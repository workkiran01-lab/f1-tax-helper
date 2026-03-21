import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'

export default function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getUser()

      if (!mounted) return

      setUser(data?.user ?? null)
      setLoading(false)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return

      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/login')
  }, [navigate])

  return { user, loading, signOut }
}
