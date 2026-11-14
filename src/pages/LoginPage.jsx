import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle, UserRound } from 'lucide-react'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'
import { Brand, BrandMark } from '../components/Brand'
import { ThemeToggle } from '../components/app/ThemeSwitch'
import { Sequence, SequenceItem } from '../components/app/motion'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signInAsGuest } = useAuth()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // Returning with the browser Back button after the Google redirect restores
  // this page from the back/forward cache with the button still disabled.
  useEffect(() => {
    const reset = (event) => event.persisted && setLoading(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  useEffect(() => {
    // Guests stay on this page so they can upgrade to a Google account; before,
    // they were bounced to /welcome and could only sign in by signing out first.
    if (!authLoading && user && !user.is_guest) {
      navigate('/home', { replace: true })
    }
  }, [authLoading, navigate, user])

  const handleGoogleSignIn = async () => {
    setError('')
    setNotice('')
    setLoading(true)

    try {
      if (!supabase) throw new Error('Google sign-in is unavailable. You can continue as a guest.')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-bg text-ink">
      <div className="aurora" />
      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <ThemeToggle />
      </header>

      <section className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-6">
        <Sequence className="w-full max-w-sm text-center">
          <SequenceItem className="flex justify-center">
            <BrandMark size="lg" className="shadow-float" />
          </SequenceItem>
          <SequenceItem>
            <h1 className="mt-6 text-[32px] font-bold leading-tight text-ink">
              {user?.is_guest ? 'Keep your progress' : 'Welcome'}
            </h1>
            <p className="mt-2 text-[17px] leading-snug text-ink-3">
              {user?.is_guest
                ? 'Sign in to use your account on any device.'
                : 'Your US taxes as an F-1 student, one step at a time.'}
            </p>
          </SequenceItem>

          <SequenceItem className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-tint px-6 text-[17px] font-semibold text-white hover:bg-tint-hover disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.81 10.04H12v3.92h5.65c-.24 1.26-.96 2.33-2.04 3.05v2.53h3.3c1.94-1.79 3.06-4.42 3.06-7.54 0-.67-.06-1.32-.16-1.96Z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 22c2.76 0 5.08-.91 6.77-2.46l-3.3-2.53c-.91.61-2.08.98-3.47.98-2.66 0-4.91-1.79-5.72-4.2H2.87v2.61A10.22 10.22 0 0 0 12 22Z"
                  />
                  <path
                    fill="currentColor"
                    d="M6.28 13.79A6.13 6.13 0 0 1 5.96 12c0-.62.11-1.21.32-1.79V7.6H2.87A10.05 10.05 0 0 0 1.8 12c0 1.62.39 3.15 1.07 4.4l3.41-2.61Z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.99c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.07 2.98 14.76 2 12 2 7.99 2 4.51 4.29 2.87 7.6l3.41 2.61C7.09 7.78 9.34 5.99 12 5.99Z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => signInAsGuest('/home')}
              disabled={loading}
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-6 text-[17px] font-semibold text-ink hover:bg-surface-2 disabled:opacity-50"
            >
              <UserRound className="h-5 w-5" />
              {user?.is_guest ? 'Keep using guest mode' : 'Continue as Guest'}
            </button>

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-left text-sm text-bad-ink"
              >
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-2xl border border-ok/40 bg-ok/10 px-4 py-3 text-left text-sm text-ok-ink">
                {notice}
              </div>
            )}
          </SequenceItem>

          <SequenceItem>
            <p className="mt-6 text-[13px] leading-relaxed text-ink-3">
              Guest mode saves progress only in this browser. By continuing you agree to our{' '}
              <Link to="/terms" className="text-tint-ink hover:text-tint-ink-strong">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-tint-ink hover:text-tint-ink-strong">
                Privacy Policy
              </Link>
              .
            </p>
          </SequenceItem>
        </Sequence>
      </section>
    </main>
  )
}
