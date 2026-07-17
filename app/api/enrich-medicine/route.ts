import { generateText, Output } from "ai"
import { z } from "zod"
import { clinicalGenerate } from "@/lib/ai-model"
import { hasAccess } from "@/lib/access"

export const maxDuration = 60

const enrichSchema = z.object({
  genericName: z.string().describe("Generic/salt name, e.g. Paracetamol"),
  composition: z.string().describe("Full composition with strengths, e.g. Paracetamol 650mg"),
  category: z.string().describe("Therapeutic category, e.g. Antibiotic, NSAID, PPI"),
  dosageForm: z
    .enum(["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Gel", "Drops", "Inhaler", "Powder"])
    .describe("Primary dosage form"),
  strength: z.string().describe("Strength, e.g. 500mg or 250mg/5ml"),
  manufacturer: z.string().describe("Known manufacturer in India, or empty string if unsure"),
  approxMrp: z.number().describe("Approximate MRP in INR for a standard pack; 0 if unknown"),
  rxRequired: z.boolean().describe("Whether it legally requires a prescription in India"),
  sideEffects: z.string().describe("Common side effects, comma separated"),
  contraindications: z.string().describe("Key contraindications, comma separated"),
  drugInteractions: z.string().describe("Major drug interactions, comma separated"),
  pregnancyCategory: z.enum(["A", "B", "C", "D", "X"]).describe("US FDA pregnancy category"),
  pediatricSafe: z.boolean().describe("Whether generally usable in children with proper dosing"),
  geriatricCaution: z.boolean().describe("Whether elderly need dose caution"),
  therapeuticUses: z.string().describe("Main uses, comma separated, e.g. Fever, headache"),
  confidence: z.enum(["high", "medium", "low"]).describe("Confidence in this data"),
  note: z.string().describe("One short note for the pharmacist, or empty string"),
})

export async function POST(request: Request) {
  const allowed = await hasAccess()
  if (!allowed) {
    return Response.json({ error: "Access denied. Unlock the clinical workspace first." }, { status: 401 })
  }

  try {
    const { brandName } = (await request.json()) as { brandName?: string }
    if (!brandName || brandName.trim().length < 2) {
      return Response.json({ error: "Enter a brand name first." }, { status: 400 })
    }

    const { output } = await clinicalGenerate((attempt) =>
      generateText({
        model: attempt.model,
        providerOptions: attempt.providerOptions,
        abortSignal: attempt.abortSignal,
        maxRetries: 0,
        output: Output.object({ schema: enrichSchema }),
        system:
        "You are a senior Indian clinical pharmacist and drug database expert. " +
        "Given a medicine brand name sold in India, return its complete, accurate clinical profile. " +
        "Use real, verifiable data for well-known Indian brands (Cipla, Sun Pharma, GSK, Mankind, etc). " +
        "If the brand is ambiguous or unknown, use the closest well-known match and set confidence to low with a note. " +
        "Be precise with compositions and strengths. Never invent dangerous data.",
        prompt: `Medicine brand name: "${brandName.trim()}". Return its full clinical profile for an Indian pharmacy inventory.`,
      }),
    )

    return Response.json({ result: output })
  } catch (error) {
    console.error("[v0] Enrich medicine error:", error)
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
    return Response.json({ error: "AI could not analyze this medicine. Please try again." }, { status: 500 })
  }
}
