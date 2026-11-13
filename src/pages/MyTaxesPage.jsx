import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Download, ExternalLink, Sparkles } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import useStoredRefresh from '../hooks/useStoredRefresh'
import { TAX_YEAR, DEADLINES, DEADLINE_NOTE, canGenerate8843 } from '../data/taxSeason.js'
import { checklistItems } from '../data/checklistItems.js'
import { readStored, removeStored, seasonKey, writeStored } from '../utils/storage.js'
import { currentTaxProfile } from '../utils/taxProfile.js'
import { AnimatedCheck, AnimatedProgress } from '../components/Motion'
import { FilingOptionsSection } from '../components/checklist/FilingOptionsSection'
import { PageHeader } from '../components/app/PageHeader'
import DisclaimerBanner from '../components/DisclaimerBanner'
import SeasonNotice from '../components/SeasonNotice'
import { cn } from '../utils/cn'

const DEADLINE_COLORS = {
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  violet: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  red: 'border-red-500/30 bg-red-500/10 text-red-400',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  green: 'border-green-500/30 bg-green-500/10 text-green-400',
}
const INCOME_LABELS = {
  w2: 'wages (W-2)',
  '1042s': 'scholarship or fellowship (1042-S)',
  1099: '1099 income',
  investment: 'investment income',
}
const sectionTitle = 'text-base font-semibold text-[#f8fafc]'
const card = 'rounded-2xl border border-[#1e293b] bg-[#0f172a]'

function readChecked(key, ids) {
  const saved = readStored(key, {})
  const state = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
  return Object.fromEntries(ids.map((id) => [id, state[id] === true]))
}

function summaryFor(profile) {
  const parts = []
  if (profile.answers?.country) parts.push(profile.answers.country)
  if (!profile.hasIncome) parts.push(`no US income reported for ${TAX_YEAR}`)
  else {
    const types = (profile.answers?.incomeTypes || []).map((t) => INCOME_LABELS[t]).filter(Boolean)
    if (!types.length) {
      if (profile.hasW2) types.push(INCOME_LABELS.w2)
      if (profile.hasScholarship) types.push(INCOME_LABELS['1042s'])
    }
    parts.push(types.length ? `US income: ${types.join(', ')}` : 'US income reported')
  }
  return parts.join(' · ')
}

function itemStyle(item) {
  const lowered = item.toLowerCase()
  if (lowered.includes('warning') || lowered.includes('risk') || lowered.includes('unauthorized'))
    return { Icon: AlertTriangle, color: 'text-[#f59e0b]', label: 'Warning' }
  if (lowered.includes('must') || lowered.includes('required') || lowered.includes('crucial'))
    return { Icon: Sparkles, color: 'text-[#a78bfa]', label: 'Important' }
  return { Icon: Check, color: 'text-[#60a5fa]', label: null }
}

function CheckItem({ item, checked, onToggle }) {
  return (
    <div
      className={cn(
        'motion-check-item flex items-start gap-3 rounded-2xl border p-4 text-sm',
        checked
          ? 'border-green-500/30 bg-green-500/10'
          : 'border-[#1e293b] bg-[#0f172a] hover:border-[#2d4a6e]',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="motion-button -m-3 mt-[-10px] flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        aria-pressed={Boolean(checked)}
        aria-label={`Mark ${item.name} as ${checked ? 'not collected' : 'collected'}`}
      >
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
            checked
              ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
              : 'border-[#64748b] bg-transparent',
          )}
        >
          <AnimatedCheck checked={Boolean(checked)} className="h-3 w-3" />
        </span>
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
                ? 'border-red-500/30 bg-red-500/20 text-red-300'
                : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-200',
            )}
          >
            {item.required ? 'Required' : 'If applicable'}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#94a3b8]">{item.description}</p>
        {item.link &&
          (item.external ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              {item.linkLabel || 'Learn more'}
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          ) : (
            <Link
              to={item.link}
              className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              {item.linkLabel || 'Learn more'}
            </Link>
          ))}
      </div>
    </div>
  )
}

