import type { Metadata } from "next"
import { hasAccess } from "@/lib/access"
import { PinLock } from "@/components/consult/pin-lock"
import { ConsultWorkspace } from "@/components/consult/consult-workspace"

export const metadata: Metadata = {
  title: "Smart Consult — PharmaAssist Pro",
  description: "AI-powered clinical decision support engine for pharmacists.",
}

export default async function ConsultPage() {
  const unlocked = await hasAccess()

  if (!unlocked) {
    return <PinLock />
  }

  return <ConsultWorkspace />
}
