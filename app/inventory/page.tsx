import { getMedicines } from "@/app/actions/medicines"
import { InventoryManager } from "@/components/inventory/inventory-manager"
import { hasAccess } from "@/lib/access"
import { PinLock } from "@/components/consult/pin-lock"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Inventory — PharmaAssist Pro",
  description: "Manage your medicine store inventory with compositions, stock levels and safety data.",
}

export default async function InventoryPage() {
  const unlocked = await hasAccess()
  if (!unlocked) {
    return <PinLock />
  }

  const medicines = await getMedicines()

  return (
    <div className="flex flex-col gap-8">
      <header className="fade-up stagger-1 flex flex-col gap-2">
        <p className="type-label flex items-center gap-2 text-primary">
          <span className="inline-block h-px w-8 bg-primary/60" aria-hidden="true" />
          Stock Control
        </p>
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">
          Medicine <span className="text-primary">Inventory</span>
        </h1>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          The living formulary behind every recommendation. Each entry feeds the clinical engine its
          composition, interaction and safety intelligence — scan a shelf, decode a bill, or curate by hand.
        </p>
      </header>
      <InventoryManager initialMedicines={medicines} />
    </div>
  )
}
