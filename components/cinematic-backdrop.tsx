"use client"

import { useEffect, useRef } from "react"
import type React from "react"

/**
 * CinematicBackdrop — dual-video premium motion background.
 * The two user-provided videos alternate with a slow 1.5s crossfade and are
 * heavily enhanced (clinical teal grade, soft blur, vignette, accent bloom,
 * scanline texture) so they read as abstract luxurious motion texture
 * behind the liquid glass UI instead of literal footage.
 */
export function CinematicBackdrop() {
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const activeRef = useRef<0 | 1>(0)

  useEffect(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return

    a.play().catch(() => {})

    function swap() {
      if (!a || !b) return
      const current = activeRef.current === 0 ? a : b
      const next = activeRef.current === 0 ? b : a
      next.currentTime = 0
      next.play().catch(() => {})
      next.style.opacity = "1"
      current.style.opacity = "0"
      activeRef.current = activeRef.current === 0 ? 1 : 0
      // pause the hidden one after the crossfade completes to save battery
      window.setTimeout(() => current.pause(), 1600)
    }

    function onTime(this: HTMLVideoElement) {
      const active = activeRef.current === 0 ? a : b
      if (active === this && this.duration && this.duration - this.currentTime < 1.5) {
        swap()
      }
    }

    a.addEventListener("timeupdate", onTime)
    b.addEventListener("timeupdate", onTime)
    return () => {
      a.removeEventListener("timeupdate", onTime)
      b.removeEventListener("timeupdate", onTime)
    }
  }, [])

  const videoCls =
    "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out"
  // Enhancement grade: clearly visible motion with a premium clinical-teal tint
  const videoStyle: React.CSSProperties = {
    filter: "brightness(0.72) saturate(0.85) hue-rotate(95deg) contrast(1.1)",
    transform: "scale(1.04)",
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-background" aria-hidden="true">
      <video
        ref={videoARef}
        className={videoCls}
        style={{ ...videoStyle, opacity: 1 }}
        src="/videos/bg-1.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
      >
        Your browser does not support background video.
      </video>
      <video
        ref={videoBRef}
        className={videoCls}
        style={{ ...videoStyle, opacity: 0 }}
        src="/videos/bg-2.mp4"
        muted
        playsInline
        preload="auto"
      >
        Your browser does not support background video.
      </video>
      {/* Clinical accent bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_20%_10%,rgba(0,212,170,0.12),transparent_60%),radial-gradient(ellipse_55%_40%_at_85%_85%,rgba(0,150,200,0.08),transparent_55%)]" />
      {/* Light readability scrim + soft cinematic vignette — video stays clearly visible */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,14,0.3)_0%,rgba(6,10,14,0.12)_45%,rgba(6,10,14,0.42)_100%),radial-gradient(ellipse_130%_100%_at_50%_50%,transparent_60%,rgba(4,8,12,0.5)_100%)]" />
      {/* Fine scanline texture for a clinical-instrument feel */}
      <div className="absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.5)_0px,transparent_1px,transparent_3px)]" />
    </div>
  )
}
