import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'

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
    return <ResultScreen result={result} navigate={navigate} />
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
              F1
            </div>
            <span className="text-sm font-semibold text-slate-100">Tax Helper</span>
          </Link>
          <span className="text-xs text-slate-400">
            Question {step + 1} of {totalSteps}
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-12 sm:px-6">
        {/* Progress bar */}
        <div className="mb-8 space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>F-1 Status Checker</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Question card */}
        <div className="flex-1">
          <div className="rounded-3xl border border-white/20 bg-white/5 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-8">
            <h2 className="mb-6 text-lg font-semibold leading-snug text-slate-100 sm:text-xl">
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
                    className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all duration-150 ${
                      selected
                        ? 'border-blue-500/60 bg-blue-500/20 text-white'
                        : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
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
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
              Home
            </Link>
          )}
          <p className="text-xs text-slate-600">Select an option to continue</p>
        </div>
      </main>
    </div>
  )
}

function ResultScreen({ result, navigate }) {
  const isNRA = result.badge === 'nra'

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
              F1
            </div>
            <span className="text-sm font-semibold text-slate-100">Tax Helper</span>
          </Link>
          <span className="text-xs text-green-400">✓ Results Ready</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        {/* Status badge */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <span
              className={`rounded-full px-5 py-2 text-sm font-bold ${
                isNRA
                  ? 'border border-green-500/30 bg-green-500/20 text-green-400'
                  : 'border border-amber-500/30 bg-amber-500/20 text-amber-400'
              }`}
            >
              {isNRA ? '✅' : '⚠️'} {result.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Your Tax Filing Results</h1>
          {result.message && (
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
              {result.message}
            </p>
          )}
        </div>

        {/* Filing requirements */}
        <div className="mb-5 rounded-3xl border border-white/20 bg-white/5 p-5 shadow-xl backdrop-blur-xl sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-100">Your Filing Requirements</h2>
          <div className="space-y-3">
            {result.forms.map((form) => (
              <div
                key={form.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{form.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{form.description}</p>
                </div>
                {form.ctaLink ? (
                  <Link
                    to={form.ctaLink}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
                  >
                    {form.cta}
                  </Link>
                ) : (
                  <Link
                    to="/chat"
                    className="shrink-0 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
                  >
                    {form.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deadline card */}
        <div className="mb-5 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 sm:p-6">
          <h2 className="mb-2 text-base font-semibold text-slate-100">📅 Your Filing Deadline</h2>
          <p className="text-sm font-bold text-blue-300">{result.deadline}</p>
          <p className="mt-1 text-xs text-slate-400">
            Missing this deadline may result in penalties. File early when possible.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/checklist')}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            View My Document Checklist →
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('f1_status_result')
              window.location.reload()
            }}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
          >
            ← Retake the Checker
          </button>
        </div>

        {/* IRS disclaimer */}
        <p className="mt-6 text-center text-xs leading-5 text-slate-600">
          This tool provides general guidance based on IRS Publication 519. Results are not tax advice.
          Consult your university&apos;s international student office or a CPA for your specific situation.
        </p>
      </main>
    </div>
  )
}
