"use client"

import { useState, useTransition } from "react"
import { Sparkles, X } from "lucide-react"
import type { Medicine } from "@/lib/db/schema"
import { addMedicine, updateMedicine, type MedicineInput } from "@/app/actions/medicines"

const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Gel", "Drops", "Inhaler", "Powder"]
const CATEGORIES = [
  "Analgesic/Antipyretic",
  "Antibiotic",
  "Antihistamine",
  "Antiallergic",
  "Antacid",
  "Proton Pump Inhibitor",
  "Antiemetic",
  "Antidiarrheal",
  "NSAID",
  "Antidiabetic",
  "Antihypertensive",
  "Antifungal",
  "Antiseptic",
  "Cold & Flu",
  "Expectorant",
  "Antitussive",
  "Antispasmodic",
  "Multivitamin",
  "Supplement",
  "General",
]
const PREG_CATEGORIES = ["A", "B", "C", "D", "X"]

function toInput(m: Medicine | null): MedicineInput {
  return {
    brandName: m?.brandName ?? "",
    genericName: m?.genericName ?? "",
    composition: m?.composition ?? "",
    category: m?.category ?? "General",
    dosageForm: m?.dosageForm ?? "Tablet",
    strength: m?.strength ?? "",
    manufacturer: m?.manufacturer ?? "",
    mrp: m?.mrp ?? "",
    stockQuantity: m?.stockQuantity ?? 0,
    rxRequired: m?.rxRequired ?? false,
    sideEffects: m?.sideEffects ?? "",
    contraindications: m?.contraindications ?? "",
    drugInteractions: m?.drugInteractions ?? "",
    pregnancyCategory: m?.pregnancyCategory ?? "C",
    pediatricSafe: m?.pediatricSafe ?? false,
    geriatricCaution: m?.geriatricCaution ?? false,
    therapeuticUses: m?.therapeuticUses ?? "",
  }
}

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"

