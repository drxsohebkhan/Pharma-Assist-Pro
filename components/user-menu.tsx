"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LogIn, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

export function UserMenu() {
  const router = useRouter()
  const { user, loading, configured, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  if (!configured) {
    return (
      <Link
        href="/login"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 whitespace-nowrap"
      >
        <LogIn className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    )
  }

  if (loading) {
    return <div className="size-8 shrink-0 animate-pulse rounded-full bg-secondary" aria-hidden="true" />
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 whitespace-nowrap"
      >
        <LogIn className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    )
  }

  const displayName = user.displayName || user.email || "Account"
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex shrink-0 items-center gap-2">
      {user.photoURL ? (
        <Image
          src={user.photoURL || "/placeholder.svg"}
          alt={displayName}
          width={32}
          height={32}
          className="size-8 rounded-full border border-primary/30"
          title={displayName}
          unoptimized
        />
      ) : (
        <span
          className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary"
          title={displayName}
        >
          {initial}
        </span>
      )}
      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true)
          try {
            await signOut()
            router.push("/login")
            router.refresh()
          } finally {
            setSigningOut(false)
          }
        }}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
        aria-label="Sign out"
      >
        <LogOut className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">{signingOut ? "Signing out…" : "Sign out"}</span>
      </button>
    </div>
  )
}
