import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function LegalLayout({ title, lastUpdated, intro, sections }) {
  useEffect(() => {
    document.title = `${title} — F1 Tax Helper`
  }, [title])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-400">Last Updated: {lastUpdated}</p>
          {intro && (
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">{intro}</p>
          )}

          <nav className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Contents
            </p>
            <ol className="space-y-1.5">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-blue-300"
                  >
                    <span className="w-4 shrink-0 text-xs text-slate-500">{i + 1}.</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="flex items-baseline gap-2 text-xl font-semibold text-white">
                  <span className="text-base text-blue-400">{i + 1}.</span>
                  {section.title}
                </h2>
                <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300 sm:text-base">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <Link
            to="/"
            className="mt-12 inline-flex text-sm font-medium text-blue-300 transition-colors hover:text-blue-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
