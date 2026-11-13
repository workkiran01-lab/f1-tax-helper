import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import supabase from '../utils/supabase'
import { clearUserStorage, writeStored } from '../utils/storage.js'
import { displayNameFor, initialOf, universityFor } from '../utils/displayName.js'
import { PageHeader } from '../components/app/PageHeader'

const card = 'rounded-2xl border border-[#1e293b] bg-[#0f172a]'
const inputClass =
  'w-full min-h-12 rounded-xl border border-[#1e293b] bg-[#080c14] px-4 text-[15px] text-[#f8fafc] focus:border-[#3b82f6] focus:outline-none'
const LINKS = [
  ['/about', 'About F1 Tax Helper'],
  ['/disclaimer', 'Disclaimer'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms'],
  ['/contact', 'Contact'],
]

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const uid = user?.id || 'guest'
  const [name, setName] = useState(displayNameFor(user))
  const [university, setUniversity] = useState(universityFor(user))
  const [saved, setSaved] = useState('')
  const [signOutError, setSignOutError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const cancelRef = useRef(null)

  useEffect(() => {
    if (!confirming) return
    cancelRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && !deleting && setConfirming(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirming, deleting])

  const saveProfile = async (event) => {
    event.preventDefault()
    const n = name.trim()
    const u = university.trim()
    if (!n || !u) return
    writeStored(`display_name_${uid}`, n)
    writeStored(`university_${uid}`, u)
    let message = 'Saved.'
    if (supabase && !user?.is_guest) {
      const { error } = await supabase.auth
        .updateUser({ data: { display_name: n, university: u } })
        .catch((e) => ({ error: e }))
      if (error) message = 'Saved in this browser. Account sync is temporarily unavailable.'
    }
    setSaved(message)
  }

  const handleSignOut = async () => {
    setSignOutError('')
    try {
      await signOut('/')
    } catch (error) {
      setSignOutError(error.message || 'Sign out failed. Please try again.')
    }
  }

  const handleDelete = async () => {
    setDeleteError('')
    setDeleting(true)
    try {
      if (!user?.is_guest) {
        const { error } = await supabase.rpc('delete_user')
        if (error) throw error
      }
      clearUserStorage(uid)
      await signOut('/')
    } catch {
      setDeleteError(
        'Account deletion did not complete. Your saved data has not been deliberately cleared. Try again or contact support@f1taxhelper.com.',
      )
      setDeleting(false)
    }
  }

  const shownName = displayNameFor(user) || (user?.is_guest ? 'Guest' : 'Student')

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-5 py-6 lg:px-10 lg:py-10">
      <PageHeader title="Account" account={false} />

      <section className={`${card} flex items-center gap-4 p-5`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#2d4a6e] bg-[#10233f] text-lg font-semibold text-[#93c5fd]">
          {initialOf(shownName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f8fafc]">{shownName}</p>
          <p className="text-sm text-[#94a3b8]">
            {user?.is_guest ? 'Guest · saved in this browser only' : user?.email}
          </p>
        </div>
      </section>

      {user?.is_guest && (
        <section className="rounded-2xl border border-[#2d4a6e] bg-[#0f172a] p-5">
          <h2 className="text-[15px] font-semibold text-[#f8fafc]">Keep your progress</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#94a3b8]">
            Sign in with Google to use your account on other devices. Guest progress stays separate
            and is not copied into the account.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Sign in with Google
          </Link>
        </section>
      )}

      <section aria-labelledby="profile-title" className={`${card} p-5`}>
        <h2 id="profile-title" className="text-base font-semibold text-[#f8fafc]">
          Profile
        </h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div>
            <label htmlFor="acc-name" className="mb-1.5 block text-sm font-medium text-[#f8fafc]">
              Full name
            </label>
            <input
              id="acc-name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved('')
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="acc-school" className="mb-1.5 block text-sm font-medium text-[#f8fafc]">
              University
            </label>
            <input
              id="acc-school"
              required
              autoComplete="organization"
              value={university}
              onChange={(e) => {
                setUniversity(e.target.value)
                setSaved('')
              }}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="min-h-11 rounded-xl border border-[#1e293b] px-4 text-sm font-semibold text-[#f8fafc] transition-colors hover:border-[#2d4a6e]"
            >
              Save changes
            </button>
            <p role="status" className="text-sm text-[#94a3b8]">
              {saved}
            </p>
          </div>
        </form>
      </section>

      <nav aria-label="Help and legal" className={card}>
        {LINKS.map(([to, label], index) => (
          <Link
            key={to}
            to={to}
            className={`flex min-h-12 items-center justify-between px-5 text-sm text-[#f8fafc] transition-colors hover:bg-[#131c2e] ${index ? 'border-t border-[#1e293b]' : ''}`}
          >
            {label}
            <ChevronRight aria-hidden="true" className="h-4 w-4 text-[#94a3b8]" />
          </Link>
        ))}
      </nav>

      <section className="space-y-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="min-h-12 w-full rounded-xl border border-[#1e293b] text-sm font-semibold text-[#f8fafc] transition-colors hover:border-[#2d4a6e]"
        >
          Sign out
        </button>
        {signOutError && (
          <p role="alert" className="text-sm text-[#fbbf24]">
            {signOutError}
          </p>
        )}
        {user?.is_guest && (
          <p className="text-xs text-[#94a3b8]">Signing out of guest mode clears guest progress.</p>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-12 w-full rounded-xl border border-red-500/30 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
        >
          {user?.is_guest ? 'Delete my saved data' : 'Delete account'}
        </button>
      </section>

      {confirming && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#0f172a] p-6"
          >
            <h2 id="delete-title" className="text-xl font-bold text-[#f8fafc]">
              {user?.is_guest ? 'Delete your saved data?' : 'Delete your account?'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#cbd5e1]">
              {user?.is_guest
                ? 'This clears your saved app data in this browser.'
                : 'This requests deletion of your account and clears saved app data in this browser after the request succeeds.'}{' '}
              PDFs already downloaded to your device are not removed. This cannot be undone.
            </p>
            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                disabled={deleting}
                onClick={() => {
                  setConfirming(false)
                  setDeleteError('')
                }}
                className="min-h-11 rounded-xl border border-[#1e293b] px-4 text-sm font-semibold text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
