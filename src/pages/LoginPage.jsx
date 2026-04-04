import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'

const initialValues = {
  email: '',
  password: '',
  confirmPassword: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [mode, setMode] = useState('login')
  const [formValues, setFormValues] = useState(initialValues)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'signup'
  const heading = useMemo(
    () => (isSignUp ? 'Create your account' : 'Welcome back'),
    [isSignUp],
  )

  const description = isSignUp
    ? 'Sign up to save your progress and access personalized F-1 tax guidance.'
    : 'Sign in to continue your F-1 tax questionnaire, checklist, and assistant chat.'

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/welcome', { replace: true })
    }
  }, [authLoading, navigate, user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setNotice('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (isSignUp && formValues.password !== formValues.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const authAction = isSignUp
      ? supabase.auth.signUp({
          email: formValues.email,
          password: formValues.password,
        })
      : supabase.auth.signInWithPassword({
          email: formValues.email,
          password: formValues.password,
        })

    const { data, error: authError } = await authAction

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.session || !isSignUp) {
      navigate('/welcome')
      return
    }

    setNotice('Account created. Please check your email to confirm your sign-up, then log in.')
    setLoading(false)
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
    setFormValues(initialValues)
    setError('')
    setNotice('')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden bg-[#1e3a5f] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <span className="text-sm font-bold">F1</span>
                </div>
                <div>
                  <p className="text-lg font-semibold">F1 Tax Helper</p>
                  <p className="text-sm text-white/70">Taxes made simpler for students</p>
                </div>
              </Link>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/85">
                Secure access with Supabase Auth
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight">
                  Save your progress and pick up your tax filing journey anytime.
                </h1>
                <p className="max-w-md text-base leading-7 text-white/75">
                  Sign in to access your questionnaire, chat guidance, and document checklist in one secure place.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-white/80">
              <p className="font-medium text-white">Designed for F-1 visa holders</p>
              <p className="mt-2 leading-6">
                Clean guidance, secure access, and a consistent navy interface aligned with the rest of the app.
              </p>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-10 sm:py-10">
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-primary lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">F1</span>
              F1 Tax Helper
            </Link>

            <div className="mx-auto max-w-md">
              <div className="mb-8 space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/70">
                  Account Access
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{heading}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>

              <div className="space-y-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#254a77] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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

                <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="student@example.edu"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={formValues.password}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="Enter your password"
                    />
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                        Confirm Password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={formValues.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        placeholder="Re-enter your password"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {notice && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {notice}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
                <p>
                  {isSignUp ? 'Already have an account?' : 'Need an account?'}
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-primary transition hover:text-primary/80"
                >
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