export function MedicineForm({
  medicine,
  onClose,
  onSaved,
}: {
  medicine: Medicine | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<MedicineInput>(() => toInput(medicine))
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [enriching, setEnriching] = useState(false)
  const [enrichNote, setEnrichNote] = useState("")

  function set<K extends keyof MedicineInput>(key: K, value: MedicineInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function autoFill() {
    setError("")
    setEnrichNote("")
    setEnriching(true)
    try {
      const res = await fetch("/api/enrich-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: form.brandName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "AI auto-fill failed.")
        return
      }
      const r = data.result
      setForm((prev) => ({
        ...prev,
        genericName: r.genericName || prev.genericName,
        composition: r.composition || prev.composition,
        category: r.category || prev.category,
        dosageForm: r.dosageForm || prev.dosageForm,
        strength: r.strength || prev.strength,
        manufacturer: r.manufacturer || prev.manufacturer,
        mrp: r.approxMrp > 0 ? String(r.approxMrp) : prev.mrp,
        rxRequired: r.rxRequired,
        sideEffects: r.sideEffects || prev.sideEffects,
        contraindications: r.contraindications || prev.contraindications,
        drugInteractions: r.drugInteractions || prev.drugInteractions,
        pregnancyCategory: r.pregnancyCategory || prev.pregnancyCategory,
        pediatricSafe: r.pediatricSafe,
        geriatricCaution: r.geriatricCaution,
        therapeuticUses: r.therapeuticUses || prev.therapeuticUses,
      }))
      const conf = r.confidence === "high" ? "High confidence" : r.confidence === "medium" ? "Medium confidence — verify before saving" : "Low confidence — verify carefully"
      setEnrichNote(r.note ? `${conf}. ${r.note}` : conf)
    } catch {
      setError("AI auto-fill failed. Check your connection and try again.")
    } finally {
      setEnriching(false)
    }
  }

  function submit() {
    setError("")
    startTransition(async () => {
      const res = medicine ? await updateMedicine(medicine.id, form) : await addMedicine(form)
      if (!res.ok) {
        setError(res.error || "Something went wrong.")
        return
      }
      onSaved()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={medicine ? `Edit ${medicine.brandName}` : "Add medicine"}
    >
      <div className="glass my-8 w-full max-w-2xl rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">
            {medicine ? `Edit ${medicine.brandName}` : "Add Medicine"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="mf-brand" className="text-xs font-medium text-muted-foreground">
              Brand name *
            </label>
            <div className="flex gap-2">
              <input
                id="mf-brand"
                value={form.brandName}
                onChange={(e) => set("brandName", e.target.value)}
                placeholder="e.g. Crocin Advance"
                className={inputCls}
              />
              <button
                type="button"
                onClick={autoFill}
                disabled={enriching || form.brandName.trim().length < 2}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 text-xs font-semibold text-primary transition-all hover:bg-primary/20 disabled:opacity-40"
              >
                <Sparkles className={`size-4 ${enriching ? "animate-spin" : ""}`} />
                {enriching ? "Analyzing..." : "AI Auto-Fill"}
              </button>
            </div>
            {enrichNote && (
              <p className="mt-1 text-xs text-primary" role="status">
                {enrichNote}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-generic" className="text-xs font-medium text-muted-foreground">
              Generic name *
            </label>
            <input
              id="mf-generic"
              value={form.genericName}
              onChange={(e) => set("genericName", e.target.value)}
              placeholder="e.g. Paracetamol"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="mf-composition" className="text-xs font-medium text-muted-foreground">
              Composition *
            </label>
            <input
              id="mf-composition"
              value={form.composition}
              onChange={(e) => set("composition", e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-category" className="text-xs font-medium text-muted-foreground">
              Category
            </label>
            <select
              id="mf-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={`${inputCls} [&>option]:bg-popover`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-form" className="text-xs font-medium text-muted-foreground">
              Dosage form
            </label>
            <select
              id="mf-form"
              value={form.dosageForm}
              onChange={(e) => set("dosageForm", e.target.value)}
              className={`${inputCls} [&>option]:bg-popover`}
            >
              {DOSAGE_FORMS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-strength" className="text-xs font-medium text-muted-foreground">
              Strength
            </label>
            <input
              id="mf-strength"
              value={form.strength}
              onChange={(e) => set("strength", e.target.value)}
              placeholder="e.g. 500mg or 250mg/5ml"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-mfr" className="text-xs font-medium text-muted-foreground">
              Manufacturer
            </label>
            <input
              id="mf-mfr"
              value={form.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              placeholder="e.g. Cipla"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-mrp" className="text-xs font-medium text-muted-foreground">
              MRP (₹)
            </label>
            <input
              id="mf-mrp"
              type="number"
              min={0}
              step="0.01"
              value={form.mrp}
              onChange={(e) => set("mrp", e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-stock" className="text-xs font-medium text-muted-foreground">
              Stock quantity
            </label>
            <input
              id="mf-stock"
              type="number"
              min={0}
              value={form.stockQuantity}
              onChange={(e) => set("stockQuantity", Number(e.target.value))}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-preg" className="text-xs font-medium text-muted-foreground">
              Pregnancy category
            </label>
            <select
              id="mf-preg"
              value={form.pregnancyCategory}
              onChange={(e) => set("pregnancyCategory", e.target.value)}
              className={`${inputCls} [&>option]:bg-popover`}
            >
              {PREG_CATEGORIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3">
            {(
              [
                ["rxRequired", "Rx required"],
                ["pediatricSafe", "Pediatric safe"],
                ["geriatricCaution", "Geriatric caution"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={form[key]}
                onClick={() => set(key, !form[key])}
                className={`rounded-full border px-3 py-2 text-xs transition-all ${
                  form[key]
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="mf-uses" className="text-xs font-medium text-muted-foreground">
              Therapeutic uses
            </label>
            <input
              id="mf-uses"
              value={form.therapeuticUses}
              onChange={(e) => set("therapeuticUses", e.target.value)}
              placeholder="e.g. Fever, headache, body pain"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-side" className="text-xs font-medium text-muted-foreground">
              Side effects
            </label>
            <input
              id="mf-side"
              value={form.sideEffects}
              onChange={(e) => set("sideEffects", e.target.value)}
              placeholder="e.g. Nausea, drowsiness"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mf-contra" className="text-xs font-medium text-muted-foreground">
              Contraindications
            </label>
            <input
              id="mf-contra"
              value={form.contraindications}
              onChange={(e) => set("contraindications", e.target.value)}
              placeholder="e.g. Liver disease, pregnancy"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="mf-inter" className="text-xs font-medium text-muted-foreground">
              Drug interactions
            </label>
            <input
              id="mf-inter"
              value={form.drugInteractions}
              onChange={(e) => set("drugInteractions", e.target.value)}
              placeholder="e.g. Warfarin, alcohol"
              className={inputCls}
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={submit}
            className="glow-teal rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-50"
          >
            {isPending ? "Saving..." : medicine ? "Save Changes" : "Add Medicine"}
          </button>
        </div>
      </div>
    </div>
  )
}
