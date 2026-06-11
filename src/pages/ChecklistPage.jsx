import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, ExternalLink, Download } from 'lucide-react'
import { cn } from '../utils/cn'
import DisclaimerBanner from '../components/DisclaimerBanner'
import FloatingChatButton from '../components/FloatingChatButton'
import useAuth from '../hooks/useAuth'

const STORAGE_KEY = 'f1_checklist_state'

const DEADLINES = [
  { date: 'Jan 31', label: 'W-2s due from employer', color: 'blue' },
  { date: 'Mid-Feb', label: '1042-S due from university', color: 'violet' },
  { date: 'Apr 15', label: 'Deadline if you have US income', color: 'red' },
  { date: 'Jun 15', label: 'Deadline if NO US income', color: 'amber' },
  { date: 'Jun 15', label: 'Form 8843 standalone deadline', color: 'green' },
]

function buildFilingItems(hasIncome, hasW2, hasScholarship) {
  const items = [
    {
      id: 'form-8843',
      name: 'Form 8843',
      description: 'Required for ALL F-1 students, even with $0 income',
      required: true,
      link: '/form-8843',
      linkLabel: 'Generate Free →',
    },
  ]
  if (hasIncome) {
    items.push({
      id: 'form-1040nr',
      name: 'Form 1040-NR',
      description: 'Main tax return for non-resident aliens with US income',
      required: true,
      link: null,
    })
  }
  if (hasW2) {
    items.push({
      id: 'w2',
      name: 'W-2 Form',
      description: 'Received from your US employer by Jan 31',
      required: true,
      link: null,
    })
  }
  if (hasScholarship) {
    items.push({
      id: '1042s',
      name: 'Form 1042-S',
      description: "Foreign Person's US Source Income — received from your university",
      required: true,
      link: null,
    })
  }
  items.push({
    id: '1099int',
    name: 'Form 1099-INT',
    description: 'If you earned more than $10 in bank interest',
    required: false,
    link: null,
  })
  items.push({
    id: '1098t',
    name: 'Form 1098-T',
    description: 'Tuition statement from your university, for your records',
    required: false,
    link: null,
  })
  return items
}

const IDENTITY_ITEMS = [
  { id: 'passport', name: 'Passport (copy)', description: 'Photo page and any US visa stamps', required: true, link: null },
  { id: 'f1-visa', name: 'F-1 Visa stamp', description: 'Page in your passport showing the F-1 visa', required: true, link: null },
  { id: 'i20', name: 'I-20 (all pages)', description: 'All pages of your current I-20 from your school', required: true, link: null },
  {
    id: 'i94',
    name: 'I-94 Arrival/Departure Record',
    description: 'Your most recent I-94 from CBP',
    required: true,
    link: 'https://i94.cbp.dhs.gov',
    linkLabel: 'Get yours at cbp.dhs.gov →',
    external: true,
  },
  { id: 'ssn-itin', name: 'SSN or ITIN', description: 'If you have one — required for 1040-NR filing', required: false, link: null },
]

const DEADLINE_COLORS = {
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  red: 'border-red-500/30 bg-red-500/10 text-red-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  green: 'border-green-500/30 bg-green-500/10 text-green-400',
}

