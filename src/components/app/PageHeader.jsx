import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import { displayNameFor, initialOf } from '../../utils/displayName.js'

function AccountButton() {
  const { user } = useAuth()
  const name = displayNameFor(user) || (user?.is_guest ? 'Guest' : 'Student')
  return (
    <Link
      to="/account"
      aria-label="Account and settings"
      className="press flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink lg:hidden"
    >
      {initialOf(name)}
    </Link>
  )
}

// Title for a tab's main screen. It starts large; once it scrolls away, a
// compact copy fades into a translucent bar that stays at the top, so the
// screen's name and its actions are always in reach.
export function PageHeader({ eyebrow, title, children, account = true }) {
  const largeTitle = useRef(null)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !largeTitle.current) return
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: '-52px 0px 0px 0px',
    })
    observer.observe(largeTitle.current)
    return () => observer.disconnect()
  }, [])
  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-20 -mx-5 flex h-[52px] items-center justify-between gap-3 border-b px-5 transition-colors duration-300 lg:-mx-10 lg:px-10',
          collapsed ? 'material border-line/70' : 'border-transparent',
        )}
      >
        <p
          aria-hidden="true"
          className={cn(
            'truncate text-[17px] font-semibold text-ink transition-all duration-300 ease-glide',
            collapsed ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0',
          )}
        >
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {children}
          {account && <AccountButton />}
        </div>
      </div>
      <header ref={largeTitle} className="!mt-0 pb-1">
        {eyebrow && <p className="text-[13px] font-medium text-ink-3">{eyebrow}</p>}
        <h1 className="text-[34px] font-bold leading-[1.1] text-ink lg:text-[40px]">{title}</h1>
      </header>
    </>
  )
}

// Header for a step-by-step flow: where you are, a way back, and a way out
// that says what happens to your work.
export function FocusHeader({ title, note, onBack, backLabel = 'Back', children }) {
  const { user } = useAuth()
  const exitTo = user ? '/home' : '/'
  const backClass =
    'press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tint-ink transition-colors hover:bg-surface-2'
  return (
    <header className="material sticky top-0 z-20 border-b border-line/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-2 sm:px-4">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label={backLabel} className={backClass}>
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </button>
        ) : (
          <Link
            to={exitTo}
            aria-label={user ? 'Back to Home' : 'Back to the homepage'}
            className={backClass}
          >
            <ChevronLeft aria-hidden="true" className="h-6 w-6" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-ink">{title}</p>
          {note && <p className="truncate text-xs text-ink-3">{note}</p>}
        </div>
        {children}
        <Link
          to={exitTo}
          className="press flex min-h-11 shrink-0 items-center rounded-lg px-3 text-[15px] font-medium text-tint-ink transition-colors hover:text-tint-ink-strong"
        >
          {user ? 'Save & exit' : 'Exit'}
        </Link>
      </div>
    </header>
  )
}
