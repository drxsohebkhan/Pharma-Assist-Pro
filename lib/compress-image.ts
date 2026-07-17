"use client"

/**
 * Compresses an image file client-side before uploading to the AI APIs.
 * - Resizes so the longest edge is at most `maxEdge` px (plenty for OCR/analysis)
 * - Re-encodes as JPEG at the given quality
 * This keeps request bodies far below Vercel's 4.5MB serverless limit and
 * makes AI responses much faster (smaller payload = faster upload + faster vision processing).
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = "anonymous"
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error("Could not load image"))
    el.src = dataUrl
  })

  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl

  // White backing so transparent PNGs don't turn black in JPEG
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)

  let out = canvas.toDataURL("image/jpeg", quality)
  // Safety net: if still above ~2.5MB as base64, compress harder
  if (out.length > 2_500_000) out = canvas.toDataURL("image/jpeg", 0.6)
  return out
}
