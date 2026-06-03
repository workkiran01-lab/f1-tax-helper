import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { Navbar } from '../components/Navbar'

// ── Animated checkup card data ──────────────────────────────────────────────

const PROFILES = [
  {
    country: 'Nepal', flag: '🇳🇵', visa: 'F-1', years: 2,
    checks: ['Form 8843 Required', 'Nonresident Alien', 'No SSN Required'],
    treatyStatus: 'none',
    treatyLabel: 'No treaty found',
    next: 'Generate Form 8843',
  },
  {
    country: 'India', flag: '🇮🇳', visa: 'F-1', years: 1,
    checks: ['Form 8843 Required', 'Nonresident Alien', 'Standard deduction eligible'],
    treatyStatus: 'active',
    treatyLabel: 'Active — Article 21(2)',
    next: 'File Form 8833',
  },
  {
    country: 'China', flag: '🇨🇳', visa: 'F-1', years: 3,
    checks: ['Form 8843 Required', 'Nonresident Alien', 'Wage exemption up to $5,000'],
    treatyStatus: 'active',
    treatyLabel: 'Active — Article 20(c)',
    next: 'File Form 8833',
  },
]

// ── Features section data ───────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Know what to file',
    desc: 'Answer 5 questions and get your exact required forms.',
    mockup: (
      <div className="rounded-lg border border-[#1e293b] bg-[#080c14] p-4 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#22c55e]">✓</span>
          <span className="text-[#cbd5e1]">Form 8843 Required</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Detect your treaty benefits',
    desc: 'We check 50+ countries against IRS Pub 901 automatically.',
    mockup: (
      <div className="rounded-lg border border-[#1e293b] bg-[#080c14] p-4 font-mono text-xs space-y-1.5">
        <div className="text-[#cbd5e1]">India 🇮🇳</div>
        <div className="text-[#22c55e]">Treaty Active · Article 21(2)</div>
      </div>
    ),
  },
  {
    title: 'Generate Form 8843 free',
    desc: 'Fill, preview, and download in minutes. No login required.',
    mockup: (
      <div className="rounded-lg border border-[#1e293b] bg-[#080c14] p-4 font-mono text-xs space-y-1.5">
        <div className="flex gap-3">
          <span className="text-[#475569] w-14 shrink-0">Name</span>
          <span className="text-[#cbd5e1]">Kiran Shahi</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[#475569] w-14 shrink-0">Country</span>
          <span className="text-[#cbd5e1]">Nepal</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[#475569] w-14 shrink-0">Visa</span>
          <span className="text-[#cbd5e1]">F-1</span>
        </div>
      </div>
    ),
  },
]

// ── Animated card component ─────────────────────────────────────────────────

function TaxCheckupCard() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % PROFILES.length)
        setVisible(true)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  function goTo(i) {
    setVisible(false)
    setTimeout(() => { setActiveIndex(i); setVisible(true) }, 150)
  }

  const profile = PROFILES[activeIndex]

  return (
    <div className="card-base w-full max-w-sm p-6 bg-[#0d1117] border-[#2d4a6e]">
      <div className="mb-4 font-mono text-xs uppercase tracking-widest text-[#475569]">
        F-1 Tax Checkup
      </div>

      <div style={{ transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }} className="space-y-4">

        {/* Profile meta */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Country', value: `${profile.country} ${profile.flag}` },
            { label: 'Visa',    value: profile.visa },
            { label: 'Years',   value: String(profile.years) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-[#475569]">{label}</div>
              <div className="text-xs text-[#f8fafc]">{value}</div>
            </div>
          ))}
        </div>

        {/* Checkmarks */}
        <div className="space-y-1.5">
          {profile.checks.map((check) => (
            <div key={check} className="flex items-center gap-2 text-xs">
              <span className="text-[#22c55e]">✓</span>
              <span className="text-[#cbd5e1]">{check}</span>
            </div>
          ))}
        </div>

        {/* Treaty row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium uppercase tracking-widest text-[#64748b]">Treaty</span>
          <span className={profile.treatyStatus === 'active' ? 'badge-success' : 'badge-warning'}>
            {profile.treatyLabel}
          </span>
        </div>

        {/* Next step */}
        <div className="flex items-center gap-1.5 text-sm text-[#3b82f6]">
          <span>→</span>
          <span>{profile.next}</span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="mt-5 flex justify-center gap-1.5">
        {PROFILES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-4 bg-[#3b82f6]' : 'w-1.5 bg-[#1e293b] hover:bg-[#2d4a6e]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

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
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-[#cbd5e1]">
      <Navbar />
      <DisclaimerBanner />

      <main>

        {/* ── HERO ── */}
        <section className="bg-grid relative border-b border-[#1e293b]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-center">

              {/* Left — 55% */}
              <div className="flex-[55] space-y-6">
                <span className="font-mono text-xs tracking-widest text-[#64748b]">
                  IRS TAX YEAR 2025
                </span>

                <h1 className="text-2xl font-semibold leading-tight text-[#f8fafc] sm:text-4xl lg:text-5xl">
                  Answer 5 questions.<br />
                  Get your required tax forms.
                </h1>

                <p className="max-w-md text-sm leading-6 text-[#64748b]">
                  Free tax guidance built for F-1 international students.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/status-checker" className="btn-primary">
                    Start Free Checkup →
                  </Link>
                  <Link to="/form-8843" className="btn-ghost">
                    Generate Form 8843
                  </Link>
                </div>

                <p className="flex flex-wrap gap-2 text-xs text-[#475569]">
                  <span>No SSN required</span>
                  <span>·</span>
                  <span>Based on IRS guidance</span>
                  <span>·</span>
                  <span>Free forever</span>
                </p>
              </div>

              {/* Right — 45%, desktop only */}
              <div className="hidden flex-[45] items-center justify-end lg:flex">
                <TaxCheckupCard />
              </div>

            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">

            <div className="mb-10 font-mono text-xs uppercase tracking-widest text-[#475569]">
              What It Does
            </div>

            <div className="divide-y divide-[#1e293b]">
              {FEATURES.map((feat) => (
                <div
                  key={feat.title}
                  className="flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="sm:w-1/2">
                    <h3 className="text-base font-semibold text-[#f8fafc]">{feat.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#64748b]">{feat.desc}</p>
                  </div>
                  <div className="sm:w-5/12">{feat.mockup}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1e293b] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/privacy"     className="text-xs text-[#475569] transition-colors hover:text-[#cbd5e1]">Privacy Policy</Link>
            <Link to="/terms"       className="text-xs text-[#475569] transition-colors hover:text-[#cbd5e1]">Terms of Service</Link>
            <Link to="/disclaimer"  className="text-xs text-[#475569] transition-colors hover:text-[#cbd5e1]">Disclaimer</Link>
            <Link to="/contact"     className="text-xs text-[#475569] transition-colors hover:text-[#cbd5e1]">Contact</Link>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-[#475569]">
            F1 Tax Helper provides general educational information only. Not tax, legal, or financial advice.
          </p>
          <p className="mt-2 text-center text-xs text-[#475569]">
            © 2026 F1 Tax Helper. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
