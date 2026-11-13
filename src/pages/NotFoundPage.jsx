import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg text-ink-2 px-4 text-center">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative z-10 max-w-md">
        <p className="mb-4 text-6xl font-extrabold text-ink-5">404</p>
        <h1 className="mb-3 text-2xl font-bold text-ink">Page not found</h1>
        <p className="mb-8 text-sm text-ink-4">
          This page doesn't exist. If you followed a link, it may be outdated.
        </p>
        <Link
          to="/"
          className="inline-block rounded-xl bg-tint px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-tint active:scale-[0.98]"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
