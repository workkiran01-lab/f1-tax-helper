import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function LegalLayout({ title, lastUpdated, intro, sections }) {
  useEffect(() => {
    document.title = `${title} — F1 Tax Helper`
  }, [title])

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg text-ink">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-xs font-bold border border-line px-2 py-1 text-tint-ink">F1</div>
            <span className="text-sm font-medium text-ink">Tax Helper</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
          <h1 className="text-2xl font-semibold text-ink">
            {title}
          </h1>
          <p className="text-xs text-ink-5 mt-1">Last Updated: {lastUpdated}</p>
          {intro && (
            <p className="text-sm text-ink-3 mt-4 leading-relaxed">{intro}</p>
          )}

          <nav className="mt-8 rounded-xl border border-line bg-bg p-4">
            <p className="text-xs text-ink-5 mb-3">
              Contents
            </p>
            <ol className="space-y-1.5">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-2 text-sm text-ink-4 transition-colors hover:text-tint-ink"
                  >
                    <span className="w-4 shrink-0 text-xs text-ink-5">{i + 1}.</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-base font-semibold text-ink mt-8 mb-3">
                  <span className="text-tint-ink text-sm mr-2">{i + 1}.</span>
                  {section.title}
                </h2>
                <div className="text-sm text-ink-3 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <Link
            to="/"
            className="text-xs text-ink-5 hover:text-ink-4 transition-colors mt-8 inline-flex"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
