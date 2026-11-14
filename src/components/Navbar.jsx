import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { Brand } from './Brand'
import { ThemeToggle } from './app/ThemeSwitch'
import { settle } from './app/motion'

const NAV_LINKS = [
  { label: 'How it works', href: '/#features' },
  { label: 'Status check', to: '/status-checker' },
  { label: 'Form 8843', to: '/form-8843' },
]
const linkClass = 'text-sm font-medium text-ink-3 transition-colors hover:text-ink'
const pill =
  'press inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-semibold'

function NavLinks({ onNavigate, className }) {
  return NAV_LINKS.map((link) =>
    link.href ? (
      <a key={link.label} href={link.href} className={className} onClick={onNavigate}>
        {link.label}
      </a>
    ) : (
      <Link key={link.label} to={link.to} className={className} onClick={onNavigate}>
        {link.label}
      </Link>
    ),
  )
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()
  // signOut rejects when the request fails; do not leave that unhandled, and do
  // not pass the click event through as its redirect path.
  const handleSignOut = () => signOut('/login').catch(() => {})

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header
      className={`material sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled || isMenuOpen ? 'border-line/70' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />

        <nav aria-label="Site" className="hidden items-center gap-8 md:flex">
          <NavLinks className={linkClass} />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`${pill} text-ink-3 hover:text-ink`}
                >
                  Sign out
                </button>
                <Link to="/home" className={`${pill} bg-tint text-white hover:bg-tint-hover`}>
                  Open app
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className={`${pill} text-ink-2 hover:text-ink`}>
                  {loading ? 'Loading…' : 'Sign in'}
                </Link>
                <Link
                  to="/status-checker"
                  className={`${pill} bg-tint text-white hover:bg-tint-hover`}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-ink md:hidden"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-[18px] w-[18px]" />
            ) : (
              <Menu className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={settle}
            className="overflow-hidden md:hidden"
          >
            <nav aria-label="Site" className="flex flex-col px-4 pb-5 pt-1">
              <NavLinks
                onNavigate={closeMenu}
                className="flex min-h-12 items-center border-b border-line/70 text-[17px] font-medium text-ink"
              />
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link
                      to="/home"
                      onClick={closeMenu}
                      className={`${pill} min-h-12 bg-tint text-[17px] text-white`}
                    >
                      Open app
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu()
                        handleSignOut()
                      }}
                      className={`${pill} min-h-12 bg-surface-2 text-[17px] text-ink`}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/status-checker"
                      onClick={closeMenu}
                      className={`${pill} min-h-12 bg-tint text-[17px] text-white`}
                    >
                      Get started
                    </Link>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className={`${pill} min-h-12 bg-surface-2 text-[17px] text-ink`}
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
