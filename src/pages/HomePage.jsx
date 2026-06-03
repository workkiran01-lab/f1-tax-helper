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
    <div className="relative overflow-hidden rounded-xl border border-[#2d4a6e] bg-[#0d1117] p-6 shadow-xl shadow-[#3b82f6]/5 w-full max-w-sm">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/50 to-transparent rounded-t-xl" />

      <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#3b82f6]">
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
              <div className="text-sm font-semibold text-[#f8fafc]">{value}</div>
            </div>
          ))}
        </div>

        {/* Checkmarks */}
        <div className="space-y-1.5">
          {profile.checks.map((check) => (
            <div key={check} className="flex items-center gap-2 text-sm text-[#cbd5e1]">
              <span className="text-[#22c55e] text-xs">✓</span>
              <span>{check}</span>
            </div>
          ))}
        </div>

        {/* Treaty row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#475569]">Treaty</span>
          {profile.treatyStatus === 'active' ? (
            <span className="border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] text-xs font-mono px-2 py-0.5 rounded">
              {profile.treatyLabel}
            </span>
          ) : (
            <span className="border border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] text-xs font-mono px-2 py-0.5 rounded">
              {profile.treatyLabel}
            </span>
          )}
        </div>

        {/* Next step */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#3b82f6]">
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
            className={`h-1 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-4 bg-[#3b82f6]' : 'w-1 bg-[#1e293b] hover:bg-[#2d4a6e]'
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
        <section className="bg-grid relative overflow-hidden border-b border-[#1e293b]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-center">

              {/* Left — 55% */}
              <div className="flex-[55] space-y-6">
                <span className="font-mono text-xs tracking-widest text-[#64748b]">
                  IRS TAX YEAR 2025
                </span>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-[#f8fafc] max-w-2xl">
                  Answer 5 questions.<br />
                  Get your exact tax forms.
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
                  <Link
                    to="/login"
                    className="w-full sm:w-auto rounded-xl border border-[#1e293b] bg-transparent px-7 py-3.5 text-sm font-medium text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
                  >
                    Sign In →
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
              <div className="hidden max-w-full flex-[45] items-center justify-end lg:flex">
                <TaxCheckupCard />
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS ROW ── */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-[#1e293b] bg-[#0f1629] p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#f8fafc] font-mono">8843</p>
              <p className="text-xs text-[#475569] mt-1">Free form generation</p>
            </div>
            <div className="text-center border-x border-[#1e293b]">
              <p className="text-2xl font-bold text-[#f8fafc] font-mono">50+</p>
              <p className="text-xs text-[#475569] mt-1">Countries checked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#f8fafc] font-mono">$0</p>
              <p className="text-xs text-[#475569] mt-1">Always free</p>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-10">What it does</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* Card 1 */}
            <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-6 flex flex-col gap-4 hover:border-[#2d4a6e] transition-colors">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#3b82f6]">01</div>
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc] mb-1">Know what to file</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Answer 5 questions. Get your exact required forms based on your visa, income, and country.
                </p>
              </div>
              <div className="mt-auto rounded-lg border border-[#1e293b] bg-[#080c14] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#22c55e] text-xs">✓</span>
                  <span className="text-xs text-[#cbd5e1]">Form 8843 Required</span>
                  <span className="ml-auto text-[10px] font-mono text-[#ef4444] border border-[#ef4444]/20 bg-[#ef4444]/5 px-1.5 py-0.5 rounded">Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#22c55e] text-xs">✓</span>
                  <span className="text-xs text-[#cbd5e1]">Nonresident Alien status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#22c55e] text-xs">✓</span>
                  <span className="text-xs text-[#cbd5e1]">No SSN required</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-6 flex flex-col gap-4 hover:border-[#2d4a6e] transition-colors">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#3b82f6]">02</div>
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc] mb-1">Detect treaty benefits</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  We check 50+ countries against IRS Pub 901. Find out if your country has an active tax treaty.
                </p>
              </div>
              <div className="mt-auto rounded-lg border border-[#1e293b] bg-[#080c14] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#cbd5e1]">India 🇮🇳</span>
                  <span className="text-[10px] font-mono border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-[10px] text-[#475569] font-mono">Article 21(2) · Standard deduction eligible</p>
                <div className="border-t border-[#1e293b] pt-2 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#cbd5e1]">Nepal 🇳🇵</span>
                  <span className="text-[10px] font-mono border border-[#475569]/30 bg-[#475569]/10 text-[#475569] px-1.5 py-0.5 rounded">No treaty</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-6 flex flex-col gap-4 hover:border-[#2d4a6e] transition-colors">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#3b82f6]">03</div>
              <div>
                <h3 className="text-sm font-semibold text-[#f8fafc] mb-1">Generate Form 8843 free</h3>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Fill, download, and file in minutes. No login required. Nothing stored on our servers.
                </p>
              </div>
              <div className="mt-auto rounded-lg border border-[#1e293b] bg-[#080c14] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#475569]">Name</span>
                  <span className="text-xs text-[#cbd5e1] font-mono">Kiran Shahi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#475569]">Visa</span>
                  <span className="text-xs text-[#cbd5e1] font-mono">F-1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#475569]">Status</span>
                  <span className="text-[10px] font-mono border border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] px-1.5 py-0.5 rounded">Ready to download</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── FREE NOTICE ── */}
        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-base font-semibold text-[#f8fafc]">Built for F-1 students. Free forever.</p>
              <p className="text-sm text-[#64748b] mt-1">No subscriptions. No hidden fees. No credit card required.</p>
            </div>
            <Link
              to="/form-8843"
              className="shrink-0 rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563eb] active:scale-[0.98]"
            >
              Get My Free Form 8843 →
            </Link>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#080c14] border-t border-[#1e293b] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/privacy"     className="text-xs text-[#475569] transition-colors hover:text-[#64748b]">Privacy Policy</Link>
            <Link to="/terms"       className="text-xs text-[#475569] transition-colors hover:text-[#64748b]">Terms of Service</Link>
            <Link to="/disclaimer"  className="text-xs text-[#475569] transition-colors hover:text-[#64748b]">Disclaimer</Link>
            <Link to="/contact"     className="text-xs text-[#475569] transition-colors hover:text-[#64748b]">Contact</Link>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-[#475569]">
            F1 Tax Helper provides general educational information only. Not tax, legal, or financial advice.
          </p>
          <p className="mt-2 text-center text-xs font-mono text-[#475569]">
            © 2026 F1 Tax Helper. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
