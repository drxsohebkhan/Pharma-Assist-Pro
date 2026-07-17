"use client"

import { useRef, useState } from "react"
import {
  ScanText,
  UploadCloud,
  X,
  FileText,
  FlaskConical,
  Eye,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  RotateCcw,
} from "lucide-react"
import type { DecodeResult } from "@/lib/consult-schema"
import { ClinicalScanner } from "@/components/consult/clinical-scanner"
import { compressImage } from "@/lib/compress-image"
import { useLanguage } from "@/components/language-provider"

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "border-success/40 bg-success/10 text-success",
  medium: "border-accent/40 bg-accent/10 text-accent",
  low: "border-destructive/40 bg-destructive/10 text-destructive",
}

const STATUS_STYLES: Record<string, string> = {
  normal: "text-success",
  high: "text-accent",
  low: "text-accent",
  critical: "text-destructive",
}

const DOC_LABELS: Record<string, string> = {
  prescription: "Handwritten Prescription",
  lab_report: "Lab Report",
  body_image: "Body Image",
  other: "Other Document",
}

export function DecoderWorkspace() {
  const [image, setImage] = useState<{ dataUrl: string; name: string } | null>(null)
  const [hint, setHint] = useState("")
  const [phase, setPhase] = useState<"idle" | "scanning" | "result">("idle")
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { language } = useLanguage()

  async function loadFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
      setError("Please choose an image file under 15MB.")
      return
    }
    setError("")
    try {
      const dataUrl = await compressImage(file, 2000, 0.85)
      setImage({ dataUrl, name: file.name })
    } catch {
      setError("Could not process that image. Try a different one.")
    }
  }

  async function decode() {
    if (!image) {
      setError("Upload a prescription, lab report or body image first.")
      return
    }
    setError("")
    setPhase("scanning")
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: image.dataUrl, hint: hint.trim(), language: language.code }),
      })
      // Server can return plain text on infra errors (413 body-too-large etc.) — never blind-parse JSON
      const raw = await res.text()
      let data: { result?: unknown; error?: string }
      try {
        data = JSON.parse(raw)
      } catch {
        if (res.status === 413 || raw.includes("Request En")) {
          throw new Error("Image is too large for upload. Try a smaller photo.")
        }
        throw new Error(`Decoding failed (server error ${res.status}). Please try again.`)
      }
      if (!res.ok) throw new Error(data.error || "Decoding failed.")
      setResult(data.result as DecodeResult)
      setPhase("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decoding failed. Please try again.")
      setPhase("idle")
    }
  }

  if (phase === "scanning") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-8 px-4">
        <ClinicalScanner />
        <p className="text-center text-sm text-muted-foreground">
          Handwriting aur clinical data ka forensic-level analysis chal raha hai...
        </p>
      </div>
    )
  }

  if (phase === "result" && result) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <header className="fade-up mb-8 flex flex-col items-start justify-between gap-4 pt-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Decode Report</h1>
            <p className="mt-1 text-sm text-muted-foreground">{DOC_LABELS[result.documentType]}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setImage(null)
              setHint("")
              setPhase("idle")
            }}
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-5 text-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" />
            Decode Another
          </button>
        </header>

        <div className="flex flex-col gap-6">
          {/* Transcription */}
          <section className="glass fade-up stagger-1 rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold">Transcription</h2>
            </div>
            <pre className="whitespace-pre-wrap rounded-2xl border border-border bg-secondary/30 p-4 font-mono text-sm leading-relaxed text-foreground/90">
              {result.transcription}
            </pre>
          </section>

          {/* Decoded medicines */}
          {result.decodedItems.length > 0 && (
            <section className="fade-up stagger-2">
              <div className="mb-4 flex items-center gap-2">
                <ScanText className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Decoded Medicines</h2>
              </div>
              <div className="flex flex-col gap-4">
                {result.decodedItems.map((item, i) => (
                  <article key={i} className="glass glass-hover rounded-3xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          Written: {'"'}
                          {item.writtenText}
                          {'"'}
                        </p>
                        <h3 className="mt-1 font-heading text-xl font-bold text-primary">
                          {item.interpretedMedicine}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider ${CONFIDENCE_STYLES[item.confidence]}`}
                      >
                        {item.confidence} confidence
                      </span>
                    </div>
                    <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-3.5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dosage Instruction</p>
                      <p className="mt-1 text-sm font-medium">{item.dosageInstruction}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      {item.inStoreMatch ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          <span className="text-success">
                            In stock: {item.inStoreMatch.brandName} ({item.inStoreMatch.composition})
                          </span>
                        </>
                      ) : (
                        <>
                          <PackageX className="h-4 w-4 shrink-0 text-destructive" />
                          <span className="text-muted-foreground">Not available in your store inventory</span>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Lab findings */}
          {result.labFindings.length > 0 && (
            <section className="glass fade-up stagger-3 rounded-3xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Lab Findings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Test</th>
                      <th className="pb-3 pr-4 font-medium">Value</th>
                      <th className="pb-3 pr-4 font-medium">Normal Range</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.labFindings.map((f, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-3 pr-4">{f.testName}</td>
                        <td className="py-3 pr-4 font-mono">{f.value}</td>
                        <td className="py-3 pr-4 font-mono text-muted-foreground">{f.normalRange}</td>
                        <td className={`py-3 font-semibold uppercase text-xs ${STATUS_STYLES[f.status]}`}>
                          {f.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Summary */}
          <section className="glass fade-up stagger-4 rounded-3xl p-6">
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold">Summary</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            {result.warnings.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {result.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-xs text-accent">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="leading-relaxed">{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <header className="fade-up mb-8 pt-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
          <ScanText className="h-7 w-7 text-primary" />
        </div>
        <p className="type-label mb-2 text-primary">Vision Analysis</p>
        <h1 className="font-heading text-3xl font-semibold text-balance sm:text-4xl">Prescription Decoder</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
          Forensic-grade vision analysis for the hardest handwriting in medicine. Every decoded line is
          verified against real Indian brands, dose strengths and clinical context — then matched live to
          your store stock.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            loadFile(e.dataTransfer.files?.[0])
          }}
          className={`glass fade-up stagger-1 flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 transition-all ${
            dragOver ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40"
          }`}
        >
          {image ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.dataUrl || "/placeholder.svg"}
                alt={image.name}
                className="max-h-64 rounded-2xl border border-border object-contain"
              />
              <span
                role="button"
                tabIndex={0}
                aria-label="Remove image"
                onClick={(e) => {
                  e.stopPropagation()
                  setImage(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation()
                    setImage(null)
                  }
                }}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </span>
            </div>
          ) : (
            <>
              <UploadCloud className={`h-10 w-10 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium">Drop image here or click to upload</p>
              <p className="text-xs text-muted-foreground">Prescription · Lab report · Body image (max 8MB)</p>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => loadFile(e.target.files?.[0])}
          aria-label="Upload document image"
        />

        <div className="fade-up stagger-2 flex flex-col gap-1.5">
          <label htmlFor="hint" className="text-xs font-medium text-muted-foreground">
            Optional hint for the AI
          </label>
          <input
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder='e.g. "Skin specialist ka prescription hai" or "CBC report hai"'
            className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={decode}
          disabled={!image}
          className="glow-teal fade-up stagger-3 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-heading text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ScanText className="h-5 w-5" />
          Decode Document
        </button>
      </div>
    </div>
  )
}
