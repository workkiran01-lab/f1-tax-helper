import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Info, Lock, Mail, ScrollText, TriangleAlert } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import supabase from '../utils/supabase'
import { clearUserStorage, writeStored } from '../utils/storage.js'
import { displayNameFor, initialOf, universityFor } from '../utils/displayName.js'
import { PageHeader } from '../components/app/PageHeader'
import { Sequence, SequenceItem, Sheet } from '../components/app/motion'
import { ThemePicker } from '../components/app/ThemeSwitch'
import IconTile from '../components/app/IconTile'

const card = 'rounded-3xl border border-line bg-surface'
const inputClass =
  'w-full min-h-12 rounded-xl border border-line bg-surface-2 px-4 text-[17px] text-ink'
const LINKS = [
  ['/about', 'About F1 Tax Helper', Info, 'blue'],
  ['/disclaimer', 'Disclaimer', TriangleAlert, 'amber'],
  ['/privacy', 'Privacy Policy', Lock, 'green'],
  ['/terms', 'Terms', ScrollText, 'grey'],
  ['/contact', 'Contact', Mail, 'teal'],
]
const groupTitle = 'mb-2 px-1 text-[13px] font-medium text-ink-3'

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
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

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
    <main className="mx-auto w-full max-w-2xl px-5 pb-8 lg:px-10 lg:pb-12">
      <PageHeader title="Account" account={false} />

      <Sequence className="mt-6 space-y-7">
        <SequenceItem as="section" className="flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[rgb(64,140,255)] to-[rgb(112,72,236)] text-[32px] font-bold text-white shadow-float">
            {initialOf(shownName)}
          </span>
          <p className="mt-3 text-[22px] font-bold text-ink">{shownName}</p>
          <p className="text-[15px] text-ink-3">
            {user?.is_guest ? 'Guest · saved in this browser only' : user?.email}
          </p>
        </SequenceItem>

        {user?.is_guest && (
          <SequenceItem as="section" className="hero-surface rounded-4xl p-5">
            <h2 className="text-[20px] font-bold">Keep your progress</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-white/90">
              Sign in with Google to use your account on other devices. Guest progress stays
              separate and is not copied into the account.
            </p>
            <Link
              to="/login"
              className="press mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-[rgb(24,64,180)] hover:bg-white/90"
            >
              Sign in with Google
            </Link>
          </SequenceItem>
        )}

        <SequenceItem as="section" aria-labelledby="appearance-title">
          <h2 id="appearance-title" className={groupTitle}>
            Appearance
          </h2>
          <div className={`${card} p-3`}>
            <ThemePicker />
            <p className="px-1 pt-3 text-[13px] text-ink-3">
              Automatic follows your device’s light or dark setting.
            </p>
          </div>
        </SequenceItem>

        <SequenceItem as="section" aria-labelledby="profile-title">
          <h2 id="profile-title" className={groupTitle}>
            Profile
          </h2>
          <form onSubmit={saveProfile} className={`${card} space-y-4 p-5`}>
            <div>
              <label htmlFor="acc-name" className="mb-1.5 block text-[15px] font-medium text-ink">
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
              <label htmlFor="acc-school" className="mb-1.5 block text-[15px] font-medium text-ink">
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
                className="min-h-11 rounded-full bg-surface-2 px-5 text-[15px] font-semibold text-ink hover:bg-surface-3"
              >
                Save changes
              </button>
              <p role="status" className="text-[15px] text-ok-ink">
                {saved}
              </p>
            </div>
          </form>
        </SequenceItem>

        <SequenceItem as="section" aria-labelledby="help-title">
          <h2 id="help-title" className={groupTitle}>
            Help and legal
          </h2>
          <nav aria-label="Help and legal" className={`${card} overflow-hidden`}>
            {LINKS.map(([to, label, icon, tone], index) => (
              <Link
                key={to}
                to={to}
                className={`row-press flex min-h-[52px] items-center gap-3 px-4 text-[17px] text-ink transition-colors hover:bg-surface-2 ${index ? 'border-t border-line' : ''}`}
              >
                <IconTile icon={icon} tone={tone} size="sm" />
                <span className="flex-1">{label}</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-4" />
              </Link>
            ))}
          </nav>
        </SequenceItem>

        <SequenceItem as="section" className="space-y-3">
          <div className={`${card} overflow-hidden`}>
            <button
              type="button"
              onClick={handleSignOut}
              className="row-press flex min-h-[52px] w-full items-center justify-center text-[17px] font-medium text-tint-ink hover:bg-surface-2"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="row-press flex min-h-[52px] w-full items-center justify-center border-t border-line text-[17px] font-medium text-bad-ink hover:bg-surface-2"
            >
              {user?.is_guest ? 'Delete my saved data' : 'Delete account'}
            </button>
          </div>
          {signOutError && (
            <p role="alert" className="px-1 text-sm text-warn-ink">
              {signOutError}
            </p>
          )}
          {user?.is_guest && (
            <p className="px-1 text-[13px] text-ink-3">
              Signing out of guest mode clears guest progress.
            </p>
          )}
        </SequenceItem>
      </Sequence>

      <Sheet
        open={confirming}
        onClose={() => !deleting && setConfirming(false)}
        labelledBy="delete-title"
        tone="danger"
      >
        <h2 id="delete-title" className="text-xl font-bold text-ink">
          {user?.is_guest ? 'Delete your saved data?' : 'Delete your account?'}
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-ink-2">
          {user?.is_guest
            ? 'This clears your saved app data in this browser.'
            : 'This requests deletion of your account and clears saved app data in this browser after the request succeeds.'}{' '}
          PDFs already downloaded to your device are not removed. This cannot be undone.
        </p>
        {deleteError && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad-ink"
          >
            {deleteError}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={deleting}
            onClick={() => {
              setConfirming(false)
              setDeleteError('')
            }}
            className="min-h-12 rounded-2xl bg-surface-2 px-5 text-[15px] font-semibold text-ink hover:bg-surface-3 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="min-h-12 rounded-2xl bg-red-600 px-5 text-[15px] font-semibold text-white hover:bg-bad disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Sheet>
    </main>
  )
}
