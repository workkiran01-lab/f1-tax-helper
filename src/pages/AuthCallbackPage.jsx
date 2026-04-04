import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const finishAuth = async () => {
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted) return

      if (session?.user) {
        navigate('/welcome', { replace: true })
        return
      }

      navigate('/login', { replace: true })
    }

    finishAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/welcome', { replace: true })
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  )
}
