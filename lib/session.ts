import "server-only"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/** Returns the signed-in user's id, or null when browsing anonymously. */
export async function getUserIdOptional(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

/** Returns the signed-in user (id, name, email), or null. */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
