import { generateText, Output, type ModelMessage } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { clinicalGenerate } from "@/lib/ai-model"
import { getUserIdOptional } from "@/lib/session"
import { db } from "@/lib/db"
import { medicines, consultations } from "@/lib/db/schema"
import { eq, isNull, or } from "drizzle-orm"
import { consultResultSchema } from "@/lib/consult-schema"
import { hasAccess } from "@/lib/access"
import { languageInstruction } from "@/lib/languages"

export const maxDuration = 120

interface ConsultRequest {
  patientName?: string
  patientAge: number
  patientGender: string
  patientWeight?: number
  symptoms: string
  previousConditions: string[]
  currentMedications?: string
  allergies?: string
  isPregnant?: boolean
  isBreastfeeding?: boolean
  images?: { dataUrl: string; label: string }[]
  language?: string
}

const SYSTEM_PROMPT = `You are PharmaAssist Pro — an elite clinical decision support engine for a licensed Indian pharmacist (DRX Soheb Khan). You reason like a senior physician with 30 years of experience combined with a clinical pharmacologist.

CORE RULES (non-negotiable):
1. You may ONLY recommend medicines from the STORE INVENTORY provided. Never invent or suggest a medicine that is not in the list. Use the exact "id" from the inventory for medicineId.
2. Symptoms may arrive in ANY Indian language (Hindi, English, Hinglish, Urdu, Bengali, Tamil, Telugu, Marathi, etc). Understand all of them perfectly.
3. All patient-facing text (reason, advice, warnings, red flags, follow-up, condition descriptions) MUST follow the RESPONSE LANGUAGE instruction appended at the end of this prompt — written naturally and warmly, like a caring senior doctor explaining to an Indian patient.
4. Safety pipeline you MUST run mentally for every recommendation:
   a. Cross-check patient's previous conditions (diabetes, BP, asthma, kidney, liver, heart, thyroid, epilepsy) against each medicine's contraindications.
   b. Check drug-drug interactions with the patient's current medications.
   c. Check allergies against compositions (e.g., Penicillin allergy blocks Amoxicillin/Augmentin).
   d. Pregnancy/breastfeeding: only category A/B medicines; explicitly block C/D/X and mention it in contraindicated.
   e. Pediatric (<12 yrs): only pediatric_safe medicines, weight-based dosing where relevant.
   f. Geriatric (65+): apply geriatric caution, prefer lower doses.
   g. Prefer in-stock medicines (stock_quantity > 0).
5. Be decisive and specific like a professional doctor — exact dose, exact frequency, exact duration, exact timing relative to food. No vague hedging.
6. If the presentation is serious (chest pain, breathing difficulty, stroke signs, severe dehydration, high fever in infant, blood in vomit/stool, etc.) set referToDoctor=true and make redFlags loud and clear.
7. IMAGE ANALYSIS PROTOCOL — if images are attached, identify the image type first, then apply the matching protocol:
   a. LAB REPORT: Extract every test name, value, unit, and reference range you can read. Flag each abnormal value (high/low) explicitly with its clinical meaning (e.g. "HbA1c 8.2% — poorly controlled diabetes"). Integrate abnormalities into diagnosis and medicine safety (e.g. high creatinine -> avoid nephrotoxic drugs, deranged LFT -> avoid hepatotoxic drugs).
   b. BODY PHOTO (skin/eye/wound/swelling): Describe morphology precisely — color, distribution, borders, scale/crust, symmetry. Give differential (e.g. tinea vs eczema vs psoriasis) and pick topicals from inventory accordingly. If it looks like cellulitis, abscess, deep wound, melanoma-suspicious lesion, set referToDoctor=true.
   c. PRESCRIPTION/HANDWRITING: Decode drug names using Indian brand knowledge and dose patterns (1-0-1, BD, TDS, HS, SOS). Cross-match against inventory.
   d. X-RAY/SCAN: Describe visible findings cautiously and always set referToDoctor=true for imaging interpretation.
   Put ALL extracted findings in imageFindings — detailed, structured, never generic. Never say just "image shows a report".
8. Rank recommendations: Safety > Efficacy > Availability > Cost. Give 2-4 medicines maximum — a focused, clean prescription, not a medicine dump.
9. SPEED: reason internally but keep output text tight and high-signal. No filler sentences.`

