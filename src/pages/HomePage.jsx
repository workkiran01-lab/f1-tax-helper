import Reveal from '../components/Reveal'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  FileText,
  FolderCheck,
  Globe2,
  Home,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { AnimatedCheck, InteractiveSurface } from '../components/Motion'
import { Sequence, SequenceItem } from '../components/app/motion'
import IconTile from '../components/app/IconTile'
import { BrandMark } from '../components/Brand'
import { TAX_YEAR, FILING_YEAR } from '../data/taxSeason.js'
import useAuth from '../hooks/useAuth'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { Navbar } from '../components/Navbar'

// ── Animated checkup card data ──────────────────────────────────────────────

const PROFILES = [
  {
    country: 'Nepal',
    flag: '🇳🇵',
    visa: 'F-1',
    years: 2,
    checks: ['Form 8843 Required', 'Nonresident Alien', 'No SSN for 8843 alone'],
    treatyStatus: 'none',
    treatyLabel: 'No treaty found',
    next: 'Generate Form 8843',
  },
  {
    country: 'India',
    flag: '🇮🇳',
    visa: 'F-1',
    years: 1,
    checks: ['Form 8843 Required', 'Nonresident Alien', 'Standard deduction may apply'],
    treatyStatus: 'active',
    treatyLabel: 'Active — Article 21(2)',
    next: 'Review treaty eligibility',
  },
  {
    country: 'China',
    flag: '🇨🇳',
    visa: 'F-1',
    years: 3,
    checks: ['Form 8843 Required', 'Nonresident Alien', 'Wage exemption up to $5,000'],
    treatyStatus: 'active',
    treatyLabel: 'Active — Article 20(c)',
    next: 'Review treaty eligibility',
  },
]

// ── Animated card component ─────────────────────────────────────────────────

