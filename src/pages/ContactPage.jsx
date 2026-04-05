import { Link } from 'react-router-dom'

export default function ContactPage() {
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
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-12">
          <p className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-100/90">
            SUPPORT
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Get in Touch</h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Have a question about your taxes or the app? We&apos;re here to help.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-4xl" aria-hidden="true">
                📧
              </p>
              <h2 className="mt-4 text-lg font-semibold text-white">Email Us</h2>
              <a className="mt-1 inline-flex text-blue-300 transition-colors hover:text-blue-200" href="mailto:work.kiran01@gmail.com">
                work.kiran01@gmail.com
              </a>
              <p className="mt-2 text-sm text-slate-300">For general questions, bug reports, or feedback</p>
            </article>

            <article className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-4xl" aria-hidden="true">
                ⏱️
              </p>
              <h2 className="mt-4 text-lg font-semibold text-white">Response Time</h2>
              <p className="mt-1 text-slate-200">Within 24-48 hours</p>
              <p className="mt-2 text-sm text-slate-300">We read every message and do our best to respond quickly</p>
            </article>
          </div>

          <p className="mt-8 text-sm leading-7 text-slate-400">
            F1 Tax Helper is an independent project built to help international students. We appreciate your patience
            and support.
          </p>

          <Link to="/" className="mt-8 inline-flex text-sm font-medium text-blue-300 transition-colors hover:text-blue-200">
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
