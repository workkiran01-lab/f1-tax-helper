import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Sheet } from './motion'
import IconTile from './IconTile'

export const ACK_KEY = 'f1_disclaimer_ack_v1'

function acknowledged() {
  try {
    return localStorage.getItem(ACK_KEY) === 'true'
  } catch {
    return false
  }
}

// Shown once per browser the first time someone opens the app. It must be accepted
// (Escape and the backdrop do nothing), then a quiet note stays at the bottom of
// every screen. If storage is unavailable it shows once per page load instead.
export default function DisclaimerGate() {
  const [open, setOpen] = useState(() => !acknowledged())
  const accept = () => {
    try {
      localStorage.setItem(ACK_KEY, 'true')
    } catch {
      // Private mode: the sheet simply returns next visit.
    }
    setOpen(false)
  }
  return (
    <Sheet open={open} onClose={() => {}} labelledBy="gate-title">
      <IconTile icon={ShieldCheck} tone="blue" size="lg" />
      <h2 id="gate-title" className="mt-4 text-2xl font-bold tracking-tight text-ink">
        Before you start
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        F1 Tax Helper gives general information for F-1 students. It is not legal or tax advice,
        and AI answers can be wrong.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-3">
        Check anything important with a qualified tax professional or your school’s DSO before you
        file.
      </p>
      <button
        type="button"
        autoFocus
        onClick={accept}
        className="press mt-6 min-h-[52px] w-full rounded-2xl bg-tint text-[17px] font-semibold text-white hover:bg-tint-hover"
      >
        I understand
      </button>
      <Link
        to="/disclaimer"
        className="mt-3 block text-center text-sm text-tint-ink hover:underline"
      >
        Read the full disclaimer
      </Link>
    </Sheet>
  )
}
