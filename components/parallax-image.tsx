"use client"

import { useEffect, useRef } from "react"

export function ParallaxImage({
  src,
  alt,
  className = "",
  speed = 0.08,
}: {
  src: string
  alt: string
  className?: string
  speed?: number
}) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const center = rect.top + rect.height / 2 - window.innerHeight / 2
        el.style.transform = `translateY(${-center * speed}px) scale(1.12)`
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [speed])

  return (
    <img
      ref={ref}
      src={src || "/placeholder.svg"}
      alt={alt}
      className={className}
      style={{ willChange: "transform" }}
    />
  )
}
