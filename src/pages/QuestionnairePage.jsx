import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Search, AlertTriangle } from 'lucide-react'
import { cn } from '../utils/cn'
import DisclaimerBanner from '../components/DisclaimerBanner'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'
import { COUNTRIES, getTreatyByCountryName, treatyGuidance } from '../data/treaties'
import { TAX_YEAR } from '../data/taxSeason.js'
import { buildActionItems, questionnaireResidency } from '../utils/taxRules.js'
import { seasonKey, readStored, writeStored, removeStored } from '../utils/storage.js'
import SeasonNotice from '../components/SeasonNotice'

export default function QuestionnairePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const STORAGE_KEY = seasonKey('questionnaire-progress', user?.id)

  const [saved] = useState(() => {
    const raw = readStored(STORAGE_KEY, null, 'sessionStorage')
    if (
      !raw ||
      !Number.isInteger(raw.currentStep) ||
      raw.currentStep < 1 ||
      raw.currentStep > 5 ||
      !raw.answers ||
      !Array.isArray(raw.answers.incomeTypes)
    )
      return null
    return raw
  })

  const [currentStep, setCurrentStep] = useState(saved?.currentStep ?? 1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [stopped, setStopped] = useState(saved?.stopped ?? false)
  const [answers, setAnswers] = useState(
    saved?.answers ?? {
      isF1Visa: null,
      hasUSIncome: null,
      incomeTypes: [],
      yearsInUS: null,
      country: null,
      residencyStatus: null,
    },
  )

  // Flags for personalized results
  const [needsW2Flow, setNeedsW2Flow] = useState(saved?.needsW2Flow ?? false)
  const [needs1042SFlow, setNeeds1042SFlow] = useState(saved?.needs1042SFlow ?? false)
  const [needs1099Flow, setNeeds1099Flow] = useState(saved?.needs1099Flow ?? false)
  const [needsInvestmentFlow, setNeedsInvestmentFlow] = useState(
    saved?.needsInvestmentFlow ?? false,
  )
  const [needsResidencyCheck, setNeedsResidencyCheck] = useState(
    saved?.needsResidencyCheck ?? false,
  )
  const [saveWarning, setSaveWarning] = useState('')

  useEffect(() => {
    writeStored(
      STORAGE_KEY,
      {
        currentStep,
        stopped,
        answers,
        needsW2Flow,
        needs1042SFlow,
        needs1099Flow,
        needsInvestmentFlow,
        needsResidencyCheck,
      },
      'sessionStorage',
    )
  }, [
    STORAGE_KEY,
    currentStep,
    stopped,
    answers,
    needsW2Flow,
    needs1042SFlow,
    needs1099Flow,
    needsInvestmentFlow,
    needsResidencyCheck,
  ])

  const handleStartOver = useCallback(() => {
    removeStored(STORAGE_KEY, 'sessionStorage')
    setCurrentStep(1)
    setStopped(false)
    setAnswers({
      isF1Visa: null,
      hasUSIncome: null,
      incomeTypes: [],
      yearsInUS: null,
      country: null,
      residencyStatus: null,
    })
    setNeedsW2Flow(false)
    setNeeds1042SFlow(false)
    setNeeds1099Flow(false)
    setNeedsInvestmentFlow(false)
    setNeedsResidencyCheck(false)
  }, [STORAGE_KEY])

  const goToNextStep = useCallback(() => {
    setCurrentStep(currentStep === 2 && answers.hasUSIncome === false ? 4 : currentStep + 1)
  }, [answers.hasUSIncome, currentStep])

  const handleF1Answer = (answer) => {
    setAnswers((prev) => ({ ...prev, isF1Visa: answer }))
    if (answer) {
      goToNextStep()
    } else {
      setStopped(true)
    }
  }

  const handleIncomeAnswer = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      hasUSIncome: answer,
      incomeTypes: answer ? prev.incomeTypes : [],
    }))
    if (!answer) {
      setNeedsW2Flow(false)
      setNeeds1042SFlow(false)
      setNeeds1099Flow(false)
      setNeedsInvestmentFlow(false)
    }
    setCurrentStep(answer ? 3 : 4)
  }

  const handleIncomeTypeToggle = (type) => {
    setAnswers((prev) => {
      const newIncomeTypes = prev.incomeTypes.includes(type)
        ? prev.incomeTypes.filter((t) => t !== type)
        : [...prev.incomeTypes, type]
      return { ...prev, incomeTypes: newIncomeTypes }
    })
  }

  const handleIncomeTypeContinue = () => {
    setNeedsW2Flow(answers.incomeTypes.includes('w2'))
    setNeeds1042SFlow(answers.incomeTypes.includes('1042s'))
    setNeeds1099Flow(answers.incomeTypes.includes('1099'))
    setNeedsInvestmentFlow(answers.incomeTypes.includes('investment'))
    goToNextStep()
  }

  const handleYearsInUSAnswer = (years) => {
    const residencyStatus = questionnaireResidency(years)
    setAnswers((prev) => ({ ...prev, yearsInUS: years, residencyStatus }))
    setNeedsResidencyCheck(residencyStatus === 'Residency review needed')
    setCurrentStep(5)
  }

  const handleCountrySelect = (country) => {
    setAnswers((prev) => ({ ...prev, country }))
  }

  const actionItems = useMemo(
    () => buildActionItems(answers, treatyGuidance(answers.country)),
    [answers],
  )

  const totalSteps = 5
  const progressPercentage = Math.min(100, Math.round((currentStep / totalSteps) * 100))

  const handleBack = useCallback(() => {
    if (currentStep <= 1) {
      navigate('/welcome')
      return
    }

    setCurrentStep((prev) =>
      prev === 4 && answers.hasUSIncome === false ? 2 : Math.max(1, prev - 1),
    )
  }, [answers.hasUSIncome, currentStep, navigate])

  useEffect(() => {
    if (currentStep !== 6) return
    let cancelled = false

    const persistAndContinue = async () => {
      const hasTreatyBenefit = Boolean(
        answers.country && getTreatyByCountryName(answers.country)?.status === 'active',
      )
      const completed = {
        taxYear: TAX_YEAR,
        answers,
        actionItems,
        hasTreatyBenefit,
        completedAt: new Date().toISOString(),
      }
      const savedLocally = writeStored(seasonKey('questionnaire', user?.id), completed)
      writeStored(seasonKey('treaty-reviewed', user?.id), true)
      let syncWarning = savedLocally
        ? ''
        : 'Browser storage is unavailable. Keep this page open or download your checklist.'
      const shouldSyncToSupabase = user?.id && user.id !== 'guest' && !user?.is_guest

      if (shouldSyncToSupabase) {
        const saveToSupabase = async () => {
          const metadata = user?.user_metadata || {}
          const { error } = await supabase.auth.updateUser({
            data: {
              ...metadata,
              questionnaire: completed,
            },
          })
          if (error) throw error
        }

        const result = await Promise.race([
          saveToSupabase()
            .then(() => 'saved')
            .catch((err) => {
              console.error('Failed to save to Supabase:', err)
              return 'failed'
            }),
          new Promise((resolve) => setTimeout(() => resolve('timeout'), 3000)),
        ])

        if (result === 'failed' || result === 'timeout') {
          if (result === 'timeout') {
            console.error('Failed to save to Supabase: request timed out')
          }
          syncWarning = savedLocally
            ? 'Progress saved in this browser. Account sync is temporarily unavailable.'
            : 'Progress could not be saved. Keep this page open and download your checklist.'
          if (!cancelled) setSaveWarning(syncWarning)
        }
      }

      if (cancelled) return
      removeStored(STORAGE_KEY, 'sessionStorage')
      navigate('/results', {
        replace: true,
        state: { answers, actionItems, hasTreatyBenefit, syncWarning },
      })
    }

    persistAndContinue()
    return () => {
      cancelled = true
    }
  }, [actionItems, answers, currentStep, navigate, user?.id, user?.is_guest, STORAGE_KEY])

  if (stopped) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <DisclaimerBanner />
        <div className="mx-auto w-full max-w-3xl px-4 pt-4">
          <SeasonNotice compact />
        </div>
        <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold border border-[#3b82f6]/50 text-[#3b82f6] px-2 py-1 rounded">
                F1
              </span>
              <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
                F1 Tax Helper
              </span>
            </Link>
          </div>
        </header>
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 text-center sm:px-6">
          <div>
            <div className="w-full max-w-xl rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-[#f59e0b]" />
              <h2 className="mb-2 text-lg font-semibold text-[#f8fafc]">Important Notice</h2>
              <p className="text-sm text-[#64748b]">
                This tool is designed specifically for students on an F-1 visa. For other visa
                types, tax rules can be very different. Please consult a qualified tax professional
                for assistance.
              </p>
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#64748b] transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <DisclaimerBanner />
      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <SeasonNotice compact />
      </div>
      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold border border-[#3b82f6]/50 text-[#3b82f6] px-2 py-1 rounded">
              F1
            </span>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1629]">
            <div
              className={cn(
                'p-4 sm:p-6 transition-all duration-300',
                isTransitioning ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100',
              )}
            >
              {currentStep <= totalSteps && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-[#475569]">
                      Question {currentStep} of {totalSteps}
                    </span>
                    <div className="flex items-center gap-3">
                      {currentStep > 1 && (
                        <button
                          onClick={handleStartOver}
                          className="text-xs text-[#475569] transition-colors hover:text-[#64748b]"
                        >
                          Start over
                        </button>
                      )}
                      <span className="text-xs text-[#475569]">{progressPercentage}%</span>
                    </div>
                  </div>
                  <div className="h-px w-full bg-[#1e293b]">
                    <div
                      className="h-px bg-[#3b82f6] transition-all duration-500 ease-out"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && <Question1 onAnswer={handleF1Answer} />}
              {currentStep === 2 && <Question2 onAnswer={handleIncomeAnswer} />}
              {currentStep === 3 && (
                <Question3
                  selected={answers.incomeTypes}
                  onToggle={handleIncomeTypeToggle}
                  onContinue={handleIncomeTypeContinue}
                />
              )}
              {currentStep === 4 && <Question4 onAnswer={handleYearsInUSAnswer} />}
              {currentStep === 5 && (
                <Question5
                  onSelect={handleCountrySelect}
                  selectedCountry={answers.country}
                  onContinue={goToNextStep}
                />
              )}
              {currentStep === 6 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-[#475569]">Preparing your results…</p>
                  {saveWarning && (
                    <p className="mt-3 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b]">
                      {saveWarning}
                    </p>
                  )}
                </div>
              )}

              {currentStep <= totalSteps && (
                <div className="mt-8 flex items-center justify-between border-t border-[#1e293b] pt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-xl border border-[#1e293b] bg-transparent px-5 py-2.5 text-sm font-medium text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
                  >
                    ← Back
                  </button>
                  <p className="text-xs text-[#475569]">Your progress is saved automatically</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Question1({ onAnswer }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#475569]">STEP 1</p>
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-2">
        Were you in the US under F-1 student status during 2026?
      </h2>
      <p className="text-sm text-[#64748b] mb-6">
        This helps us determine which tax forms and rules apply to you.
      </p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 text-left text-sm text-[#cbd5e1] transition-all duration-150 hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc] active:scale-[0.99]"
        >
          Yes, I am
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 text-left text-sm text-[#cbd5e1] transition-all duration-150 hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc] active:scale-[0.99]"
        >
          No, I'm not
        </button>
      </div>
    </div>
  )
}

function Question2({ onAnswer }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#475569]">STEP 2</p>
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-2">
        Did you have any US-source income in tax year 2026?
      </h2>
      <p className="text-sm text-[#64748b] mb-6">
        This includes wages, scholarships, freelance work, investments, etc.
      </p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 text-left text-sm text-[#cbd5e1] transition-all duration-150 hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc] active:scale-[0.99]"
        >
          Yes, I had income
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 text-left text-sm text-[#cbd5e1] transition-all duration-150 hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc] active:scale-[0.99]"
        >
          No, I had no income
        </button>
      </div>
    </div>
  )
}

function Question3({ selected, onToggle, onContinue }) {
  const incomeTypes = [
    { id: 'w2', title: 'W-2 Wages', description: 'From an employer (on-campus, CPT, OPT)' },
    { id: '1042s', title: '1042-S Income', description: 'Scholarships, fellowships, stipends' },
    {
      id: '1099',
      title: 'Other 1099 income',
      description: 'Check the form type: services, interest and other payments differ',
    },
    {
      id: 'investment',
      title: 'Investment Income',
      description: 'Interest, dividends, capital gains',
    },
  ]
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#475569]">STEP 3</p>
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-2">
        What type of income did you receive?
      </h2>
      <p className="text-sm text-[#64748b] mb-6">
        Select all that apply. This determines the forms you'll need.
      </p>

      <div className="mb-6 space-y-3">
        {incomeTypes.map((type) => {
          const isSelected = selected.includes(type.id)
          return (
            <button
              key={type.id}
              onClick={() => onToggle(type.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border bg-transparent px-4 py-3 text-left text-sm transition-all duration-150 active:scale-[0.99]',
                isSelected
                  ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#f8fafc]'
                  : 'border-[#1e293b] bg-[#131c2e] text-[#cbd5e1] hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc]',
                type.id === '1099' && isSelected
                  ? 'border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]'
                  : '',
              )}
            >
              <div>
                <div className="font-medium">{type.title}</div>
                <div className="mt-1 text-xs opacity-70">{type.description}</div>
              </div>
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
                  isSelected ? 'border-[#3b82f6] bg-[#3b82f6]' : 'border-[#334155]',
                  type.id === '1099' && isSelected ? 'border-[#f59e0b] bg-[#f59e0b]' : '',
                )}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          )
        })}
        {selected.includes('1099') && (
          <div className="flex items-start gap-3 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#f59e0b]" />
            <p className="text-xs text-[#f59e0b]">
              A 1099 does not automatically mean self-employment. If you performed services, check
              your specific work authorization with your DSO. Taxable income must still be reported.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={selected.length === 0}
        className="w-full rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  )
}

function Question4({ onAnswer }) {
  const options = [
    { id: 1, text: 'This is my first calendar year' },
    { id: 2, text: '2 calendar years' },
    { id: 3, text: '3–4 calendar years' },
    { id: 5, text: '5 calendar years' },
    { id: 6, text: '6 or more calendar years' },
  ]
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#475569]">STEP 4</p>
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-2">
        Including 2026, how many exempt student, teacher or trainee calendar years have you had?
      </h2>
      <p className="text-sm text-[#64748b] mb-6">
        Count any part of a calendar year, including earlier F/J/M/Q visits. Years need not be
        consecutive. Status changes or a green card require a separate review.
      </p>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer(option.id)}
            className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 text-left text-sm text-[#cbd5e1] transition-all duration-150 hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc] active:scale-[0.99]"
          >
            {option.text}
          </button>
        ))}
        <button
          onClick={() => onAnswer(0)}
          className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 text-left text-sm text-[#cbd5e1] transition-all duration-150 hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#f8fafc] active:scale-[0.99]"
        >
          I'm not sure / It's complicated
        </button>
      </div>
    </div>
  )
}

function Question5({ onSelect, selectedCountry, onContinue }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredCountries = useMemo(
    () => COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[#475569]">STEP 5</p>
      <h2 className="text-base sm:text-lg font-semibold text-[#f8fafc] mb-2">
        Where were you a tax resident just before coming to the US?
      </h2>
      <p className="text-sm text-[#64748b] mb-6">
        Treaty eligibility usually depends on prior tax residence, which can differ from
        citizenship. Choose the country to review; additional treaty conditions may apply.
      </p>

      <div className="relative">
        <div
          className="flex items-center gap-3 rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 transition-colors hover:border-[#2d4a6e]"
          onClick={() => setIsOpen(!isOpen)}
          role="combobox"
          aria-controls="country-listbox"
          aria-expanded={isOpen}
          aria-label="Select your country"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false)
              return
            }
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
        >
          <Search className="h-5 w-5 text-[#475569]" />
          <input
            type="text"
            placeholder="Search for your country..."
            className="flex-1 bg-[#131c2e] text-sm text-[#f8fafc] outline-none placeholder:text-[#475569]"
            style={{ backgroundColor: '#131c2e', colorScheme: 'dark' }}
            value={search}
            aria-label="Search countries"
            onChange={(e) => {
              onSelect(null)
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(true)
            }}
          />
          <ChevronDown
            className={cn('h-5 w-5 text-[#475569] transition-transform', isOpen && 'rotate-180')}
          />
        </div>

        {isOpen && (
          <div
            id="country-listbox"
            role="listbox"
            className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#1e293b] bg-[#0f172a] shadow-xl"
          >
            {filteredCountries.map((country) => (
              <button
                key={country}
                role="option"
                aria-selected={selectedCountry === country}
                className="w-full px-4 py-2.5 text-left text-sm text-[#cbd5e1] transition-colors hover:bg-[#1e293b] hover:text-[#f8fafc]"
                onClick={() => {
                  onSelect(country)
                  setSearch(country)
                  setIsOpen(false)
                }}
              >
                {country}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-4 py-3 text-sm text-[#475569]">No countries found</div>
            )}
          </div>
        )}
      </div>

      {selectedCountry && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-3">
            <Check className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-[#22c55e]">{selectedCountry}</span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] active:scale-[0.98]"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
