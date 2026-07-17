import Link from "next/link"
import { getDashboardStats } from "@/app/actions/medicines"
import { getConsultations } from "@/app/actions/consultations"
import { getSessionUser } from "@/lib/session"
import { CountUp } from "@/components/count-up"
import { EcgLine } from "@/components/ecg-line"
import { ParallaxImage } from "@/components/parallax-image"
import type { ConsultResult } from "@/lib/consult-schema"
import {
  Activity,
  Pill,
  ScanLine,
  History,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Stethoscope,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [stats, recent, user] = await Promise.all([
    getDashboardStats(),
    getConsultations(4),
    getSessionUser(),
  ])
  const maxCategory = Math.max(1, ...stats.categories.map((c) => c.count))
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? null

  return (
    <div className="flex flex-col gap-6">
      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Hero — 2x2 */}
        <section className="fade-up stagger-1 glass glass-hover relative col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl p-8 md:col-span-2 lg:row-span-2">
          <div className="relative z-10 flex flex-col gap-4">
            <span className="type-label inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-primary">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Clinical Decision Support System
            </span>
            {firstName ? (
              <div>
                <h1 className="text-balance font-heading text-4xl font-semibold leading-tight md:text-5xl">
                  <span className="text-primary text-glow">{firstName}</span>
                </h1>
                <p className="mt-2 font-heading text-lg font-medium leading-snug text-foreground md:text-xl">
                  collaborating with{" "}
                  <span className="text-primary">Drx Soheb Khan&apos;s</span> Pharmacy Intelligence
                </p>
              </div>
            ) : (
              <h1 className="text-balance font-heading text-4xl font-semibold leading-tight md:text-5xl">
                Pharmacy Intelligence, <span className="text-primary text-glow">Perfected.</span>
              </h1>
            )}
            <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
              Clinical-grade decision support for the modern Indian pharmacy — symptom intelligence in 27
              languages, forensic prescription decoding, and every recommendation safety-screened against
              your live shelf stock.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/consult"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] glow-teal"
              >
                <Stethoscope className="size-4" aria-hidden="true" />
                Start Smart Consult
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/decoder"
                className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
              >
                <ScanLine className="size-4" aria-hidden="true" />
                Decode Prescription
              </Link>
            </div>
          </div>
          <div className="relative z-10 mt-8 h-16 w-full opacity-80">
            <EcgLine className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        </section>

        {/* Stat: Total medicines */}
        <section className="fade-up stagger-2 glass glass-hover flex flex-col justify-between rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="type-label text-muted-foreground">Medicines in Store</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pill className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 font-sans text-5xl font-semibold tracking-tight tabular-nums text-primary text-glow">
            <CountUp value={stats.totalMedicines} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">brands with full composition data</p>
        </section>

        {/* Stat: Rx required */}
        <section className="fade-up stagger-3 glass glass-hover flex flex-col justify-between rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="type-label text-muted-foreground">Rx-Only Medicines</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 font-sans text-5xl font-semibold tracking-tight tabular-nums text-accent">
            <CountUp value={stats.rxCount} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">require a valid prescription</p>
        </section>

        {/* Low stock alert */}
        <section
          className={`fade-up stagger-4 glass glass-hover flex flex-col rounded-3xl p-6 ${stats.lowStock > 0 ? "pulse-danger" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="type-label text-muted-foreground">Low Stock Alerts</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 font-sans text-5xl font-semibold tracking-tight tabular-nums text-destructive">
            <CountUp value={stats.lowStock} />
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {stats.lowStockList.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{m.brandName}</span>
                <span className="ml-2 shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                  {m.stockQuantity} left
                </span>
              </li>
            ))}
            {stats.lowStockList.length === 0 && (
              <li className="text-sm text-muted-foreground">All medicines well stocked.</li>
            )}
          </ul>
        </section>

        {/* Consultations stat */}
        <section className="fade-up stagger-4 glass glass-hover flex flex-col justify-between rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="type-label text-muted-foreground">AI Consultations</span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-success/10 text-success">
              <Activity className="size-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-4 font-sans text-5xl font-semibold tracking-tight tabular-nums text-success">
            <CountUp value={stats.totalConsultations} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">patients analyzed by the engine</p>
        </section>

        {/* Category infographic — 2 wide */}
        <section className="fade-up stagger-5 glass glass-hover col-span-1 rounded-3xl p-6 md:col-span-2">
          <h2 className="font-heading text-lg font-semibold">Inventory by Category</h2>
          <div className="mt-4 flex flex-col gap-3">
            {stats.categories.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm text-muted-foreground">{c.category}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(c.count / maxCategory) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-semibold text-primary">{c.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Molecular visual — 2 wide with parallax */}
        <section className="fade-up stagger-5 glass glass-hover relative col-span-1 min-h-56 overflow-hidden rounded-3xl md:col-span-2">
          <ParallaxImage
            src="/images/molecular-hero.png"
            alt="Molecular structure visualization with glowing teal DNA helix and floating capsules"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 z-10 p-6">
            <p className="font-heading text-lg font-semibold">Beast-Mode AI Engine</p>
            <p className="text-sm text-muted-foreground">
              Multi-layer safety pipeline: interactions, allergies, pregnancy, pediatric and geriatric filters.
            </p>
          </div>
        </section>

        {/* Recent consultations — full width */}
        <section className="fade-up stagger-6 glass glass-hover col-span-1 rounded-3xl p-6 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recent Consultations</h2>
            <Link
              href="/history"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all
              <History className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No consultations yet. Run your first Smart Consult to see patient analysis history here.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recent.map((c) => {
                const result = c.aiResult as Partial<ConsultResult>
                const firstMed = result?.recommendedMedicines?.[0]
                return (
                  <li key={c.id} className="rounded-2xl bg-secondary/60 p-4">
                    <p className="text-xs text-muted-foreground">
                      {c.patientName || "Patient"} — {c.patientAge}y, {c.patientGender}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium">{c.symptoms}</p>
                    {firstMed && (
                      <p className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {firstMed.brandName}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
