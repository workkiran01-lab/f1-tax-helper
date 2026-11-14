import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ComingSoon({ title }) {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (res.ok) {
        setJoined(true)
      } else {
        // Show the server's reason (invalid address, rate limit, unavailable).
        const body = await res.json().catch(() => ({}))
        setError(
          typeof body.error === 'string' ? body.error : 'Something went wrong — please try again.',
        )
      }
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 text-ink-2">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface px-8 py-10 text-center">
        <span className="mb-4 inline-flex text-xs text-ink-5">
          Coming Soon
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-4">
          We're building more tools to make US taxes easier for F-1 students.
          Join the waitlist for early access.
        </p>

        <div className="mt-8">
          {joined ? (
            <p className="rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm font-medium text-ok-ink">
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
                className="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-5 focus:border-tint focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-tint py-2.5 text-sm font-semibold text-white transition-all hover:bg-tint active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Joining…' : 'Join Waitlist'}
              </button>
              {error && (
                <p className="text-sm font-medium text-bad-ink">{error}</p>
              )}
            </form>
          )}
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex text-xs text-ink-5 transition-colors hover:text-ink-2"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}
