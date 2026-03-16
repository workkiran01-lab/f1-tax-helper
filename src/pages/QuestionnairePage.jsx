import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileText,
  MessageCircle,
  Search,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { cn } from '../utils/cn'
import { DisclaimerBanner } from '../components/DisclaimerBanner'

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

const PRIORITY_COUNTRIES = ['Nepal', 'India', 'China', 'South Korea', 'Mexico']

export default function QuestionnairePage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [answers, setAnswers] = useState({
    isF1Visa: null,
    country: null,
    incomeType: null,
    documents: [],
    concern: null,
  })

  const goToNextStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
      setIsTransitioning(false)
    }, 300)
  }, [])

  const handleF1Answer = (answer) => {
    setAnswers((prev) => ({ ...prev, isF1Visa: answer }))
    goToNextStep()
  }

  const handleCountrySelect = (country) => {
    setAnswers((prev) => ({ ...prev, country }))
    goToNextStep()
  }

  const handleIncomeSelect = (income) => {
    setAnswers((prev) => ({ ...prev, incomeType: income }))
    goToNextStep()
  }

  const handleDocumentToggle = (doc) => {
    setAnswers((prev) => ({
      ...prev,
      documents: prev.documents.includes(doc)
        ? prev.documents.filter((d) => d !== doc)
        : [...prev.documents, doc],
    }))
  }

  const handleConcernSelect = (concern) => {
    setAnswers((prev) => ({ ...prev, concern }))
    goToNextStep()
  }

  const actionItems = useMemo(() => {
    const items = []

    if (answers.incomeType === 'w2' || answers.documents.includes('W-2')) {
      items.push(
        'File Form 8843 (required for all F-1 students) and Form 1040-NR for your W-2 income',
      )
    } else if (answers.incomeType === '1099') {
      items.push(
        'File Form 8843 and Form 1040-NR. You may also need to pay self-employment taxes',
      )
    } else {
      items.push(
        'Even with no income, you must file Form 8843 to maintain your F-1 status',
      )
    }

    if (answers.documents.includes('1098-T tuition statement')) {
      items.push(
        'Review your 1098-T for potential education credits or deductions on your tax return',
      )
    }

    const treatyCountries = ['India', 'China', 'South Korea', 'Nepal']
    if (answers.country && treatyCountries.includes(answers.country)) {
      items.push(
        `Check if ${answers.country} has a tax treaty with the US that may reduce your tax burden`,
      )
    }

    if (answers.concern === 'fica') {
      items.push(
        'F-1 students are generally exempt from FICA taxes. If deducted incorrectly, you can file for a refund',
      )
    }

    if (items.length < 3) {
      items.push('Gather all your tax documents before the April 15th deadline')
    }
    if (items.length < 3) {
      items.push('Keep copies of all filed forms for your immigration records')
    }

    return items.slice(0, 3)
  }, [answers])

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DisclaimerBanner />
      <header className="px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">
            F1 Tax Helper
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {currentStep <= 5 && (
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Step {currentStep} of 5
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((currentStep / 5) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card shadow-lg">
            <div
              className={cn(
                'p-6 transition-all duration-300 md:p-8',
                isTransitioning
                  ? 'translate-y-4 opacity-0'
                  : 'translate-y-0 opacity-100',
              )}
            >
              {currentStep === 1 && <Question1 onAnswer={handleF1Answer} />}
              {currentStep === 2 && <Question2 onSelect={handleCountrySelect} />}
              {currentStep === 3 && <Question3 onSelect={handleIncomeSelect} />}
              {currentStep === 4 && (
                <Question4
                  selected={answers.documents}
                  onToggle={handleDocumentToggle}
                  onContinue={goToNextStep}
                />
              )}
              {currentStep === 5 && <Question5 onSelect={handleConcernSelect} />}
              {currentStep === 6 && (
                <Results
                  answers={answers}
                  actionItems={actionItems}
                  onChat={() => navigate('/chat', { state: { answers, actionItems } })}
                />
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
    <div className="text-center">
      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        Are you currently on an F-1 student visa?
      </h2>
      <p className="mb-8 text-muted-foreground">
        This helps us determine which tax forms and rules apply to you.
      </p>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Button
          onClick={() => onAnswer(true)}
          className="h-14 bg-primary px-12 text-lg text-primary-foreground hover:bg-primary/90"
        >
          Yes, I am
        </Button>
        <Button
          onClick={() => onAnswer(false)}
          variant="outline"
          className="h-14 border-2 border-primary px-12 text-lg text-primary hover:bg-primary/5"
        >
          No, I'm not
        </Button>
      </div>
    </div>
  )
}

function Question2({ onSelect }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredCountries = useMemo(
    () => COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase())),
    [search],
  )
  const priorityFiltered = useMemo(
    () =>
      PRIORITY_COUNTRIES.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )
  const otherFiltered = useMemo(
    () => filteredCountries.filter((c) => !PRIORITY_COUNTRIES.includes(c)),
    [filteredCountries],
  )

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-foreground">
        What country are you from?
      </h2>
      <p className="mb-6 text-center text-muted-foreground">
        Your home country may have a tax treaty that affects your filing.
      </p>

      <div className="relative">
        <div
          className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border p-4 transition-colors hover:border-primary/50"
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for your country..."
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
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
              'h-5 w-5 text-muted-foreground transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {priorityFiltered.length > 0 && (
              <>
                <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                  Popular Countries
                </div>
                {priorityFiltered.map((country) => (
                  <button
                    key={country}
                    className="w-full px-4 py-3 text-left text-foreground transition-colors hover:bg-secondary"
                    onClick={() => {
                      onSelect(country)
                      setIsOpen(false)
                    }}
                  >
                    {country}
                  </button>
                ))}
                {otherFiltered.length > 0 && (
                  <div className="border-t border-border" />
                )}
              </>
            )}
            {otherFiltered.map((country) => (
              <button
                key={country}
                className="w-full px-4 py-3 text-left text-foreground transition-colors hover:bg-secondary"
                onClick={() => {
                  onSelect(country)
                  setIsOpen(false)
                }}
              >
                {country}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div className="px-4 py-3 text-muted-foreground">
                No countries found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Question3({ onSelect }) {
  const options = [
    {
      id: 'w2',
      title: 'Yes - I have a W-2 from a job',
      description: 'On-campus employment, CPT, or OPT work',
    },
    {
      id: '1099',
      title: 'Yes - I have freelance or 1099 income',
      description: 'Self-employment, consulting, or contract work',
    },
    {
      id: 'none',
      title: 'No - I had no US income',
      description: 'No employment or self-employment income',
    },
  ]

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-foreground">
        Did you earn any US income this year?
      </h2>
      <p className="mb-6 text-center text-muted-foreground">
        Different income types require different tax forms.
      </p>

      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="group w-full rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="font-medium text-foreground transition-colors group-hover:text-primary">
              {option.title}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {option.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Question4({ selected, onToggle, onContinue }) {
  const documents = [
    'W-2',
    '1098-T tuition statement',
    '1042-S foreign income',
    'Social Security Number',
    'ITIN number',
  ]

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-foreground">
        Which tax documents do you have?
      </h2>
      <p className="mb-6 text-center text-muted-foreground">
        Select all that apply. Don't worry if you're missing some.
      </p>

      <div className="mb-6 space-y-3">
        {documents.map((doc) => {
          const isSelected = selected.includes(doc)
          return (
            <button
              key={doc}
              onClick={() => onToggle(doc)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <span
                className={cn(
                  'font-medium',
                  isSelected ? 'text-primary' : 'text-foreground',
                )}
              >
                {doc}
              </span>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground',
                )}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <Button
        onClick={onContinue}
        className="h-12 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

function Question5({ onSelect }) {
  const concerns = [
    { id: 'filing', text: "I don't know if I need to file" },
    { id: 'fica', text: "I'm worried about FICA deductions" },
    { id: 'treaty', text: 'I want to understand my tax treaty' },
    { id: '1098t', text: 'I need help with my 1098-T' },
    { id: 'forms', text: "I don't know which form to use" },
  ]

  return (
    <div>
      <h2 className="mb-2 text-center text-2xl font-semibold text-foreground">
        What is your biggest tax concern?
      </h2>
      <p className="mb-6 text-center text-muted-foreground">
        We'll personalize your guidance based on your main concern.
      </p>

      <div className="space-y-3">
        {concerns.map((concern) => (
          <button
            key={concern.id}
            onClick={() => onSelect(concern.id)}
            className="group w-full rounded-xl border-2 border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
          >
            <span className="font-medium text-foreground transition-colors group-hover:text-primary">
              {concern.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Results({ answers, actionItems, onChat }) {
  const navigate = useNavigate()
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        Based on your answers, here's what you need to know
      </h2>
      <p className="mb-6 text-muted-foreground">
        {answers.country && `As an F-1 student from ${answers.country}, `}
        we've prepared personalized guidance for you.
      </p>

      <div className="mb-8 space-y-3 text-left">
        {actionItems.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-xl bg-secondary p-4">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {index + 1}
            </div>
            <p className="text-sm leading-relaxed text-foreground">{item}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button
          variant="default"
          onClick={() =>
            navigate('/checklist', {
              state: { documents: answers.documents, country: answers.country },
            })
          }
          className="h-12 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
        >
          <Download className="mr-2 h-5 w-5" />
          Download My Document Checklist
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          or if you have questions first
        </p>

        <Button
          variant="outline"
          onClick={onChat}
          className="h-12 w-full border-2 border-primary text-base text-primary hover:bg-primary/5"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Chat with F1 Tax Assistant
        </Button>
      </div>
    </div>
  )
}

