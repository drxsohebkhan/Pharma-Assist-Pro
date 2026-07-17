import { generateText, Output, type ModelMessage } from "ai"
import { z } from "zod"
import { clinicalGenerate } from "@/lib/ai-model"
import { hasAccess } from "@/lib/access"

export const maxDuration = 120

const scannedMedicineSchema = z.object({
  brandName: z.string().describe("Brand name exactly as printed, e.g. Crocin Advance"),
  genericName: z.string().describe("Generic/salt name, e.g. Paracetamol"),
  composition: z.string().describe("Full composition with strengths, e.g. Paracetamol 500mg"),
  category: z.string().describe("Therapeutic category, e.g. Antibiotic, NSAID, Antacid"),
  dosageForm: z
    .enum(["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Gel", "Drops", "Inhaler", "Powder"])
    .describe("Primary dosage form"),
  strength: z.string().describe("Strength, e.g. 500mg or 250mg/5ml; empty string if not visible"),
  manufacturer: z.string().describe("Manufacturer if visible or well known; else empty string"),
  approxMrp: z.number().describe("MRP in INR if visible on image, else typical MRP; 0 if unknown"),
  stockQuantity: z
    .number()
    .describe("Quantity if written on the list (e.g. 'x20', 'qty 10'), else 0"),
  rxRequired: z.boolean().describe("Whether it legally requires a prescription in India"),
  sideEffects: z.string().describe("Common side effects, comma separated"),
  contraindications: z.string().describe("Key contraindications, comma separated"),
  drugInteractions: z.string().describe("Major drug interactions, comma separated"),
  pregnancyCategory: z.enum(["A", "B", "C", "D", "X"]).describe("US FDA pregnancy category"),
  pediatricSafe: z.boolean().describe("Whether usable in children with proper dosing"),
  geriatricCaution: z.boolean().describe("Whether elderly need dose caution"),
  therapeuticUses: z.string().describe("Main uses, comma separated"),
  confidence: z.enum(["high", "medium", "low"]).describe("Read/identification confidence"),
})

const scanResultSchema = z.object({
  imageType: z
    .enum(["medicine_list", "single_medicine", "prescription", "unreadable"])
    .describe("What the image contains"),
  medicines: z
    .array(scannedMedicineSchema)
    .describe("Every medicine identified. Single product photo = one entry. List/bill = every line item."),
  note: z
    .string()
    .describe("Short note for the pharmacist about anything skipped or unclear; empty string if none"),
})

interface ScanBody {
  dataUrl?: string
  hint?: string
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return { mimeType: match[1], base64: match[2] }
}

export async function POST(request: Request) {
  const allowed = await hasAccess()
  if (!allowed) {
    return Response.json({ error: "Access denied. Unlock the clinical workspace first." }, { status: 401 })
  }

  try {
    let body: ScanBody
    try {
      body = (await request.json()) as ScanBody
    } catch {
      return Response.json({ error: "Invalid request. Please re-upload the image." }, { status: 400 })
    }

    if (!body.dataUrl) {
      return Response.json({ error: "No image received. Please upload or capture a photo." }, { status: 400 })
    }
    const parsed = parseDataUrl(body.dataUrl)
    if (!parsed) {
      return Response.json({ error: "Unsupported image format. Use a JPG or PNG photo." }, { status: 400 })
    }

    const messages: ModelMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Analyze this pharmacy image and extract EVERY medicine.\n` +
              `- If it is a handwritten/printed LIST or purchase bill: extract every line item as a separate medicine.\n` +
              `- If it is a photo of a SINGLE medicine (strip, bottle, box): extract that one product with full detail.\n` +
              `- Fill complete clinical data for each medicine from your Indian drug knowledge (composition, category, safety flags).\n` +
              `- Names may be in English, Hindi, or Hinglish with spelling mistakes — resolve to the correct Indian brand.\n` +
              `- Skip non-medicine items (cosmetics, general store items) and mention them in the note.` +
              (body.hint ? `\nPharmacist hint: ${body.hint.slice(0, 200)}` : ""),
          },
          { type: "file", mediaType: parsed.mimeType, data: parsed.base64 },
        ],
      },
    ]

    const { output } = await clinicalGenerate(
      (attempt) =>
        generateText({
          model: attempt.model,
          providerOptions: attempt.providerOptions,
          abortSignal: attempt.abortSignal,
          maxRetries: 0,
          output: Output.object({ schema: scanResultSchema }),
          system:
            "You are a senior Indian clinical pharmacist and drug database expert with perfect OCR skills. " +
            "You read medicine lists, purchase bills, and product photos, then return complete accurate inventory data. " +
            "Use real verifiable data for known Indian brands (Cipla, Sun Pharma, GSK, Mankind, Dr Reddy's, etc). " +
            "Never invent dangerous clinical data — use conservative defaults when unsure and lower the confidence.",
          messages,
        }),
      "accuracy",
    )

    if (!output || output.imageType === "unreadable" || output.medicines.length === 0) {
      return Response.json(
        {
          error:
            output?.note ||
            "Could not read any medicines from this image. Try a clearer, well-lit photo taken straight-on.",
        },
        { status: 422 },
      )
    }

    return Response.json({ result: output })
  } catch (error) {
    console.error("[v0] Scan inventory error:", error)
    const message = error instanceof Error ? error.message : ""
    if (message.includes("credit card") || message.includes("customer_verification") || message.includes("API key")) {
      return Response.json(
        {
          error:
            "AI engine is not configured. Add a FREE Google AI key from aistudio.google.com as GOOGLE_GENERATIVE_AI_API_KEY in project settings (Vars).",
        },
        { status: 402 },
      )
    }
    return Response.json(
      { error: "AI could not analyze this image. Please try again with a clearer photo." },
      { status: 500 },
    )
  }
}
