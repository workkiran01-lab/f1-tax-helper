import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true

    const redirectIfAuthenticated = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return
      if (session?.user) {
        navigate('/welcome', { replace: true })
      }
    }

    redirectIfAuthenticated()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const getStartedHref = user ? '/welcome' : '/login'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-16 sm:px-6 md:py-20">
        <div className="w-full rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-100/90">
            Built for international students
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              File your U.S. taxes with confidence.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            F1 Tax Helper gives international students one clear place to understand tax requirements, avoid mistakes, and move through filing season faster.
          </p>

          <div className="mt-10">
            <Link
              to={getStartedHref}
              className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] sm:text-base"
            >
              Get Started
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {['🎓 Built for F1 Students', '🌍 20+ Treaty Countries', '⚡ Free to Get Started'].map((stat) => (
              <span
                key={stat}
                className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-slate-300"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to file with confidence
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/15 border-t-2 border-t-blue-500 bg-slate-900/40 p-5">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-500/10 p-3">
                <p className="text-2xl" aria-hidden="true">
                  🗂️
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">Step-by-Step Guidance</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Answer a few questions and get a personalized tax checklist built for F1 visa holders
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 border-t-2 border-t-violet-500 bg-slate-900/40 p-5">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-500/10 p-3">
                <p className="text-2xl" aria-hidden="true">
                  🤖
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">AI Tax Assistant</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Chat with our AI to get instant answers about deductions, treaties, and filing deadlines
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 border-t-2 border-t-cyan-500 bg-slate-900/40 p-5">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 p-3">
                <p className="text-2xl" aria-hidden="true">
                  📄
                </p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">Tax Treaty Support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                We automatically check if your country has a U.S. tax treaty that could reduce what you owe
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">File your taxes in 3 simple steps</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="relative rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
                1
              </p>
              <span className="absolute right-0 top-9 hidden h-px w-8 translate-x-1/2 border-t border-dashed border-white/30 md:block" />
              <h3 className="mt-3 text-lg font-semibold text-white">Answer a few questions</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Tell us about your income, visa status, and home country
              </p>
            </article>

            <article className="relative rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
                2
              </p>
              <span className="absolute right-0 top-9 hidden h-px w-8 translate-x-1/2 border-t border-dashed border-white/30 md:block" />
              <h3 className="mt-3 text-lg font-semibold text-white">Get your personalized checklist</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                We generate a custom list of forms and documents you need
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
                3
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">File with confidence</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Follow your checklist and use our AI chat for any questions
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why students trust us</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-4xl" aria-hidden="true">
                🎓
              </p>
              <h3 className="mt-4 text-lg font-semibold text-white">Built for F1 only</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Not a generic tax tool. Every feature is designed specifically for F1 visa holders and international
                students
              </p>
            </article>

            <article className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-4xl" aria-hidden="true">
                🌍
              </p>
              <h3 className="mt-4 text-lg font-semibold text-white">20+ Treaty Countries</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                We support students from every major tax treaty country including India, China, South Korea, Germany,
                UK and more
              </p>
            </article>

            <article className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-4xl" aria-hidden="true">
                ⚡
              </p>
              <h3 className="mt-4 text-lg font-semibold text-white">Free to Start</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                No credit card required. Get your personalized tax checklist completely free
              </p>
            </article>

            <article className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-4xl" aria-hidden="true">
                🤖
              </p>
              <h3 className="mt-4 text-lg font-semibold text-white">AI Powered</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Our assistant is trained on IRS guidelines and F1-specific tax rules to answer your questions instantly
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to file with confidence
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="text-2xl" aria-hidden="true">
                🗂️
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">Step-by-Step Guidance</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Answer a few questions and get a personalized tax checklist built for F1 visa holders
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="text-2xl" aria-hidden="true">
                🤖
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">AI Tax Assistant</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Chat with our AI to get instant answers about deductions, treaties, and filing deadlines
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="text-2xl" aria-hidden="true">
                📄
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">Tax Treaty Support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                We automatically check if your country has a U.S. tax treaty that could reduce what you owe
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">File your taxes in 3 simple steps</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
                1
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">Answer a few questions</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Tell us about your income, visa status, and home country
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
                2
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">Get your personalized checklist</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                We generate a custom list of forms and documents you need
              </p>
            </article>

            <article className="rounded-2xl border border-white/15 bg-slate-900/40 p-5">
              <p className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
                3
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">File with confidence</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Follow your checklist and use our AI chat for any questions
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Tax treaty countries we support
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              'India',
              'China',
              'South Korea',
              'Germany',
              'France',
              'UK',
              'Canada',
              'Japan',
              'Mexico',
              'Netherlands',
              'Italy',
              'Russia',
              'Philippines',
              'Thailand',
              'Pakistan',
              'Bangladesh',
              'Sri Lanka',
              'Egypt',
              'Indonesia',
              'Poland',
            ].map((country) => (
              <span
                key={country}
                className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100/90"
              >
                {country}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-300">
            Students from treaty countries may qualify for reduced tax rates or exemptions on certain income
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-white/15 bg-slate-900/40 p-5 text-sm leading-6 text-slate-400">
          <p>
            <span className="mr-2" aria-hidden="true">
              ⚠️
            </span>
            F1 Tax Helper provides general tax information for educational purposes only. We are not a licensed tax
            advisor. For complex situations, please consult a qualified CPA or tax professional familiar with
            international student taxes.
          </p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#0f172a]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <p className="text-sm">© 2026 F1 Tax Helper. All rights reserved.</p>
          </div>

          <nav className="flex items-center gap-3 text-sm text-slate-400">
            <Link to="/privacy" className="transition-colors hover:text-slate-200">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="transition-colors hover:text-slate-200">
              Terms of Service
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="transition-colors hover:text-slate-200">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
