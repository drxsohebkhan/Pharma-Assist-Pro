"use client"

/**
 * Access-code gate — shown to signed-in accounts that don't have premium yet.
 * Code redemption (one-account-per-code binding) ships in the next phase;
 * this page already routes premium users straight to the dashboard the
 * moment their users/{uid}.premium flips to true (live Firestore snapshot).
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, MessageCircle } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { AuthLoader } from "@/components/auth/protected-route"

const WHATSAPP_URL = "https://wa.me/918249630746?text=Hi%2C%20I%27d%20like%20to%20buy%20access%20to%20PharmaAssist%20Pro"

export default function AccessPage() {
  const router = useRouter()
  const { user, profile, loading, configured } = useAuth()

  useEffect(() => {
    if (!configured || loading) return
    if (!user) {
      router.replace("/login")
    } else if (profile?.premium) {
      router.replace("/")
    }
  }, [configured, loading, user, profile, router])

  if (!configured) {
    router.replace("/login")
    return null
  }
  if (loading || !user || profile?.premium) return <AuthLoader />

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="fade-up w-full max-w-md">
        <div className="glass rounded-3xl p-8 text-center sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-teal">
            <KeyRound className="size-8" aria-hidden="true" />
          </span>

          <p className="type-label mt-6 text-primary">One Step Away</p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-balance sm:text-3xl">
            Activate Your Access
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>. This account
            doesn&apos;t have premium access yet — get your personal access code below. Each code activates
            exactly one account, permanently.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-secondary/40 p-4 text-left">
            <p className="text-sm font-semibold text-foreground">Code entry launching here</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The access-code redemption system is being activated. Once live, you&apos;ll enter your code on
              this page and the site unlocks instantly — on every device, forever.
            </p>
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            Chat on WhatsApp to get your access code
          </a>
        </div>

        <p className="mt-6 text-center font-heading text-sm font-semibold text-primary text-glow">
          Made by DRX SOHEB KHAN
        </p>
      </div>
    </main>
  )
}
