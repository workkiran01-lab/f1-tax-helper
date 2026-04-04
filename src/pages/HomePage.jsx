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
        </div>
      </section>
    </main>
  )
}
