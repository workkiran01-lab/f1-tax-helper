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
  const sectionDisplay = {
    income: { title: '💼 Income Documents', description: 'W-2, 1042-S, and 1099 related income forms.' },
    identity: { title: '🆔 Identity & Visa Documents', description: 'Passport, I-20, and visa documentation.' },
    education: { title: '🏦 Bank & Financial', description: 'Bank statements, tuition, and financial records.' },
  }

  const toggleItem = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>
      <DisclaimerBanner />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-12">
        <header className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100/90">
            <Sparkles className="h-3 w-3" />
            <span>DOCUMENTS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 md:text-4xl">
            Tax Documents Checklist
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Gather these documents before you start filing
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {completed} of {total} documents collected
              </span>
              <span>{progress}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <section className="space-y-5">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-3xl border border-white/20 bg-white/5 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl md:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      {sectionDisplay[section.id]?.title || section.title}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {sectionDisplay[section.id]?.description || section.description}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
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
                          'rounded-2xl border border-white/20 bg-white/5 p-4 text-sm transition-all backdrop-blur-xl',
                          isChecked && 'border-green-500/30 bg-green-500/10',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            className={cn(
                              'mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/30 bg-transparent transition-colors',
                              isChecked &&
                                'border-none bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white',
                            )}
                            aria-pressed={isChecked}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn('font-medium text-slate-100', isChecked && 'line-through')}>
                                  📄 {' '}
                                  {item.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {item.description}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  'whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-medium',
                                  ['w2', '1042s', '1099', 'passport', 'f1-visa', 'ssn-itin', 'form-8843'].includes(item.id)
                                    ? 'border-red-500/30 bg-red-500/20 text-red-400'
                                    : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400',
                                )}
                              >
                                {['w2', '1042s', '1099', 'passport', 'f1-visa', 'ssn-itin', 'form-8843'].includes(item.id)
                                  ? 'Required'
                                  : 'If applicable'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleDetails(item.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200"
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
                              <div className="mt-2 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-slate-300">
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
        </div>
        {allDone && <FilingOptionsSection />}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/chat', { state: { answers, actionItems } })}
            className="w-full rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            I&apos;ve gathered everything → Start Filing
          </button>
          <button
            type="button"
            onClick={() => navigate('/results')}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10"
          >
            ← Back to Results
          </button>
          <p className="text-center text-xs text-slate-500">
            You can come back to this checklist anytime from your dashboard
          </p>
        </div>
      </main>
      <FloatingChatButton state={{ answers, actionItems }} />
    </div>
  )
}
