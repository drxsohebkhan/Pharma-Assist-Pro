"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { LANGUAGE_COOKIE, getLanguage, type AppLanguage } from "@/lib/languages"

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (code: string) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  language: getLanguage("auto"),
  setLanguage: () => {},
})

function readCookie(): string {
  if (typeof document === "undefined") return "auto"
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : "auto"
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState("auto")

  useEffect(() => {
    setCode(readCookie())
  }, [])

  const setLanguage = useCallback((next: string) => {
    setCode(next)
    // 1-year UI preference cookie (SameSite=None so it survives the v0 preview iframe)
    document.cookie = `${LANGUAGE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; SameSite=None; Secure`
  }, [])

  return (
    <LanguageContext.Provider value={{ language: getLanguage(code), setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
