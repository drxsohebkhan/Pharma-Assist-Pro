"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, ShieldCheck, Sparkles, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { signInWithGoogle, friendlyAuthError } from "@/lib/firebase-auth"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.1 3.58-5.18 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.35.6 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 1.27 6.61l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  )
}

interface Toast {
  id: number
  message: string
}

export default function LoginPage() {
  const router = useRouter()
  const { user, profile, loading, configured } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Already signed in? Route by premium status immediately.
  useEffect(() => {
    if (loading || !user) return
    router.replace(profile?.premium ? "/" : "/access")
  }, [loading, user, profile, router])

  function pushToast(message: string) {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000)
  }

  async function handleGoogleSignIn() {
    if (signingIn) return
    setSigningIn(true)
    try {
      const userProfile = await signInWithGoogle()
      router.replace(userProfile.premium ? "/" : "/access")
    } catch (error) {
      pushToast(friendlyAuthError(error))
      setSigningIn(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Toasts */}
      <div className="fixed left-1/2 top-4 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" aria-live="assertive">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="fade-up flex items-start gap-3 rounded-xl border border-destructive/40 bg-card/95 p-3.5 shadow-lg backdrop-blur"
            role="alert"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <X className="size-3.5" aria-hidden="true" />
            </span>
            <p className="flex-1 text-sm leading-snug text-foreground">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Dismiss notification"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="fade-up w-full max-w-md">
        <div className="glass rounded-3xl p-8 text-center sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-teal">
            <Activity className="size-8" aria-hidden="true" />
          </span>

          <p className="type-label mt-6 text-primary">Secure Access</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-balance">
            PharmaAssist <span className="text-primary">Pro</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            Sign in with your Google account to access the clinical workspace. One account, one identity —
            your access stays yours.
          </p>

          {!configured ? (
            <div className="mt-8 rounded-xl border border-border bg-secondary/40 p-4 text-left">
              <p className="text-sm font-semibold text-foreground">Firebase setup pending</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Add the NEXT_PUBLIC_FIREBASE_* environment variables from your Firebase project to activate
                Google Sign-In.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn || loading}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-secondary/50 px-5 py-3.5 font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingIn ? (
                <>
                  <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                  Signing you in…
                </>
              ) : (
                <>
                  <GoogleMark />
                  Continue with Google
                </>
              )}
            </button>
          )}

          <div className="mt-8 flex items-center justify-center gap-6 border-t border-border pt-6">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              No passwords stored
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Instant access
            </span>
          </div>
        </div>

        <p className="mt-6 text-center font-heading text-sm font-semibold text-primary text-glow">
          Made by DRX SOHEB KHAN
        </p>
      </div>
    </main>
  )
}
