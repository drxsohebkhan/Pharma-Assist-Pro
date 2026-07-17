import { google } from "@ai-sdk/google"
import type { generateText, LanguageModel } from "ai"

type ProviderOptions = NonNullable<Parameters<typeof generateText>[0]["providerOptions"]>

// TASK-TIERED chains with automatic failover.
//
// Measured on this key:
//   gemini-3-flash-preview  — strongest fast multimodal (best OCR/handwriting)
//   gemini-3.1-flash-lite   — fastest (~4-6s) but weaker on messy vision input
//   gemini-3.5-flash        — strong but slower AND 20/day quota (constant 429s)
//   gemini-2.5-flash        — DEAD: 404 "no longer available to new users"
//
// Every attempt carries a hard timeout: a saturated model must fail over in
// seconds, not hang for minutes (previously a 503 took 170s to surface).
//
// ACCURACY chain (vision: Rx decode, shelf scans, patient images):
//   the strongest fast model goes FIRST — a wrong medicine reading is a
//   patient-safety failure, so we only fall back to lite under outage.
// SPEED chain (text-dominant: consult, enrich, triage):
//   lite first for instant answers; stronger models as fallbacks.
const ACCURACY_CHAIN: { id: string; timeoutMs: number; providerOptions?: ProviderOptions }[] = [
  { id: "gemini-3-flash-preview", timeoutMs: 45_000, providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } } },
  { id: "gemini-3.1-flash-lite", timeoutMs: 35_000, providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } } },
  { id: "gemini-3.5-flash", timeoutMs: 60_000, providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } } },
  { id: "gemini-2.0-flash", timeoutMs: 45_000 },
]

const SPEED_CHAIN: { id: string; timeoutMs: number; providerOptions?: ProviderOptions }[] = [
  { id: "gemini-3.1-flash-lite", timeoutMs: 30_000, providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } } },
  { id: "gemini-3-flash-preview", timeoutMs: 40_000, providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } } },
  { id: "gemini-3.5-flash", timeoutMs: 60_000, providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } } },
  { id: "gemini-2.0-flash", timeoutMs: 45_000 },
]

export function isFreeModeActive() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}

// Kept for compatibility: returns the primary model.
export function getClinicalModel(): LanguageModel {
  if (isFreeModeActive()) {
    return google(SPEED_CHAIN[0].id)
  }
  return "openai/gpt-5-mini"
}

export interface ClinicalAttempt {
  model: LanguageModel
  providerOptions?: ProviderOptions
  /** Hard per-attempt timeout — pass to generateText as abortSignal so a saturated model fails over in seconds. */
  abortSignal?: AbortSignal
}

type ChainEntry = { id: string; timeoutMs: number; providerOptions?: ProviderOptions }

function runEntry<T>(entry: ChainEntry, fn: (attempt: ClinicalAttempt) => Promise<T>): Promise<T> {
  return fn({
    model: google(entry.id),
    providerOptions: entry.providerOptions,
    abortSignal: AbortSignal.timeout(entry.timeoutMs),
  })
}

/**
 * Hedged race between a primary and a backup model.
 * The primary starts immediately; if it hasn't answered within `hedgeDelayMs`
 * (or it errors early), the backup fires in parallel. First success wins.
 * This keeps best-model accuracy when the primary is healthy, and caps the
 * saturated-primary penalty at ~hedgeDelayMs instead of a full timeout.
 */
function hedgedRace<T>(
  primary: ChainEntry,
  backup: ChainEntry,
  fn: (attempt: ClinicalAttempt) => Promise<T>,
  hedgeDelayMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    let pending = 0
    let lastErr: unknown
    let hedgeTimer: ReturnType<typeof setTimeout> | null = null

    const launch = (entry: ChainEntry) => {
      pending++
      runEntry(entry, fn).then(
        (value) => {
          if (settled) return
          settled = true
          if (hedgeTimer) clearTimeout(hedgeTimer)
          resolve(value)
        },
        (err) => {
          pending--
          lastErr = err
          if (settled) return
          if (hedgeTimer) {
            // Primary failed before the hedge fired — launch backup right away
            clearTimeout(hedgeTimer)
            hedgeTimer = null
            console.log(`[v0] Hedge: ${entry.id} failed fast, launching ${backup.id} immediately`)
            launch(backup)
          } else if (pending === 0) {
            settled = true
            reject(lastErr)
          }
        },
      )
    }

    launch(primary)
    hedgeTimer = setTimeout(() => {
      hedgeTimer = null
      if (!settled) {
        console.log(`[v0] Hedge: ${primary.id} slow (>${hedgeDelayMs}ms), racing ${backup.id}`)
        launch(backup)
      }
    }, hedgeDelayMs)
  })
}

/**
 * Runs `fn` against the tier's model chain until one succeeds.
 * tier "accuracy" = vision-critical (Rx decode, shelf scan, patient images) —
 *   uses a hedged race so a saturated primary costs seconds, not a timeout.
 * tier "speed"    = text-dominant (consult, enrich, triage). Default: speed.
 * Each attempt uses maxRetries: 0 semantics — the caller must pass
 * maxRetries: 0 to generateText so a 503 fails over instantly instead
 * of burning ~90s retrying a saturated model.
 */
export async function clinicalGenerate<T>(
  fn: (attempt: ClinicalAttempt) => Promise<T>,
  tier: "speed" | "accuracy" = "speed",
): Promise<T> {
  if (!isFreeModeActive()) {
    return fn({ model: "openai/gpt-5-mini" })
  }

  const chain = tier === "accuracy" ? ACCURACY_CHAIN : SPEED_CHAIN
  let lastError: unknown
  let startIndex = 0

  // Accuracy tier: hedged race between the two strongest models first
  if (tier === "accuracy" && chain.length >= 2) {
    try {
      return await hedgedRace(chain[0], chain[1], fn, 12_000)
    } catch (error) {
      lastError = error
      startIndex = 2
      console.log(`[v0] Hedged pair exhausted, falling back down the chain`)
    }
  }

  for (const entry of chain.slice(startIndex)) {
    try {
      return await runEntry(entry, fn)
    } catch (error) {
      lastError = error
      const msg = error instanceof Error ? error.message : ""
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? (error as { statusCode?: number }).statusCode
          : undefined
      // Fail over on capacity / quota / availability / arg errors (429, 503,
      // quota exhausted, model overload, unsupported option). Rethrow real
      // problems (bad API key = 400/401/403) immediately.
      const isAbort =
        (error instanceof Error && error.name === "TimeoutError") ||
        (error instanceof Error && error.name === "AbortError") ||
        msg.includes("aborted") ||
        msg.includes("timed out")
      const retryable =
        isAbort ||
        statusCode === 404 ||
        statusCode === 429 ||
        statusCode === 500 ||
        statusCode === 503 ||
        msg.includes("no longer available") ||
        msg.includes("high demand") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("overloaded") ||
        msg.includes("quota") ||
        msg.includes("Quota") ||
        msg.includes("Rate limit") ||
        msg.includes("rate limit") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("thinking") ||
        msg.includes("not found") ||
        msg.includes("not supported") ||
        msg.includes("INVALID_ARGUMENT") ||
        msg.includes("Failed after")
      if (!retryable) throw error
      console.log(`[v0] Model ${entry.id} unavailable (status ${statusCode}), failing over. Reason: ${msg.slice(0, 100)}`)
    }
  }
  throw lastError
}
