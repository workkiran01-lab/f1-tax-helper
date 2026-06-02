import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'
import DisclaimerBanner from '../components/DisclaimerBanner'

const TRUST_CARDS = [
  { icon: '🛡️', title: 'Built for F-1 student situations', description: 'We never ask for SSN or immigration documents.' },
  { icon: '✅', title: 'Based on IRS guidance for international students', description: 'References official IRS forms and publications where possible.' },
  { icon: '📋', title: 'Designed with accuracy in mind', description: 'Plain explanations with reminders to verify before filing.' },
  { icon: '💰', title: 'Save $200+', description: 'CPAs charge $200–400 for F-1 filings. F1 Tax Helper is completely free.' },
]

const STEPS = [
  { number: '01', title: 'Answer 5 Questions', description: 'Tell us about your F-1 status, income sources, and situation.' },
  { number: '02', title: 'Get Your Checklist', description: 'Receive a personalized list of exactly which forms you need.' },
  { number: '03', title: 'Download Free', description: 'Get your completed Form 8843 instantly — no login required.' },
]

const TRUST_BADGES = [
  '🔒 No SSN Required',
  '📄 Based on IRS Guidance',
  '⚡ Free to Start',
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
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

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
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

      <DisclaimerBanner />

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/90">
            Free for F-1 Students ✦
          </span>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 mx-auto max-w-2xl rounded-full bg-gradient-to-r from-blue-600/20 to-violet-600/20 blur-3xl" />
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Understand Your Tax Obligations
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent [filter:drop-shadow(0_0_24px_rgba(139,92,246,0.35))]">
                as an F-1 Student
              </span>
            </h1>
          </div>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            A free tax tool built specifically for F-1 international students.
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

        {/* ── FREE NOTICE ── */}
        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-6 py-8 text-center backdrop-blur-xl">
            <p className="text-lg font-semibold text-blue-200">
              F1 Tax Helper is completely free for all F-1 students.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              No subscriptions, no hidden fees, no credit card required — ever.
            </p>
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
            <Link to="/contact" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
              Contact
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
