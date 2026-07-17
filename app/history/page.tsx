import type { Metadata } from "next"
import { getConsultations } from "@/app/actions/consultations"
import { hasAccess } from "@/lib/access"
import { HistoryList } from "@/components/history/history-list"
import { PinLock } from "@/components/consult/pin-lock"

export const metadata: Metadata = {
  title: "Consultation History — PharmaAssist Pro",
  description: "Complete record of patient consultations and AI recommendations.",
}

export default async function HistoryPage() {
  const unlocked = await hasAccess()
  if (!unlocked) {
    return <PinLock />
  }

  const records = await getConsultations()

  return <HistoryList records={records} />
}
