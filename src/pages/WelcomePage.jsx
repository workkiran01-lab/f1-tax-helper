import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DisclaimerBanner from '../components/DisclaimerBanner'
import useAuth from '../hooks/useAuth'
import supabase from '../utils/supabase'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const metadata = user?.user_metadata || {}
  const questionnaire = metadata.questionnaire || null
  const hasAnswers = Boolean(questionnaire?.answers)

  const displayName = useMemo(() => {
    return metadata.full_name || metadata.name || user?.email?.split('@')?.[0] || ''
  }, [metadata.full_name, metadata.name, user?.email])

  useEffect(() => {
    if (displayName) {
      setName(displayName)
    }
  }, [displayName])

  const persistNameIfNeeded = async () => {
    if (displayName || !name.trim()) return

    setSaving(true)
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        name: name.trim(),
      },
    })
    setSaving(false)
  }

  const handleContinue = async () => {
    await persistNameIfNeeded()

    if (hasAnswers) {
      navigate('/results')
      return
    }

    navigate('/questionnaire')
  }

  const handleRestart = async () => {
    setSaving(true)
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        ...(name.trim() ? { name: name.trim() } : {}),
        questionnaire: null,
      },
    })
    setSaving(false)
    navigate('/questionnaire')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>
      <DisclaimerBanner />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex w-fit items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-4 text-2xl shadow-lg shadow-blue-500/30">
            👋
          </div>
          <p className="mx-auto mt-5 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-100/90">
            WELCOME BACK
          </p>
          <h1 className="mt-6 text-center text-3xl font-extrabold leading-tight tracking-tight text-slate-100 sm:text-4xl">
            Hey,{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              {displayName || name || 'there'}
            </span>
            ! 👋
          </h1>

          {!displayName && (
            <div className="mt-6 space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-100">What should we call you?</label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500/60"
                placeholder="Enter your name"
              />
            </div>
          )}

          <p className="mt-4 text-center text-slate-300">
            Ready to tackle your U.S. taxes? Let&apos;s pick up where you left off.
          </p>
          <div className="my-6 border-t border-white/10" />

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={saving || (!displayName && !name.trim())}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Start Tax Questionnaire →
            </button>
            <button
              type="button"
              onClick={handleRestart}
              disabled={saving || (!displayName && !name.trim())}
              className="h-12 w-full rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Restart Questionnaire
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">Your progress is saved automatically</p>
        </div>
      </main>
    </div>
  )
}
