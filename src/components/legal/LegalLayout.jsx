import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function LegalLayout({ title, lastUpdated, intro, sections }) {
  useEffect(() => {
    document.title = `${title} — F1 Tax Helper`
  }, [title])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
            <span className="text-sm font-medium text-[#f8fafc]">Tax Helper</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8 sm:p-10">
          <h1 className="text-2xl font-semibold text-[#f8fafc]">
            {title}
          </h1>
          <p className="text-xs text-[#475569] font-mono mt-1">Last Updated: {lastUpdated}</p>
          {intro && (
            <p className="text-sm text-[#94a3b8] mt-4 leading-relaxed">{intro}</p>
          )}

          <nav className="mt-8 rounded-xl border border-[#1e293b] bg-[#080c14] p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-3">
              Contents
            </p>
            <ol className="space-y-1.5">
              {sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex items-center gap-2 text-sm text-[#64748b] transition-colors hover:text-[#3b82f6]"
                  >
                    <span className="w-4 shrink-0 text-xs text-[#475569]">{i + 1}.</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-base font-semibold text-[#f8fafc] mt-8 mb-3">
                  <span className="text-[#3b82f6] font-mono text-sm mr-2">{i + 1}.</span>
                  {section.title}
                </h2>
                <div className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <Link
            to="/"
            className="text-xs text-[#475569] hover:text-[#64748b] transition-colors mt-8 inline-flex"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
