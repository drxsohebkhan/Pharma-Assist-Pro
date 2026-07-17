"use server"

import { db } from "@/lib/db"
import { consultations, type Consultation } from "@/lib/db/schema"
import { and, desc, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hasAccess } from "@/lib/access"
import { getUserIdOptional } from "@/lib/session"

export async function getConsultations(limit = 50): Promise<Consultation[]> {
  const userId = await getUserIdOptional()
  return db
    .select()
    .from(consultations)
    .where(userId ? eq(consultations.userId, userId) : isNull(consultations.userId))
    .orderBy(desc(consultations.createdAt))
    .limit(limit)
}

export async function deleteConsultation(id: number): Promise<{ ok: boolean }> {
  const allowed = await hasAccess()
  if (!allowed) return { ok: false }
  const userId = await getUserIdOptional()
  await db
    .delete(consultations)
    .where(
      and(
        eq(consultations.id, id),
        userId ? eq(consultations.userId, userId) : isNull(consultations.userId),
      ),
    )
  revalidatePath("/history")
  return { ok: true }
}