function TaxCheckupCard() {
  const reduceMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (reduceMotion || paused || hovered) return
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % PROFILES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [reduceMotion, paused, hovered])

  function goTo(i) {
    setPaused(true)
    setActiveIndex(i)
  }

  const profile = PROFILES[activeIndex]

  return (
    <InteractiveSurface
      className="w-full max-w-sm overflow-hidden rounded-4xl border border-line bg-surface p-6 shadow-float"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (event.target.matches(':focus-visible')) setPaused(true)
      }}
      role="region"
      aria-label="Example tax checkups"
      aria-roledescription="carousel"
    >
      <div className="mb-4 text-[13px] font-medium text-tint-ink">Example checkup</div>

      <div className="min-h-[235px]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeIndex}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            className="space-y-4"
          >
            {/* Profile meta */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Country', value: `${profile.country} ${profile.flag}` },
                { label: 'Visa', value: profile.visa },
                { label: 'Years', value: String(profile.years) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="mb-1 text-xs text-ink-5">{label}</div>
                  <div className="text-sm font-semibold text-ink">{value}</div>
                </div>
              ))}
            </div>

            {/* Checkmarks */}
            <div className="space-y-1.5">
              {profile.checks.map((check) => (
                <div key={check} className="flex items-center gap-2 text-sm text-ink-2">
                  <AnimatedCheck className="h-4 w-4 shrink-0 text-ok-ink" />
                  <span>{check}</span>
                </div>
              ))}
            </div>

            {/* Treaty row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-5">Treaty</span>
              {profile.treatyStatus === 'active' ? (
                <span className="border border-ok/30 bg-ok/10 text-ok-ink text-xs px-2 py-0.5 rounded">
                  {profile.treatyLabel}
                </span>
              ) : (
                <span className="border border-bad/30 bg-bad/10 text-bad-ink text-xs px-2 py-0.5 rounded">
                  {profile.treatyLabel}
                </span>
              )}
            </div>

            {/* Next step */}
            <div className="flex items-center gap-1.5 text-sm font-medium text-tint-ink">
              <span>→</span>
              <span>{profile.next}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        disabled={Boolean(reduceMotion)}
        className="mt-4 text-xs text-muted hover:text-body"
        aria-pressed={Boolean(paused || reduceMotion)}
      >
        {reduceMotion ? 'Animations reduced' : paused ? 'Play examples' : 'Pause examples'}
      </button>
      {/* Progress dots */}
      <div className="mt-5 flex justify-center gap-1.5">
        {PROFILES.map((_, i) => (
          <button
            key={i}
            aria-label={`Show ${PROFILES[i].country} example`}
            aria-pressed={i === activeIndex}
            type="button"
            onClick={() => goTo(i)}
            className="motion-button flex h-11 w-11 items-center justify-center rounded-full"
          >
            <span
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-5 bg-tint' : 'w-1.5 bg-line'
              }`}
            />
          </button>
        ))}
      </div>
    </InteractiveSurface>
  )
}

// ── A look at the app, drawn in the page ───────────────────────────────────
// Decorative: a still of the Home screen so visitors see what they get before
// they sign in. It tilts upright as it scrolls into view.

// Older browsers without IntersectionObserver get the finished drawing.
const canObserve = typeof IntersectionObserver !== 'undefined'

function AppPreview() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const eased = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })
  const rotateX = useTransform(eased, [0, 1], [reduced ? 0 : 22, 0])
  const scale = useTransform(eased, [0, 1], [reduced ? 1 : 0.92, 1])
  const y = useTransform(eased, [0, 1], [reduced ? 0 : 40, 0])
  const steps = [
    ['Check your tax status', 'Likely nonresident alien', 'done'],
    ['Prepare Form 8843', 'In progress · 3 of 5 sections', 'current'],
    ['Gather your documents', '3 of 8 items done', 'todo'],
  ]
  return (
    <div ref={ref} aria-hidden="true" className="mx-auto w-full max-w-[340px] [perspective:1400px]">
      <motion.div
        style={{ rotateX, scale, y }}
        className="origin-bottom rounded-[46px] border border-line-strong bg-bg p-2.5 shadow-float"
      >
        <div className="overflow-hidden rounded-[36px] bg-bg">
          <div className="px-4 pb-3 pt-6">
            <p className="text-[11px] font-medium text-ink-3">Tax year {TAX_YEAR}</p>
            <p className="text-[26px] font-bold leading-tight text-ink">Hi, Ana</p>
            <div className="hero-surface mt-3 rounded-[26px] p-4">
              <div className="flex items-center gap-3">
                <svg width="46" height="46" viewBox="0 0 46 46" className="-rotate-90">
                  <circle
                    cx="23"
                    cy="23"
                    r="19"
                    fill="none"
                    strokeWidth="5"
                    className="stroke-white/25"
                  />
                  <motion.circle
                    cx="23"
                    cy="23"
                    r="19"
                    fill="none"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="stroke-white"
                    initial={{ pathLength: canObserve ? 0 : 0.5 }}
                    {...(canObserve
                      ? { whileInView: { pathLength: 0.5 }, viewport: { once: true } }
                      : {})}
                    transition={{
                      duration: reduced ? 0 : 1.1,
                      delay: 0.3,
                      ease: [0.32, 0.72, 0, 1],
                    }}
                  />
                </svg>
                <div>
                  <p className="text-[11px] font-medium text-white/80">Your next step</p>
                  <p className="text-[17px] font-bold leading-tight">Finish Form 8843</p>
                </div>
              </div>
              <div className="mt-3 flex h-10 items-center justify-center rounded-xl bg-white text-[13px] font-semibold text-[rgb(24,64,180)]">
                Continue Form 8843
              </div>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-[20px] border border-line bg-surface p-3">
                <IconTile icon={CalendarDays} tone="amber" size="sm" />
                <p className="mt-2 text-xl font-bold leading-none text-ink">
                  214<span className="ml-1 text-[11px] font-semibold text-ink-3">days</span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink-3">until June 15, 2027</p>
              </div>
              <div className="rounded-[20px] border border-line bg-surface p-3">
                <IconTile icon={FolderCheck} tone="green" size="sm" />
                <p className="mt-2 text-xl font-bold leading-none text-ink">
                  3<span className="text-ink-3">/8</span>
                </p>
                <p className="mt-0.5 text-[11px] text-ink-3">documents ready</p>
              </div>
            </div>
            <div className="mt-2.5 overflow-hidden rounded-[20px] border border-line bg-surface">
              {steps.map(([title, detail, state], index) => (
                <div
                  key={title}
                  className={`flex items-center gap-2.5 px-3 py-2.5 ${index ? 'border-t border-line' : ''}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      state === 'done'
                        ? 'bg-tint text-white'
                        : state === 'current'
                          ? 'bg-tint/20 text-tint-ink ring-2 ring-tint'
                          : 'bg-surface-3 text-ink-2'
                    }`}
                  >
                    {state === 'done' ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {title}
                    </span>
                    <span
                      className={`block truncate text-[11px] ${state === 'current' ? 'text-tint-ink' : 'text-ink-3'}`}
                    >
                      {detail}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="material grid grid-cols-4 border-t border-line/70 px-2 pb-3 pt-2">
            {[
              [Home, 'Home', true],
              [ClipboardCheck, 'My Taxes'],
              [FileText, 'Form 8843'],
              [MessageSquare, 'Ask AI'],
            ].map(([Icon, label, active]) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-0.5 text-[9px] ${active ? 'font-semibold text-tint-ink' : 'text-ink-3'}`}
              >
                <span
                  className={`flex h-6 w-10 items-center justify-center rounded-full ${active ? 'bg-tint/15' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheck,
    tone: 'blue',
    title: 'Know what to file',
    body: 'Answer 5 questions and see the forms that apply to your visa, income and country.',
  },
  {
    icon: Globe2,
    tone: 'teal',
    title: 'Check treaty benefits',
    body: 'See whether your country has a reviewed tax treaty entry, and what to verify with the IRS.',
  },
  {
    icon: FileText,
    tone: 'violet',
    title: 'Prepare Form 8843',
    body: 'Fill it in step by step with a live preview. It is filled on your device, not on our servers.',
  },
  {
    icon: Sparkles,
    tone: 'amber',
    title: 'Ask along the way',
    body: 'An assistant that starts from your status and points to the IRS page behind each answer.',
  },
]

const cta =
  'press inline-flex min-h-[52px] items-center justify-center rounded-full px-7 text-[17px] font-semibold'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg text-ink-2">
      <Navbar />
      <DisclaimerBanner />

      <main>
        {/* Hero: one statement, one action, then the product itself. */}
        <section className="relative overflow-hidden">
          <div className="aurora" />
          <Sequence className="relative mx-auto max-w-3xl px-5 pb-12 pt-16 text-center sm:pt-24">
            <SequenceItem>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-[13px] font-medium text-ink-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                {FILING_YEAR} filing season, for {TAX_YEAR} income
              </p>
            </SequenceItem>
            <SequenceItem>
              <h1 className="mt-6 text-[44px] font-bold leading-[1.04] tracking-[-0.03em] text-ink sm:text-[68px]">
                Answer 5 questions.
                <br />
                Get your exact tax forms.
              </h1>
            </SequenceItem>
            <SequenceItem>
              <p className="mx-auto mt-5 max-w-xl text-[19px] leading-relaxed text-ink-3">
                Free tax guidance built for F-1 international students. No SSN needed to start.
              </p>
            </SequenceItem>
            <SequenceItem className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                to="/status-checker"
                className={`${cta} bg-tint text-white hover:bg-tint-hover`}
              >
                Start free checkup
              </Link>
              <Link
                to="/form-8843"
                className={`${cta} border border-line bg-surface text-ink hover:bg-surface-2`}
              >
                Prepare Form 8843
              </Link>
            </SequenceItem>
            <SequenceItem>
              <Link
                to={user ? '/home' : '/login'}
                className="mt-5 inline-flex min-h-11 items-center text-[15px] font-medium text-tint-ink hover:text-tint-ink-strong"
              >
                {user ? 'Open my app' : 'Already started? Sign in'}
              </Link>
            </SequenceItem>
          </Sequence>
          <div className="relative px-5 pb-20">
            <AppPreview />
          </div>
        </section>

        {/* What it does */}
        <Reveal id="features" className="mx-auto max-w-5xl scroll-mt-20 px-5 pb-24">
          <h2 className="max-w-xl text-[32px] font-bold leading-tight text-ink sm:text-[40px]">
            Everything between “do I even file?” and the mailbox.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon, tone, title, body }) => (
              <div key={title} className="rounded-4xl border border-line bg-surface p-6 sm:p-7">
                <IconTile icon={icon} tone={tone} size="lg" />
                <h3 className="mt-5 text-[22px] font-bold text-ink">{title}</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-3">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Worked examples */}
        <Reveal className="mx-auto max-w-5xl px-5 pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-[32px] font-bold leading-tight text-ink sm:text-[40px]">
                Your country changes the answer.
              </h2>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-3">
                Two students with the same visa can have different forms and treaty rules. These
                examples show what a checkup looks like for three of them.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <TaxCheckupCard />
            </div>
          </div>
        </Reveal>

        {/* Closing action */}
        <Reveal className="mx-auto max-w-5xl px-5 pb-24">
          <div className="hero-surface flex flex-col items-start justify-between gap-6 rounded-4xl p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="text-[28px] font-bold leading-tight sm:text-[34px]">
                Built for F-1 students. Free.
              </h2>
              <p className="mt-2 text-[17px] text-white/85">
                No subscription, no card, no hidden fees.
              </p>
            </div>
            <Link
              to="/form-8843"
              className={`${cta} shrink-0 bg-white text-[rgb(24,64,180)] hover:bg-white/90`}
            >
              Get my Form 8843
            </Link>
          </div>
        </Reveal>
      </main>

      <footer className="border-t border-line px-5 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <BrandMark />
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {[
              ['/about', 'About'],
              ['/privacy', 'Privacy'],
              ['/terms', 'Terms'],
              ['/disclaimer', 'Disclaimer'],
              ['/contact', 'Contact'],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className="text-[13px] text-ink-3 transition-colors hover:text-ink"
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="max-w-md text-[13px] leading-relaxed text-ink-4">
            F1 Tax Helper provides general educational information only. Not tax, legal, or
            financial advice. © 2026 F1 Tax Helper.
          </p>
        </div>
      </footer>
    </div>
  )
}
