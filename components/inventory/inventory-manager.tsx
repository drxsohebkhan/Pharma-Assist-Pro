"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Medicine } from "@/lib/db/schema"
import { deleteMedicine, updateStock, type MedicineInput } from "@/app/actions/medicines"
import { MedicineForm } from "@/components/inventory/medicine-form"
import { InventoryScanner } from "@/components/inventory/inventory-scanner"
import { Search, Plus, Pencil, Trash2, Pill, TriangleAlert, ScanSearch, Download, Minus } from "lucide-react"

const CATEGORY_ALL = "All"
const PAGE_SIZE = 48

function exportCsv(medicines: Medicine[]) {
  const esc = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`
  const header = [
    "Brand Name", "Generic Name", "Composition", "Category", "Dosage Form", "Strength",
    "Manufacturer", "MRP", "Stock", "Rx Required", "Pregnancy Category", "Therapeutic Uses",
  ]
  const rows = medicines.map((m) =>
    [
      m.brandName, m.genericName, m.composition, m.category, m.dosageForm, m.strength,
      m.manufacturer, m.mrp, m.stockQuantity, m.rxRequired ? "Yes" : "No", m.pregnancyCategory,
      m.therapeuticUses,
    ].map(esc).join(","),
  )
  const blob = new Blob([[header.map(esc).join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function InventoryManager({ initialMedicines }: { initialMedicines: Medicine[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(CATEGORY_ALL)
  const [lowOnly, setLowOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [formOpen, setFormOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Medicine | null>(null)
  const [stockPending, setStockPending] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const categories = useMemo(() => {
    const set = new Set(initialMedicines.map((m) => m.category))
    return [CATEGORY_ALL, ...Array.from(set).sort()]
  }, [initialMedicines])

  const lowStockCount = useMemo(
    () => initialMedicines.filter((m) => m.stockQuantity < 30).length,
    [initialMedicines],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return initialMedicines.filter((m) => {
      if (lowOnly && m.stockQuantity >= 30) return false
      if (category !== CATEGORY_ALL && m.category !== category) return false
      if (!q) return true
      return (
        m.brandName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.composition.toLowerCase().includes(q) ||
        m.therapeuticUses.toLowerCase().includes(q)
      )
    })
  }, [initialMedicines, query, category, lowOnly])

  function adjustStock(m: Medicine, delta: number) {
    const next = Math.max(0, m.stockQuantity + delta)
    setStockPending(m.id)
    startTransition(async () => {
      await updateStock(m.id, next)
      setStockPending(null)
      router.refresh()
    })
  }

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

  function handleDelete(medicine: Medicine) {
    startTransition(async () => {
      await deleteMedicine(medicine.id)
      setConfirmDelete(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="fade-up stagger-2 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            placeholder="Search by brand, generic, composition or use..."
            aria-label="Search medicines"
            className="w-full rounded-full glass py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            aria-label="Filter by category"
            className="rounded-full glass px-4 py-3 text-sm outline-none focus:border-primary/50 [&>option]:bg-popover"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary/20"
          >
            <ScanSearch className="size-4" aria-hidden="true" />
            AI Scan
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] glow-teal"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Count + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{Math.min(visibleCount, filtered.length)}</span> of{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span> matching (
          {initialMedicines.length} total medicines)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={lowOnly}
            onClick={() => {
              setLowOnly((v) => !v)
              setVisibleCount(PAGE_SIZE)
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              lowOnly
                ? "border-destructive/50 bg-destructive/15 text-destructive"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            Low Stock ({lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Cards */}
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((m, i) => (
          <li
            key={m.id}
            className={`fade-up glass glass-hover flex flex-col gap-3 rounded-2xl p-5 ${i < 6 ? `stagger-${Math.min(i + 1, 6)}` : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-heading text-base font-semibold">{m.brandName}</h3>
                <p className="truncate text-sm text-muted-foreground">{m.composition}</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Pill className="size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {m.category}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {m.dosageForm}
              </span>
              {m.rxRequired && (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  Rx
                </span>
              )}
              {m.stockQuantity < 30 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                  <TriangleAlert className="size-3" aria-hidden="true" />
                  Low
                </span>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-3">
                <span className="font-heading text-lg font-bold text-primary">{"₹"}{m.mrp}</span>
                <div className="flex items-center gap-1" aria-label={`Stock for ${m.brandName}`}>
                  <button
                    type="button"
                    disabled={stockPending === m.id || m.stockQuantity === 0}
                    onClick={() => adjustStock(m, -1)}
                    aria-label={`Decrease stock of ${m.brandName}`}
                    className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    <Minus className="size-3" aria-hidden="true" />
                  </button>
                  <span
                    className={`type-data min-w-8 text-center text-xs font-semibold ${stockPending === m.id ? "opacity-40" : ""}`}
                  >
                    {m.stockQuantity}
                  </span>
                  <button
                    type="button"
                    disabled={stockPending === m.id}
                    onClick={() => adjustStock(m, 1)}
                    aria-label={`Increase stock of ${m.brandName}`}
                    className="flex size-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(m)
                    setFormOpen(true)
                  }}
                  aria-label={`Edit ${m.brandName}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(m)}
                  aria-label={`Delete ${m.brandName}`}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">No medicines match your search.</p>
        </div>
      )}

      {filtered.length > visibleCount && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full glass glass-hover px-6 py-3 text-sm font-semibold text-primary transition-transform hover:scale-[1.03]"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* AI Scanner modal */}
      {scannerOpen && (
        <InventoryScanner
          onClose={() => setScannerOpen(false)}
          onAdded={() => {
            setScannerOpen(false)
            router.refresh()
          }}
        />
      )}

      {/* Add/Edit modal */}
      {formOpen && (
        <MedicineForm
          medicine={editing}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={() => {
            setFormOpen(false)
            setEditing(null)
            router.refresh()
          }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm deletion"
        >
          <div className="glass w-full max-w-sm rounded-2xl p-6 shake">
            <h3 className="font-heading text-lg font-semibold">Delete {confirmDelete.brandName}?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This will permanently remove it from your store inventory. The AI engine will no longer suggest
              it.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-transform hover:scale-[1.03] disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export type { MedicineInput }
