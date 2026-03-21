import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import useAuth from '../hooks/useAuth'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const closeMenu = () => setIsMenuOpen(false)
  const authLabel = user?.email || 'Guest'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">F1</span>
          </div>
          <span className="text-xl font-semibold text-foreground">F1 Tax Helper</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <Link
            to="/checklist"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Checklist
          </Link>
          <Link
            to="/questionnaire"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Questionnaire
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                {authLabel}
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {loading ? 'Loading…' : 'Sign In'}
            </Link>
          )}
        </nav>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={closeMenu}
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={closeMenu}
            >
              Features
            </a>
            <Link
              to="/checklist"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={closeMenu}
            >
              Checklist
            </Link>
            <Link
              to="/questionnaire"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={closeMenu}
            >
              Questionnaire
            </Link>

            {user ? (
              <>
                <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground">
                  {authLabel}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    signOut()
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={closeMenu}
              >
                {loading ? 'Loading…' : 'Sign In'}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
