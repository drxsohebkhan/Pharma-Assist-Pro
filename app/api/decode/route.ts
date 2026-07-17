import { generateText, Output, type ModelMessage } from "ai"
import { eq, isNull, or } from "drizzle-orm"
import { clinicalGenerate } from "@/lib/ai-model"
import { db } from "@/lib/db"
import { medicines } from "@/lib/db/schema"
import { decodeResultSchema } from "@/lib/consult-schema"
import { languageInstruction } from "@/lib/languages"
import { hasAccess } from "@/lib/access"
import { getUserIdOptional } from "@/lib/session"

export const maxDuration = 120

const SYSTEM_PROMPT = `You are the Prescription Decoder inside PharmaAssist Pro — a forensic-grade medical handwriting analysis engine for a licensed Indian pharmacist.

Your specialties:
1. DOCTOR HANDWRITING: Indian doctors' notoriously messy prescriptions. You know common Indian brand names, abbreviations (OD, BD, TDS, QID, HS, SOS, AC, PC, STAT, 1-0-1 notation), and common misreadings (e.g. "Pan" vs "Pen", "Azee" vs "Aztor"). Reconstruct what was most likely written using triple context: (a) dose strength must exist for that brand, (b) drug combinations must make clinical sense together, (c) the diagnosis line if visible must match the drugs. For every decoded medicine also state its full salt composition with strength in interpretedMedicine, e.g. "Augmentin 625 (Amoxicillin 500mg + Clavulanic Acid 125mg)".
2. LAB REPORTS: Extract EVERY test name, value, unit, and reference range visible. Flag each abnormal value explicitly with direction (HIGH/LOW) and one-line clinical meaning (e.g. "TSH 12.4 HIGH — hypothyroidism, thyroxine dose review needed"). Do not skip any readable row.
3. BODY IMAGES: Describe morphology precisely — location, color, borders, texture, distribution, discharge. Give the most likely clinical finding plus one differential (e.g. "ringworm (tinea corporis), differential: nummular eczema"). Flag danger signs (spreading redness, pus, black tissue, irregular pigmented lesion) prominently in warnings.
4. X-RAY/SCAN/ECG: Describe cautiously what is visible, never give a definitive radiology read — always add a warning to confirm with the treating doctor.

Precision protocol (follow in order):
a. Read the ENTIRE image first: letterhead, doctor's specialty, diagnosis line, patient age/sex. A pediatrician's Rx biases toward syrups; a cardiologist's toward cardiac drugs.
b. For each line, list mentally the 2-3 most likely brand readings, then eliminate using dose strength (a brand that never comes in the written strength is wrong) and clinical coherence with the other drugs.
c. Transcribe honestly. If a word is truly illegible, interpret the MOST CLINICALLY LIKELY option and mark confidence "low" — never invent unrelated drugs.
d. Decode dosage notations into plain instructions: "1-0-1" = morning and night, "TDS" = 3 times a day, "HS" = at bedtime, "SOS" = when needed, "x5d" = for 5 days.
e. VERIFY before answering: re-read the image one final time and cross-check every decoded line against your transcription. Does each brand exist in India at that strength? Does the dose fit the patient's age? Do the drugs together match the diagnosis? Fix any mismatch and only then respond. If two readings remain equally plausible, put the alternative in the notes field.

Rules:
- Set inStoreMatch to null for every decoded item. The pharmacy system matches stock separately — do NOT attempt inventory matching yourself.
- Summary and warnings must follow the RESPONSE LANGUAGE instruction appended at the end of this prompt.
- If the image is not a medical document at all, set documentType to "other" and explain in the summary.`

// ---------- Local inventory matching (deterministic, instant) ----------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9+ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Tokens worth matching on (drop strengths/forms/noise words). */
function brandTokens(s: string): string[] {
  const STOP = new Set(["tab", "tabs", "tablet", "tablets", "cap", "caps", "capsule", "syrup", "syp", "inj", "injection", "cream", "gel", "drops", "mg", "ml", "gm", "od", "bd", "tds", "hs", "sos"])
  return normalize(s)
    .split(" ")
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t))
}

