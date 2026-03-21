import { useMemo, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { SECTIONS } from '../checklist/data'
import { FilingOptionsSection } from '../checklist/FilingOptionsSection'
import { cn } from '../../utils/cn'

const CHECKLIST_STORAGE_KEY = 'f1-tax-helper-checklist'

const loadChecklistState = (allItemIds) => {
  if (typeof window === 'undefined') {
    return Object.fromEntries(allItemIds.map((id) => [id, false]))
  }
  try {
    const stored = window.localStorage.getItem(CHECKLIST_STORAGE_KEY)
    if (!stored) {
      return Object.fromEntries(allItemIds.map((id) => [id, false]))
    }
    const parsed = JSON.parse(stored)
    return Object.fromEntries(
      allItemIds.map((id) => [id, Boolean(parsed[id])]),
    )
  } catch {
    return Object.fromEntries(allItemIds.map((id) => [id, false]))
  }
}

const saveChecklistState = (state) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      CHECKLIST_STORAGE_KEY,
      JSON.stringify(state),
    )
  } catch {
    // ignore
  }
}

export function ChatChecklistPanel({ onClose }) {
  const allItemIds = useMemo(
    () => SECTIONS.flatMap((section) => section.items.map((item) => item.id)),
    [],
  )
  const [checked, setChecked] = useState(() => loadChecklistState(allItemIds))
  const [openDetails, setOpenDetails] = useState({})

  const total = allItemIds.length
  const completed = Object.values(checked).filter(Boolean).length
  const progress = Math.round((completed / total) * 100)
  const allDone = completed === total && total > 0

  const toggleItem = (id) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      saveChecklistState(next)
      return next
    })
  }

  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          My Document Checklist
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close checklist</span>
        </button>
      </div>

      <div className="border-b border-border px-4 py-3 text-xs text-muted-foreground">
        <div className="mb-1 flex items-center justify-between">
          <span>
            {completed} of {total} documents collected
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.id} className="space-y-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </h3>
                <p className="text-[11px] text-muted-foreground/80">
                  {section.description}
                </p>
              </div>
              <ul className="space-y-3">
                {section.items.map((item) => {
                  const isChecked = checked[item.id]
                  const isOpen = openDetails[item.id]
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'rounded-xl border border-border bg-card p-3 text-xs transition-all',
                        isChecked && 'border-primary bg-primary/5',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          className={cn(
                            'mt-0.5 flex h-4 w-4 items-center justify-center rounded border border-border bg-background transition-colors',
                            isChecked &&
                              'border-primary bg-primary text-primary-foreground',
                          )}
                          aria-pressed={isChecked}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleDetails(item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/90"
                          >
                            <span>What is this?</span>
                            <ChevronDown
                              className={cn(
                                'h-3 w-3 transition-transform',
                                isOpen && 'rotate-180',
                              )}
                            />
                          </button>
                          {isOpen && (
                            <div className="mt-2 rounded-lg bg-secondary/60 p-2 text-[11px] text-muted-foreground">
                              {item.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {allDone && <FilingOptionsSection />}
        </div>
      </div>
    </div>
  )
}