export async function POST(req: Request) {
  const allowed = await hasAccess()
  if (!allowed) {
    return Response.json({ error: "Access denied. Clinical engine is locked." }, { status: 401 })
  }

  let body: ConsultRequest
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!body.symptoms?.trim() || !body.patientAge || body.patientAge < 0 || body.patientAge > 130) {
    return Response.json({ error: "Symptoms and a valid patient age are required." }, { status: 400 })
  }

  try {
    // Send only unique base products to the model (pack-size variants share
    // identical clinical data) — keeps the prompt lean and the engine fast.
    const uid = await getUserIdOptional()
    const fullInventory = await db
      .select()
      .from(medicines)
      .where(uid ? or(isNull(medicines.userId), eq(medicines.userId, uid)) : isNull(medicines.userId))
    const seen = new Set<string>()
    let inventory = fullInventory.filter((m) => {
      if (m.brandName.includes("(Pack of")) return false
      const key = `${m.brandName}|${m.composition}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const images = (body.images ?? []).slice(0, 4)

    // STAGE 1 — ultra-fast triage: a lite model picks the relevant therapeutic
    // categories from the symptoms, so the main clinical call only receives a
    // small inventory slice. Cuts the main prompt ~10x for a much faster answer.
    // On any triage failure we silently fall back to the full inventory.
    const allCategories = [...new Set(inventory.map((m) => m.category))].sort()
    if (allCategories.length > 6 && inventory.length > 250) {
      try {
        const triage = await generateText({
          model: google("gemini-3.1-flash-lite"),
          maxRetries: 0,
          // Triage must never slow the consult down: 8s hard cap, then full-inventory fallback
          abortSignal: AbortSignal.timeout(8_000),
          providerOptions: { google: { thinkingConfig: { thinkingLevel: "low" } } },
          output: Output.object({
            schema: z.object({ categories: z.array(z.string()) }),
          }),
          prompt: `Patient: age ${body.patientAge}, ${body.patientGender}. Symptoms (Hindi/Hinglish/English): "${body.symptoms.trim()}"${body.previousConditions?.length ? ` Conditions: ${body.previousConditions.join(", ")}` : ""}${images.length ? " (medical images attached — include categories for possible skin/wound/lab findings too)" : ""}\n\nFrom this list of pharmacy categories, pick EVERY category that could plausibly be needed to treat this patient (be generous — include supportive care like Analgesic/Antipyretic, Vitamins & Supplements when relevant):\n${allCategories.join(", ")}\n\nReturn only exact category names from the list.`,
        })
        const picked = new Set(
          (triage.output.categories ?? []).filter((c) => allCategories.includes(c)),
        )
        if (picked.size > 0) {
          const sliced = inventory.filter((m) => picked.has(m.category))
          // Safety: only use the slice if it's a meaningful, non-trivial subset
          if (sliced.length >= 20) inventory = sliced
        }
      } catch {
        // triage is best-effort — full inventory fallback keeps correctness
      }
    }

    // Ultra-compressed inventory — the model derives contraindications/interactions
    // from the composition itself, so we only send identity + safety flags.
    // Smaller prompt = dramatically faster first token and total latency.
    const inventoryText = inventory
      .map(
        (m) =>
          `${m.id}|${m.brandName}|${m.composition}|${m.category}|${m.dosageForm}|${m.stockQuantity}|${m.rxRequired ? 1 : 0}|${m.pregnancyCategory}|${m.pediatricSafe ? 1 : 0}|${m.geriatricCaution ? 1 : 0}`,
      )
      .join("\n")

    const patientProfile = [
      `Age: ${body.patientAge} years`,
      `Gender: ${body.patientGender}`,
      body.patientWeight ? `Weight: ${body.patientWeight} kg` : null,
      `Symptoms (verbatim): "${body.symptoms.trim()}"`,
      body.previousConditions?.length
        ? `Previous conditions: ${body.previousConditions.join(", ")}`
        : "Previous conditions: none reported",
      body.currentMedications?.trim()
        ? `Current medications: ${body.currentMedications.trim()}`
        : "Current medications: none reported",
      body.allergies?.trim() ? `Known allergies: ${body.allergies.trim()}` : "Known allergies: none reported",
      body.isPregnant ? "PATIENT IS PREGNANT" : null,
      body.isBreastfeeding ? "PATIENT IS BREASTFEEDING" : null,
    ]
      .filter(Boolean)
      .join("\n")

    const userParts: Array<
      { type: "text"; text: string } | { type: "image"; image: string }
    > = [
      {
        type: "text",
        text: `PATIENT PROFILE:\n${patientProfile}\n\nSTORE INVENTORY (the ONLY medicines you may recommend). Format: id|brand|composition|category|form|stock|rxRequired(1/0)|pregnancyCategory|pediatricSafe(1/0)|geriatricCaution(1/0). Derive contraindications and interactions from the composition using your own pharmacology knowledge.\n${inventoryText}\n\nAnalyze this patient like a professional doctor and produce the structured consultation. Be fast and decisive.`,
      },
    ]

    for (const img of images) {
      if (typeof img.dataUrl === "string" && img.dataUrl.startsWith("data:image/")) {
        userParts.push({ type: "text", text: `Attached image (${img.label || "patient upload"}):` })
        userParts.push({ type: "image", image: img.dataUrl })
      }
    }

    const messages: ModelMessage[] = [{ role: "user", content: userParts }]

    // Images attached = vision-critical, use the accuracy chain.
    // Text-only symptoms = speed chain for the fastest possible answer.
    const { output } = await clinicalGenerate(
      (attempt) =>
        generateText({
          model: attempt.model,
          providerOptions: attempt.providerOptions,
          abortSignal: attempt.abortSignal,
          maxRetries: 0,
          system: `${SYSTEM_PROMPT}\n\n${languageInstruction(body.language)}`,
          messages,
          output: Output.object({ schema: consultResultSchema }),
        }),
      images.length > 0 ? "accuracy" : "speed",
    )

    // Persist consultation (text data only)
    await db.insert(consultations).values({
      patientName: body.patientName?.trim() ?? "",
      patientAge: Math.round(body.patientAge),
      patientGender: body.patientGender || "male",
      patientWeight: body.patientWeight ? String(body.patientWeight) : null,
      symptoms: body.symptoms.trim(),
      previousConditions: body.previousConditions ?? [],
      currentMedications: body.currentMedications?.trim() ?? "",
      allergies: body.allergies?.trim() ?? "",
      isPregnant: !!body.isPregnant,
      isBreastfeeding: !!body.isBreastfeeding,
      aiResult: output,
      userId: await getUserIdOptional(),
    })

    return Response.json({ result: output })
  } catch (error) {
    console.error("[v0] Consult engine error:", error)
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
      { error: "The clinical engine hit a problem while analyzing. Please try again." },
      { status: 500 },
    )
  }
}
