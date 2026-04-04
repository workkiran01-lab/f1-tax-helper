import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

const featureCards = [
  {
    title: 'Tax Questionnaire',
    description: 'Answer a few questions about your situation to get started in minutes.',
    icon: ClipboardList,
  },
  {
    title: 'Personalized Results',
    description: 'Get a clear action plan tailored to your visa status, income, and timeline.',
    icon: Sparkles,
  },
  {
    title: 'Document Checklist',
    description: 'Know exactly which documents and forms you need before you file.',
    icon: ShieldCheck,
  },
  {
    title: 'AI Chat Support',
    description: 'Ask tax questions anytime and get instant, focused answers.',
    icon: MessageSquareText,
  },
]

const steps = [
  'Answer questions about your visa and income',
  'Get your personalized tax action plan',
  'File with confidence',
]

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
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 md:pb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-100 sm:text-3xl">Features</h2>
          <p className="mt-3 text-slate-300">Everything you need to navigate U.S. tax filing as an international student.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-violet-300/40 hover:bg-white/10"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white shadow-md shadow-violet-900/40">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 md:py-16">
        <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl sm:p-10">
          <h2 className="text-center text-2xl font-bold text-slate-100 sm:text-3xl">How It Works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-slate-950/30 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Step {index + 1}</p>
                <p className="mt-3 text-base font-medium leading-relaxed text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-slate-900/40 px-4 py-12 backdrop-blur sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
                F1
              </div>
              <span className="text-lg font-semibold text-slate-100">F1 Tax Helper</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              Simplifying U.S. tax filing for international students with clear guidance, smart tools, and support when you need it.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-100">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/tax-guide" className="hover:text-white">Tax Guide</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link to="/tax-treaties" className="hover:text-white">Tax Treaties</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-100">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
              <li><Link to="/disclaimer" className="hover:text-white">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col gap-2 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} F1 Tax Helper. All rights reserved.</p>
          <p>Not tax advice. Consult a qualified tax professional for your specific situation.</p>
        </div>
      </footer>
    </main>
  )
}
