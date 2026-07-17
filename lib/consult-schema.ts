import { z } from "zod"

export const consultResultSchema = z.object({
  interpretedSymptoms: z.object({
    original: z.string(),
    normalized: z.string().describe("Symptoms translated to clean English medical terminology"),
    detectedLanguage: z.string().describe("Language detected: Hindi, English, Hinglish, etc."),
    possibleConditions: z.array(
      z.object({
        condition: z.string(),
        confidence: z.enum(["high", "medium", "low"]),
        description: z.string().describe("Short explanation of this condition in the RESPONSE LANGUAGE"),
      }),
    ),
  }),
  imageFindings: z
    .string()
    .describe("If images were provided, describe visible findings in the RESPONSE LANGUAGE. Empty string if no images."),
  recommendedMedicines: z.array(
    z.object({
      medicineId: z.number().describe("The exact id of the medicine from the store inventory list"),
      brandName: z.string(),
      composition: z.string(),
      dosageForm: z.string(),
      recommendedDosage: z.string().describe("Exact dosage e.g. '1 tablet, 3 times daily after meals'"),
      duration: z.string().describe("e.g. '3-5 days'"),
      timing: z.string().describe("e.g. 'Khana khane ke baad, subah-dopahar-raat'"),
      reason: z.string().describe("RESPONSE LANGUAGE explanation why this medicine is chosen for this patient"),
      warnings: z.array(z.string()).describe("Specific warnings for this medicine in the RESPONSE LANGUAGE"),
    }),
  ),
  contraindicated: z.array(
    z.object({
      medicine: z.string(),
      reason: z.string().describe("RESPONSE LANGUAGE reason why this medicine must be avoided for this patient"),
    }),
  ),
  generalAdvice: z.array(z.string()).describe("Practical lifestyle/home-care advice in the RESPONSE LANGUAGE"),
  redFlags: z
    .array(z.string())
    .describe("Danger signs in the RESPONSE LANGUAGE - when patient must immediately see a doctor/hospital"),
  followUp: z.string().describe("Follow-up recommendation in the RESPONSE LANGUAGE"),
  referToDoctor: z
    .boolean()
    .describe("true if condition is beyond OTC/pharmacy scope and needs physician referral"),
})

export type ConsultResult = z.infer<typeof consultResultSchema>

export const decodeResultSchema = z.object({
  documentType: z
    .enum(["prescription", "lab_report", "body_image", "other"])
    .describe("What kind of image/document this is"),
  transcription: z
    .string()
    .describe(
      "For prescriptions: full transcription of what the doctor wrote, line by line. For lab reports: extracted values. For body images: visible findings.",
    ),
  decodedItems: z.array(
    z.object({
      writtenText: z.string().describe("The raw handwritten text as best interpreted"),
      interpretedMedicine: z.string().describe("The most likely medicine name it refers to"),
      confidence: z.enum(["high", "medium", "low"]),
      dosageInstruction: z.string().describe("Decoded dosage notation e.g. '1-0-1 means morning and night'"),
      inStoreMatch: z
        .object({
          medicineId: z.number(),
          brandName: z.string(),
          composition: z.string(),
        })
        .nullable()
        .describe("Matching medicine from store inventory, or null if not available"),
    }),
  ),
  labFindings: z.array(
    z.object({
      testName: z.string(),
      value: z.string(),
      normalRange: z.string(),
      status: z.enum(["normal", "high", "low", "critical"]),
    }),
  ),
  summary: z.string().describe("Overall summary in the RESPONSE LANGUAGE of what this document says"),
  warnings: z.array(z.string()).describe("Any warnings or cautions in the RESPONSE LANGUAGE"),
})

export type DecodeResult = z.infer<typeof decodeResultSchema>