type InvRow = { id: number; brandName: string; genericName: string; composition: string }

/**
 * Match a decoded medicine to inventory:
 * 1. exact/prefix brand match  2. generic name match  3. composition salt overlap
 */
function matchInventory(interpreted: string, written: string, inv: InvRow[]) {
  const tokens = [...new Set([...brandTokens(interpreted), ...brandTokens(written)])]
  if (tokens.length === 0) return null

  let best: { row: InvRow; score: number } | null = null
  for (const row of inv) {
    const brand = normalize(row.brandName)
    const generic = normalize(row.genericName)
    const compo = normalize(row.composition)
    let score = 0
    for (const t of tokens) {
      if (brand === t) score += 10
      else if (brand.startsWith(t) || t.startsWith(brand.split(" ")[0])) score += 6
      else if (brand.includes(t)) score += 4
      if (generic.includes(t)) score += 3
      if (compo.includes(t)) score += 2
    }
    if (score > 0 && (!best || score > best.score)) best = { row, score }
  }
  // Threshold: require a confident signal, not a weak single-salt overlap
  return best && best.score >= 6
    ? { medicineId: best.row.id, brandName: best.row.brandName, composition: best.row.composition }
    : null
}

interface DecodeRequest {
  dataUrl: string
  hint?: string
  language?: string
}

export async function POST(req: Request) {
  const allowed = await hasAccess()
  if (!allowed) {
    return Response.json({ error: "Access denied. Unlock the clinical workspace first." }, { status: 401 })
  }

  let body: DecodeRequest
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body.dataUrl !== "string" || !body.dataUrl.startsWith("data:image/")) {
    return Response.json({ error: "A valid image is required." }, { status: 400 })
  }

  try {
    // No inventory in the prompt — the model puts 100% of its attention on the
    // image (accuracy) and the prompt is ~50KB smaller (speed). Stock matching
    // happens locally below, in parallel with nothing blocking the AI call.
    const messages: ModelMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${
              body.hint?.trim() ? `Pharmacist's hint about this image: ${body.hint.trim()}\n\n` : ""
            }Analyze this image with maximum precision and produce the structured decode result.`,
          },
          { type: "image", image: body.dataUrl },
        ],
      },
    ]

    // Fire the AI call and the inventory query in PARALLEL
    const uid = await getUserIdOptional()
    const [aiRes, fullInventory] = await Promise.all([
      clinicalGenerate(
        (attempt) =>
          generateText({
            model: attempt.model,
            providerOptions: attempt.providerOptions,
            abortSignal: attempt.abortSignal,
            maxRetries: 0,
            system: `${SYSTEM_PROMPT}\n\n${languageInstruction(body.language)}`,
            messages,
            output: Output.object({ schema: decodeResultSchema }),
          }),
        "accuracy",
      ),
      db
        .select({
          id: medicines.id,
          brandName: medicines.brandName,
          genericName: medicines.genericName,
          composition: medicines.composition,
        })
        .from(medicines)
        .where(uid ? or(isNull(medicines.userId), eq(medicines.userId, uid)) : isNull(medicines.userId)),
    ])

    const inv = fullInventory.filter((m) => !m.brandName.includes("(Pack of"))
    const output = aiRes.output

    // Deterministic local stock matching — instant and always consistent with real inventory
    const result = {
      ...output,
      decodedItems: output.decodedItems.map((item) => ({
        ...item,
        inStoreMatch: matchInventory(item.interpretedMedicine, item.writtenText, inv),
      })),
    }

    return Response.json({ result })
  } catch (error) {
    console.error("[v0] Decoder error:", error)
    const message = error instanceof Error ? error.message : ""
    if (message.includes("credit card") || message.includes("customer_verification") || message.includes("API key")) {
      return Response.json(
        {
          error:
            "AI engine is not configured. Add a FREE Google AI key: get it from aistudio.google.com (no card needed) and set it as GOOGLE_GENERATIVE_AI_API_KEY in project settings (Vars).",
        },
        { status: 402 },
      )
    }
    return Response.json(
      { error: "The decoder hit a problem while analyzing this image. Please try again." },
      { status: 500 },
    )
  }
}
