import type { Metadata } from "next"
import { DecoderWorkspace } from "@/components/decode/decoder-workspace"
import { hasAccess } from "@/lib/access"
import { PinLock } from "@/components/consult/pin-lock"

export const metadata: Metadata = {
  title: "Prescription Decoder — PharmaAssist Pro",
  description: "AI-powered decoding of handwritten prescriptions, lab reports and body images.",
}

export default async function DecodePage() {
  const unlocked = await hasAccess()
  if (!unlocked) {
    return <PinLock />
  }

  return <DecoderWorkspace />
}
