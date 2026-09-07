import { clearUserStorage } from '../../utils/storage.js'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Settings, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import supabase from '../../utils/supabase'

const formatGroupLabel = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)

  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  if (date >= startOfWeek) return 'This Week'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

const groupConversations = (conversations) => {
  const groups = {}
  conversations.forEach((conv) => {
    const label = formatGroupLabel(conv.timestamp || Date.now())
    if (!groups[label]) groups[label] = []
    groups[label].push(conv)
  })
  return Object.entries(groups).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => b.timestamp - a.timestamp),
  }))
}

export function ChatSidebar({ conversations = [], onSelect, onNewChat, onClose }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const metadata = user?.user_metadata || {}
  const displayName =
    metadata.full_name || metadata.name || user?.email?.split('@')?.[0] || 'Student'
  const initial = useMemo(() => (displayName?.[0] || 'S').toUpperCase(), [displayName])

  const handleSignOut = async () => {
    try {
      await signOut('/')
    } catch (error) {
      setDeleteError(error.message)
      setShowDeleteModal(true)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')
    setDeleteMessage('')
    setDeleteLoading(true)

    try {
      if (!user?.is_guest) {
        const { error } = await supabase.rpc('delete_user')
        if (error) throw error
      }
      clearUserStorage(user?.id || 'guest')
      await signOut('/')
    } catch {
      setDeleteError(
        'Account deletion did not complete. Your saved data has not been deliberately cleared. Try again or contact support@f1taxhelper.com.',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowSettings(false)
        if (!deleteLoading) setShowDeleteModal(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <>
      <div className="flex h-full flex-col bg-[#0a0e1a] border-r border-[#1e293b]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">
              F1
            </div>
            <span className="font-semibold text-slate-100">Tax Helper</span>
          </div>
          <button onClick={onClose} aria-label="Close sidebar" className="p-2 text-body lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3 pb-4 shrink-0">
          <button
            onClick={onNewChat}
            className="flex w-full items-center justify-start gap-2 rounded-xl border border-[#1e293b] bg-transparent px-3 py-2 text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {conversations.length === 0 ? (
            <p className="px-4 py-2 text-sm text-slate-400">
              No conversations yet — ask your first question
            </p>
          ) : (
            groupConversations(conversations).map(({ label, items }) => (
              <div key={label} className="space-y-1">
                <h3 className="mb-2 px-3 text-[10px] font-mono uppercase tracking-widest text-[#475569]">
                  {label}
                </h3>
                <div className="space-y-1">
                  {items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelect && onSelect(conv)}
                      className="w-full truncate rounded-md px-3 py-2 text-left text-sm text-[#64748b] transition-colors hover:bg-[#131c2e] hover:text-[#f8fafc]"
                    >
                      <MessageSquare className="inline-block w-4 h-4 mr-2 opacity-70" />
                      {conv.title}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#1e293b] p-3">
          <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b] border border-[#2d4a6e] text-[#3b82f6] font-mono font-bold text-sm">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">{displayName}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || 'No email'}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="border border-[#22c55e]/20 text-[#22c55e] text-[10px] font-mono px-2 py-0.5 rounded">
                Free Plan
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="rounded-xl border border-[#1e293b] bg-transparent p-2 text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 w-full rounded-xl border border-[#1e293b] bg-transparent px-4 py-2 text-sm font-medium text-[#64748b] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
            >
              Sign Out
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="mt-2 w-full rounded-xl border border-[#ef4444]/20 bg-transparent px-4 py-2 text-sm font-medium text-[#ef4444]/70 transition-colors hover:border-[#ef4444]/40 hover:text-[#ef4444]"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-title"
              className="relative w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900/95 p-6 shadow-2xl"
            >
              <h3 id="delete-title" className="text-xl font-bold text-slate-100">
                Delete your account?
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This requests deletion of your account and clears saved app data in this browser
                after the request succeeds. PDFs already downloaded to your device are not removed.
                This cannot be undone.
              </p>
              {deleteError && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {deleteError}
                </p>
              )}
              {deleteMessage && (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {deleteMessage}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteError('')
                    setDeleteMessage('')
                  }}
                  disabled={deleteLoading}
                  className="rounded-xl border border-[#1e293b] bg-transparent px-4 py-2 text-sm font-semibold text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Settings panel — portalled to body to escape the sidebar's transform containing block */}
      {createPortal(
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
              showSettings ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setShowSettings(false)}
            aria-hidden
          />
          <div
            className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-[#1e293b] bg-[#0a0e1a] p-5 transition-transform duration-300 ease-in-out ${
              showSettings ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
                className="rounded-md p-1 text-slate-300 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Account
                </h4>
                <div className="mt-2 rounded-xl border border-[#1e293b] bg-[#0f172a] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e293b] border border-[#2d4a6e] text-[#3b82f6] font-mono font-bold text-sm">
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm text-slate-100">{displayName}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Preferences
                </h4>
                <div className="mt-2 rounded-xl border border-border bg-surface p-3 text-sm text-body">
                  <p>Dark appearance</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Animations follow your device's reduced-motion setting. Email notifications and
                    deadline reminders are not yet available.
                  </p>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  About
                </h4>
                <div className="mt-2 rounded-xl border border-[#1e293b] bg-[#0f172a] p-3 text-sm text-slate-300">
                  <p>F1 Tax Helper v1.0</p>
                  <div className="mt-2 flex flex-col gap-1 text-blue-300">
                    <Link to="/privacy" onClick={() => setShowSettings(false)}>
                      Privacy Policy
                    </Link>
                    <Link to="/terms" onClick={() => setShowSettings(false)}>
                      Terms
                    </Link>
                    <Link to="/contact" onClick={() => setShowSettings(false)}>
                      Contact
                    </Link>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Danger Zone
                </h4>
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full rounded-xl border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(false)
                      setShowDeleteModal(true)
                    }}
                    className="w-full rounded-xl border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    Delete Account
                  </button>
                </div>
              </section>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
