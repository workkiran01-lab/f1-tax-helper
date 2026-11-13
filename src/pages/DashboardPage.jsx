import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, ChevronRight, Lock } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import useStoredRefresh from '../hooks/useStoredRefresh'
import supabase from '../utils/supabase'
import { writeStored } from '../utils/storage.js'
import { computeJourney } from '../utils/journey.js'
import { displayNameFor, firstName, universityFor } from '../utils/displayName.js'
import { TAX_YEAR, FILING_YEAR, DEADLINE_NOTE } from '../data/taxSeason.js'
import { PageHeader } from '../components/app/PageHeader'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { cn } from '../utils/cn'

const inputClass =
  'w-full min-h-12 rounded-xl border border-[#1e293b] bg-[#080c14] px-4 text-[15px] text-[#f8fafc] placeholder:text-[#64748b] focus:border-[#3b82f6] focus:outline-none'

function Onboarding({ user, onDone }) {
  const uid = user?.id || 'guest'
  const [name, setName] = useState(displayNameFor(user))
  const [university, setUniversity] = useState(universityFor(user))
  const submit = (event) => {
    event.preventDefault()
    const n = name.trim()
    const u = university.trim()
    if (!n || !u) return
    writeStored(`display_name_${uid}`, n)
    writeStored(`university_${uid}`, u)
    if (supabase && !user?.is_guest)
      supabase.auth.updateUser({ data: { display_name: n, university: u } }).catch(() => {})
    onDone()
  }
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">
        Welcome. Two quick things.
      </h1>
      <p className="mt-2 text-sm text-[#94a3b8]">
        Your name and school are used to greet you. You can change them later in Account.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="onb-name" className="mb-1.5 block text-sm font-medium text-[#f8fafc]">
            Full name
          </label>
          <input
            id="onb-name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="onb-school" className="mb-1.5 block text-sm font-medium text-[#f8fafc]">
            University
          </label>
          <input
            id="onb-school"
            required
            autoComplete="organization"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-[#2563eb] text-[15px] font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
        >
          Continue
        </button>
      </form>
    </section>
  )
}

function StepMark({ state, number }) {
  if (state === 'done')
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]">
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#080c14]" strokeWidth={3} />
      </span>
    )
  if (state === 'locked')
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#334155] text-[#94a3b8]">
        <Lock aria-hidden="true" className="h-3 w-3" />
      </span>
    )
  return (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
        state === 'current' ? 'border-[#3b82f6] text-[#60a5fa]' : 'border-[#334155] text-[#94a3b8]',
      )}
    >
      {number}
    </span>
  )
}

const STATE_LABEL = {
  done: 'Done',
  current: 'Next',
  todo: 'To do',
  waiting: 'Waiting',
  locked: 'Locked',
}

function StepRow({ step, number, last }) {
  const body = (
    <>
      <StepMark state={step.state} number={number} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-[15px]',
            step.state === 'current' ? 'font-semibold text-[#f8fafc]' : 'font-medium',
            step.state === 'locked' ? 'text-[#cbd5e1]' : 'text-[#f8fafc]',
          )}
        >
          {step.title}
          <span className="sr-only"> — {STATE_LABEL[step.state]}</span>
        </span>
        <span
          className={cn(
            'block text-[13px]',
            step.state === 'current' ? 'text-[#60a5fa]' : 'text-[#94a3b8]',
          )}
        >
          {step.detail}
        </span>
      </span>
    </>
  )
  const rowClass = cn(
    'flex min-h-14 items-center gap-3.5 px-4 py-3',
    !last && 'border-b border-[#1e293b]',
  )
  if (step.state === 'locked') return <li className={rowClass}>{body}</li>
  return (
    <li>
      <Link to={step.to} className={cn(rowClass, 'transition-colors hover:bg-[#131c2e]')}>
        {body}
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#94a3b8]" />
      </Link>
    </li>
  )
}

function deadlineReason(profile) {
  if (profile.hasW2) return 'Form 1040-NR with wages subject to US tax withholding.'
  if (profile.hasIncome) return 'Form 1040-NR without wages subject to withholding.'
  return 'Form 8843 alone, with no US income.'
}

