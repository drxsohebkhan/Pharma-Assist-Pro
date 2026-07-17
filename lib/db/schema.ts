import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core"

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull(),
  genericName: text("generic_name").notNull(),
  composition: text("composition").notNull(),
  category: text("category").notNull().default("General"),
  dosageForm: text("dosage_form").notNull().default("Tablet"),
  strength: text("strength").notNull().default(""),
  manufacturer: text("manufacturer").notNull().default(""),
  mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull().default("0"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  rxRequired: boolean("rx_required").notNull().default(false),
  sideEffects: text("side_effects").notNull().default(""),
  contraindications: text("contraindications").notNull().default(""),
  drugInteractions: text("drug_interactions").notNull().default(""),
  pregnancyCategory: text("pregnancy_category").notNull().default("C"),
  pediatricSafe: boolean("pediatric_safe").notNull().default(false),
  geriatricCaution: boolean("geriatric_caution").notNull().default(false),
  therapeuticUses: text("therapeutic_uses").notNull().default(""),
  userId: text("userId"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull().default(""),
  patientAge: integer("patient_age").notNull(),
  patientGender: text("patient_gender").notNull().default("male"),
  patientWeight: numeric("patient_weight", { precision: 6, scale: 2 }),
  symptoms: text("symptoms").notNull(),
  previousConditions: jsonb("previous_conditions").notNull().default([]),
  currentMedications: text("current_medications").notNull().default(""),
  allergies: text("allergies").notNull().default(""),
  isPregnant: boolean("is_pregnant").notNull().default(false),
  isBreastfeeding: boolean("is_breastfeeding").notNull().default(false),
  aiResult: jsonb("ai_result").notNull().default({}),
  userId: text("userId"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Medicine = typeof medicines.$inferSelect
export type NewMedicine = typeof medicines.$inferInsert
export type Consultation = typeof consultations.$inferSelect
