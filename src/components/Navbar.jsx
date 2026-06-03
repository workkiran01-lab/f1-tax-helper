import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import useAuth from '../hooks/useAuth'

const NAV_LINKS = [
  { label: 'How It Works', href: '/#features' },
  { label: 'Status Checker', to: '/status-checker' },
  { label: 'Form 8843', to: '/form-8843' },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-[#080c14]/80 backdrop-blur-xl transition-colors duration-200 ${
        scrolled ? 'border-b border-[#1e293b]' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="font-mono text-xs font-bold border border-[#1e2d45] px-2 py-1 text-[#3b82f6]">F1</div>
          <span className="text-sm font-normal text-[#f8fafc]">Tax Helper</span>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) =>
            link.href ? (
              <a
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-widest text-[#64748b] transition-colors hover:text-[#f8fafc]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className="text-xs uppercase tracking-widest text-[#64748b] transition-colors hover:text-[#f8fafc]"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Right — desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-xs text-[#64748b] max-w-[160px] truncate">{user.email}</span>
              <button type="button" onClick={signOut} className="btn-ghost py-2 px-4 text-xs">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost py-2 px-4 text-xs">
                {loading ? 'Loading…' : 'Sign In'}
              </Link>
              <Link to="/status-checker" className="btn-primary py-2 px-4 text-xs">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#64748b] transition-colors hover:text-[#f8fafc] md:hidden"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {isMenuOpen
            ? <X className="h-4 w-4" />
            : <Menu className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="border-t border-[#1e293b] bg-[#080c14] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs uppercase tracking-widest text-[#64748b] transition-colors hover:text-[#f8fafc]"
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-xs uppercase tracking-widest text-[#64748b] transition-colors hover:text-[#f8fafc]"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              )
            )}

            <div className="mt-2 flex flex-col gap-2 border-t border-[#1e293b] pt-4">
              {user ? (
                <>
                  <span className="text-xs text-[#64748b]">{user.email}</span>
                  <button
                    type="button"
                    onClick={() => { closeMenu(); signOut() }}
                    className="btn-ghost w-full justify-center py-2 text-xs"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full rounded-xl bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white text-center"
                    onClick={closeMenu}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/status-checker"
                    className="btn-primary w-full justify-center py-2 text-xs"
                    onClick={closeMenu}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
