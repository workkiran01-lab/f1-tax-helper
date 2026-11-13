import { Link, NavLink, useLocation } from 'react-router-dom'
import { ClipboardCheck, FileText, Home, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import useAuth from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import { displayNameFor, initialOf } from '../../utils/displayName.js'
import { ScreenTransition, snappy } from './motion'

// The four places in the app. Every signed-in screen shows the same list, so a
// student always knows where they are and how to get anywhere else.
export const APP_NAV = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/taxes', label: 'My Taxes', Icon: ClipboardCheck },
  { to: '/form-8843', label: 'Form 8843', Icon: FileText },
  { to: '/chat', label: 'Ask AI', Icon: MessageSquare },
]

function Sidebar({ user }) {
  const name = displayNameFor(user) || (user.is_guest ? 'Guest' : 'Student')
  return (
    <aside className="material fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line/70 px-3 py-5 lg:flex">
      <Link to="/home" className="flex items-center gap-2.5 px-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-tint text-[13px] font-bold text-white shadow-raised">
          F1
        </span>
        <span className="text-[15px] font-semibold text-ink">Tax Helper</span>
      </Link>
      <nav aria-label="Main" className="mt-8 flex flex-col gap-0.5">
        {APP_NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors',
                isActive ? 'text-ink' : 'text-ink-3 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  // One highlight that slides between items instead of blinking.
                  <motion.span
                    layoutId="sidebar-active"
                    transition={snappy}
                    className="absolute inset-0 rounded-xl bg-surface-2"
                  />
                )}
                <Icon
                  aria-hidden="true"
                  className={cn('relative h-5 w-5', isActive && 'text-tint-ink')}
                />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/account"
        className={({ isActive }) =>
          cn(
            'mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors',
            isActive ? 'bg-surface-2' : 'hover:bg-surface',
          )
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-ink">
          {initialOf(name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">{name}</span>
          <span className="block text-xs text-ink-3">Account &amp; settings</span>
        </span>
      </NavLink>
    </aside>
  )
}

function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="material fixed inset-x-0 bottom-0 z-30 grid h-[var(--tabbar)] grid-cols-4 border-t border-line/70 px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      {APP_NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10.5px] transition-colors',
              isActive ? 'font-semibold text-tint-ink' : 'font-medium text-ink-3',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative flex h-8 w-14 items-center justify-center">
                {isActive && (
                  <motion.span
                    layoutId="tab-active"
                    transition={snappy}
                    className="absolute inset-0 rounded-full bg-tint/15"
                  />
                )}
                <motion.span
                  className="relative"
                  animate={{ scale: isActive ? 1.06 : 1 }}
                  whileTap={{ scale: 0.86 }}
                  transition={snappy}
                >
                  <Icon aria-hidden="true" className="h-[22px] w-[22px]" />
                </motion.span>
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

// Wraps a page in the app chrome: a sidebar on desktop and a bottom tab bar on
// phones. `focus` hides the tab bar for step-by-step flows so nothing competes
// with "Continue". Signed-out visitors (the public status check and Form 8843)
// get the page without app chrome.
export default function AppShell({ children, focus = false }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  if (!user) return children
  return (
    <div className="min-h-dvh bg-bg lg:pl-60">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-tint focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar user={user} />
      <div id="app-content" className={cn(!focus && 'pb-[var(--tabbar)] lg:pb-0')}>
        <ScreenTransition screenKey={pathname} push={focus}>
          {children}
        </ScreenTransition>
      </div>
      {!focus && <TabBar />}
    </div>
  )
}
