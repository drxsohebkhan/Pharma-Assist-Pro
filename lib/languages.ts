export interface AppLanguage {
  code: string
  label: string
  native: string
  /** Instruction fragment sent to the AI */
  aiName: string
}

/**
 * Response languages: auto-detect, English, Hinglish, plus the major language
 * of every Indian state (the 22 scheduled languages and key regional ones).
 */
export const LANGUAGES: AppLanguage[] = [
  { code: "auto", label: "Auto Detect", native: "Auto", aiName: "AUTO" },
  { code: "en", label: "English", native: "English", aiName: "English" },
  { code: "hinglish", label: "Hinglish", native: "Hinglish", aiName: "Hinglish (Hindi written in Latin/Roman script, casual Indian pharmacy style)" },
  { code: "hi", label: "Hindi", native: "हिन्दी", aiName: "Hindi (Devanagari script)" },
  { code: "bn", label: "Bengali", native: "বাংলা", aiName: "Bengali" },
  { code: "te", label: "Telugu", native: "తెలుగు", aiName: "Telugu" },
  { code: "mr", label: "Marathi", native: "मराठी", aiName: "Marathi" },
  { code: "ta", label: "Tamil", native: "தமிழ்", aiName: "Tamil" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", aiName: "Gujarati" },
  { code: "ur", label: "Urdu", native: "اردو", aiName: "Urdu" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", aiName: "Kannada" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ", aiName: "Odia" },
  { code: "ml", label: "Malayalam", native: "മലയാളം", aiName: "Malayalam" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", aiName: "Punjabi (Gurmukhi script)" },
  { code: "as", label: "Assamese", native: "অসমীয়া", aiName: "Assamese" },
  { code: "mai", label: "Maithili", native: "मैथिली", aiName: "Maithili" },
  { code: "sat", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", aiName: "Santali" },
  { code: "ks", label: "Kashmiri", native: "کٲشُر", aiName: "Kashmiri" },
  { code: "ne", label: "Nepali", native: "नेपाली", aiName: "Nepali" },
  { code: "kok", label: "Konkani", native: "कोंकणी", aiName: "Konkani" },
  { code: "sd", label: "Sindhi", native: "سنڌي", aiName: "Sindhi" },
  { code: "doi", label: "Dogri", native: "डोगरी", aiName: "Dogri" },
  { code: "mni", label: "Manipuri", native: "ꯃꯤꯇꯩꯂꯣꯟ", aiName: "Manipuri (Meitei)" },
  { code: "brx", label: "Bodo", native: "बड़ो", aiName: "Bodo" },
  { code: "lus", label: "Mizo", native: "Mizo ṭawng", aiName: "Mizo" },
  { code: "kha", label: "Khasi", native: "Khasi", aiName: "Khasi" },
  { code: "sa", label: "Sanskrit", native: "संस्कृतम्", aiName: "Sanskrit" },
]

export const LANGUAGE_COOKIE = "pa_lang"

export function getLanguage(code: string | undefined | null): AppLanguage {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}

/** Builds the AI system-prompt fragment for the selected response language. */
export function languageInstruction(code: string | undefined | null): string {
  const lang = getLanguage(code)
  if (lang.code === "auto") {
    return (
      "RESPONSE LANGUAGE: Auto-detect. Reply in the SAME language and script the patient/pharmacist used in their input. " +
      "If the input is Hinglish (Hindi in Roman script), reply in Hinglish. If mixed, use the dominant language. " +
      "Medicine names always stay in English/Latin script."
    )
  }
  return (
    `RESPONSE LANGUAGE: ${lang.aiName}. Write ALL patient-facing text (advice, instructions, summaries, reasons) in ${lang.aiName}, ` +
    `using the language's NATIVE SCRIPT (e.g. Bengali in Bengali script, Tamil in Tamil script) — never romanize, except Hinglish which is intentionally Roman script. ` +
    "Medicine names, doses and clinical abbreviations always stay in English/Latin script."
  )
}
