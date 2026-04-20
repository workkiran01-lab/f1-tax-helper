import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ComingSoon({ title }) {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    const existing = JSON.parse(localStorage.getItem('waitlist_emails') || '[]')
    if (!existing.includes(trimmed)) {
      localStorage.setItem('waitlist_emails', JSON.stringify([...existing, trimmed]))
    }
    setJoined(true)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f172a] px-4 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-8 py-10 text-center backdrop-blur-xl">
        <span className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-blue-100/80">
          Coming Soon
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          We're building more tools to make US taxes easier for F-1 students.
          Join the waitlist for early access.
        </p>

        <div className="mt-8">
          {joined ? (
            <p className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
              ✓ You're on the list! We'll email you at launch.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
              >
                Join Waitlist
              </button>
            </form>
          )}
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}
