import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#080c14] text-[#cbd5e1] px-4 text-center">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="relative z-10 max-w-md">
        <p className="mb-4 text-6xl font-extrabold text-[#475569]">404</p>
        <h1 className="mb-3 text-2xl font-bold text-[#f8fafc]">Page not found</h1>
        <p className="mb-8 text-sm text-[#64748b]">
          This page doesn't exist. If you followed a link, it may be outdated.
        </p>
        <Link
          to="/"
          className="inline-block rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2563eb] active:scale-[0.98]"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
