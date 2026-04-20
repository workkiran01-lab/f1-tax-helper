import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary px-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  F1
                </span>
              </div>
              <span className="text-xl font-semibold text-foreground">
                F1 Tax Helper
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Simplifying US tax filing for international students on F-1 visas.
              Free, accurate, and designed with you in mind.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/tax-guide"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tax Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/tax-treaties"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tax Treaties
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/disclaimer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <a
                  href="mailto:work.kiran01@gmail.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="mailto:work.kiran01@gmail.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Help
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} F1 Tax Helper. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Not tax advice. Consult a qualified tax professional for your
            specific situation.
          </p>
        </div>
      </div>
    </footer>
  )
}
