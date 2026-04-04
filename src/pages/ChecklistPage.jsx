import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Sparkles } from 'lucide-react'
import { SECTIONS } from '../components/checklist/data'
import { FilingOptionsSection } from '../components/checklist/FilingOptionsSection'
import { cn } from '../utils/cn'
import DisclaimerBanner from '../components/DisclaimerBanner'
import FloatingChatButton from '../components/FloatingChatButton'
import useAuth from '../hooks/useAuth'

export default function ChecklistPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const storedQuestionnaire = user?.user_metadata?.questionnaire || null
  const { documents = [], country } = location.state || {}
  const answers = location.state?.answers || storedQuestionnaire?.answers || null
  const actionItems = location.state?.actionItems || storedQuestionnaire?.actionItems || []
  const allItemIds = useMemo(
    () => SECTIONS.flatMap((section) => section.items.map((item) => item.id)),
    [],
  )
  const [checked, setChecked] = useState(() => {
    const docsSet = new Set(documents || [])

    const isPreChecked = (id) => {
      if (id === 'w2') return docsSet.has('W-2')
      if (id === '1042s') return docsSet.has('1042-S foreign income')
      if (id === '1098t') return docsSet.has('1098-T tuition statement')
      if (id === 'ssn-itin') {
        return (
          docsSet.has('Social Security Number') || docsSet.has('ITIN number')
        )
      }
      return false
    }

    return Object.fromEntries(allItemIds.map((id) => [id, isPreChecked(id)]))
  })
  const [openDetails, setOpenDetails] = useState({})

  const total = allItemIds.length
  const completed = Object.values(checked).filter(Boolean).length
  const progress = Math.round((completed / total) * 100)
  const allDone = completed === total && total > 0

  const toggleItem = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DisclaimerBanner />
      <main className="mx-auto max-w-5xl px-4 py-10 w-full">
        <button
          onClick={() => navigate('/results')}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to my results
        </button>
        <header className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            <span>Step 1 · Get your documents ready</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {country
              ? `Your Document Checklist for ${country}`
              : 'F-1 Tax Document Checklist'}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Track everything you need before you start filing. As you check off items,
            your progress updates automatically. When you&apos;re done, jump straight
            into your F1 Tax Assistant chat.
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {completed} of {total} documents collected
              </span>
              <span>{progress}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="space-y-6">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {section.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {
                      section.items.filter((item) => checked[item.id]).length
                    }{' '}
                    / {section.items.length}
                  </span>
                </div>

                <ul className="space-y-3">
                  {section.items.map((item) => {
                    const isChecked = checked[item.id]
                    const isOpen = openDetails[item.id]
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          'rounded-xl border border-border bg-background p-3 text-sm transition-all',
                          isChecked && 'border-primary bg-primary/5',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className={cn(
                              'mt-1 flex h-5 w-5 items-center justify-center rounded border border-border bg-card transition-colors',
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
                                <p className="font-medium text-foreground">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleDetails(item.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/90"
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
                              <div className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
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
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
              <h3 className="text-sm font-semibold text-foreground">
                Why this checklist matters
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>• Avoid last‑minute scrambling for missing forms.</li>
                <li>• Make your Sprintax or software filing much faster.</li>
                <li>• Help your F1 Tax Assistant give accurate guidance.</li>
              </ul>
            </div>

            {allDone && <FilingOptionsSection />}
          </aside>
        </div>
      </main>
      <FloatingChatButton state={{ answers, actionItems }} />
    </div>
  )
}
