import { Link } from 'react-router-dom'

const privacySections = [
  {
    title: 'What We Collect',
    description:
      'We collect your email address and name when you sign in with Google. We also store your questionnaire answers to generate your personalized tax checklist. We do not collect any sensitive financial data like your Social Security Number or bank details.',
  },
  {
    title: 'How We Use Your Data',
    description:
      'Your data is used solely to provide you with a personalized tax checklist and AI chat experience. We do not sell your data to any third parties. We do not use your data for advertising purposes.',
  },
  {
    title: 'Google OAuth',
    description:
      'We use Google Sign-In for authentication. When you sign in, Google shares your name and email with us. We do not access your Gmail, Google Drive, or any other Google services.',
  },
  {
    title: 'Data Storage',
    description:
      'Your data is securely stored using Supabase, a trusted cloud database provider. All data is encrypted in transit and at rest.',
  },
  {
    title: 'Your Rights',
    description:
      'You can request deletion of your account and all associated data at any time by emailing us at work.kiran01@gmail.com. We will process your request within 7 business days.',
  },
  {
    title: 'Contact',
    description: 'For any privacy-related questions, contact us at work.kiran01@gmail.com',
  },
]

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
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            F1 Tax Helper is committed to protecting your privacy. This policy explains what data we collect and how
            we use it.
          </p>

          <div className="mt-8 space-y-4">
            {privacySections.map((section) => (
              <section key={section.title} className="rounded-3xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300 sm:text-base">{section.description}</p>
              </section>
            ))}
          </div>

          <Link to="/" className="mt-10 inline-flex text-sm font-medium text-blue-300 transition-colors hover:text-blue-200">
            ← Back to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
