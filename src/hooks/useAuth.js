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
  // Where a signed-out visitor on a protected screen is sent. Signing out sets
  // it to the requested destination; otherwise the route guard's own redirect
  // to /login would win the race against navigate() and override it.
  const [exitPath, setExitPath] = useState('/login')
  useEffect(() => {
    if (!supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        removeStored(GUEST_SESSION_KEY)
        setExitPath('/login')
      }
      setUser(session?.user || guestUser())
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])
  const signInAsGuest = useCallback(
    (path = '/home') => {
      writeStored(GUEST_SESSION_KEY, true)
      setUser(GUEST_USER)
      setExitPath('/login')
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
      const destination = typeof path === 'string' ? path : '/login'
      setExitPath(destination)
      setUser(null)
      navigate(destination)
    },
    [navigate, user],
  )
  return createElement(
    AuthContext.Provider,
    { value: { user, loading, exitPath, signInAsGuest, signOut } },
    children,
  )
}
export default function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth requires AuthProvider')
  return auth
}
