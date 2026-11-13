import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { displayNameFor, initialOf } from '../../utils/displayName.js'

// Title bar for a tab's main screen. The account button only shows on phones;
// on desktop the account lives at the bottom of the sidebar.
export function PageHeader({ eyebrow, title, children, account = true }) {
  const { user } = useAuth()
  const name = displayNameFor(user) || (user?.is_guest ? 'Guest' : 'Student')
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] text-[#94a3b8]">{eyebrow}</p>}
        <h1 className="truncate text-2xl font-bold tracking-tight text-[#f8fafc] lg:text-3xl">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        {account && (
          <Link
            to="/account"
            aria-label="Account and settings"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1e293b] bg-[#0f172a] text-[15px] font-semibold text-[#f8fafc] lg:hidden"
          >
            {initialOf(name)}
          </Link>
        )}
      </div>
    </header>
  )
}

// Header for a step-by-step flow: where you are, a way back, and a way out
// that says what happens to your work.
export function FocusHeader({ title, note, onBack, backLabel = 'Back', children }) {
  const { user } = useAuth()
  const exitTo = user ? '/home' : '/'
  return (
    <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-2 sm:px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#f8fafc] transition-colors hover:bg-[#131c2e]"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : (
          <Link
            to={exitTo}
            aria-label={user ? 'Back to Home' : 'Back to the homepage'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#f8fafc] transition-colors hover:bg-[#131c2e]"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[#f8fafc]">{title}</p>
          {note && <p className="truncate text-xs text-[#94a3b8]">{note}</p>}
        </div>
        {children}
        <Link
          to={exitTo}
          className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-[#60a5fa] transition-colors hover:text-[#93c5fd]"
        >
          {user ? 'Save & exit' : 'Exit'}
        </Link>
      </div>
    </header>
  )
}
