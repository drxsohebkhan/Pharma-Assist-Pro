"use client"

import { useEffect, useState } from "react"

const STEPS = [
  "Parsing symptoms",
  "Risk profiling",
  "Scanning inventory",
  "Safety filters",
  "Dosage engine",
  "Final report",
]

/** Premium neural-core analysis animation — orbital rings, energy arcs, live waveform. */
export function ClinicalScanner() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Fast cadence — the engine typically answers in 3-7s
    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div
      className="gradient-border w-full overflow-hidden rounded-3xl p-6 sm:p-8"
      role="status"
      aria-label="AI clinical analysis in progress"
    >
      <div className="flex flex-col items-center gap-7">
        {/* Neural core */}
        <div className="relative flex h-52 w-52 items-center justify-center">
          {/* Progress ring */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0,212,170,0.12)" strokeWidth="3" />
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="rgba(0,212,170,0.9)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 92}
              strokeDashoffset={2 * Math.PI * 92 * (1 - progress / 100)}
              className="transition-all duration-700 ease-out"
              style={{ filter: "drop-shadow(0 0 6px rgba(0,212,170,0.7))" }}
            />
          </svg>

          {/* Orbital rings */}
          <div className="orbit-ring absolute inset-5 rounded-full border border-primary/25" />
          <div className="orbit-ring-reverse absolute inset-10 rounded-full border border-dashed border-primary/20" />

          {/* Orbiting electrons */}
          <div className="orbit-carrier absolute inset-5">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,212,170,0.9)]" />
          </div>
          <div className="orbit-carrier-slow absolute inset-10">
            <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
          </div>

          {/* Pulsing energy core */}
          <div className="core-pulse relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
            <div className="absolute inset-0 rounded-full border border-primary/50" />
            <div className="core-inner h-9 w-9 rounded-full bg-primary/80 shadow-[0_0_28px_rgba(0,212,170,0.95)]" />
          </div>

          {/* Percentage readout */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-mono text-xs font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Step ticker */}
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <p key={step} className="fade-up font-heading text-base font-semibold text-foreground">
            {STEPS[step]}
            <span className="cursor-blink text-primary">_</span>
          </p>
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < step
                    ? "w-6 bg-primary/80"
                    : i === step
                      ? "w-9 bg-primary shadow-[0_0_8px_rgba(0,212,170,0.8)]"
                      : "w-6 bg-primary/15"
                }`}
              />
            ))}
          </div>
          {/* Audio-style waveform */}
          <div className="mt-1 flex h-8 items-end gap-1" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="wave-bar w-1 rounded-full bg-primary/70"
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
