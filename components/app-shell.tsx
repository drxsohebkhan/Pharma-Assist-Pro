"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { MolecularField } from "@/components/molecular-field"
import { CinematicBackdrop } from "@/components/cinematic-backdrop"
import { Activity, Pill, ScanLine, History, LayoutGrid, Menu, X } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { LanguageProvider } from "@/components/language-provider"
import { LanguageSelect } from "@/components/language-select"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ProtectedRoute } from "@/components/auth/protected-route"

// Full-screen auth pages render without the sidebar/shell chrome
const BARE_ROUTES = ["/login", "/access"]

const NAV = [
  { href: "/", label: "Dashboard", kicker: "Overview", icon: LayoutGrid },
  { href: "/consult", label: "Smart Consult", kicker: "AI Engine", icon: Activity },
  { href: "/inventory", label: "Inventory", kicker: "Stock", icon: Pill },
  { href: "/decoder", label: "Rx Decoder", kicker: "Vision", icon: ScanLine },
  { href: "/history", label: "History", kicker: "Records", icon: History },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary glow-teal">
        <Activity className="size-5" aria-hidden="true" />
      </span>
      <span className="font-heading text-lg font-bold tracking-tight">
        PharmaAssist <span className="text-primary">Pro</span>
      </span>
    </Link>
  )
}

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1.5">
      <p className="type-label mb-2 px-3 text-muted-foreground/70">Workspace</p>
      {NAV.map(({ href, label, kicker, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                active ? "bg-primary/15 text-primary" : "bg-secondary/60 group-hover:text-foreground",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold leading-tight">{label}</span>
              <span className="type-label mt-0.5 text-[10px] text-muted-foreground/60">{kicker}</span>
            </span>
            {active && <span className="ml-auto size-1.5 rounded-full bg-primary" aria-hidden="true" />}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change + lock body scroll while open
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  // Auth pages: full-screen, no sidebar — but still inside AuthProvider
  if (BARE_ROUTES.includes(pathname)) {
    return (
      <AuthProvider>
        <div className="relative min-h-screen">
          <CinematicBackdrop />
          <MolecularField />
          <div className="relative z-10">{children}</div>
        </div>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <LanguageProvider>
      <div className="relative flex min-h-screen">
        <CinematicBackdrop />
        <MolecularField />

        {/* Desktop sidebar */}
        <aside className="sticky top-0 z-40 hidden h-screen w-64 shrink-0 flex-col gap-6 glass border-y-0 border-l-0 p-5 lg:flex">
          <Logo />
          <SidebarNav pathname={pathname} />
          <div className="flex flex-col gap-3">
            <LanguageSelect />
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
              <span className="type-label text-muted-foreground/70">Account</span>
              <UserMenu />
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 glass border-y-0 border-l-0 p-5 slide-in-left overflow-y-auto">
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation"
                  className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <SidebarNav pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              <LanguageSelect />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile / tablet top bar */}
          <header className="sticky top-0 z-40 glass border-x-0 border-t-0 lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open navigation menu"
                  className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </button>
                <Logo />
              </div>
              <UserMenu />
            </div>
            {/* Quick tabs strip */}
            <nav aria-label="Quick navigation" className="flex items-center gap-1 overflow-x-auto px-4 pb-2.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </header>

          <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-10">
            <ProtectedRoute>{children}</ProtectedRoute>
          </main>

          <footer className="relative z-10 mt-8 border-t border-border">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
              <p className="text-sm text-muted-foreground">
                PharmaAssist Pro — Clinical decision support for pharmacists. AI suggestions are advisory; final
                dispensing judgment rests with the licensed pharmacist.
              </p>
              <p className="font-heading text-sm font-semibold text-primary text-glow whitespace-nowrap md:hidden">
                Made by DRX SOHEB KHAN
              </p>
            </div>
          </footer>
        </div>

        <div
          className="pointer-events-none fixed bottom-4 right-4 z-50 hidden rounded-full glass px-3 py-1.5 text-xs font-medium text-primary md:block"
          aria-hidden="true"
        >
          Made by DRX SOHEB KHAN
        </div>
      </div>
      </LanguageProvider>
    </AuthProvider>
  )
}
