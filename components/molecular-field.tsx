"use client"

import { useEffect, useRef } from "react"

// Premium interactive background: three layers rendered in one canvas rAF loop.
// 1. Aurora — huge soft teal/amber radial blobs drifting on sine paths.
// 2. Molecular network — depth-sorted particles with parallax, bonds light up
//    near the pointer, pointer gently attracts nearby nodes.
// 3. Touch ripples — expanding glowing rings on tap/click.
// Passive listeners, DPR-capped, respects prefers-reduced-motion.
export function MolecularField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const pointer = { x: -9999, y: -9999, active: false }

    interface Node {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      depth: number // 0 far … 1 near
      hue: "teal" | "amber"
      tw: number // twinkle phase
    }
    interface Ripple {
      x: number
      y: number
      t: number // 0..1 life
    }

    let nodes: Node[] = []
    const ripples: Ripple[] = []

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.min(85, Math.floor((width * height) / 18000))
      nodes = Array.from({ length: target }, () => {
        const depth = Math.random()
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (0.12 + depth * 0.22),
          vy: (Math.random() - 0.5) * (0.12 + depth * 0.22),
          r: 0.7 + depth * 2.3,
          depth,
          hue: Math.random() < 0.86 ? "teal" : "amber",
          tw: Math.random() * Math.PI * 2,
        }
      })
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }
    const onPointerDown = (e: PointerEvent) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
      if (ripples.length < 6) ripples.push({ x: e.clientX, y: e.clientY, t: 0 })
    }
    const onPointerLeave = () => {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) {
        pointer.x = t.clientX
        pointer.y = t.clientY
        pointer.active = true
      }
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    window.addEventListener("pointerleave", onPointerLeave, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onPointerLeave, { passive: true })

    const LINK_DIST = 135
    const POINTER_DIST = 200

    // Aurora blobs: [xFreq, yFreq, xPhase, yPhase, radiusScale, color]
    const AURORAS: Array<[number, number, number, number, number, string]> = [
      [0.00013, 0.00009, 0, 1.2, 0.55, "0, 212, 170"],
      [0.00009, 0.00012, 2.1, 3.6, 0.48, "255, 179, 71"],
      [0.00011, 0.00007, 4.4, 0.6, 0.62, "0, 180, 200"],
    ]

    let raf = 0
    const frame = (now: number) => {
      ctx.clearRect(0, 0, width, height)

      // --- Layer 1: drifting aurora blobs ---
      ctx.globalCompositeOperation = "lighter"
      for (const [fx, fy, px, py, scale, rgb] of AURORAS) {
        const ax = width * (0.5 + 0.42 * Math.sin(now * fx + px))
        const ay = height * (0.45 + 0.4 * Math.cos(now * fy + py))
        const ar = Math.max(width, height) * scale
        const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, ar)
        g.addColorStop(0, `rgba(${rgb}, 0.045)`)
        g.addColorStop(0.5, `rgba(${rgb}, 0.018)`)
        g.addColorStop(1, `rgba(${rgb}, 0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, 0, width, height)
      }
      ctx.globalCompositeOperation = "source-over"

      // Pointer glow halo
      if (pointer.active) {
        const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, POINTER_DIST)
        grad.addColorStop(0, "rgba(0, 212, 170, 0.09)")
        grad.addColorStop(1, "rgba(0, 212, 170, 0)")
        ctx.fillStyle = grad
        ctx.fillRect(pointer.x - POINTER_DIST, pointer.y - POINTER_DIST, POINTER_DIST * 2, POINTER_DIST * 2)
      }

      // --- Layer 3: touch ripples ---
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.t += 0.02
        if (rp.t >= 1) {
          ripples.splice(i, 1)
          continue
        }
        const radius = rp.t * 160
        const alpha = (1 - rp.t) * 0.5
        ctx.strokeStyle = `rgba(0, 212, 170, ${alpha.toFixed(3)})`
        ctx.lineWidth = 1.5 * (1 - rp.t) + 0.5
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        // Inner echo ring
        if (rp.t > 0.25) {
          ctx.strokeStyle = `rgba(255, 179, 71, ${(alpha * 0.5).toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(rp.x, rp.y, radius * 0.6, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // --- Layer 2: molecular network ---
      for (const n of nodes) {
        if (pointer.active) {
          const dx = pointer.x - n.x
          const dy = pointer.y - n.y
          const dist = Math.hypot(dx, dy)
          if (dist < POINTER_DIST && dist > 1) {
            const force = ((POINTER_DIST - dist) / POINTER_DIST) * 0.014 * (0.4 + n.depth)
            n.vx += (dx / dist) * force
            n.vy += (dy / dist) * force
          }
        }

        n.x += n.vx
        n.y += n.vy
        n.vx *= 0.985
        n.vy *= 0.985
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.02
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.02

        if (n.x < -20) n.x = width + 20
        if (n.x > width + 20) n.x = -20
        if (n.y < -20) n.y = height + 20
        if (n.y > height + 20) n.y = -20
      }

      // Bonds
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_DIST * LINK_DIST) {
            const d = Math.sqrt(d2)
            const depthAvg = (a.depth + b.depth) / 2
            let alpha = (1 - d / LINK_DIST) * (0.06 + depthAvg * 0.12)
            if (pointer.active) {
              const mx = (a.x + b.x) / 2
              const my = (a.y + b.y) / 2
              const pd = Math.hypot(pointer.x - mx, pointer.y - my)
              if (pd < POINTER_DIST) alpha += (1 - pd / POINTER_DIST) * 0.28
            }
            ctx.strokeStyle = `rgba(0, 212, 170, ${alpha.toFixed(3)})`
            ctx.lineWidth = 0.5 + depthAvg * 0.8
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Nodes with twinkle + glow
      for (const n of nodes) {
        const twinkle = 0.75 + 0.25 * Math.sin(now * 0.0012 + n.tw)
        let alpha = (0.2 + n.depth * 0.35) * twinkle
        if (pointer.active) {
          const pd = Math.hypot(pointer.x - n.x, pointer.y - n.y)
          if (pd < POINTER_DIST) alpha += (1 - pd / POINTER_DIST) * 0.55
        }
        const rgb = n.hue === "teal" ? "0, 212, 170" : "255, 179, 71"
        // Soft glow for near particles
        if (n.depth > 0.65) {
          ctx.fillStyle = `rgba(${rgb}, ${(alpha * 0.25).toFixed(3)})`
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = `rgba(${rgb}, ${Math.min(alpha, 0.9).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    if (reduced) {
      frame(0)
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onPointerLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
