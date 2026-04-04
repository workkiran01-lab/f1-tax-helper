import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Download, FileText, MessageCircle } from 'lucide-react'
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

  if (!answers) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DisclaimerBanner />
        <main className="flex flex-1 items-center justify-center px-4 py-8 text-center">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-lg">
            <h2 className="mb-2 text-2xl font-semibold text-foreground">No results yet</h2>
            <p className="mb-6 text-muted-foreground">Complete the questionnaire to generate your personalized tax summary.</p>
            <Button onClick={() => navigate('/questionnaire')} className="h-11 bg-primary text-primary-foreground">Start Questionnaire</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DisclaimerBanner />
      <header className="px-4 py-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">F1 Tax Helper</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
          <button
            onClick={() => navigate('/welcome')}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to welcome
          </button>

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-center text-2xl font-semibold text-foreground">Your Personalized Tax Summary</h2>

          <div className="mb-8 mt-6 space-y-3 text-left">
            {actionItems.map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-3 rounded-xl bg-secondary p-4">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">{index + 1}</div>
                <p className="text-sm leading-relaxed text-foreground">{item}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              variant="default"
              onClick={() => navigate('/checklist', { state: { answers } })}
              className="h-12 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
            >
              <Download className="mr-2 h-5 w-5" />
              View My Document Checklist
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/chat', { state: chatState })}
              className="h-12 w-full border-2 border-primary text-base text-primary hover:bg-primary/5"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat with F1 Tax Assistant
            </Button>
          </div>
        </div>
      </main>

      <FloatingChatButton state={chatState} />
    </div>
  )
}
