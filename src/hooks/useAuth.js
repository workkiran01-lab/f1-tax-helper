import { createContext, createElement, useContext, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'
import { clearUserStorage, readStored, writeStored, removeStored } from '../utils/storage.js'
const AuthContext = createContext(null)
const GUEST_SESSION_KEY = 'f1_guest_session'
const GUEST_USER = {
  id: 'guest',
  email: null,
  is_guest: true,
  app_metadata: { provider: 'guest' },
  user_metadata: {},
}
const guestUser = () => (readStored(GUEST_SESSION_KEY) === true ? GUEST_USER : null)
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(guestUser)
  const [loading, setLoading] = useState(Boolean(supabase))
  useEffect(() => {
    if (!supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) removeStored(GUEST_SESSION_KEY)
      setUser(session?.user || guestUser())
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])
  const signInAsGuest = useCallback(
    (path = '/welcome') => {
      writeStored(GUEST_SESSION_KEY, true)
      setUser(GUEST_USER)
      setLoading(false)
      navigate(path)
    },
    [navigate],
  )
  const signOut = useCallback(
    async (path = '/login') => {
      if (supabase && user && !user.is_guest) {
        const { error } = await supabase.auth.signOut({ scope: 'local' })
        if (error) throw new Error('Sign out failed. Please try again.')
      }
      clearUserStorage(user?.id || 'guest')
      removeStored(GUEST_SESSION_KEY)
      setUser(null)
      navigate(typeof path === 'string' ? path : '/login')
    },
    [navigate, user],
  )
  return createElement(
    AuthContext.Provider,
    { value: { user, loading, signInAsGuest, signOut } },
    children,
  )
}
export default function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth requires AuthProvider')
  return auth
}
