import "server-only"
import { createHash } from "crypto"
import { cookies } from "next/headers"

// Server-only secret gate. The PIN never ships to the client.
const ACCESS_PIN = "7856"
const SALT = "pharmassist-pro-drx-clinical-gate-v1"

export const ACCESS_COOKIE = "pa_clinical_access"

export function accessToken(): string {
  return createHash("sha256").update(`${ACCESS_PIN}::${SALT}`).digest("hex")
}

export function isValidPin(pin: string): boolean {
  return pin === ACCESS_PIN
}

export async function hasAccess(): Promise<boolean> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value === accessToken()
}
