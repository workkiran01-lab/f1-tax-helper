import { Link } from 'react-router-dom'

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c14] text-[#cbd5e1]">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">F1</div>
            <span className="text-base font-semibold tracking-wide text-[#f8fafc] sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-[#1e293b] bg-[#0f1629] p-8 sm:p-12">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-[#475569]">
            SUPPORT
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#f8fafc] sm:text-5xl">Get in Touch</h1>
          <p className="mt-4 text-base text-[#cbd5e1] sm:text-lg">
            Have a question about your taxes or the app? We&apos;re here to help.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-[#1e293b] bg-[#0f172a] p-6 transition-colors hover:border-[#2d4a6e]">
              <p className="text-4xl" aria-hidden="true">
                📧
              </p>
              <h2 className="mt-4 text-lg font-semibold text-[#f8fafc]">Email Us</h2>
              <a className="mt-1 inline-flex text-[#3b82f6] transition-colors hover:text-[#60a5fa]" href="mailto:support@f1taxhelper.com">
                support@f1taxhelper.com
              </a>
              <p className="mt-2 text-sm text-[#64748b]">For general questions, bug reports, or feedback</p>
            </article>

            <article className="rounded-3xl border border-[#1e293b] bg-[#0f172a] p-6 transition-colors hover:border-[#2d4a6e]">
              <p className="text-4xl" aria-hidden="true">
                ⏱️
              </p>
              <h2 className="mt-4 text-lg font-semibold text-[#f8fafc]">Response Time</h2>
              <p className="mt-1 text-[#cbd5e1]">Within 24-48 hours</p>
              <p className="mt-2 text-sm text-[#64748b]">We read every message and do our best to respond quickly</p>
            </article>
          </div>

          <p className="mt-8 text-sm leading-7 text-[#64748b]">
            F1 Tax Helper is an independent project built to help international students. We appreciate your patience
            and support.
          </p>

          <Link to="/" className="mt-8 inline-flex text-sm font-medium text-[#3b82f6] transition-colors hover:text-[#60a5fa]">
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
