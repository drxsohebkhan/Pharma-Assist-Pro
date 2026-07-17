"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { accessToken, isValidPin, ACCESS_COOKIE } from "@/lib/access"

export async function unlockConsult(pin: string): Promise<{ ok: boolean }> {
  // small constant delay to blunt brute-force guessing
  await new Promise((r) => setTimeout(r, 600))
  if (!isValidPin(pin.trim())) {
    return { ok: false }
  }
  const store = await cookies()
  store.set(ACCESS_COOKIE, accessToken(), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  })
  revalidatePath("/consult")
  return { ok: true }
}

export async function lockConsult(): Promise<void> {
  const store = await cookies()
  store.delete(ACCESS_COOKIE)
  revalidatePath("/consult")
}
