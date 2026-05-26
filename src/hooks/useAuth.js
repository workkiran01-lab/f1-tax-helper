import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../utils/supabase'

const GUEST_SESSION_KEY = 'f1_guest_session'
const GUEST_USER = {
  id: 'guest',
  email: null,
  is_guest: true,
  app_metadata: { provider: 'guest' },
  user_metadata: {},
}

function clearScopedUserStorage(uid) {
  if (!uid) return
  const keysToClean = [
    `f1_checklist_state_${uid}`,
    `f1-tax-helper-checklist_${uid}`,
    `f1-conversations_${uid}`,
    `display_name_${uid}`,
    `university_${uid}`,
  ]
  keysToClean.forEach((key) => localStorage.removeItem(key))
}

function hasGuestSession() {
  try {
    return localStorage.getItem(GUEST_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function setGuestSession(enabled) {
  try {
    if (enabled) localStorage.setItem(GUEST_SESSION_KEY, 'true')
    else localStorage.removeItem(GUEST_SESSION_KEY)
  } catch {
    // Ignore storage failures; the current in-memory auth state still updates.
  }
}

export default function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Don't call getUser() first — let onAuthStateChange be the single source of truth
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (session?.user) {
        setGuestSession(false)
        setUser(session.user)
      } else {
        setUser(hasGuestSession() ? GUEST_USER : null)
      }
      setLoading(false)  // only set false AFTER auth state is known
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signInAsGuest = useCallback((redirectTo = '/welcome') => {
    setGuestSession(true)
    setUser(GUEST_USER)
    navigate(redirectTo)
  }, [navigate])

  const signOut = useCallback(async (redirectTo = '/login') => {
    const nextPath = typeof redirectTo === 'string' ? redirectTo : '/login'
    clearScopedUserStorage(user?.id)
    setGuestSession(false)
    if (!user?.is_guest) {
      await supabase.auth.signOut()
    }
    setUser(null)
    navigate(nextPath)
  }, [navigate, user?.id, user?.is_guest])

  return { user, loading, signInAsGuest, signOut }
}
