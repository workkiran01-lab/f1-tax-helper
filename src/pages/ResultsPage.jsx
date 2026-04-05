import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Download, MessageCircle, AlertTriangle, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'
import DisclaimerBanner from '../components/DisclaimerBanner'
import FloatingChatButton from '../components/FloatingChatButton'
import useAuth from '../hooks/useAuth'

export default function ResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const storedQuestionnaire = user?.user_metadata?.questionnaire || null
  const answers = location.state?.answers || storedQuestionnaire?.answers || null
  const actionItems = location.state?.actionItems || storedQuestionnaire?.actionItems || []

  const chatState = useMemo(() => ({ answers, actionItems }), [answers, actionItems])
  const hasTreatyBenefit = actionItems.some((item) => item.toLowerCase().includes('tax treaty'))

  const getResultStyle = (item) => {
    const lowered = item.toLowerCase()
    if (lowered.includes('warning') || lowered.includes('risk') || lowered.includes('unauthorized')) {
      return {
        border: 'border-l-yellow-500',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-300" />,
        title: 'Warning',
      }
    }
    if (lowered.includes('must') || lowered.includes('required') || lowered.includes('crucial')) {
      return {
        border: 'border-l-violet-500',
        icon: <Sparkles className="h-5 w-5 text-violet-300" />,
        title: 'Important',
      }
    }
    return {
      border: 'border-l-blue-500',
      icon: <Check className="h-5 w-5 text-blue-300" />,
      title: 'Summary',
    }
  }

  if (!answers) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
          <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
          <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
        </div>
        <DisclaimerBanner />
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
                F1
              </div>
              <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
            </Link>
          </div>
        </header>
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 text-center sm:px-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/5 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
            <h2 className="mb-2 text-2xl font-semibold text-slate-100">No results yet</h2>
            <p className="mb-6 text-slate-300">Complete the questionnaire to generate your personalized tax summary.</p>
            <Button onClick={() => navigate('/questionnaire')} className="h-11 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">Start Questionnaire</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-pulse [animation-duration:9s]" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl animate-pulse [animation-duration:11s]" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl animate-pulse [animation-duration:13s]" />
      </div>
      <DisclaimerBanner />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-bold text-white shadow-lg shadow-blue-500/30">
              F1
            </div>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">F1 Tax Helper</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <div className="rounded-3xl border border-white/20 bg-white/5 p-6 shadow-2xl shadow-blue-950/40 backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-blue-100/90">
              YOUR RESULTS
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">Here&apos;s your tax summary</h1>
            <p className="mt-3 text-slate-300">Based on your answers, here&apos;s what you need to know</p>
          </div>

          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className={`rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-xl border-l-4 ${getResultStyle(item).border}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getResultStyle(item).icon}</div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-100">{getResultStyle(item).title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{item}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasTreatyBenefit && (
            <div className="mt-6 rounded-3xl border border-blue-500/30 bg-gradient-to-r from-blue-500/20 to-violet-500/20 p-5">
              <h3 className="text-lg font-bold text-slate-100">🎉 You may qualify for a tax treaty benefit!</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                We detected that your country may have treaty-based exemptions. Review your checklist for Form 8833 and treaty claim details.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <Button
              variant="default"
              onClick={() => navigate('/checklist', { state: { answers } })}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40"
            >
              <Download className="mr-2 h-5 w-5" />
              View My Checklist →
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/chat', { state: chatState })}
              className="h-12 w-full rounded-xl border border-white/20 bg-white/5 text-base font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with AI Assistant
            </Button>

            <button
              type="button"
              onClick={() => navigate('/questionnaire')}
              className="mx-auto mt-1 inline-flex w-fit items-center text-sm font-medium text-slate-400 transition-colors hover:text-slate-200"
            >
              ← Back to Questionnaire
            </button>
          </div>
        </div>
      </main>

      <FloatingChatButton state={chatState} />
    </div>
  )
}