export default function MyTaxesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const uid = user?.id || 'guest'
  useStoredRefresh()
  const profile = currentTaxProfile(user)
  const syncWarning = location.state?.syncWarning || null

  const profileKey = profile
    ? [profile.needsReview, profile.hasIncome, profile.hasW2, profile.hasScholarship].join()
    : ''
  // Rebuilt only when the inputs that shape the list change, not on every render.
  const items = useMemo(() => (profile ? checklistItems(profile) : null), [profileKey])
  const storageKey = seasonKey('checklist', uid)
  const ids = items?.ids
  const [checked, setChecked] = useState(() => (ids ? readChecked(storageKey, ids) : {}))
  const [loadedKey, setLoadedKey] = useState(storageKey)

  useEffect(() => {
    setChecked(ids ? readChecked(storageKey, ids) : {})
    setLoadedKey(storageKey)
  }, [ids, storageKey])
  useEffect(() => {
    if (!ids || loadedKey !== storageKey) return
    writeStored(storageKey, checked)
  }, [checked, ids, loadedKey, storageKey])

  // Home links straight to a section (#checklist, #filing).
  useEffect(() => {
    if (!location.hash) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView?.({ block: 'start' })
  }, [location.hash, location.key])

  const restartQuestionnaire = () => {
    removeStored(seasonKey('questionnaire-progress', uid), 'sessionStorage')
    navigate('/questionnaire')
  }

  if (!profile)
    return (
      <>
        <DisclaimerBanner />
        <main className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-10 lg:py-10">
          <PageHeader eyebrow={`Tax year ${TAX_YEAR}`} title="My Taxes" />
          <section className={cn(card, 'mt-6 p-6 text-center')}>
            <h2 className="text-lg font-semibold text-[#f8fafc]">Start with your tax status</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#94a3b8]">
              Answer 5 quick questions and this page will show your status, the forms that apply to
              you and a document checklist for {TAX_YEAR}.
            </p>
            <Link
              to="/questionnaire"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[#2563eb] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Check my tax status
            </Link>
          </section>
        </main>
      </>
    )

  const total = ids.length
  const completed = ids.filter((id) => checked[id]).length
  const progress = total ? Math.round((completed / total) * 100) : 0
  const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  const formDownloaded =
    canGenerate8843(TAX_YEAR) && readStored(seasonKey('8843-generated', uid)) === true
  const filedKey = seasonKey('filed', uid)
  const filed = readStored(filedKey) === true

  const handleDownload = () => {
    const lines = [
      `F1 Tax Helper — My Document Checklist — Tax Year ${TAX_YEAR}`,
      '======================================',
      '',
      `Status: ${profile.label}`,
      '',
      'Filing Documents:',
    ]
    const add = (item) => {
      lines.push(`  [${checked[item.id] ? 'x' : ' '}] ${item.name}`)
      lines.push(`      ${item.description}`)
    }
    items.filing.forEach(add)
    lines.push('', 'Identity Documents:')
    items.identity.forEach(add)
    lines.push('', 'Expected 2027 filing dates (2026 income):', DEADLINE_NOTE)
    DEADLINES.forEach((d) => lines.push(`  ${d.date}: ${d.label}`))
    lines.push(
      '',
      'Generated by F1 Tax Helper — f1taxhelper.com',
      'This checklist is for informational purposes only. Not tax advice.',
    )
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `f1-tax-checklist-${TAX_YEAR}.txt`
    // Attach the link and revoke later: some browsers cancel a download whose
    // object URL is revoked in the same task as the click.
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const checkedOn = profile.updatedAt ? new Date(profile.updatedAt) : null
  const dateLabel =
    checkedOn && !Number.isNaN(checkedOn.getTime())
      ? checkedOn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : null

  return (
    <>
      <DisclaimerBanner />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 lg:px-10 lg:py-10">
        <PageHeader eyebrow={`Tax year ${TAX_YEAR}`} title="My Taxes" />

        {syncWarning && (
          <p
            role="status"
            className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#fbbf24]"
          >
            {syncWarning}
          </p>
        )}

        <section aria-labelledby="status-title" className={cn(card, 'rounded-[20px] p-5')}>
          <h2
            id="status-title"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]"
          >
            Your tax status
          </h2>
          <p className="mt-3">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-[13px] font-semibold',
                profile.needsReview
                  ? 'bg-[#f59e0b]/15 text-[#fbbf24]'
                  : 'bg-[#10233f] text-[#93c5fd]',
              )}
            >
              {profile.label}
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#cbd5e1]">{summaryFor(profile)}</p>
          <p className="mt-1 text-[13px] text-[#94a3b8]">
            From your {profile.source === 'questionnaire' ? 'questionnaire' : 'quick status check'}
            {dateLabel ? ` on ${dateLabel}` : ''}. A screening result, not a final determination.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={restartQuestionnaire}
              className="min-h-11 rounded-xl border border-[#1e293b] px-4 text-sm font-medium text-[#f8fafc] transition-colors hover:border-[#2d4a6e]"
            >
              Edit my answers
            </button>
            <Link
              to="/chat"
              className="inline-flex min-h-11 items-center text-sm font-medium text-[#60a5fa] hover:text-[#93c5fd]"
            >
              Ask AI about this result
            </Link>
          </div>
        </section>

        {(profile.actionItems.length > 0 || profile.message) && (
          <section aria-labelledby="means-title" className="space-y-3">
            <h2 id="means-title" className={sectionTitle}>
              What this means for you
            </h2>
            {profile.message && (
              <p className={cn(card, 'p-4 text-sm leading-relaxed text-[#cbd5e1]')}>
                {profile.message}
              </p>
            )}
            {profile.actionItems.map((item, index) => {
              const { Icon, color, label } = itemStyle(item)
              return (
                <div key={`${index}-${item.slice(0, 24)}`} className={cn(card, 'flex gap-3 p-4')}>
                  <Icon aria-hidden="true" className={cn('mt-0.5 h-4 w-4 shrink-0', color)} />
                  <div>
                    {label && (
                      <p
                        className={cn(
                          'mb-1 text-[11px] font-semibold uppercase tracking-wider',
                          color,
                        )}
                      >
                        {label}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed text-[#cbd5e1]">{item}</p>
                  </div>
                </div>
              )
            })}
            {profile.hasTreatyBenefit && (
              <div className="rounded-2xl border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-4">
                <h3 className="text-[15px] font-semibold text-[#f8fafc]">
                  You may qualify for a tax treaty benefit
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#94a3b8]">
                  We detected that your country may have treaty-based exemptions. Verify treaty
                  residence, income limits and disclosure exceptions with the IRS. Form 8833 is not
                  required for every student treaty claim.
                </p>
              </div>
            )}
          </section>
        )}

        <section id="checklist" aria-labelledby="checklist-title" className="scroll-mt-6 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="checklist-title" className={sectionTitle}>
              Checklist
            </h2>
            <p role="status" className="text-[13px] text-[#94a3b8]">
              {completed} of {total} items collected
            </p>
          </div>
          <AnimatedProgress value={progress} label="Documents collected" />
          {completed === total && total > 0 && (
            <p className="motion-message flex items-center gap-2 text-sm text-[#22c55e]">
              <AnimatedCheck />
              Documents collected. You can now review your filing options.
            </p>
          )}
          <h3 className="pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
            Documents you need to file
          </h3>
          <div className="space-y-2">
            {items.filing.map((item) => (
              <CheckItem
                key={item.id}
                item={item}
                checked={checked[item.id]}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
          <h3 className="pt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
            Identity documents
          </h3>
          <div className="space-y-2">
            {items.identity.map((item) => (
              <CheckItem
                key={item.id}
                item={item}
                checked={checked[item.id]}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#1e293b] px-5 text-sm font-semibold text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download my checklist
          </button>
        </section>

        <section aria-labelledby="deadlines-title" className="space-y-3">
          <h2 id="deadlines-title" className={sectionTitle}>
            Filing deadlines
          </h2>
          <div className={cn(card, 'space-y-2 p-4')}>
            {DEADLINES.map((d) => (
              <div key={`${d.date}-${d.label}`} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                    DEADLINE_COLORS[d.color],
                  )}
                >
                  {d.date}
                </span>
                <p className="text-[13px] text-[#cbd5e1]">{d.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-[#94a3b8]">{DEADLINE_NOTE}</p>
        </section>

        <section id="filing" aria-labelledby="filing-title" className="scroll-mt-6 space-y-3">
          <h2 id="filing-title" className={sectionTitle}>
            When you’re ready to file
          </h2>
          <SeasonNotice />
          {formDownloaded && (
            <label
              className={cn(card, 'flex min-h-12 items-center gap-3 p-4 text-sm text-[#f8fafc]')}
            >
              <input
                type="checkbox"
                checked={filed}
                onChange={(e) => writeStored(filedKey, e.target.checked)}
                className="h-5 w-5 accent-[#3b82f6]"
              />
              I have printed, signed and mailed my Form 8843
            </label>
          )}
          <FilingOptionsSection />
        </section>
      </main>
    </>
  )
}
