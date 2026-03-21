import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'
import { cn } from '../utils/cn'
import DisclaimerBanner from '../components/DisclaimerBanner'

const SECTIONS = [
  {
    id: 'identity',
    title: 'Identity Documents',
    description: 'Proof of who you are and your F-1 visa status.',
    items: [
      {
        id: 'passport',
        name: 'Passport',
        description: 'Photo page of your valid passport.',
        details:
          'Your passport confirms your legal identity and citizenship. Tax forms and treaty benefits often depend on your country of residence.',
      },
      {
        id: 'f1-visa',
        name: 'F-1 Visa / I-20',
        description: 'Your current I-20 or F-1 visa documentation.',
        details:
          'Your I-20 and F-1 visa show you are a nonresident student for immigration purposes, which affects which tax forms you use (typically Form 1040-NR and Form 8843).',
      },
      {
        id: 'ssn-itin',
        name: 'SSN or ITIN',
        description: 'Social Security Number or Individual Taxpayer ID.',
        details:
          'The IRS uses your SSN or ITIN to match your income and tax filings. Most students with US income need one of these before filing.',
      },
    ],
  },
  {
    id: 'income',
    title: 'Income Documents',
    description: 'Records of money you earned in the US.',
    items: [
      {
        id: 'w2',
        name: 'Form W-2',
        description: 'Wage statement from on-campus or employer.',
        details:
          'Employers issue Form W-2 to report your salary and tax withheld. You usually receive one from each US employer by the end of January.',
      },
      {
        id: '1099',
        name: 'Form 1099',
        description: 'Freelance, contract, or other non-employee income.',
        details:
          'Form 1099 reports income such as contract work, rideshare, tutoring, or interest. This income is often not taxed in advance, so it matters for your final bill.',
      },
      {
        id: '1042s',
        name: 'Form 1042-S',
        description: 'Scholarships, fellowships, or treaty-based income.',
        details:
          'Form 1042-S reports income paid to nonresidents, including taxable scholarships and amounts covered by tax treaties. Many F-1 students receive this from their school.',
      },
      {
        id: 'bank-statements',
        name: 'Bank Statements',
        description: 'Interest or other income from US (and some foreign) accounts.',
        details:
          'Interest is sometimes taxable for nonresidents. Having your bank statements handy helps you answer questions about worldwide income accurately.',
      },
    ],
  },
  {
    id: 'education',
    title: 'Education Documents',
    description: 'Records from your university or college.',
    items: [
      {
        id: '1098t',
        name: 'Form 1098-T',
        description: 'Tuition statement from your school.',
        details:
          'Form 1098-T summarizes tuition and certain fees billed or paid. For many F-1 students it is informational, but it is still useful when completing tax software or working with an advisor.',
      },
      {
        id: 'scholarship-letters',
        name: 'Scholarship Letters',
        description: 'Award letters or grant notifications.',
        details:
          'These letters show how much scholarship or fellowship you received and whether it was for tuition, housing, or stipends—which can affect whether it is taxable.',
      },
      {
        id: 'enrollment-proof',
        name: 'Proof of Enrollment',
        description: 'Enrollment verification or transcript.',
        details:
          'Enrollment verification from your registrar confirms you were a full-time student on F-1 status, which is important for certain tax treaty and FICA exemptions.',
      },
    ],
  },
]

export default function ChecklistPage() {
  const location = useLocation()
  const { documents = [], country } = location.state || {}
  const navigate = useNavigate()
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

            {allDone && (
              <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-primary text-primary-foreground shadow-md">
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute -left-4 top-4 h-16 w-16 rounded-full bg-background/20" />
                  <div className="absolute right-0 top-10 h-20 w-20 rounded-full bg-background/10" />
                  <div className="absolute bottom-0 left-10 h-12 w-12 rounded-full bg-background/15" />
                </div>
                <div className="relative p-5 md:p-6">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">
                    <Sparkles className="h-3 w-3" />
                    <span>All documents collected</span>
                  </div>
                  <h3 className="text-lg font-semibold">
                    You&apos;re ready to file 🎉
                  </h3>
                  <p className="mt-2 text-xs text-primary-foreground/80 md:text-sm">
                    Great work. You have everything you need. Continue into your
                    chat to get personalized guidance or start filing with your
                    preferred software.
                  </p>
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full bg-background text-xs text-primary hover:bg-background/90 md:text-sm"
                      onClick={() => navigate('/chat')}
                    >
                      Start Filing with Sprintax
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-blue-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => navigate('/chat')}
                    >
                      Chat with F1 Tax Assistant
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

