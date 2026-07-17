"use client"

import {
  Pill,
  AlertTriangle,
  Ban,
  HeartPulse,
  RotateCcw,
  Languages,
  Siren,
  ClipboardList,
  Eye,
} from "lucide-react"
import type { ConsultResult } from "@/lib/consult-schema"

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "border-success/40 bg-success/10 text-success",
  medium: "border-accent/40 bg-accent/10 text-accent",
  low: "border-border bg-secondary/40 text-muted-foreground",
}

export function ConsultResultView({
  result,
  patientName,
  age,
  gender,
  onNewConsult,
}: {
  result: ConsultResult
  patientName: string
  age: string
  gender: string
  onNewConsult: () => void
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="fade-up mb-8 flex flex-col items-start justify-between gap-4 pt-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Clinical Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patientName || "Patient"} · {age} yrs · {gender}
          </p>
        </div>
        <button
          type="button"
          onClick={onNewConsult}
          className="flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
        >
          <RotateCcw className="h-4 w-4" />
          New Consultation
        </button>
      </header>

      <div className="flex flex-col gap-6">
        {/* Interpretation */}
        <section className="glass fade-up stagger-1 rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Symptom Interpretation</h2>
            <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-wider text-primary">
              {result.interpretedSymptoms.detectedLanguage}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {'"'}
            {result.interpretedSymptoms.original}
            {'"'}
          </p>
          <p className="mt-2 text-base font-medium text-foreground">
            {result.interpretedSymptoms.normalized}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {result.interpretedSymptoms.possibleConditions.map((c) => (
              <div key={c.condition} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-semibold">{c.condition}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${CONFIDENCE_STYLES[c.confidence]}`}
                  >
                    {c.confidence} confidence
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
          {result.imageFindings && (
            <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/5 p-4">
              <div className="mb-1 flex items-center gap-2 text-accent">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Image Findings</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.imageFindings}</p>
            </div>
          )}
        </section>

        {/* Referral banner */}
        {result.referToDoctor && (
          <div className="pulse-danger fade-up flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-5" role="alert">
            <Siren className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-heading text-sm font-bold text-destructive">Physician Referral Recommended</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                Ye condition pharmacy-level treatment se aage ki hai. Patient ko doctor ke paas refer karna zaroori
                hai. Neeche di gayi medicines sirf initial/supportive relief ke liye hain.
              </p>
            </div>
          </div>
        )}

        {/* Recommended medicines — prescription pad */}
        <section className="fade-up stagger-2">
          <div className="mb-4 flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold">Recommended Medication</h2>
            <span className="text-xs text-muted-foreground">(from your store stock)</span>
          </div>
          <div className="flex flex-col gap-4">
            {result.recommendedMedicines.map((m, i) => (
              <article
                key={`${m.medicineId}-${i}`}
                className="glass glass-hover rounded-3xl p-6"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-primary text-glow">{m.brandName}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.composition} · {m.dosageForm}
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                    Rx #{i + 1}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dosage</p>
                    <p className="mt-1 text-sm font-medium">{m.recommendedDosage}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
                    <p className="mt-1 text-sm font-medium">{m.duration}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Timing</p>
                    <p className="mt-1 text-sm font-medium">{m.timing}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{m.reason}</p>

                {m.warnings.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {m.warnings.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-xs text-accent">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Contraindicated */}
        {result.contraindicated.length > 0 && (
          <section className="glass fade-up stagger-3 rounded-3xl border-destructive/25 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              <h2 className="font-heading text-lg font-semibold">Avoid These Medicines</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {result.contraindicated.map((c) => (
                <li key={c.medicine} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="font-heading text-sm font-semibold text-destructive">{c.medicine}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.reason}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Advice + Red flags */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="glass fade-up stagger-4 rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-success" />
              <h2 className="font-heading text-lg font-semibold">General Advice</h2>
            </div>
            <ul className="flex flex-col gap-2.5">
              {result.generalAdvice.map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  {a}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass fade-up stagger-5 rounded-3xl border-destructive/20 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" />
              <h2 className="font-heading text-lg font-semibold">Red Flags</h2>
            </div>
            <ul className="flex flex-col gap-2.5">
              {result.redFlags.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Follow up */}
        <section className="glass fade-up stagger-6 flex items-start gap-3 rounded-3xl p-6">
          <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-primary">Follow-up</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{result.followUp}</p>
          </div>
        </section>

        <p className="text-center text-xs leading-relaxed text-muted-foreground/60">
          This is a clinical decision-support suggestion for a licensed pharmacist — final dispensing judgment rests
          with the pharmacist. Serious cases must always be referred to a physician.
        </p>
      </div>
    </div>
  )
}
