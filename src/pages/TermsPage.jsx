import { Link } from 'react-router-dom'

export default function TermsPage() {
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
            EFFECTIVE: JANUARY 2026
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Terms of Service</h1>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300 sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-white">Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing or using F1 Tax Helper, you agree to these Terms of Service. If you do not agree, please
                discontinue use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Use of Service</h2>
              <p className="mt-2">
                You agree to use the service only for lawful purposes and to provide accurate information where
                requested. You are responsible for maintaining the confidentiality of your account and any activity
                conducted under it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Not Legal Advice</h2>
              <p className="mt-2">
                F1 Tax Helper provides educational tax information and workflow support. We are not a law firm,
                accounting firm, or licensed tax advisor, and our content does not constitute legal or tax advice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Disclaimer</h2>
              <p className="mt-2">
                We strive for accuracy, but tax rules may change and individual situations vary. You are responsible for
                reviewing your filings and consulting a qualified professional when appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Limitation of Liability</h2>
              <p className="mt-2">
                To the fullest extent permitted by law, F1 Tax Helper and its operators are not liable for indirect,
                incidental, consequential, or special damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Changes to Terms</h2>
              <p className="mt-2">
                We may update these terms from time to time. Continued use of the service after updates are posted
                constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Contact</h2>
              <p className="mt-2">
                For questions about these Terms, email us at
                {' '}
                <a className="text-blue-300 hover:text-blue-200" href="mailto:work.kiran01@gmail.com">
                  work.kiran01@gmail.com
                </a>
                .
              </p>
            </section>
          </div>

          <Link to="/" className="mt-10 inline-flex text-sm font-medium text-blue-300 transition-colors hover:text-blue-200">
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
