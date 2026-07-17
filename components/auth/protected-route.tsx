"use client"

/**
 * Route guard for premium pages. Unauthenticated visitors are redirected to
 * /login automatically. While auth state resolves, a branded loader renders
 * so protected content never flashes.
 *
 * If Firebase env vars are missing, the guard renders children untouched so
 * the site keeps working until configuration is added.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export function AuthLoader({ label = "Verifying your session" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <span className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden="true" />
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-teal">
          <Activity className="size-7 animate-pulse" aria-hidden="true" />
        </span>
      </span>
      <p className="text-sm font-medium text-muted-foreground">{label}…</p>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!configured || loading) return
    if (!user) {
      router.replace("/login")
    }
  }, [configured, loading, user, router])

  // Firebase not configured yet — don't lock the site out.
  if (!configured) return <>{children}</>

  if (loading) return <AuthLoader />

  if (!user) return <AuthLoader label="Redirecting to sign-in" />

  return <>{children}</>
}
