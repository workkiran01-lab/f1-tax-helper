import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Brand } from '../Brand.jsx'
import { CONTENT_REVIEWED } from '../../data/guide.js'
import { SUPPORT_EMAIL, formatDate } from '../../data/site.js'
import { RichText, linkKind } from './RichText.jsx'

export const formatReviewed = formatDate

const NAV = [
  ['/tax-guide', 'Guide'],
  ['/faq', 'FAQ'],
  ['/tax-treaties', 'Treaties'],
]

// Scroll to #section links such as /tax-guide#review-log after a client-side navigation.
function useHashScroll() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (!hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [hash, pathname])
}

export function SourceLinks({ sources }) {
  const safe = sources.filter((s) => linkKind(s.url) === 'irs')
  if (!safe.length) return null
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="text-xs font-medium text-ink-4">IRS sources</p>
      <ul className="mt-2 space-y-1.5">
        {safe.map((s) => (
          <li key={s.url} className="text-sm">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tint-ink underline-offset-2 hover:underline"
            >
              {s.label}
              <span className="sr-only"> (IRS, opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Callout({ tone = 'info', children }) {
  const style =
    tone === 'warn'
      ? 'border-warning/30 bg-warning-soft text-warn-ink'
      : 'border-primary/30 bg-primary-soft text-ink-2'
  return (
    <p role="note" className={`mt-4 rounded-2xl border p-4 text-sm leading-relaxed ${style}`}>
      {children}
    </p>
  )
}

// Shared frame for the public information pages (guide, FAQ, treaties). They sit outside the
// signed-in app shell, like About and the policies.
export function InfoLayout({ eyebrow, title, intro, children }) {
  useHashScroll()
  return (
    <div className="min-h-screen bg-bg text-ink-2">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav aria-label="Learn" className="flex items-center gap-1 sm:gap-2">
            {NAV.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive ? 'bg-tint-soft text-tint-ink' : 'text-ink-3 hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {eyebrow && <p className="text-xs font-medium text-ink-4">{eyebrow}</p>}
        <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[40px]">
          {title}
        </h1>
        {intro && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-ink-3">{intro}</p>}
        <p className="mt-3 text-xs text-ink-4">
          Content reviewed {formatReviewed(CONTENT_REVIEWED)} against IRS pages. Educational
          information, not tax or legal advice.
        </p>
        <div className="mt-8">{children}</div>
        <p className="mt-10 text-sm text-ink-3">
          <RichText
            text={`Something wrong or out of date? Email [${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL}).`}
          />
        </p>
      </main>

      <footer className="border-t border-line px-4 py-8 sm:px-6">
        <nav
          aria-label="More"
          className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {[
            ['/', 'Home'],
            ['/about', 'About'],
            ['/privacy', 'Privacy'],
            ['/terms', 'Terms'],
            ['/disclaimer', 'Disclaimer'],
            ['/contact', 'Contact'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="text-[13px] text-ink-3 transition-colors hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
