import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import DisclaimerBanner from '../components/DisclaimerBanner'
import useAuth from '../hooks/useAuth'
import supabase from '../utils/supabase'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const metadata = user?.user_metadata || {}
  const questionnaire = metadata.questionnaire || null
  const hasAnswers = Boolean(questionnaire?.answers)

  const displayName = useMemo(() => {
    return metadata.full_name || metadata.name || user?.email?.split('@')?.[0] || ''
  }, [metadata.full_name, metadata.name, user?.email])

  useEffect(() => {
    if (displayName) {
      setName(displayName)
    }
  }, [displayName])

  const persistNameIfNeeded = async () => {
    if (displayName || !name.trim()) return

    setSaving(true)
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        name: name.trim(),
      },
    })
    setSaving(false)
  }

  const handleContinue = async () => {
    await persistNameIfNeeded()

    if (hasAnswers) {
      navigate('/results')
      return
    }

    navigate('/questionnaire')
  }

  const handleRestart = async () => {
    setSaving(true)
    await supabase.auth.updateUser({
      data: {
        ...metadata,
        ...(name.trim() ? { name: name.trim() } : {}),
        questionnaire: null,
      },
    })
    setSaving(false)
    navigate('/questionnaire')
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DisclaimerBanner />
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground">Hi {displayName || name || 'there'}!</h1>

          {!displayName && (
            <div className="mt-6 space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">What should we call you?</label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
                placeholder="Enter your name"
              />
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            {hasAnswers ? 'Pick up where you left off or restart the questionnaire from scratch.' : 'Start your questionnaire to generate your personalized tax results.'}
          </p>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleContinue}
              disabled={saving || (!displayName && !name.trim())}
              className="h-12 w-full bg-primary text-base text-primary-foreground"
            >
              {hasAnswers ? 'Continue' : 'Start Questionnaire'}
            </Button>
            <Button
              variant="outline"
              onClick={handleRestart}
              disabled={saving || (!displayName && !name.trim())}
              className="h-12 w-full border-2 border-primary text-base text-primary"
            >
              Restart Questionnaire
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
