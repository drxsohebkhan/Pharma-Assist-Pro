"use client"

import { Languages } from "lucide-react"
import { LANGUAGES } from "@/lib/languages"
import { useLanguage } from "@/components/language-provider"

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage()

  return (
    <label
      className={`flex items-center gap-2 ${compact ? "" : "glass rounded-xl px-3 py-2.5"}`}
      title="AI response language"
    >
      <Languages className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="sr-only">AI response language</span>
      <select
        value={language.code}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full min-w-0 cursor-pointer bg-transparent text-sm font-medium text-foreground outline-none [&>option]:bg-popover"
        aria-label="Select AI response language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.code === "auto" ? "Auto Detect Language" : `${l.label} — ${l.native}`}
          </option>
        ))}
      </select>
    </label>
  )
}
