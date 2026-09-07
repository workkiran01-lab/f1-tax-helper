import { readStored, writeStored, currentQuestionnaire } from '../utils/storage.js'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'
import useAuth from '../hooks/useAuth'
import ReadinessCard from '../components/ReadinessCard'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const uid = user?.id || 'guest'
  const displayNameKey = `display_name_${uid}`
  const universityKey = `university_${uid}`

  const [isOnboarding, setIsOnboarding] = useState(true)
  const [name, setName] = useState('')
  const [university, setUniversity] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [universityInput, setUniversityInput] = useState('')

  useEffect(() => {
    const metadata = user?.user_metadata || {}
    const n = metadata.display_name || readStored(displayNameKey, '') || ''
    const u = metadata.university || readStored(universityKey, '') || ''
    if (n && u) {
      setName(n)
      setUniversity(u)
      setIsOnboarding(false)
    }
  }, [displayNameKey, universityKey, user])

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault()
    const n = nameInput.trim()
    const u = universityInput.trim()
    if (!n || !u) return
    writeStored(displayNameKey, n)
    writeStored(universityKey, u)
    if (supabase && !user?.is_guest) {
      supabase.auth.updateUser({ data: { display_name: n, university: u } }).catch(() => {})
    }
    setName(n)
    setUniversity(u)
    setIsOnboarding(false)
  }

  const handleReset = async () => {
    await signOut('/login')
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold border border-[#3b82f6]/50 text-[#3b82f6] px-2 py-1 rounded">
              F1
            </span>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        {isOnboarding ? (
          /* ── STATE 1: Onboarding ── */
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8 sm:p-10">
            <div className="mx-auto mb-5 flex w-fit items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 p-3.5 text-2xl shadow-lg shadow-blue-500/30">
              ✨
            </div>
            <h1 className="text-center text-2xl font-extrabold tracking-tight text-[#f8fafc] sm:text-3xl">
              Let's personalize your experience
            </h1>
            <p className="mt-2 text-center text-sm text-[#64748b]">
              Takes 10 seconds. Helps us guide you better.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748b]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Kiran Shahi"
                  className="w-full rounded-xl border border-[#1e293b] bg-[#080c14] px-4 py-3 text-sm text-[#f8fafc] placeholder:text-[#475569] focus:border-[#3b82f6] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748b]">
                  University
                </label>
                <input
                  type="text"
                  required
                  value={universityInput}
                  onChange={(e) => setUniversityInput(e.target.value)}
                  placeholder="e.g. UCLA, NYU, UT Austin"
                  className="w-full rounded-xl border border-[#1e293b] bg-[#080c14] px-4 py-3 text-sm text-[#f8fafc] placeholder:text-[#475569] focus:border-[#3b82f6] focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-[#3b82f6] py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] active:scale-[0.98]"
              >
                Continue →
              </button>
            </form>
          </div>
        ) : (
          /* ── STATE 2: Welcome back ── */
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8 sm:p-10">
            <p className="mx-auto mb-6 w-fit font-mono text-[10px] uppercase tracking-widest text-[#475569]">
              WELCOME BACK
            </p>
            <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-[#f8fafc] sm:text-3xl">
              Hey, <span className="text-[#3b82f6]">{name}</span>
            </h1>
            <p className="mt-2 text-center text-sm text-[#64748b]">{university} · F-1 Student</p>

            <div className="mt-6">
              <ReadinessCard compact uid={uid} questionnaire={currentQuestionnaire(user) || null} />
            </div>

            <div className="my-6 border-t border-[#1e293b]" />

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/questionnaire')}
                className="w-full rounded-xl bg-[#3b82f6] py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] active:scale-[0.98]"
              >
                Start Tax Questionnaire →
              </button>
              <button
                type="button"
                onClick={() => navigate('/questionnaire')}
                className="w-full rounded-xl border border-[#1e293b] bg-transparent py-3 text-sm font-medium text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
              >
                Restart Questionnaire
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-[#475569]">
              Your progress is saved automatically
            </p>
            <p className="mt-3 text-center">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#475569] transition-colors hover:text-[#64748b]"
              >
                Not you? Sign out
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