export default function ChecklistPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const uid = user?.id || 'guest'
  const checklistStorageKey = `${STORAGE_KEY}_${uid}`

  const storedQuestionnaire = user?.user_metadata?.questionnaire || null
  const answers = location.state?.answers || storedQuestionnaire?.answers || null
  const actionItems = location.state?.actionItems || storedQuestionnaire?.actionItems || []

  const savedResult = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('f1_status_result') || 'null') }
    catch { return null }
  }, [])

  const hasAnyData = savedResult !== null || answers !== null

  const hasIncome = savedResult
    ? savedResult.hasIncome
    : Boolean(answers?.incomeTypes?.length > 0)
  const hasW2 = savedResult
    ? savedResult.forms?.some((f) => f.id === 'w2')
    : answers?.incomeTypes?.includes('w2') ?? false
  const hasScholarship = savedResult
    ? savedResult.forms?.some((f) => f.id === '1042s')
    : answers?.incomeTypes?.includes('1042s') ?? false

  const filingItems = useMemo(
    () => buildFilingItems(hasIncome, hasW2, hasScholarship),
    [hasIncome, hasW2, hasScholarship],
  )

  const allItemIds = useMemo(
    () => [...filingItems.map((i) => i.id), ...IDENTITY_ITEMS.map((i) => i.id)],
    [filingItems],
  )

  const [checked, setChecked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(checklistStorageKey) || '{}')
      return Object.fromEntries(allItemIds.map((id) => [id, saved[id] ?? false]))
    } catch {
      return Object.fromEntries(allItemIds.map((id) => [id, false]))
    }
  })
  const [loadedStorageKey, setLoadedStorageKey] = useState(checklistStorageKey)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(checklistStorageKey) || '{}')
      setChecked(Object.fromEntries(allItemIds.map((id) => [id, saved[id] ?? false])))
    } catch {
      setChecked(Object.fromEntries(allItemIds.map((id) => [id, false])))
    }
    setLoadedStorageKey(checklistStorageKey)
  }, [allItemIds, checklistStorageKey])

  useEffect(() => {
    if (loadedStorageKey !== checklistStorageKey) return
    try { localStorage.setItem(checklistStorageKey, JSON.stringify(checked)) } catch {}
  }, [checked, checklistStorageKey, loadedStorageKey])

  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))

  const total = allItemIds.length
  const completed = Object.values(checked).filter(Boolean).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleDownload = () => {
    const lines = [
      'F1 Tax Helper — My Document Checklist',
      '======================================',
      '',
      'Filing Documents:',
    ]
    filingItems.forEach((item) => {
      lines.push(`  [${checked[item.id] ? 'x' : ' '}] ${item.name}`)
      lines.push(`      ${item.description}`)
    })
    lines.push('')
    lines.push('Identity Documents:')
    IDENTITY_ITEMS.forEach((item) => {
      lines.push(`  [${checked[item.id] ? 'x' : ' '}] ${item.name}`)
      lines.push(`      ${item.description}`)
    })
    lines.push('')
    lines.push('Filing Deadlines:')
    DEADLINES.forEach((d) => lines.push(`  ${d.date}: ${d.label}`))
    lines.push('')
    lines.push('Generated by F1 Tax Helper — f1taxhelper.com')
    lines.push('This checklist is for informational purposes only. Not tax advice.')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'f1-tax-checklist.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!hasAnyData) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-[#cbd5e1]">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <DisclaimerBanner />
        <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
              <span className="text-base font-semibold tracking-wide text-[#f8fafc] sm:text-lg">F1 Tax Helper</span>
            </Link>
          </div>
        </header>
        <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-8">
            <div className="mb-4 text-4xl">📋</div>
            <h1 className="text-2xl font-bold text-[#f8fafc]">Get Your Personalized Checklist</h1>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">
              Take the F-1 Status Checker first so we can show you exactly which documents you need.
            </p>
            <Link
              to="/status-checker"
              className="mt-6 inline-block rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563eb] active:scale-[0.98]"
            >
              Take the Status Checker →
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-[#cbd5e1]">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <DisclaimerBanner />
      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
            <span className="text-base font-semibold tracking-wide text-[#f8fafc] sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#f8fafc] md:text-4xl">
            My Document Checklist
          </h1>
          <p className="text-sm text-[#64748b]">
            {savedResult
              ? `Personalized for your status: ${savedResult.status}`
              : 'Based on your questionnaire answers'}
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#64748b]">
              <span>{completed} of {total} items collected</span>
              <span>{progress}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#1e293b]">
              <div
                className="h-full rounded-full bg-[#3b82f6] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Section 1 — Filing documents */}
          <section className="space-y-3 md:col-span-2">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">
              Documents You Need to File
            </h2>
            <div className="space-y-2">
              {filingItems.map((item) => (
                <CheckItem
                  key={item.id}
                  item={item}
                  checked={checked[item.id]}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </section>

          {/* Section 2 — Identity documents */}
          <section className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">
              Identity Documents
            </h2>
            <div className="space-y-2">
              {IDENTITY_ITEMS.map((item) => (
                <CheckItem
                  key={item.id}
                  item={item}
                  checked={checked[item.id]}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </section>

          {/* Section 3 — Filing Deadlines */}
          <section className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">
              Filing Deadlines
            </h2>
            <div className="rounded-2xl border border-[#1e293b] bg-[#0f1629] p-4">
              <div className="space-y-2">
                {DEADLINES.map((d, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        DEADLINE_COLORS[d.color],
                      )}
                    >
                      {d.date}
                    </span>
                    <p className="text-xs text-[#cbd5e1]">{d.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Action buttons */}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleDownload}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1e293b] bg-transparent px-5 py-3 text-sm font-semibold text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
          >
            <Download className="h-4 w-4" />
            Download My Checklist
          </button>
          <button
            type="button"
            onClick={() => navigate('/chat', { state: { answers, actionItems } })}
            className="w-full rounded-xl bg-[#3b82f6] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563eb] active:scale-[0.98]"
          >
            I&apos;ve gathered everything → Start Filing
          </button>
          {answers && (
            <button
              type="button"
              onClick={() => navigate('/results')}
              className="w-full rounded-xl border border-[#1e293b] bg-transparent px-5 py-3 text-sm font-semibold text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
            >
              ← Back to Results
            </button>
          )}
          <p className="text-center text-xs text-[#64748b]">
            Your progress is saved automatically
          </p>
        </div>
      </main>
      <FloatingChatButton state={{ answers, actionItems }} />
    </div>
  )
}

function CheckItem({ item, checked, onToggle }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-sm transition-all',
        checked
          ? 'border-green-500/30 bg-green-500/10'
          : 'border-[#1e293b] bg-[#0f1629] hover:border-[#2d4a6e]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked
            ? 'border-none bg-[#3b82f6] text-white'
            : 'border-[#475569] bg-transparent',
        )}
        aria-pressed={checked}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('font-medium text-[#f8fafc]', checked && 'line-through opacity-60')}>
            {item.name}
          </p>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              item.required
                ? 'border-red-500/30 bg-red-500/20 text-red-400'
                : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-200',
            )}
          >
            {item.required ? 'Required' : 'If applicable'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#64748b]">{item.description}</p>
        {item.link && (
          item.external ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              {item.linkLabel || 'Learn more'}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Link
              to={item.link}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              {item.linkLabel || 'Learn more'}
            </Link>
          )
        )}
      </div>
    </div>
  )
}
