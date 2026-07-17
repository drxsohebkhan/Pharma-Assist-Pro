"use client"

import { useRef, useState } from "react"
import {
  Stethoscope,
  ImagePlus,
  X,
  Sparkles,
  Mars,
  Venus,
  Users,
} from "lucide-react"
import type { ConsultResult } from "@/lib/consult-schema"
import { ClinicalScanner } from "@/components/consult/clinical-scanner"
import { compressImage } from "@/lib/compress-image"
import { ConsultResultView } from "@/components/consult/consult-result"
import { useLanguage } from "@/components/language-provider"

const CONDITIONS = [
  "Diabetes",
  "Hypertension (BP)",
  "Asthma",
  "Heart Disease",
  "Kidney Disease",
  "Liver Disease",
  "Thyroid",
  "Epilepsy",
]

const SYMPTOM_CHIPS = ["Bukhar / Fever", "Sir dard / Headache", "Khansi / Cough", "Pet dard / Stomach pain", "Loose motion", "Body pain"]

const GENDERS = [
  { value: "male", label: "Male", icon: Mars },
  { value: "female", label: "Female", icon: Venus },
  { value: "other", label: "Other", icon: Users },
] as const

interface UploadedImage {
  dataUrl: string
  label: string
  name: string
}

export function ConsultWorkspace() {
  const [patientName, setPatientName] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<string>("male")
  const [weight, setWeight] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [conditions, setConditions] = useState<string[]>([])
  const [currentMeds, setCurrentMeds] = useState("")
  const [allergies, setAllergies] = useState("")
  const [isPregnant, setIsPregnant] = useState(false)
  const [isBreastfeeding, setIsBreastfeeding] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [phase, setPhase] = useState<"form" | "scanning" | "result">("form")
  const [result, setResult] = useState<ConsultResult | null>(null)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const { language } = useLanguage()

  function toggleCondition(c: string) {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = 4 - images.length
    const list = Array.from(files).slice(0, remaining)
    for (const file of list) {
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) continue
      try {
        const dataUrl = await compressImage(file)
        setImages((prev) =>
          prev.length >= 4 ? prev : [...prev, { dataUrl, label: "patient upload", name: file.name }],
        )
      } catch {
        setError("Could not process that image. Try a different one.")
      }
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  async function analyze() {
    setError("")
    const ageNum = Number(age)
    if (!symptoms.trim()) {
      setError("Please describe the patient's symptoms first.")
      return
    }
    if (!ageNum || ageNum < 0 || ageNum > 130) {
      setError("Please enter a valid patient age.")
      return
    }
    setPhase("scanning")
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientAge: ageNum,
          patientGender: gender,
          patientWeight: weight ? Number(weight) : undefined,
          symptoms: symptoms.trim(),
          previousConditions: conditions,
          currentMedications: currentMeds.trim(),
          allergies: allergies.trim(),
          isPregnant: gender === "female" && isPregnant,
          isBreastfeeding: gender === "female" && isBreastfeeding,
          images: images.map(({ dataUrl, label }) => ({ dataUrl, label })),
          language: language.code,
        }),
      })
      // Server can return plain text on infra errors (413 body-too-large etc.) — never blind-parse JSON
      const raw = await res.text()
      let data: { result?: unknown; error?: string }
      try {
        data = JSON.parse(raw)
      } catch {
        if (res.status === 413 || raw.includes("Request En")) {
          throw new Error("Images are too large for upload. Remove an image and try again.")
        }
        throw new Error(`Analysis failed (server error ${res.status}). Please try again.`)
      }
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed.")
      }
      setResult(data.result as ConsultResult)
      setPhase("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.")
      setPhase("form")
    }
  }

  function resetAll() {
    setResult(null)
    setPhase("form")
  }

  if (phase === "scanning") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-8 px-4">
        <ClinicalScanner />
        <p className="text-center text-sm text-muted-foreground">
          Patient profile aur store inventory ke against deep analysis chal raha hai...
        </p>
      </div>
    )
  }

  if (phase === "result" && result) {
    return (
      <ConsultResultView
        result={result}
        patientName={patientName}
        age={age}
        gender={gender}
        onNewConsult={resetAll}
      />
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20">
      <header className="fade-up mb-8 pt-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
          <Stethoscope className="h-7 w-7 text-primary" />
        </div>
        <p className="type-label mb-2 text-primary">AI Clinical Engine</p>
        <h1 className="font-heading text-3xl font-semibold text-balance sm:text-4xl">Smart Consult</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
          Describe the patient in any of 27 languages — the engine reasons like a senior physician,
          cross-screens every suggestion for interactions, pregnancy and age safety, and prescribes only
          from medicines actually on your shelf.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Patient basics */}
        <section className="glass fade-up stagger-1 rounded-3xl p-6">
          <h2 className="mb-5 font-heading text-lg font-semibold">Patient Profile</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pname" className="text-xs font-medium text-muted-foreground">
                Patient Name (optional)
              </label>
              <input
                id="pname"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="page" className="text-xs font-medium text-muted-foreground">
                  Age (years) *
                </label>
                <input
                  id="page"
                  type="number"
                  min={0}
                  max={130}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="45"
                  className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pweight" className="text-xs font-medium text-muted-foreground">
                  Weight (kg)
                </label>
                <input
                  id="pweight"
                  type="number"
                  min={1}
                  max={300}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                  className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Gender</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Gender">
              {GENDERS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={gender === value}
                  onClick={() => setGender(value)}
                  className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm transition-all ${
                    gender === value
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {gender === "female" && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                aria-pressed={isPregnant}
                onClick={() => setIsPregnant((v) => !v)}
                className={`rounded-full border px-4 py-2 text-xs transition-all ${
                  isPregnant
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border bg-secondary/40 text-muted-foreground"
                }`}
              >
                Pregnant
              </button>
              <button
                type="button"
                aria-pressed={isBreastfeeding}
                onClick={() => setIsBreastfeeding((v) => !v)}
                className={`rounded-full border px-4 py-2 text-xs transition-all ${
                  isBreastfeeding
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border bg-secondary/40 text-muted-foreground"
                }`}
              >
                Breastfeeding
              </button>
            </div>
          )}
        </section>

        {/* Medical history */}
        <section className="glass fade-up stagger-2 rounded-3xl p-6">
          <h2 className="mb-5 font-heading text-lg font-semibold">Medical History</h2>
          <span className="text-xs font-medium text-muted-foreground">Previous conditions</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={conditions.includes(c)}
                onClick={() => toggleCondition(c)}
                className={`rounded-full border px-4 py-2 text-xs transition-all ${
                  conditions.includes(c)
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cmeds" className="text-xs font-medium text-muted-foreground">
                Current medications
              </label>
              <input
                id="cmeds"
                value={currentMeds}
                onChange={(e) => setCurrentMeds(e.target.value)}
                placeholder="e.g. Metformin 500mg, Amlodipine 5mg"
                className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pallergy" className="text-xs font-medium text-muted-foreground">
                Known allergies
              </label>
              <input
                id="pallergy"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa"
                className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Symptoms */}
        <section className="glass fade-up stagger-3 rounded-3xl p-6">
          <h2 className="mb-2 font-heading text-lg font-semibold">Symptoms</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Hindi, English ya Hinglish — jaise patient bole waise hi likh do.
          </p>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            placeholder='e.g. "sir dard ho raha hai aur bukhar hai, 2 din se"'
            className="w-full resize-none rounded-xl border border-border bg-secondary/50 p-4 text-sm leading-relaxed outline-none transition-colors focus:border-primary"
            aria-label="Patient symptoms"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSymptoms((s) => (s ? `${s}, ${chip}` : chip))}
                className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Images */}
          <div className="mt-5">
            <span className="text-xs font-medium text-muted-foreground">
              Body images / lab reports (optional, max 4)
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl || "/placeholder.svg"}
                    alt={img.name}
                    className="h-20 w-20 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${img.name}`}
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                aria-label="Upload patient images"
              />
            </div>
          </div>
        </section>

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={analyze}
          className="glow-teal fade-up stagger-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary font-heading text-base font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <Sparkles className="h-5 w-5" />
          Run Clinical Analysis
        </button>
        <p className="text-center text-xs text-muted-foreground/70">
          Recommendations are generated only from medicines currently in your store inventory.
        </p>
      </div>
    </div>
  )
}
