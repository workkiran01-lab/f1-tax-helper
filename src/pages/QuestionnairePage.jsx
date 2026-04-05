import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '../utils/cn'
import DisclaimerBanner from '../components/DisclaimerBanner'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

const COUNTRIES = [
  'Nepal',
  'India',
  'China',
  'South Korea',
  'Mexico',
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Chile',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
]

const TREATY_COUNTRIES = {
  "China": { article: "Article 20(c)", wageCap: 5000, scholarshipExempt: true, form8833Required: true },
  "India": { article: "Article 21(2)", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "South Korea": { article: "Article 21(1)", wageCap: 2000, scholarshipExempt: true, form8833Required: true },
  "Canada": { article: "Article XX", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "Thailand": { article: "Article 22", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "Philippines": { article: "Article 20", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "Indonesia": { article: "Article 19", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "France": { article: "Article 21", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "Germany": { article: "Article 20", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "Netherlands": { article: "Article 22", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "UK": { article: "Article 20", wageCap: null, scholarshipExempt: true, form8833Required: true },
  "Japan": { article: "Article 20", wageCap: null, scholarshipExempt: true, form8833Required: true },
};

export default function QuestionnairePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [answers, setAnswers] = useState({
    isF1Visa: null,
    hasUSIncome: null,
    incomeTypes: [],
    yearsInUS: null,
    country: null,
    residencyStatus: null,
  })

  // Flags for personalized results
  const [needsW2Flow, setNeedsW2Flow] = useState(false)
  const [needs1042SFlow, setNeeds1042SFlow] = useState(false)
  const [needs1099Flow, setNeeds1099Flow] = useState(false)
  const [needsInvestmentFlow, setNeedsInvestmentFlow] = useState(false)
  const [needsResidencyCheck, setNeedsResidencyCheck] = useState(false)


  const goToNextStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      // Logic to skip steps 3 and 4 if no income
      if (currentStep === 2 && answers.hasUSIncome === false) {
        setCurrentStep(5) // Skip to country question
      } else {
        setCurrentStep((prev) => prev + 1)
      }
      setIsTransitioning(false)
    }, 300)
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
    setAnswers((prev) => ({ ...prev, hasUSIncome: answer }))
    goToNextStep()
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
    setAnswers((prev) => ({ ...prev, yearsInUS: years }))
    if (years >= 5) {
      setNeedsResidencyCheck(true)
      // In a real scenario, you'd ask more questions for SPT
      setAnswers((prev) => ({ ...prev, residencyStatus: 'Resident Alien' }))
    } else {
      setAnswers((prev) => ({ ...prev, residencyStatus: 'Non-Resident Alien' }))
    }
    goToNextStep()
  }

  const handleCountrySelect = (country) => {
    setAnswers((prev) => ({ ...prev, country }))
    goToNextStep()
  }

  const actionItems = useMemo(() => {
    const items = []

    // No income flow
    if (answers.hasUSIncome === false) {
      items.push('You are required to file Form 8843, Statement for Exempt Individuals and Individuals With a Medical Condition. This is true even if you had no income.')
      items.push('Since you had no US-source income, you likely do not need to file a US tax return (like Form 1040-NR), but Form 8843 is mandatory.')
      items.push('Filing Form 8843 on time is crucial for maintaining your F-1 visa status and future immigration benefits.')
      return items;
    }

    // Default NRA filing requirement
    if (answers.residencyStatus === 'Non-Resident Alien') {
      items.push('As a Non-Resident Alien, you will file Form 1040-NR and Form 8843.')
    } else if (answers.residencyStatus === 'Resident Alien') {
      items.push('Our analysis suggests you may qualify as a Resident Alien for tax purposes. You would file Form 1040, the standard US tax return.')
    }

    if (needsW2Flow) {
      items.push('Report your W-2 wages on Form 1040-NR.')
    }
    if (needs1042SFlow) {
      items.push('Report your 1042-S income (scholarships, fellowships) on Form 1040-NR. A portion of this may be exempt under a tax treaty.')
    }
    if (needs1099Flow) {
      items.push('Income reported on a 1099 (freelance/contract) is considered self-employment income. This may be unauthorized work under an F-1 visa and carries significant risk. You must still report it, but you should consult an immigration attorney.')
    }
    if (needsInvestmentFlow) {
      items.push('Investment income may be taxed differently depending on the source. This adds complexity to your return.')
    }

    if (answers.country) {
      const treaty = TREATY_COUNTRIES[answers.country];
      if (treaty) {
        let treatyMessage = `Your country, ${answers.country}, has a tax treaty with the US (${treaty.article}). `;
        if (treaty.wageCap && needsW2Flow) {
          treatyMessage += `You may be able to exclude up to $${treaty.wageCap} of your wages. `;
        }
        if (treaty.scholarshipExempt && needs1042SFlow) {
          treatyMessage += `Scholarship/fellowship income is generally exempt. `;
        }
        if (treaty.form8833Required) {
          treatyMessage += `You must file Form 8833 to claim these treaty benefits.`;
        }
        items.push(treatyMessage);
      } else {
        items.push(`No US income tax treaty exists for ${answers.country}. Standard Non-Resident Alien rules apply in full.`);
      }
    }
    
    // 1098-T Advice
    if (answers.residencyStatus === 'Resident Alien') {
        items.push('Your 1098-T may make you eligible for education credits like the American Opportunity Credit or Lifetime Learning Credit on your Form 1040.')
    } else { // Non-Resident Alien
        items.push('Your university may issue a 1098-T documenting tuition paid. As a Non-Resident Alien filing Form 1040-NR, you generally cannot claim US education credits. Keep this form for your records and verify with your DSO.')
    }


    items.push('Always verify with a licensed tax professional and your DSO before filing.')


    return items.slice(0, 4) // Show up to 4 items
  }, [answers, needsW2Flow, needs1042SFlow, needs1099Flow, needsInvestmentFlow])

  const totalSteps = 5;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100)

  const handleBack = useCallback(() => {
    if (currentStep <= 1) {
      navigate('/welcome')
      return
    }

    setCurrentStep((prev) => Math.max(1, prev - 1))
  }, [currentStep, navigate])

  useEffect(() => {
    if (currentStep !== 6) return

    const persistAndContinue = async () => {
      const metadata = user?.user_metadata || {}
      await supabase.auth.updateUser({
        data: {
          ...metadata,
          questionnaire: {
            answers,
            actionItems,
            completedAt: new Date().toISOString(),
          },
        },
      })

      navigate('/results', {
        replace: true,
        state: { answers, actionItems },
      })
    }

    persistAndContinue()
  }, [actionItems, answers, currentStep, navigate, user?.user_metadata])

  if (stopped) {
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
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
                F1
              </div>
              <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
            </Link>
          </div>
        </header>
         <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 text-center sm:px-6">
            <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-400" />
                <h2 className="mb-2 text-2xl font-semibold text-slate-100">Important Notice</h2>
                <p className="text-slate-300">
                    This tool is designed specifically for students on an F-1 visa. For other visa types, tax rules can be very different. Please consult a qualified tax professional for assistance.
                </p>
            </div>
         </main>
       </div>
    )
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
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="rounded-3xl border border-white/20 bg-white/5 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
            <div
              className={cn(
                'p-6 transition-all duration-300 md:p-8',
                isTransitioning
                  ? 'translate-y-4 opacity-0'
                  : 'translate-y-0 opacity-100',
              )}
            >
              {currentStep <= totalSteps && (
                <div className="mb-8">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Question {currentStep} of {totalSteps}
                    </span>
                    <span className="text-sm text-slate-400">{progressPercentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] transition-all duration-500 ease-out"
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
              {currentStep === 5 && <Question5 onSelect={handleCountrySelect} />}
              {currentStep === 6 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">Preparing your results…</p>
                </div>
              )}

              {currentStep <= totalSteps && (
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10"
                  >
                    ← Back
                  </button>
                  <p className="text-xs text-slate-500">Your progress is saved automatically</p>
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
      <p className="mb-3 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100/90">
        STEP 1
      </p>
      <h2 className="mb-2 text-2xl font-bold text-slate-100">
        Are you currently on an F-1 student visa?
      </h2>
      <p className="mb-6 text-slate-300">
        This helps us determine which tax forms and rules apply to you.
      </p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="w-full rounded-xl border border-white/20 bg-white/5 p-4 text-left text-slate-100 transition-all duration-200 hover:border-blue-500/50 hover:bg-white/10"
        >
          Yes, I am
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="w-full rounded-xl border border-white/20 bg-white/5 p-4 text-left text-slate-100 transition-all duration-200 hover:border-blue-500/50 hover:bg-white/10"
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
      <p className="mb-3 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100/90">
        STEP 2
      </p>
      <h2 className="mb-2 text-2xl font-bold text-slate-100">
        Did you have any US-source income in tax year 2025?
      </h2>
      <p className="mb-6 text-slate-300">
        This includes wages, scholarships, freelance work, investments, etc.
      </p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="w-full rounded-xl border border-white/20 bg-white/5 p-4 text-left text-slate-100 transition-all duration-200 hover:border-blue-500/50 hover:bg-white/10"
        >
          Yes, I had income
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="w-full rounded-xl border border-white/20 bg-white/5 p-4 text-left text-slate-100 transition-all duration-200 hover:border-blue-500/50 hover:bg-white/10"
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
    { id: '1099', title: '1099 / Freelance', description: 'Independent contractor or side jobs' },
    { id: 'investment', title: 'Investment Income', description: 'Interest, dividends, capital gains' },
  ]
  return (
    <div>
      <p className="mb-3 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100/90">
        STEP 3
      </p>
      <h2 className="mb-2 text-2xl font-bold text-slate-100">
        What type of income did you receive?
      </h2>
      <p className="mb-6 text-slate-300">
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
                'flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/5 p-4 text-left transition-all duration-200 hover:bg-white/10 hover:border-blue-500/50',
                isSelected
                  ? 'border-blue-500 bg-blue-500/20 text-blue-100'
                  : '',
                type.id === '1099' && isSelected ? 'border-amber-400 bg-amber-500/20 text-amber-50' : ''
              )}
            >
              <div>
                <div className={cn('font-medium text-slate-100', isSelected ? 'text-blue-100' : '',  type.id === '1099' && isSelected ? 'text-amber-50' : '')}>
                  {type.title}
                </div>
                <div className="mt-1 text-sm text-slate-300">{type.description}</div>
              </div>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
                  isSelected ? 'border-blue-500 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]' : 'border-slate-500',
                  type.id === '1099' && isSelected ? 'border-amber-400 bg-amber-400' : ''
                )}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </div>
            </button>
          )
        })}
         {selected.includes('1099') && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/60 bg-amber-500/15 p-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-300" />
                <p className="text-xs text-amber-100">
                    <strong>Warning:</strong> Freelance (1099) work may violate your F-1 status unless it is directly related to your studies and authorized CPT/OPT. This carries immigration risk. You must still report this income to the IRS.
                </p>
            </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={selected.length === 0}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>
    </div>
  )
}

