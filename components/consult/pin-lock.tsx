"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Lock } from "lucide-react"
import { unlockConsult } from "@/app/actions/access"

const PIN_LENGTH = 4

export function PinLock() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""))
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle")
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  async function submit(pin: string) {
    setStatus("checking")
    const res = await unlockConsult(pin)
    if (res.ok) {
      router.refresh()
    } else {
      setStatus("error")
      setDigits(Array(PIN_LENGTH).fill(""))
      inputsRef.current[0]?.focus()
      setTimeout(() => setStatus("idle"), 1200)
    }
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < PIN_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== "")) {
      submit(next.join(""))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div
        className={`glass relative w-full max-w-md rounded-3xl p-8 text-center sm:p-10 ${
          status === "error" ? "shake border-destructive/40" : ""
        }`}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          {status === "checking" ? (
            <ShieldCheck className="h-8 w-8 animate-pulse text-primary" />
          ) : (
            <Lock className="h-8 w-8 text-primary" />
          )}
        </div>
        <h1 className="font-heading text-2xl font-semibold text-foreground text-balance">Restricted Clinical Zone</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          The clinical workspace — Smart Consult, Rx Decoder and Inventory — is reserved for authorized personnel
          only. Enter your access code to continue.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3" role="group" aria-label="Access code">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el
              }}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              aria-label={`Access code digit ${i + 1}`}
              value={digit}
              disabled={status === "checking"}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-14 w-12 rounded-xl border bg-secondary/60 text-center font-heading text-2xl text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,212,170,0.15)] ${
                status === "error" ? "border-destructive/60" : "border-border"
              }`}
            />
          ))}
        </div>

        <p className="mt-6 h-5 text-sm" aria-live="polite">
          {status === "checking" && <span className="text-primary">Verifying credentials...</span>}
          {status === "error" && <span className="text-destructive">Access denied. Invalid code.</span>}
        </p>

        <p className="mt-4 text-xs text-muted-foreground/60">
          Unauthorized access attempts are logged. Contact the store administrator for access.
        </p>
      </div>
    </div>
  )
}
