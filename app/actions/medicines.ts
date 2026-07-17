"use server"

import { db } from "@/lib/db"
import { medicines, type Medicine } from "@/lib/db/schema"
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getUserIdOptional } from "@/lib/session"
import { hasAccess } from "@/lib/access"

const DENIED = "Access denied. Unlock the clinical workspace first."

/** Visible inventory = shared global catalog (userId NULL) + the signed-in user's own medicines. */
async function visibleScope() {
  const userId = await getUserIdOptional()
  return userId ? or(isNull(medicines.userId), eq(medicines.userId, userId)) : isNull(medicines.userId)
}

export async function getMedicines(query?: string): Promise<Medicine[]> {
  const scope = await visibleScope()
  if (query && query.trim()) {
    const q = `%${query.trim()}%`
    return db
      .select()
      .from(medicines)
      .where(
        and(
          scope,
          or(
            ilike(medicines.brandName, q),
            ilike(medicines.genericName, q),
            ilike(medicines.composition, q),
            ilike(medicines.category, q),
            ilike(medicines.therapeuticUses, q),
          ),
        ),
      )
      .orderBy(medicines.brandName)
  }
  return db.select().from(medicines).where(scope).orderBy(medicines.brandName)
}

export interface MedicineInput {
  brandName: string
  genericName: string
  composition: string
  category: string
  dosageForm: string
  strength: string
  manufacturer: string
  mrp: string
  stockQuantity: number
  rxRequired: boolean
  sideEffects: string
  contraindications: string
  drugInteractions: string
  pregnancyCategory: string
  pediatricSafe: boolean
  geriatricCaution: boolean
  therapeuticUses: string
}

function sanitize(input: MedicineInput) {
  const mrp = Number.parseFloat(input.mrp)
  return {
    brandName: input.brandName.trim(),
    genericName: input.genericName.trim(),
    composition: input.composition.trim(),
    category: input.category.trim() || "General",
    dosageForm: input.dosageForm.trim() || "Tablet",
    strength: input.strength.trim(),
    manufacturer: input.manufacturer.trim(),
    mrp: (Number.isFinite(mrp) && mrp >= 0 ? mrp : 0).toFixed(2),
    stockQuantity: Math.max(0, Math.round(input.stockQuantity) || 0),
    rxRequired: !!input.rxRequired,
    sideEffects: input.sideEffects.trim(),
    contraindications: input.contraindications.trim(),
    drugInteractions: input.drugInteractions.trim(),
    pregnancyCategory: input.pregnancyCategory.trim() || "C",
    pediatricSafe: !!input.pediatricSafe,
    geriatricCaution: !!input.geriatricCaution,
    therapeuticUses: input.therapeuticUses.trim(),
  }
}

export async function addMedicine(input: MedicineInput): Promise<{ ok: boolean; error?: string }> {
  if (!(await hasAccess())) return { ok: false, error: DENIED }
  if (!input.brandName?.trim() || !input.genericName?.trim() || !input.composition?.trim()) {
    return { ok: false, error: "Brand name, generic name and composition are required." }
  }
  const userId = await getUserIdOptional()
  await db.insert(medicines).values({ ...sanitize(input), userId })
  revalidatePath("/inventory")
  revalidatePath("/")
  return { ok: true }
}

export async function addMedicinesBulk(
  inputs: MedicineInput[],
): Promise<{ ok: boolean; added: number; skipped: number; error?: string }> {
  if (!(await hasAccess())) return { ok: false, added: 0, skipped: 0, error: DENIED }
  const valid = inputs.filter(
    (i) => i.brandName?.trim() && i.genericName?.trim() && i.composition?.trim(),
  )
  if (valid.length === 0) {
    return { ok: false, added: 0, skipped: inputs.length, error: "No valid medicines to add." }
  }

  const userId = await getUserIdOptional()
  const scope = await visibleScope()

  // Dedupe against existing visible inventory (case-insensitive brand match)
  const existing = await db.select({ brandName: medicines.brandName }).from(medicines).where(scope)
  const existingNames = new Set(existing.map((e) => e.brandName.trim().toLowerCase()))

  const seen = new Set<string>()
  const fresh = valid.filter((i) => {
    const key = i.brandName.trim().toLowerCase()
    if (existingNames.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (fresh.length > 0) {
    await db.insert(medicines).values(fresh.map((i) => ({ ...sanitize(i), userId })))
  }

  revalidatePath("/inventory")
  revalidatePath("/")
  return { ok: true, added: fresh.length, skipped: valid.length - fresh.length }
}

export async function updateMedicine(
  id: number,
  input: MedicineInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await hasAccess())) return { ok: false, error: DENIED }
  if (!input.brandName?.trim() || !input.genericName?.trim() || !input.composition?.trim()) {
    return { ok: false, error: "Brand name, generic name and composition are required." }
  }
  await db
    .update(medicines)
    .set({ ...sanitize(input), updatedAt: sql`now()` })
    .where(eq(medicines.id, id))
  revalidatePath("/inventory")
  revalidatePath("/")
  return { ok: true }
}

export async function deleteMedicine(id: number): Promise<{ ok: boolean }> {
  if (!(await hasAccess())) return { ok: false }
  await db.delete(medicines).where(eq(medicines.id, id))
  revalidatePath("/inventory")
  revalidatePath("/")
  return { ok: true }
}

export async function updateStock(id: number, stockQuantity: number): Promise<{ ok: boolean }> {
  if (!(await hasAccess())) return { ok: false }
  await db
    .update(medicines)
    .set({ stockQuantity: Math.max(0, Math.round(stockQuantity) || 0), updatedAt: sql`now()` })
    .where(eq(medicines.id, id))
  revalidatePath("/inventory")
  revalidatePath("/")
  return { ok: true }
}

export interface DashboardStats {
  totalMedicines: number
  rxCount: number
  lowStock: number
  totalConsultations: number
  categories: { category: string; count: number }[]
  lowStockList: { id: number; brandName: string; stockQuantity: number }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totals] = await db
    .select({
      totalMedicines: sql<number>`count(*)::int`,
      rxCount: sql<number>`count(*) filter (where ${medicines.rxRequired})::int`,
      lowStock: sql<number>`count(*) filter (where ${medicines.stockQuantity} < 30)::int`,
    })
    .from(medicines)

  const categories = await db
    .select({
      category: medicines.category,
      count: sql<number>`count(*)::int`,
    })
    .from(medicines)
    .groupBy(medicines.category)
    .orderBy(desc(sql`count(*)`))
    .limit(6)

  const lowStockList = await db
    .select({
      id: medicines.id,
      brandName: medicines.brandName,
      stockQuantity: medicines.stockQuantity,
    })
    .from(medicines)
    .where(sql`${medicines.stockQuantity} < 30`)
    .orderBy(medicines.stockQuantity)
    .limit(5)

  const [{ totalConsultations }] = await db
    .select({ totalConsultations: sql<number>`count(*)::int` })
    .from(sql`consultations`)

  return { ...totals, categories, lowStockList, totalConsultations }
}
