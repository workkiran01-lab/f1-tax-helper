import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const getStoredName = () => localStorage.getItem('f1_user_name') || ''
const getStoredUniversity = () => localStorage.getItem('f1_user_university') || ''

export default function WelcomePage() {
  const navigate = useNavigate()

  const [isOnboarding, setIsOnboarding] = useState(
    () => !getStoredName() || !getStoredUniversity(),
  )
  const [name, setName] = useState(getStoredName)
  const [university, setUniversity] = useState(getStoredUniversity)
  const [nameInput, setNameInput] = useState('')
  const [universityInput, setUniversityInput] = useState('')

  const handleOnboardingSubmit = (e) => {
    e.preventDefault()
    const n = nameInput.trim()
    const u = universityInput.trim()
    if (!n || !u) return
    localStorage.setItem('f1_user_name', n)
    localStorage.setItem('f1_user_university', u)
    setName(n)
    setUniversity(u)
    setIsOnboarding(false)
  }

  const handleReset = () => {
    localStorage.removeItem('f1_user_name')
    localStorage.removeItem('f1_user_university')
    setName('')
    setUniversity('')
    setNameInput('')
    setUniversityInput('')
    setIsOnboarding(true)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        {isOnboarding ? (
          /* ── STATE 1: Onboarding ── */
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-10">
            <div className="mx-auto mb-5 flex w-fit items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 p-3.5 text-2xl shadow-lg shadow-blue-500/30">
              ✨
            </div>
            <h1 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Let's personalize your experience
            </h1>
            <p className="mt-2 text-center text-sm text-slate-400">
              Takes 10 seconds. Helps us guide you better.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Kiran Shahi"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  University
                </label>
                <input
                  type="text"
                  required
                  value={universityInput}
                  onChange={(e) => setUniversityInput(e.target.value)}
                  placeholder="e.g. UCLA, NYU, UT Austin"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40"
              >
                Continue →
              </button>
            </form>
          </div>
        ) : (
          /* ── STATE 2: Welcome back ── */
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-10">
            <p className="mx-auto mb-6 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-100/90">
              WELCOME BACK
            </p>
            <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Hey,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                {name}
              </span>
              ! 👋
            </h1>
            <p className="mt-2 text-center text-sm text-slate-400">
              {university} · F-1 Student
            </p>

            <div className="my-6 border-t border-white/10" />

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/questionnaire')}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40"
              >
                Start Tax Questionnaire →
              </button>
              <button
                type="button"
                onClick={() => navigate('/questionnaire')}
                className="w-full rounded-xl border border-white/20 bg-white/5 py-3 text-sm font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10"
              >
                Restart Questionnaire
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Your progress is saved automatically
            </p>
            <p className="mt-3 text-center">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 underline transition-colors hover:text-slate-300"
              >
                Not you? Reset
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