function Question4({ onAnswer }) {
  const options = [
    { id: 1, text: 'Less than 1 year' },
    { id: 2, text: '1-2 years' },
    { id: 3, text: '3-4 years' },
    { id: 5, text: '5 or more years' },
  ]
  return (
     <div>
      <p className="mb-3 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100/90">
        STEP 4
      </p>
      <h2 className="mb-2 text-2xl font-bold text-slate-100">
        How many calendar years have you been in the US on F-1 status?
      </h2>
      <p className="mb-6 text-slate-300">
        This helps determine your tax residency status (Non-Resident vs. Resident).
      </p>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer(option.id)}
            className="group w-full rounded-xl border border-white/20 bg-white/5 p-4 text-left transition-all duration-200 hover:border-blue-500/50 hover:bg-white/10"
          >
            <span className="font-medium text-slate-100 transition-colors group-hover:text-blue-100">
              {option.text}
            </span>
          </button>
        ))}
         <button
            onClick={() => onAnswer(0)} // Special value for "not sure"
            className="group w-full rounded-xl border border-white/20 bg-white/5 p-4 text-left transition-all duration-200 hover:border-blue-500/50 hover:bg-white/10"
          >
            <span className="font-medium text-slate-100 transition-colors group-hover:text-blue-100">
              I'm not sure / It's complicated
            </span>
          </button>
      </div>
    </div>
  )
}

function Question5({ onSelect }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredCountries = useMemo(
    () => COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  return (
    <div>
      <p className="mb-3 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.16em] text-blue-100/90">
        STEP 5
      </p>
      <h2 className="mb-2 text-2xl font-bold text-slate-100">
        What is your country of citizenship?
      </h2>
      <p className="mb-6 text-slate-300">
        This is for checking potential tax treaty benefits.
      </p>

      <div className="relative">
        <div
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-4 transition-colors hover:border-blue-500/50 hover:bg-white/10"
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
        >
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for your country..."
            className="flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(true)
            }}
          />
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-white/20 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
            {filteredCountries.map((country) => (
              <button
                key={country}
                className="w-full px-4 py-3 text-left text-slate-100 transition-colors hover:bg-white/10"
                onClick={() => {
                  onSelect(country)
                  setIsOpen(false)
                }}
              >
                {country}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-4 py-3 text-slate-400">
                No countries found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
