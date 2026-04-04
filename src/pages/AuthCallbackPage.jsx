import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/welcome', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Signing you in...</p>
    </div>
  )
}