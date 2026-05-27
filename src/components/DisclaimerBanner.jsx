import { useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'f1_disclaimer_dismissed'

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const handleDismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, 'true') } catch {}
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="relative z-20 border-b border-amber-300/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
        <p className="leading-6">
          ⚠️ For informational purposes only. This is not legal or tax advice. Always verify with a qualified tax professional or your DSO before filing.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-0.5 rounded-lg p-1 text-amber-100/80 transition-colors hover:bg-amber-400/10 hover:text-amber-50"
          aria-label="Dismiss disclaimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
