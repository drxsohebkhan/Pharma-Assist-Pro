"use client"

import { useRef, useState, useTransition } from "react"
import { X, Camera, Upload, CheckCircle2, TriangleAlert, Pill } from "lucide-react"
import { compressImage } from "@/lib/compress-image"
import { addMedicinesBulk, type MedicineInput } from "@/app/actions/medicines"
import { ClinicalScanner } from "@/components/consult/clinical-scanner"

interface ScannedMedicine {
  brandName: string
  genericName: string
  composition: string
  category: string
  dosageForm: string
  strength: string
  manufacturer: string
  approxMrp: number
  stockQuantity: number
  rxRequired: boolean
  sideEffects: string
  contraindications: string
  drugInteractions: string
  pregnancyCategory: string
  pediatricSafe: boolean
  geriatricCaution: boolean
  therapeuticUses: string
  confidence: "high" | "medium" | "low"
}

interface ScanResult {
  imageType: string
  medicines: ScannedMedicine[]
  note: string
}

type Stage = "pick" | "scanning" | "review" | "done"

export function InventoryScanner({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: () => void
}) {
  const [stage, setStage] = useState<Stage>("pick")
  const [preview, setPreview] = useState("")
  const [error, setError] = useState("")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [summary, setSummary] = useState({ added: 0, skipped: 0 })
  const [isPending, startTransition] = useTransition()
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    setError("")
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG photo).")
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image is too large (max 15MB). Take a normal photo and retry.")
      return
    }

    let dataUrl: string
    try {
      dataUrl = await compressImage(file, 2000, 0.85)
    } catch {
      setError("Could not process that image. Try a different photo.")
      return
    }

    setPreview(dataUrl)
    setStage("scanning")

    try {
      const res = await fetch("/api/scan-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      })
      // Server can return plain text on infra errors — never blind-parse JSON
      const raw = await res.text()
      let data: { result?: ScanResult; error?: string }
      try {
        data = JSON.parse(raw)
      } catch {
        if (res.status === 413 || raw.includes("Request En")) {
          throw new Error("Image is too large for upload. Take a photo from slightly further away.")
        }
        throw new Error(`Scan failed (server error ${res.status}). Please try again.`)
      }
      if (!res.ok || !data.result) {
        throw new Error(data.error || "Scan failed. Try a clearer photo.")
      }
      setResult(data.result)
      setSelected(new Set(data.result.medicines.map((_, i) => i)))
      setStage("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed. Please try again.")
      setStage("pick")
    } finally {
      if (uploadRef.current) uploadRef.current.value = ""
      if (cameraRef.current) cameraRef.current.value = ""
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function confirmAdd() {
    if (!result) return
    setError("")
    const inputs: MedicineInput[] = result.medicines
      .filter((_, i) => selected.has(i))
      .map((m) => ({
        brandName: m.brandName,
        genericName: m.genericName,
        composition: m.composition,
        category: m.category || "General",
        dosageForm: m.dosageForm || "Tablet",
        strength: m.strength || "",
        manufacturer: m.manufacturer || "",
        mrp: m.approxMrp > 0 ? m.approxMrp.toFixed(2) : "0",
        stockQuantity: m.stockQuantity > 0 ? m.stockQuantity : 50,
        rxRequired: m.rxRequired,
        sideEffects: m.sideEffects || "",
        contraindications: m.contraindications || "",
        drugInteractions: m.drugInteractions || "",
        pregnancyCategory: m.pregnancyCategory || "C",
        pediatricSafe: m.pediatricSafe,
        geriatricCaution: m.geriatricCaution,
        therapeuticUses: m.therapeuticUses || "",
      }))

    if (inputs.length === 0) {
      setError("Select at least one medicine to add.")
      return
    }

    startTransition(async () => {
      try {
        const res = await addMedicinesBulk(inputs)
        if (!res.ok) {
          setError(res.error || "Could not add medicines. Please try again.")
          return
        }
        setSummary({ added: res.added, skipped: res.skipped })
        setStage("done")
      } catch {
        setError("Could not save medicines. Check your connection and try again.")
      }
    })
  }

  const confidenceBadge = {
    high: "bg-success/15 text-success",
    medium: "bg-accent/15 text-accent",
    low: "bg-destructive/15 text-destructive",
  } as const

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Scan medicines"
    >
      <div className="glass my-8 w-full max-w-2xl rounded-3xl p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="type-label text-primary">AI Inventory Scanner</p>
            <h2 className="mt-1 font-heading text-xl font-bold">
              {stage === "review" ? "Review & Confirm" : stage === "done" ? "Added to Inventory" : "Scan Medicines"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {stage === "pick" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Upload or capture a photo of a <span className="font-semibold text-foreground">medicine list, purchase
              bill, or a single medicine</span>. The AI reads every item, fills complete clinical data, and adds
              everything to your inventory automatically.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                className="glass glass-hover flex flex-col items-center gap-3 rounded-2xl border-dashed p-8"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Upload className="size-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">Upload Photo</span>
                <span className="text-xs text-muted-foreground">List, bill, or product image</span>
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="glass glass-hover flex flex-col items-center gap-3 rounded-2xl border-dashed p-8"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <Camera className="size-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">Use Camera</span>
                <span className="text-xs text-muted-foreground">Scan directly with your camera</span>
              </button>
            </div>
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload medicine list image"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              aria-label="Capture medicine photo with camera"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        )}

        {stage === "scanning" && (
          <div className="flex flex-col items-center gap-5 py-4">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview || "/placeholder.svg"}
                alt="Uploaded medicine list being analyzed"
                className="max-h-40 rounded-xl border border-border object-contain"
              />
            )}
            <ClinicalScanner />
          </div>
        )}

        {stage === "review" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{result.medicines.length}</span>{" "}
                {result.medicines.length === 1 ? "medicine" : "medicines"} — uncheck any you don&apos;t want.
              </p>
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    selected.size === result.medicines.length
                      ? new Set()
                      : new Set(result.medicines.map((_, i) => i)),
                  )
                }
                className="shrink-0 text-xs font-semibold text-primary hover:underline"
              >
                {selected.size === result.medicines.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            {result.note && (
              <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-xs leading-relaxed text-accent">
                {result.note}
              </p>
            )}

            <ul className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto pr-1">
              {result.medicines.map((m, i) => (
                <li key={`${m.brandName}-${i}`}>
                  <label className="glass flex cursor-pointer items-start gap-3 rounded-xl p-3.5 transition-colors has-[:checked]:border-primary/50">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-1 size-4 accent-[#00d4aa]"
                      aria-label={`Include ${m.brandName}`}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-semibold">{m.brandName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${confidenceBadge[m.confidence]}`}
                        >
                          {m.confidence}
                        </span>
                        {m.rxRequired && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            Rx
                          </span>
                        )}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.composition} · {m.dosageForm}
                        {m.approxMrp > 0 ? ` · ₹${m.approxMrp}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setStage("pick")
                  setResult(null)
                  setPreview("")
                }}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Scan Another
              </button>
              <button
                type="button"
                disabled={isPending || selected.size === 0}
                onClick={confirmAdd}
                className="glow-teal inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-50"
              >
                <Pill className="size-4" aria-hidden="true" />
                {isPending ? "Adding..." : `Add ${selected.size} to Inventory`}
              </button>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-2xl font-bold">
                {summary.added} {summary.added === 1 ? "medicine" : "medicines"} added
              </p>
              {summary.skipped > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary.skipped} skipped (already in your inventory)
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStage("pick")
                  setResult(null)
                  setPreview("")
                  setError("")
                }}
                className="rounded-full glass glass-hover px-5 py-2.5 text-sm font-semibold text-primary"
              >
                Scan More
              </button>
              <button
                type="button"
                onClick={onAdded}
                className="glow-teal rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                View Inventory
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
