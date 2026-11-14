import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  ChevronRight,
  FolderCheck,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import useAuth from '../hooks/useAuth'
import useStoredRefresh from '../hooks/useStoredRefresh'
import supabase from '../utils/supabase'
import { writeStored } from '../utils/storage.js'
import { checklistProgress, computeJourney } from '../utils/journey.js'
import IconTile from '../components/app/IconTile'
import { displayNameFor, firstName, universityFor } from '../utils/displayName.js'
import { TAX_YEAR, FILING_YEAR } from '../data/taxSeason.js'
import { PageHeader } from '../components/app/PageHeader'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { cn } from '../utils/cn'
import { motion } from 'framer-motion'
import { CountUp, ProgressRing, Sequence, SequenceItem, settle } from '../components/app/motion'

const inputClass =
  'w-full min-h-[52px] rounded-2xl border border-line bg-surface-2 px-4 text-[17px] text-ink placeholder:text-ink-4'

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
    <section className="mx-auto w-full max-w-md rounded-4xl border border-line bg-surface p-6 shadow-raised sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome. Two quick things.</h1>
      <p className="mt-2 text-sm text-ink-3">
        Your name and school are used to greet you. You can change them later in Account.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="onb-name" className="mb-1.5 block text-sm font-medium text-ink">
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
          <label htmlFor="onb-school" className="mb-1.5 block text-sm font-medium text-ink">
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
          className="min-h-[52px] w-full rounded-2xl bg-tint text-[17px] font-semibold text-white hover:bg-tint-hover"
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
      <motion.span
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={settle}
        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint"
      >
        <Check aria-hidden="true" className="h-3.5 w-3.5 text-white" strokeWidth={3} />
      </motion.span>
    )
  if (state === 'locked')
    return (
      <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-3">
        <Lock aria-hidden="true" className="h-3 w-3" />
      </span>
    )
  return (
    <span
      className={cn(
        'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        state === 'current'
          ? 'bg-tint/20 text-tint-ink ring-2 ring-tint'
          : 'bg-surface-3 text-ink-2',
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
      <span className="relative flex shrink-0 self-stretch">
        <span className="flex items-center">
          <StepMark state={step.state} number={number} />
        </span>
        {!last && (
          // The line to the next step fills in once this one is done.
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-full w-0.5 -translate-x-1/2 bg-line"
          >
            {step.state === 'done' && (
              <motion.span
                className="block h-full w-full origin-top bg-tint"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...settle, delay: 0.3 + number * 0.08 }}
              />
            )}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 py-3.5">
        <span
          className={cn(
            'block text-[17px] leading-snug',
            step.state === 'current' ? 'font-semibold' : 'font-medium',
            step.state === 'locked' ? 'text-ink-3' : 'text-ink',
          )}
        >
          {step.title}
          <span className="sr-only"> — {STATE_LABEL[step.state]}</span>
        </span>
        <span
          className={cn(
            'mt-0.5 block text-[13px] leading-snug',
            step.state === 'current' ? 'text-tint-ink' : 'text-ink-3',
          )}
        >
          {step.detail}
        </span>
      </span>
    </>
  )
  const rowClass = 'flex min-h-[60px] items-stretch gap-3.5 px-4'
  if (step.state === 'locked')
    return (
      <SequenceItem as="li" className={rowClass}>
        {body}
      </SequenceItem>
    )
  return (
    <SequenceItem as="li">
      <Link to={step.to} className={cn(rowClass, 'row-press transition-colors hover:bg-surface-2')}>
        {body}
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 self-center text-ink-4" />
      </Link>
    </SequenceItem>
  )
}

// Whole days from today until a date written like "June 15, 2027".
function daysUntil(dateText) {
  const target = Date.parse(dateText)
  if (Number.isNaN(target)) return null
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.max(0, Math.ceil((target - start) / 86_400_000))
}

// A small tappable tile: one fact, and where to go for more.
function Widget({ to, icon, tone, label, children }) {
  return (
    <SequenceItem>
      <Link
        to={to}
        className="press flex h-full min-h-[132px] flex-col justify-between rounded-3xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center justify-between">
          <IconTile icon={icon} tone={tone} />
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-4" />
        </span>
        <span className="mt-3 block">
          {children}
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{label}</span>
        </span>
      </Link>
    </SequenceItem>
  )
}

const bigFigure = 'block text-[28px] font-bold leading-none tracking-tight text-ink tabular-nums'
const smallFigure = 'block text-[17px] font-semibold leading-snug text-ink'

export default function DashboardPage() {
  const { user } = useAuth()
  useStoredRefresh()
  const name = displayNameFor(user)
  const [onboarded, setOnboarded] = useState(false)
  const needsOnboarding = !onboarded && !(name && universityFor(user))

  if (needsOnboarding)
    return (
      <main className="relative flex min-h-[calc(100dvh-var(--tabbar))] items-center px-4 py-10 lg:min-h-dvh">
        <div className="aurora" />
        <div className="relative w-full">
          <Onboarding user={user} onDone={() => setOnboarded(true)} />
        </div>
      </main>
    )

  const { profile, steps, next, done, total } = computeJourney(user)
  const waiting = steps.find((s) => s.state === 'waiting')
  const docs = checklistProgress(user?.id || 'guest', profile)
  const days = profile?.deadline ? daysUntil(profile.deadline) : null

  return (
    <>
      <DisclaimerBanner />
      <main className="mx-auto w-full max-w-5xl px-5 pb-8 lg:px-10 lg:pb-12">
        <PageHeader
          eyebrow={`Tax year ${TAX_YEAR}, filed in ${FILING_YEAR}`}
          title={`Hi, ${firstName(name) || 'there'}`}
        />

        <Sequence className="mt-6 grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
          <div className="space-y-4">
            <SequenceItem
              as="section"
              aria-labelledby="next-step"
              className="hero-surface rounded-4xl p-5 lg:p-7"
            >
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={done}
                  total={total}
                  size={68}
                  label="Filing steps completed"
                  trackClass="stroke-white/25"
                  barClass="stroke-white"
                >
                  <span className="text-[15px] font-semibold tabular-nums text-white">
                    <CountUp value={done} />
                    <span className="text-white/70">/{total}</span>
                  </span>
                </ProgressRing>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white/80">
                    {next ? 'Your next step' : 'Nothing to do right now'}
                  </p>
                  <h2 id="next-step" className="text-[24px] font-bold leading-tight lg:text-[28px]">
                    {next
                      ? next.title
                      : waiting
                        ? 'You’re prepared for now'
                        : 'You’re all caught up'}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-white/90">
                {next
                  ? next.about
                  : waiting
                    ? `The IRS has not released the final ${TAX_YEAR} Form 8843. Come back when it does to download yours. Your draft stays in this browser tab, so keep a copy of your details.`
                    : 'Every step is done. Keep copies of what you filed with your records.'}
              </p>
              <Link
                to={next ? next.to : '/taxes'}
                className="press mt-5 flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-6 text-[17px] font-semibold text-[rgb(24,64,180)] shadow-[0_8px_24px_-10px_rgb(0_0_0/0.5)] hover:bg-white/90 lg:inline-flex"
              >
                {next ? next.action : 'Review My Taxes'}
              </Link>
            </SequenceItem>

            <Sequence className="grid grid-cols-2 gap-3">
              {profile ? (
                <>
                  <Widget
                    to="/taxes#deadlines-title"
                    icon={CalendarDays}
                    tone="amber"
                    label={
                      profile.deadline ? `until ${profile.deadline}` : 'Confirm it in your review'
                    }
                  >
                    <h2 className="sr-only">
                      {profile.deadline
                        ? `Your expected deadline: ${profile.deadline}`
                        : 'Confirm your deadline during your residency review'}
                    </h2>
                    {days === null ? (
                      <span className={smallFigure}>Deadline</span>
                    ) : (
                      <span aria-hidden="true" className={bigFigure}>
                        <CountUp value={days} />
                        <span className="ml-1 text-[15px] font-semibold text-ink-3">days</span>
                      </span>
                    )}
                  </Widget>
                  <Widget
                    to="/taxes#checklist"
                    icon={FolderCheck}
                    tone="green"
                    label="documents ready"
                  >
                    <span className={bigFigure}>
                      <CountUp value={docs.done} />
                      <span className="text-ink-3">/{docs.total}</span>
                    </span>
                  </Widget>
                  <Widget to="/taxes" icon={ShieldCheck} tone="blue" label="Your tax status">
                    <span className={smallFigure}>{profile.label}</span>
                  </Widget>
                </>
              ) : (
                <Widget
                  to="/questionnaire"
                  icon={ShieldCheck}
                  tone="blue"
                  label="5 quick questions"
                >
                  <span className={smallFigure}>Status not checked</span>
                </Widget>
              )}
              <Widget to="/chat" icon={Sparkles} tone="violet" label="Questions about your taxes">
                <span className={smallFigure}>Ask AI</span>
              </Widget>
            </Sequence>
          </div>

          <SequenceItem as="section" aria-labelledby="steps">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 id="steps" className="text-xl font-bold text-ink">
                Your filing steps
              </h2>
              <p className="text-[13px] text-ink-3">
                {done} of {total} done
              </p>
            </div>
            <Sequence as="ol" className="overflow-hidden rounded-3xl border border-line bg-surface">
              {steps.map((step, index) => (
                <StepRow
                  key={step.id}
                  step={step}
                  number={index + 1}
                  last={index === steps.length - 1}
                />
              ))}
            </Sequence>
            <p className="mt-4 px-1 text-[13px] text-ink-3">
              Filing a 2025 form late?{' '}
              <Link to="/form-8843" className="text-tint-ink hover:text-tint-ink-strong">
                Prior-year Form 8843 is available
              </Link>
              .
            </p>
          </SequenceItem>
        </Sequence>
      </main>
    </>
  )
}
