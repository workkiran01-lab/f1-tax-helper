import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle, UserRound } from 'lucide-react'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signInAsGuest } = useAuth()
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
    <main className="relative min-h-screen overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
            <span className="text-sm font-medium text-[#f8fafc]">Tax Helper</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-16 sm:px-6 md:py-20">
        <div className="w-full max-w-xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#64748b] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-8 sm:p-10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">
            Sign in to continue
          </span>

          <h1 className="mt-4 text-2xl font-semibold text-[#f8fafc]">
            Welcome back.
          </h1>

          <p className="text-sm text-[#64748b] mt-3">
            Sign in with Google or continue as a guest
          </p>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563eb] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c14]"
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

            <button
              type="button"
              onClick={() => signInAsGuest('/welcome')}
              disabled={loading}
              className="w-full rounded-xl border border-[#1e293b] bg-transparent px-6 py-3 text-sm font-medium text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc] flex items-center justify-center gap-3 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080c14]"
            >
              <UserRound className="h-4 w-4" />
              Continue as Guest
            </button>

            <p className="text-xs text-[#475569] text-center">
              Guest mode saves progress only in this browser.
            </p>

            {error && (
              <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#ef4444]">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {notice}
              </div>
            )}

            <p className="text-xs text-[#475569] text-center">
              By signing in, you agree to our Terms of Service
            </p>
          </div>
        </div>
        </div>
      </section>
    </main>
  )
}