export default function DashboardPage() {
  const { user } = useAuth()
  useStoredRefresh()
  const name = displayNameFor(user)
  const [onboarded, setOnboarded] = useState(false)
  const needsOnboarding = !onboarded && !(name && universityFor(user))

  if (needsOnboarding)
    return (
      <main className="flex min-h-[calc(100dvh-var(--tabbar))] items-center px-4 py-10 lg:min-h-dvh">
        <Onboarding user={user} onDone={() => setOnboarded(true)} />
      </main>
    )

  const { profile, steps, next, done, total } = computeJourney(user)
  const waiting = steps.find((s) => s.state === 'waiting')

  return (
    <>
      <DisclaimerBanner />
      <main className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-10 lg:py-10">
        <PageHeader
          eyebrow={`Tax year ${TAX_YEAR} · filed in ${FILING_YEAR}`}
          title={`Hi, ${firstName(name) || 'there'}`}
        />

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <section
              aria-labelledby="next-step"
              className="rounded-[20px] border border-[#2d4a6e] bg-[#0f172a] p-5 lg:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#60a5fa]">
                {next ? 'Your next step' : 'Nothing to do right now'}
              </p>
              {next ? (
                <>
                  <h2
                    id="next-step"
                    className="mt-3 text-xl font-bold text-[#f8fafc] lg:text-[22px]"
                  >
                    {next.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#cbd5e1]">{next.about}</p>
                  <Link
                    to={next.to}
                    className="mt-4 flex min-h-12 items-center justify-center rounded-[14px] bg-[#2563eb] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] lg:inline-flex"
                  >
                    {next.action}
                  </Link>
                </>
              ) : (
                <>
                  <h2
                    id="next-step"
                    className="mt-3 text-xl font-bold text-[#f8fafc] lg:text-[22px]"
                  >
                    {waiting ? 'You’re prepared for now' : 'You’re all caught up'}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#cbd5e1]">
                    {waiting
                      ? `The IRS has not released the final ${TAX_YEAR} Form 8843. Come back when it does to download yours. Your draft stays in this browser tab, so keep a copy of your details.`
                      : 'Every step is done. Keep copies of what you filed with your records.'}
                  </p>
                  <Link
                    to="/taxes"
                    className="mt-4 flex min-h-12 items-center justify-center rounded-[14px] border border-[#1e293b] px-5 text-[15px] font-semibold text-[#f8fafc] transition-colors hover:border-[#2d4a6e] lg:inline-flex"
                  >
                    Review My Taxes
                  </Link>
                </>
              )}
            </section>

            {profile && (
              <section
                aria-labelledby="deadline"
                className="flex items-start gap-3.5 rounded-2xl border border-[#1e293b] bg-[#0f172a] p-4"
              >
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]"
                />
                <div>
                  <h2 id="deadline" className="text-[15px] font-semibold text-[#f8fafc]">
                    {profile.deadline
                      ? `Your expected deadline: ${profile.deadline}`
                      : 'Confirm your deadline during your residency review'}
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#94a3b8]">
                    {profile.deadline ? `${deadlineReason(profile)} ` : ''}
                    {DEADLINE_NOTE}
                  </p>
                </div>
              </section>
            )}
          </div>

          <section
            aria-labelledby="steps"
            className="rounded-[20px] border border-[#1e293b] bg-[#0f172a]"
          >
            <div className="px-4 pb-3 pt-4">
              <div className="flex items-baseline justify-between">
                <h2 id="steps" className="text-base font-semibold text-[#f8fafc]">
                  Your filing steps
                </h2>
                <p className="text-[13px] text-[#94a3b8]">
                  {done} of {total} done
                </p>
              </div>
              <div
                role="progressbar"
                aria-label="Filing steps completed"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1e293b]"
              >
                <div
                  className="h-full rounded-full bg-[#3b82f6] transition-all duration-500"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            </div>
            <ol className="border-t border-[#1e293b]">
              {steps.map((step, index) => (
                <StepRow
                  key={step.id}
                  step={step}
                  number={index + 1}
                  last={index === steps.length - 1}
                />
              ))}
            </ol>
          </section>
        </div>

        <p className="mt-6 text-[13px] text-[#94a3b8]">
          Filing a 2025 form late?{' '}
          <Link to="/form-8843" className="text-[#60a5fa] hover:text-[#93c5fd]">
            Prior-year Form 8843 is available
          </Link>
          .
        </p>
      </main>
    </>
  )
}
