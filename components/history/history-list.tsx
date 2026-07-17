"use client"

import { useMemo, useState } from "react"
import { History, Search, Trash2, ChevronDown, Pill, Siren } from "lucide-react"
import type { Consultation } from "@/lib/db/schema"
import type { ConsultResult } from "@/lib/consult-schema"
import { deleteConsultation } from "@/app/actions/consultations"
import { useRouter } from "next/navigation"

function formatDate(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function HistoryList({ records }: { records: Consultation[] }) {
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const router = useRouter()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return records
    return records.filter(
      (r) =>
        r.patientName.toLowerCase().includes(q) ||
        r.symptoms.toLowerCase().includes(q),
    )
  }, [records, query])

  async function handleDelete(id: number) {
    setDeletingId(id)
    await deleteConsultation(id)
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="fade-up mb-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="type-label text-primary">Patient Records</p>
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Consultation History</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              A complete clinical audit trail — <span className="tabular-nums">{records.length}</span>{" "}
              consultation{records.length === 1 ? "" : "s"} preserved with full patient context and AI reasoning
            </p>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name or symptoms..."
            aria-label="Search consultations"
            className="h-12 w-full rounded-2xl border border-border bg-secondary/50 pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="glass fade-up rounded-3xl p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {records.length === 0
              ? "No consultations yet. Run your first Smart Consult to build patient records."
              : "No consultations match your search."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((r, idx) => {
            const result = r.aiResult as ConsultResult | Record<string, never>
            const hasResult = "recommendedMedicines" in result
            const isOpen = openId === r.id
            const conditions = Array.isArray(r.previousConditions) ? (r.previousConditions as string[]) : []
            return (
              <li key={r.id} className="glass fade-up rounded-3xl" style={{ animationDelay: `${Math.min(idx, 6) * 80}ms` }}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-base font-semibold">
                        {r.patientName || "Unnamed patient"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.patientAge} yrs · {r.patientGender}
                      </span>
                      {hasResult && (result as ConsultResult).referToDoctor && (
                        <span className="flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-destructive">
                          <Siren className="h-3 w-3" />
                          Referred
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{r.symptoms}</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">{formatDate(r.createdAt)}</p>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-border px-5 pb-5 pt-4">
                    {conditions.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {conditions.map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] text-accent"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {hasResult ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {(result as ConsultResult).interpretedSymptoms.normalized}
                        </p>
                        <ul className="flex flex-col gap-2">
                          {(result as ConsultResult).recommendedMedicines.map((m, i) => (
                            <li
                              key={`${m.medicineId}-${i}`}
                              className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/30 p-3.5"
                            >
                              <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-primary">{m.brandName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {m.recommendedDosage} · {m.duration}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Follow-up: {(result as ConsultResult).followUp}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No structured result stored.</p>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="mt-4 flex h-9 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 text-xs text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === r.id ? "Deleting..." : "Delete record"}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
