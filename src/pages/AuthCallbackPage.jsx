import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
// Supabase processes the callback once; duplicating code exchange races the SDK.
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  useEffect(() => {
    if (!loading) navigate(user && !user.is_guest ? '/welcome' : '/login', { replace: true })
    const timer = setTimeout(() => navigate('/login', { replace: true }), 12000)
    return () => clearTimeout(timer)
  }, [user, loading, navigate])
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p role="status" className="text-body">
        Signing you in…
      </p>
    </div>
  )
}
