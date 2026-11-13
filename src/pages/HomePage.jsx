import Reveal from '../components/Reveal'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AnimatedCheck, InteractiveSurface, Stagger, StaggerItem } from '../components/Motion'
import SeasonNotice from '../components/SeasonNotice'
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
      className="overflow-hidden rounded-xl border border-line-strong bg-chrome p-6 shadow-xl shadow-tint/5 w-full max-w-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (event.target.matches(':focus-visible')) setPaused(true)
      }}
      role="region"
      aria-label="Example tax checkups"
      aria-roledescription="carousel"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tint/50 to-transparent rounded-t-xl" />

      <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-tint-ink">
        F-1 Tax Checkup · Example
      </div>

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
                  <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-ink-5">
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-ink">{value}</div>
                </div>
              ))}
            </div>

            {/* Checkmarks */}
            <div className="space-y-1.5">
              {profile.checks.map((check) => (
                <div key={check} className="flex items-center gap-2 text-sm text-ink-2">
                  <AnimatedCheck className="h-4 w-4 shrink-0 text-ok" />
                  <span>{check}</span>
                </div>
              ))}
            </div>

            {/* Treaty row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-5">
                Treaty
              </span>
              {profile.treatyStatus === 'active' ? (
                <span className="border border-ok/30 bg-ok/10 text-ok text-xs font-mono px-2 py-0.5 rounded">
                  {profile.treatyLabel}
                </span>
              ) : (
                <span className="border border-bad/30 bg-bad/10 text-bad text-xs font-mono px-2 py-0.5 rounded">
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-bg text-ink-2">
      <Navbar />
      <DisclaimerBanner />
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <SeasonNotice />
      </div>

      <main>
        {/* ── HERO ── */}
        <Reveal className="bg-grid relative overflow-hidden border-b border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
              {/* Left — 55% */}
              <Stagger className="flex-[55] space-y-6">
                <StaggerItem>
                  <span className="font-mono text-xs tracking-widest text-ink-4">
                    {FILING_YEAR} FILING SEASON · {TAX_YEAR} INCOME
                  </span>
                </StaggerItem>
                <StaggerItem>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-ink max-w-2xl">
                    Answer 5 questions.
                    <br />
                    Get your exact tax forms.
                  </h1>
                </StaggerItem>
                <StaggerItem>
                  <p className="max-w-md text-sm leading-6 text-ink-4">
                    Free tax guidance built for F-1 international students.
                  </p>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to="/status-checker" className="btn-primary">
                      Start Free Checkup →
                    </Link>
                    <Link to="/form-8843" className="btn-ghost">
                      Generate Form 8843
                    </Link>
                    <Link
                      to={user ? '/home' : '/login'}
                      className="w-full sm:w-auto rounded-xl border border-line bg-transparent px-7 py-3.5 text-sm font-medium text-ink-4 transition-colors hover:border-line-strong hover:text-ink"
                    >
                      {user ? 'Open my app →' : 'Sign In →'}
                    </Link>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <p className="flex flex-wrap gap-2 text-xs text-ink-5">
                    <span>No SSN required</span>
                    <span>·</span>
                    <span>Based on IRS guidance</span>
                    <span>·</span>
                    <span>Free forever</span>
                  </p>
                </StaggerItem>
              </Stagger>

              {/* Right — 45%, desktop only */}
              <div className="hidden max-w-full flex-[45] items-center justify-end lg:flex">
                <TaxCheckupCard />
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── STATS ROW ── */}
        <Reveal className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-line bg-surface p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-ink font-mono">8843</p>
              <p className="text-xs text-ink-5 mt-1">Free form generation</p>
            </div>
            <div className="text-center border-x border-line">
              <p className="text-2xl font-bold text-ink font-mono">50+</p>
              <p className="text-xs text-ink-5 mt-1">Countries checked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-ink font-mono">$0</p>
              <p className="text-xs text-ink-5 mt-1">Always free</p>
            </div>
          </div>
        </Reveal>

        {/* ── FEATURES ── */}
        <Reveal id="features" className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-5 mb-10">
            What it does
          </p>

          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Card 1 */}
            <StaggerItem>
              <InteractiveSurface className="h-full rounded-xl border border-line bg-surface p-6 flex flex-col gap-4 hover:border-line-strong transition-colors">
                <div className="font-mono text-[10px] uppercase tracking-widest text-tint-ink">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-1">Know what to file</h3>
                  <p className="text-xs text-ink-4 leading-relaxed">
                    Answer 5 questions. Get your exact required forms based on your visa, income,
                    and country.
                  </p>
                </div>
                <div className="mt-auto rounded-lg border border-line bg-bg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-ok text-xs">✓</span>
                    <span className="text-xs text-ink-2">Form 8843 Required</span>
                    <span className="ml-auto text-[10px] font-mono text-bad border border-bad/20 bg-bad/5 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ok text-xs">✓</span>
                    <span className="text-xs text-ink-2">Nonresident Alien status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ok text-xs">✓</span>
                    <span className="text-xs text-ink-2">No SSN required</span>
                  </div>
                </div>
              </InteractiveSurface>
            </StaggerItem>

            {/* Card 2 */}
            <StaggerItem>
              <InteractiveSurface className="h-full rounded-xl border border-line bg-surface p-6 flex flex-col gap-4 hover:border-line-strong transition-colors">
                <div className="font-mono text-[10px] uppercase tracking-widest text-tint-ink">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-1">
                    Detect treaty benefits
                  </h3>
                  <p className="text-xs text-ink-4 leading-relaxed">
                    We check 50+ countries against IRS Pub 901. Find out if your country has an
                    active tax treaty.
                  </p>
                </div>
                <div className="mt-auto rounded-lg border border-line bg-bg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-ink-2">India 🇮🇳</span>
                    <span className="text-[10px] font-mono border border-ok/30 bg-ok/10 text-ok px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-5 font-mono">
                    Article 21(2) · Standard deduction may apply
                  </p>
                  <div className="border-t border-line pt-2 flex items-center justify-between">
                    <span className="text-xs font-mono text-ink-2">Nepal 🇳🇵</span>
                    <span className="text-[10px] font-mono border border-ink-5/30 bg-ink-5/10 text-ink-5 px-1.5 py-0.5 rounded">
                      No treaty
                    </span>
                  </div>
                </div>
              </InteractiveSurface>
            </StaggerItem>

            {/* Card 3 */}
            <StaggerItem>
              <InteractiveSurface className="h-full rounded-xl border border-line bg-surface p-6 flex flex-col gap-4 hover:border-line-strong transition-colors">
                <div className="font-mono text-[10px] uppercase tracking-widest text-tint-ink">
                  03
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-1">
                    Generate Form 8843 free
                  </h3>
                  <p className="text-xs text-ink-4 leading-relaxed">
                    Fill, download, and file in minutes. No login required. Nothing stored on our
                    servers.
                  </p>
                </div>
                <div className="mt-auto rounded-lg border border-line bg-bg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ink-5">
                      Name
                    </span>
                    <span className="text-xs text-ink-2 font-mono">Kiran Shahi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ink-5">
                      Visa
                    </span>
                    <span className="text-xs text-ink-2 font-mono">F-1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ink-5">
                      Status
                    </span>
                    <span className="text-[10px] font-mono border border-ok/30 bg-ok/10 text-ok px-1.5 py-0.5 rounded">
                      Ready to download
                    </span>
                  </div>
                </div>
              </InteractiveSurface>
            </StaggerItem>
          </Stagger>
        </Reveal>

        {/* ── FREE NOTICE ── */}
        <Reveal className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <div className="rounded-xl border border-line bg-surface p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-base font-semibold text-ink">
                Built for F-1 students. Free forever.
              </p>
              <p className="text-sm text-ink-4 mt-1">
                No subscriptions. No hidden fees. No credit card required.
              </p>
            </div>
            <Link
              to="/form-8843"
              className="shrink-0 rounded-xl bg-tint px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-tint active:scale-[0.98]"
            >
              Get My Free Form 8843 →
            </Link>
          </div>
        </Reveal>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-bg border-t border-line px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              to="/privacy"
              className="text-xs text-ink-5 transition-colors hover:text-ink-4"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-ink-5 transition-colors hover:text-ink-4"
            >
              Terms of Service
            </Link>
            <Link
              to="/disclaimer"
              className="text-xs text-ink-5 transition-colors hover:text-ink-4"
            >
              Disclaimer
            </Link>
            <Link
              to="/contact"
              className="text-xs text-ink-5 transition-colors hover:text-ink-4"
            >
              Contact
            </Link>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-ink-5">
            F1 Tax Helper provides general educational information only. Not tax, legal, or
            financial advice.
          </p>
          <p className="mt-2 text-center text-xs font-mono text-ink-5">
            © 2026 F1 Tax Helper. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
