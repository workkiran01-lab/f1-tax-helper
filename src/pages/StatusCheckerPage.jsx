import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import DisclaimerBanner from '../components/DisclaimerBanner'
import useAuth from '../hooks/useAuth'

const QUESTIONS = [
  {
    id: 'days',
    question: 'How many days were you physically present in the United States in 2025?',
    options: [
      { value: 'lt31', label: 'Less than 31 days' },
      { value: '31-182', label: '31–182 days' },
      { value: 'gte183', label: '183 or more days' },
    ],
  },
  {
    id: 'visa',
    question: 'What is your current US visa type?',
    options: [
      { value: 'f1', label: 'F-1 Student' },
      { value: 'j1', label: 'J-1 Exchange Visitor' },
      { value: 'opt', label: 'OPT (Optional Practical Training)' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'years',
    question: 'How many calendar years have you been in the US on an F/J visa?',
    options: [
      { value: '1-2', label: 'This is my 1st or 2nd year' },
      { value: '3-4', label: '3rd or 4th year' },
      { value: '5plus', label: '5th year or more' },
    ],
  },
  {
    id: 'income',
    question: 'Did you have any US-source income in 2025? (wages, stipend, scholarship, etc.)',
    options: [
      { value: 'none', label: 'No income at all' },
      { value: 'w2', label: 'Yes, from a US employer (W-2)' },
      { value: 'scholarship', label: 'Yes, scholarship/fellowship only' },
      { value: 'both', label: 'Yes, both W-2 and scholarship' },
    ],
  },
  {
    id: 'status_change',
    question: 'Did you apply for a green card or change your immigration status in 2025?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
]

function computeResult(answers) {
  const { days, visa, years, income, status_change } = answers
  const isExemptVisa = visa === 'f1' || visa === 'j1' || visa === 'opt'
  const underFiveYears = years === '1-2' || years === '3-4'
  const under183Days = days === 'lt31' || days === '31-182'
  const hasIncome = income !== 'none'
  const hasW2 = income === 'w2' || income === 'both'
  const hasScholarship = income === 'scholarship' || income === 'both'
  const changedStatus = status_change === 'yes'

  const isNRA = isExemptVisa && underFiveYears && under183Days && !changedStatus

  if (isNRA) {
    const forms = [
      {
        id: 'form-8843',
        name: 'Form 8843',
        description: 'Required for ALL F-1 students, even with $0 income',
        cta: 'Generate Free →',
        ctaLink: '/form-8843',
      },
    ]
    if (hasIncome) {
      forms.push({
        id: 'form-1040nr',
        name: 'Form 1040-NR',
        description: 'Main tax return for non-resident aliens with US income',
        cta: 'Learn More →',
        ctaLink: null,
      })
    }
    if (hasW2) {
      forms.push({
        id: 'w2',
        name: 'W-2 Form',
        description: 'Wage statement from your US employer — attach to 1040-NR',
        cta: 'Learn More →',
        ctaLink: null,
      })
    }
    if (hasScholarship) {
      forms.push({
        id: '1042s',
        name: 'Form 1042-S',
        description: "Foreign person's US source income — attach to 1040-NR",
        cta: 'Learn More →',
        ctaLink: null,
      })
    }
    const deadline = hasIncome
      ? 'April 15, 2026 (June 15 if you have no W-2 income)'
      : 'June 15, 2026'
    return { status: 'Non-Resident Alien (NRA)', badge: 'nra', forms, deadline, hasIncome }
  }

  return {
    status: 'Possibly Resident Alien',
    badge: 'ra',
    forms: [
      {
        id: 'form-1040',
        name: 'Form 1040',
        description: 'Standard US tax return for resident aliens and citizens',
        cta: 'Learn More →',
        ctaLink: null,
      },
    ],
    deadline: 'April 15, 2026',
    hasIncome,
    message:
      'You may meet the Substantial Presence Test. We recommend consulting a tax professional.',
  }
}

export default function StatusCheckerPage() {
  const navigate = useNavigate()
  const { user, signInAsGuest } = useAuth()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const current = QUESTIONS[step]
  const totalSteps = QUESTIONS.length
  const progress = Math.round(((step) / totalSteps) * 100)

  const handleSelect = (value) => {
    const next = { ...answers, [current.id]: value }
    setAnswers(next)
    if (step < totalSteps - 1) {
      setTimeout(() => setStep((s) => s + 1), 180)
    } else {
      const res = computeResult(next)
      try { localStorage.setItem('f1_status_result', JSON.stringify(res)) } catch {}
      setResult(res)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  if (result) {
    return <ResultScreen result={result} navigate={navigate} signInAsGuest={signInAsGuest} user={user} />
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
            <span className="text-sm font-medium text-[#f8fafc]">Tax Helper</span>
          </Link>
          <span className="text-xs text-[#475569]">
            Question {step + 1} of {totalSteps}
          </span>
        </div>
      </header>

      <DisclaimerBanner />

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-12 sm:px-6">
        {/* Progress bar */}
        <div className="mb-8 space-y-2">
          <div className="h-px w-full bg-[#1e293b]">
            <div
              className="h-full bg-[#3b82f6] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#475569]">
            <span>F-1 Status Checker</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Question card */}
        <div className="flex-1">
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[#f8fafc] mb-6 leading-snug">
              {current.question}
            </h2>
            <div className="space-y-3">
              {current.options.map((opt) => {
                const selected = answers[current.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left text-sm transition-all duration-150 active:scale-[0.99] ${
                      selected
                        ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#f8fafc]'
                        : 'border-[#1e293b] bg-transparent text-[#cbd5e1] hover:border-[#2d4a6e] hover:text-[#f8fafc]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Back navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 border border-[#1e293b] bg-transparent text-[#64748b] hover:border-[#2d4a6e] hover:text-[#f8fafc] rounded-xl px-4 py-2 text-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-1.5 border border-[#1e293b] bg-transparent text-[#64748b] hover:border-[#2d4a6e] hover:text-[#f8fafc] rounded-xl px-4 py-2 text-sm transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Home
            </Link>
          )}
          <p className="text-xs text-[#475569]">Select an option to continue</p>
        </div>
      </main>
    </div>
  )
}

function ResultScreen({ result, navigate, signInAsGuest, user }) {
  const isNRA = result.badge === 'nra'
  const [showChecklistPrompt, setShowChecklistPrompt] = useState(false)

  const handleChecklistClick = () => {
    if (user) {
      navigate('/checklist')
      return
    }
    setShowChecklistPrompt(true)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
            <span className="text-sm font-medium text-[#f8fafc]">Tax Helper</span>
          </Link>
          <span className="text-xs text-[#475569]">Results Ready</span>
        </div>
      </header>

      <DisclaimerBanner />

      <main className="relative z-10 mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        {/* Status badge */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <span
              className={`rounded-full px-5 py-2 text-sm font-mono font-medium ${
                isNRA
                  ? 'border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]'
                  : 'border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]'
              }`}
            >
              {result.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#f8fafc]">Your Tax Filing Results</h1>
          {result.message && (
            <p className="mt-3 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 p-3 text-sm text-[#f59e0b]">
              {result.message}
            </p>
          )}
        </div>

        {/* Filing requirements */}
        <div className="mb-5 rounded-2xl border border-[#1e293b] bg-[#0f172a] p-5 sm:p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#475569] mb-4">Your Filing Requirements</h2>
          <div className="space-y-3">
            {result.forms.map((form) => (
              <div
                key={form.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#1e293b] bg-[#080c14] p-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f8fafc]">{form.name}</p>
                  <p className="mt-0.5 text-xs text-[#64748b]">{form.description}</p>
                </div>
                {form.ctaLink ? (
                  <Link
                    to={form.ctaLink}
                    className="shrink-0 rounded-xl bg-[#3b82f6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2563eb]"
                  >
                    {form.cta}
                  </Link>
                ) : (
                  <Link
                    to="/chat"
                    className="shrink-0 rounded-xl border border-[#1e293b] bg-transparent px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
                  >
                    {form.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deadline card */}
        <div className="mb-5 rounded-2xl border border-[#1e293b] bg-[#0f172a] p-5 sm:p-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#475569] mb-2">Your Filing Deadline</h2>
          <p className="text-sm font-medium text-[#3b82f6] font-mono">{result.deadline}</p>
          <p className="text-xs text-[#64748b] mt-1">
            Missing this deadline may result in penalties. File early when possible.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleChecklistClick}
            className="w-full rounded-xl bg-[#3b82f6] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563eb] active:scale-[0.98]"
          >
            View My Document Checklist →
          </button>
          {showChecklistPrompt && (
            <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-4 text-sm text-[#f59e0b]">
              <p className="leading-6">
                Sign in to save and view your personalized checklist. Your progress won't be lost.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-xl bg-[#f59e0b] px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-[#d97706]"
                >
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={() => signInAsGuest('/checklist')}
                  className="rounded-xl border border-[#f59e0b]/40 bg-transparent px-4 py-2 text-xs font-semibold text-[#f59e0b] transition-colors hover:border-[#f59e0b]/60"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('f1_status_result')
              window.location.reload()
            }}
            className="w-full rounded-xl border border-[#1e293b] bg-transparent px-5 py-3 text-sm font-medium text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
          >
            ← Retake the Checker
          </button>
        </div>

        {/* IRS disclaimer */}
        <p className="mt-6 text-xs text-[#475569] text-center leading-5">
          This tool provides general guidance based on IRS Publication 519. Results are not tax advice.
          Consult your university&apos;s international student office or a CPA for your specific situation.
        </p>
      </main>
    </div>
  )
}
