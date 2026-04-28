import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0f172a] text-slate-100 px-4 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
      </div>
      <div className="relative z-10 max-w-md">
        <p className="mb-4 text-6xl font-extrabold text-slate-600">404</p>
        <h1 className="mb-3 text-2xl font-bold text-white">Page not found</h1>
        <p className="mb-8 text-sm text-slate-400">
          This page doesn't exist. If you followed a link, it may be outdated.
        </p>
        <Link
          to="/"
          className="inline-block rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
