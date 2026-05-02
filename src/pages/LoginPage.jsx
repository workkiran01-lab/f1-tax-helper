import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/welcome', { replace: true })
    }
  }, [authLoading, navigate, user])

  const handleGoogleSignIn = async () => {
    setError('')
    setNotice('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

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

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-16 sm:px-6 md:py-20">
        <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-100/90">
            SIGN IN TO CONTINUE
          </p>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Welcome back.
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
            Sign in with your Google account to continue
          </p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="currentColor" d="M21.81 10.04H12v3.92h5.65c-.24 1.26-.96 2.33-2.04 3.05v2.53h3.3c1.94-1.79 3.06-4.42 3.06-7.54 0-.67-.06-1.32-.16-1.96Z" />
                  <path fill="currentColor" d="M12 22c2.76 0 5.08-.91 6.77-2.46l-3.3-2.53c-.91.61-2.08.98-3.47.98-2.66 0-4.91-1.79-5.72-4.2H2.87v2.61A10.22 10.22 0 0 0 12 22Z" />
                  <path fill="currentColor" d="M6.28 13.79A6.13 6.13 0 0 1 5.96 12c0-.62.11-1.21.32-1.79V7.6H2.87A10.05 10.05 0 0 0 1.8 12c0 1.62.39 3.15 1.07 4.4l3.41-2.61Z" />
                  <path fill="currentColor" d="M12 5.99c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.07 2.98 14.76 2 12 2 7.99 2 4.51 4.29 2.87 7.6l3.41 2.61C7.09 7.78 9.34 5.99 12 5.99Z" />
                </svg>
              )}
              Continue with Google
            </button>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {notice}
              </div>
            )}

            <p className="text-center text-xs text-slate-500">
              By signing in, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
