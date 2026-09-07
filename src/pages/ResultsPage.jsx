import { TAX_YEAR, DEADLINES, DEADLINE_NOTE, SOURCES } from '../data/taxSeason.js'
import { currentQuestionnaire, readStored, writeStored, seasonKey } from '../utils/storage.js'
import SeasonNotice from '../components/SeasonNotice'
import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Download, MessageCircle, AlertTriangle, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'
import DisclaimerBanner from '../components/DisclaimerBanner'
import FloatingChatButton from '../components/FloatingChatButton'
import ReadinessCard from '../components/ReadinessCard'
import useAuth from '../hooks/useAuth'

export default function ResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const storedQuestionnaire = currentQuestionnaire(user)
  const answers = location.state?.answers || storedQuestionnaire?.answers || null
  const actionItems = location.state?.actionItems || storedQuestionnaire?.actionItems || []
  const hasTreatyBenefit = Boolean(
    location.state?.hasTreatyBenefit ?? storedQuestionnaire?.hasTreatyBenefit,
  )
  const syncWarning = location.state?.syncWarning || null

  const chatState = useMemo(() => ({ answers, actionItems }), [answers, actionItems])

  const getResultStyle = (item) => {
    const lowered = item.toLowerCase()
    if (
      item.startsWith('⚠️') ||
      lowered.includes('warning') ||
      lowered.includes('risk') ||
      lowered.includes('unauthorized')
    ) {
      return {
        cardBg: 'bg-[#f59e0b]/5',
        border: 'border-l-[#f59e0b]',
        icon: <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />,
        title: 'Warning',
        titleColor: 'text-[#f59e0b]',
      }
    }
    if (lowered.includes('must') || lowered.includes('required') || lowered.includes('crucial')) {
      return {
        cardBg: 'bg-[#8b5cf6]/5',
        border: 'border-l-[#8b5cf6]',
        icon: <Sparkles className="h-4 w-4 text-[#8b5cf6]" />,
        title: 'Important',
        titleColor: 'text-[#8b5cf6]',
      }
    }
    return {
      cardBg: 'bg-[#3b82f6]/5',
      border: 'border-l-[#3b82f6]',
      icon: <Check className="h-4 w-4 text-[#3b82f6]" />,
      title: 'Summary',
      titleColor: 'text-[#3b82f6]',
    }
  }

  if (!answers) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <DisclaimerBanner />
        <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold border border-[#3b82f6]/50 text-[#3b82f6] px-2 py-1 rounded">
                F1
              </span>
              <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
                F1 Tax Helper
              </span>
            </Link>
          </div>
        </header>
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 text-center sm:px-6">
          <div className="w-full max-w-xl rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8">
            <h2 className="mb-2 text-lg font-semibold text-[#f8fafc]">No results yet</h2>
            <p className="mb-6 text-sm text-[#64748b]">
              Complete the questionnaire to generate your personalized tax summary.
            </p>
            <div className="mb-6 text-left">
              <ReadinessCard
                uid={user?.id || 'guest'}
                questionnaire={answers ? { answers, taxYear: TAX_YEAR } : null}
              />
            </div>
            <button
              onClick={() => navigate('/questionnaire')}
              className="w-full rounded-xl bg-[#3b82f6] px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] active:scale-[0.98]"
            >
              Start Questionnaire
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#080c14] text-slate-100">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <DisclaimerBanner />
      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#080c14]/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold border border-[#3b82f6]/50 text-[#3b82f6] px-2 py-1 rounded">
              F1
            </span>
            <span className="text-base font-semibold tracking-wide text-slate-100 sm:text-lg">
              F1 Tax Helper
            </span>
          </Link>
        </div>
      </header>

      <main className="animate-fade-up relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <div className="rounded-xl border border-[#1e293b] bg-[#0f172a] p-6 sm:p-8">
          <div className="mb-8">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">
              Your Results · Tax Year {TAX_YEAR}
            </span>
            <h1 className="mt-3 text-2xl font-semibold text-[#f8fafc]">
              Here&apos;s your tax summary
            </h1>
            <p className="mt-2 text-sm text-[#64748b]">
              Based on your answers, here&apos;s what you need to know
            </p>
            {syncWarning && (
              <p className="mt-4 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b]">
                {syncWarning}
              </p>
            )}
          </div>

          <div className="mb-6">
            <ReadinessCard
              uid={user?.id || 'guest'}
              questionnaire={answers ? { answers, taxYear: TAX_YEAR } : null}
            />
          </div>

          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className={`rounded-xl border border-[#1e293b] border-l-2 p-4 ${getResultStyle(item).border} ${getResultStyle(item).cardBg}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getResultStyle(item).icon}</div>
                  <div>
                    <p
                      className={`text-[10px] font-mono uppercase tracking-widest ${getResultStyle(item).titleColor}`}
                    >
                      {getResultStyle(item).title}
                    </p>
                    <p className="text-sm text-[#cbd5e1] leading-relaxed mt-1">{item}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasTreatyBenefit && (
            <div className="mt-6 rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-5">
              <h3 className="text-base font-semibold text-[#f8fafc]">
                You may qualify for a tax treaty benefit
              </h3>
              <p className="text-sm text-[#94a3b8] mt-2 leading-relaxed">
                We detected that your country may have treaty-based exemptions. Verify treaty
                residence, income limits and disclosure exceptions with the IRS. Form 8833 is not
                required for every student treaty claim.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <Button
              variant="default"
              onClick={() => navigate('/checklist', { state: { answers } })}
              className="h-12 w-full rounded-xl bg-[#3b82f6] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2563eb] active:scale-[0.98]"
            >
              <Download className="mr-2 h-5 w-5" />
              View My Checklist →
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/chat', { state: chatState })}
              className="h-12 w-full rounded-xl border border-[#1e293b] bg-transparent text-sm font-semibold text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with AI Assistant
            </Button>

            <button
              type="button"
              onClick={() => navigate('/questionnaire')}
              className="mx-auto mt-1 inline-flex w-fit items-center text-xs text-[#475569] transition-colors hover:text-[#64748b]"
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
