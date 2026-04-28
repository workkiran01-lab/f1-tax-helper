import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

const TRUST_CARDS = [
  { icon: '🛡️', title: 'Visa Safe', description: 'We never ask for SSN or immigration documents.' },
  { icon: '✅', title: 'IRS Compliant', description: 'Forms match official IRS specifications exactly.' },
  { icon: '📋', title: 'No Audit Risk', description: 'Plain explanations, no guessing — just accurate guidance.' },
  { icon: '💰', title: 'Save $200+', description: 'CPAs charge $200–400. We start at free.' },
]

const STEPS = [
  { number: '01', title: 'Answer 5 Questions', description: 'Tell us about your F-1 status, income sources, and situation.' },
  { number: '02', title: 'Get Your Checklist', description: 'Receive a personalized list of exactly which forms you need.' },
  { number: '03', title: 'Download Free', description: 'Get your completed Form 8843 instantly — no login required.' },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started with no commitment.',
    features: ['Form 8843 download', 'F-1 status checker'],
    cta: 'Get Started Free',
    ctaTo: '/form-8843',
    popular: false,
    comingSoon: false,
    note: null,
  },
  {
    name: 'Student',
    price: '$29',
    description: 'Everything most F-1 students need.',
    features: ['1040-NR preparation', 'Form 8843 download', 'Treaty benefits check', 'AI chat assistant'],
    cta: 'Join Waitlist →',
    popular: true,
    comingSoon: true,
    note: '* 1040-NR requires SSN/ITIN. We generate a draft for you to review with a tax professional.',
  },
  {
    name: 'Premium',
    price: '$49',
    description: 'For complex situations and past years.',
    features: ['Everything in Student', 'State tax return', 'Prior year filing', 'Audit defense guide'],
    cta: 'Join Waitlist →',
    popular: false,
    comingSoon: true,
    note: '* State returns vary by state requirements.',
  },
]

const TRUST_BADGES = [
  '🔒 No SSN Required',
  '📄 IRS Compliant',
  '⚡ Free to Start',
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistVisa, setWaitlistVisa] = useState('')
  const [waitlistSchool, setWaitlistSchool] = useState('')
  const [waitlistJoined, setWaitlistJoined] = useState(false)

  useEffect(() => {
    let isMounted = true
    const redirectIfAuthenticated = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return
      if (session?.user) navigate('/welcome', { replace: true })
    }
    redirectIfAuthenticated()
    return () => { isMounted = false }
  }, [navigate])

  const handleWaitlist = (e) => {
    e.preventDefault()
    const trimmed = waitlistEmail.trim()
    if (!trimmed) return
    try { localStorage.setItem('waitlist_email', trimmed) } catch {}
    if (waitlistVisa)   try { localStorage.setItem('waitlist_visa',   waitlistVisa) } catch {}
    if (waitlistSchool) try { localStorage.setItem('waitlist_school', waitlistSchool.trim()) } catch {}
    setWaitlistJoined(true)
  }

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToWaitlist = () => {
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/90">
            Free for F-1 Students ✦
          </span>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 mx-auto max-w-2xl rounded-full bg-gradient-to-r from-blue-600/20 to-violet-600/20 blur-3xl" />
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              U.S. Taxes Shouldn't Cost
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent [filter:drop-shadow(0_0_24px_rgba(139,92,246,0.35))]">
                You Your Visa
              </span>
            </h1>
          </div>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            The only tax tool built specifically for F-1 international students.
            Start with a free Form 8843 — no login, no SSN required.
          </p>

          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Link
              to="/form-8843"
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 sm:w-auto"
            >
              Get My Free Form 8843 →
            </Link>
            <Link
              to="/status-checker"
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10 sm:w-auto"
            >
              Check My Status →
            </Link>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="w-full rounded-2xl border border-white/10 bg-transparent px-7 py-3.5 text-sm font-medium text-slate-400 transition-all duration-300 hover:text-slate-200 sm:w-auto"
            >
              See How It Works ↓
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs text-slate-400"
              >
                {badge}
              </span>
            ))}
          </div>
        </section>

        {/* ── FEAR / TRUST CARDS ── */}
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TRUST_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="mb-2 text-xl">{card.icon}</div>
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
              >
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+2.5rem)] top-6 hidden h-px w-[calc(100%-3rem)] bg-gradient-to-r from-white/25 to-transparent sm:block" />
                )}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-extrabold text-blue-300">
                  {step.number}
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING + WAITLIST ── */}
        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <h2 className="mb-2 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Simple Pricing
          </h2>
          <p className="mb-10 text-center text-sm text-slate-400">
            Free tier available now. Paid plans launching soon — join the waitlist for early access.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-xl ${
                  plan.popular
                    ? 'border-violet-500/40 bg-gradient-to-b from-blue-500/10 to-violet-500/10 shadow-lg shadow-violet-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-0.5 text-xs font-semibold text-white shadow-md">
                    Most Popular
                  </span>
                )}
                <div className="mb-4">
                  {plan.comingSoon && (
                    <span className="mb-2 inline-block rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                      Coming Soon
                    </span>
                  )}
                  <p className="text-sm font-medium text-slate-400">{plan.name}</p>
                  <p className="mt-1 text-3xl font-extrabold text-white">{plan.price}</p>
                  <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                </div>
                <ul className="mb-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-blue-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.note && (
                  <p className="mb-4 text-[11px] italic leading-4 text-slate-500">{plan.note}</p>
                )}
                {plan.comingSoon ? (
                  <button
                    type="button"
                    onClick={scrollToWaitlist}
                    className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30'
                        : 'border border-white/20 bg-white/5 text-slate-100 hover:bg-white/10'
                    }`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    to={plan.ctaTo}
                    className="block w-full rounded-xl border border-white/20 bg-white/5 py-2.5 text-center text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-white/10"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* ── WAITLIST (merged into pricing) ── */}
          <div id="waitlist" className="mt-10 scroll-mt-20 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/20 to-violet-500/20 px-6 py-10 text-center backdrop-blur-xl sm:px-12">
            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
              Early Access Waitlist
            </p>
            <h3 className="mt-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Be First When Paid Plans Launch
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Join the waitlist for early access and a launch discount on Student and Premium plans.
            </p>
            {waitlistJoined ? (
              <p className="mt-6 text-sm font-medium text-green-400">
                ✓ You're on the list! We'll notify you when paid plans launch.
              </p>
            ) : (
              <form
                onSubmit={handleWaitlist}
                className="mt-6 flex w-full flex-col items-center gap-3 sm:mx-auto sm:max-w-md"
              >
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
                />
                <select
                  value={waitlistVisa}
                  onChange={(e) => setWaitlistVisa(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#0f172a] px-4 py-2.5 text-sm text-slate-100 focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="" disabled>Visa Type (optional)</option>
                  <option value="F-1">F-1</option>
                  <option value="J-1">J-1</option>
                  <option value="OPT">OPT</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  value={waitlistSchool}
                  onChange={(e) => setWaitlistSchool(e.target.value)}
                  placeholder="School Name (optional)"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
                >
                  Join Waitlist
                </button>
                <p className="text-xs text-slate-500">No spam, ever. Unsubscribe anytime.</p>
              </form>
            )}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-900/50 px-4 py-8 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/privacy" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Terms of Service
            </Link>
            <Link to="/disclaimer" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Disclaimer
            </Link>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-600">
            F1 Tax Helper provides general educational information only. Not tax, legal, or financial advice.
          </p>
          <p className="mt-2 text-center text-xs text-slate-600">
            © 2026 F1 Tax Helper. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
