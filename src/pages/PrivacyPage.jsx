import { Link } from 'react-router-dom'

export default function PrivacyPage() {
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
            LAST UPDATED: JANUARY 2026
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Privacy Policy</h1>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-300 sm:text-base">
            <section>
              <h2 className="text-xl font-semibold text-white">What We Collect</h2>
              <p className="mt-2">
                We collect account details you provide (such as your email address when signing in with Google), basic
                usage data, and tax-preparation responses you enter into our questionnaires. We only request
                information needed to provide and improve the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">How We Use It</h2>
              <p className="mt-2">
                We use your information to authenticate your account, generate personalized tax checklists, support chat
                functionality, and maintain platform security. We may also use aggregated, de-identified usage metrics
                to improve product quality and user experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Data Security</h2>
              <p className="mt-2">
                We apply administrative and technical safeguards designed to protect your information from unauthorized
                access, disclosure, or misuse. While no online system is completely risk-free, we continuously review
                our controls and limit access to sensitive data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Third Party Services</h2>
              <p className="mt-2">
                We rely on trusted providers including Google OAuth for authentication and Supabase for backend
                infrastructure. These providers process data according to their own privacy policies and security
                practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Your Rights</h2>
              <p className="mt-2">
                You may request access, correction, or deletion of your personal information, subject to applicable law.
                You may also choose to stop using the service at any time by discontinuing access to your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Contact Us</h2>
              <p className="mt-2">
                For privacy-related questions, contact us at
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
