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
    <div className="relative z-20 border-b border-warn/40 bg-warn/15 px-4 py-3 text-sm text-warn-ink">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
        <p className="leading-6">
          ⚠️ For informational purposes only. This is not legal or tax advice. Always verify with a qualified tax professional or your DSO before filing.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-0.5 rounded-lg p-1 text-warn-ink/80 transition-colors hover:bg-warn/10 hover:text-warn-ink"
          aria-label="Dismiss disclaimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
