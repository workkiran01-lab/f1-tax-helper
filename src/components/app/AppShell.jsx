import { Link, NavLink } from 'react-router-dom'
import { ClipboardCheck, FileText, Home, MessageSquare } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import { displayNameFor, initialOf } from '../../utils/displayName.js'

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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[#1e293b] bg-[#0a0e1a] px-3 py-5 lg:flex">
      <Link to="/home" className="flex items-center gap-2.5 px-3">
        <span className="rounded border border-[#1e293b] px-2 py-1 font-mono text-xs font-bold text-[#3b82f6]">
          F1
        </span>
        <span className="text-sm font-semibold text-[#f8fafc]">Tax Helper</span>
      </Link>
      <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
        {APP_NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#10233f] text-[#93c5fd]'
                  : 'text-[#cbd5e1] hover:bg-[#131c2e] hover:text-[#f8fafc]',
              )
            }
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/account"
        className={({ isActive }) =>
          cn(
            'mt-auto flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors',
            isActive ? 'border-[#1e293b] bg-[#0f172a]' : 'hover:bg-[#131c2e]',
          )
        }
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1e293b] bg-[#0f172a] text-sm font-semibold text-[#f8fafc]">
          {initialOf(name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-[#f8fafc]">{name}</span>
          <span className="block text-xs text-[#94a3b8]">Account &amp; settings</span>
        </span>
      </NavLink>
    </aside>
  )
}

function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid h-[var(--tabbar)] grid-cols-4 border-t border-[#1e293b] bg-[#0b111c] px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      {APP_NAV.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] transition-colors',
              isActive ? 'font-semibold text-[#60a5fa]' : 'font-medium text-[#94a3b8]',
            )
          }
        >
          <Icon aria-hidden="true" className="h-[22px] w-[22px]" />
          {label}
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
  if (!user) return children
  return (
    <div className="min-h-dvh bg-[#080c14] lg:pl-60">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#2563eb] focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar user={user} />
      <div id="app-content" className={cn(!focus && 'pb-[var(--tabbar)] lg:pb-0')}>
        {children}
      </div>
      {!focus && <TabBar />}
    </div>
  )
}
