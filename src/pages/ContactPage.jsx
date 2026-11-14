import { Link } from 'react-router-dom'

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-bg text-ink-2">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-xs font-bold border border-line px-2 py-1 text-tint-ink">F1</div>
            <span className="text-base font-semibold tracking-wide text-ink sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12">
          <p className="mb-6 text-xs text-ink-5">
            SUPPORT
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Get in Touch</h1>
          <p className="mt-4 text-base text-ink-2 sm:text-lg">
            Have a question about your taxes or the app? We&apos;re here to help.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
              <p className="text-4xl" aria-hidden="true">
                📧
              </p>
              <h2 className="mt-4 text-lg font-semibold text-ink">Email Us</h2>
              <a className="mt-1 inline-flex text-tint-ink transition-colors hover:text-tint-ink" href="mailto:support@f1taxhelper.com">
                support@f1taxhelper.com
              </a>
              <p className="mt-2 text-sm text-ink-4">For general questions, bug reports, or feedback</p>
            </article>

            <article className="rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
              <p className="text-4xl" aria-hidden="true">
                ⏱️
              </p>
              <h2 className="mt-4 text-lg font-semibold text-ink">Response Time</h2>
              <p className="mt-1 text-ink-2">Within 24-48 hours</p>
              <p className="mt-2 text-sm text-ink-4">We read every message and do our best to respond quickly</p>
            </article>
          </div>

          <p className="mt-8 text-sm leading-7 text-ink-4">
            F1 Tax Helper is an independent project built to help international students. We appreciate your patience
            and support.
          </p>

          <Link to="/" className="mt-8 inline-flex text-sm font-medium text-tint-ink transition-colors hover:text-tint-ink">
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
