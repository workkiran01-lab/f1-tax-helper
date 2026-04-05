import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Settings, X } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import supabase from '../../utils/supabase'

const formatGroupLabel = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
  )

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

export function ChatSidebar({ conversations = [], onSelect, onNewChat }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showProModal, setShowProModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [deadlineReminders, setDeadlineReminders] = useState(true)

  const metadata = user?.user_metadata || {}
  const displayName = metadata.full_name || metadata.name || user?.email?.split('@')?.[0] || 'Student'
  const initial = useMemo(() => (displayName?.[0] || 'S').toUpperCase(), [displayName])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const handleDeleteAccount = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
    <div className="flex h-full flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur-xl">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6]">
            <span className="text-sm font-bold text-white">F1</span>
          </div>
          <span className="font-semibold text-slate-100">Tax Helper</span>
        </div>
      </div>

      <div className="px-3 pb-4 shrink-0">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-start gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-slate-100 transition-colors hover:bg-white/10"
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
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
              </h3>
              <div className="space-y-1">
                {items.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => onSelect && onSelect(conv)}
                    className="w-full truncate rounded-md px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
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

      <div className="border-t border-white/10 p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || 'No email'}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">Free Plan</span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-white/20 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowProModal(true)}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            ⚡ Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
    {showProModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-slate-900/95 p-8">
          <button
            type="button"
            onClick={() => setShowProModal(false)}
            className="absolute right-4 top-4 rounded-md p-1 text-slate-300 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100/90">
            COMING SOON
          </p>
          <h3 className="text-2xl font-bold text-slate-100">F1 Tax Helper Pro ⚡</h3>
          <p className="mt-2 text-sm text-slate-300">We&apos;re building something powerful for serious filers</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>✅ Auto-filled tax forms (1040-NR, 8843)</li>
            <li>✅ Email reminders for deadlines</li>
            <li>✅ Priority AI responses</li>
            <li>✅ Multi-visa support (H1B, OPT, J1)</li>
            <li>✅ Download ready-to-file PDF forms</li>
            <li>✅ Human CPA review add-on</li>
          </ul>
          <p className="mt-5 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-lg font-semibold text-transparent">
            Starting at $9.99/month
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              value={waitlistEmail}
              onChange={(e) => setWaitlistEmail(e.target.value)}
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              placeholder="Enter email"
            />
            <button className="rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-4 py-2 text-sm font-semibold text-white">
              Notify Me
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Join the waitlist. No spam, ever.</p>
        </div>
      </div>
    )}
    {showSettings && (
      <>
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowSettings(false)} aria-hidden />
        <div className="fixed left-0 right-0 top-0 z-[100] h-full w-full overflow-y-auto border-l border-white/10 bg-slate-900/95 p-5 backdrop-blur-xl sm:left-auto sm:w-80">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-sm font-medium text-slate-200 hover:text-white"
            >
              ← Settings
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="rounded-md p-1 text-slate-300 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-5">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</h4>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] text-sm font-semibold text-white">
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
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferences</h4>
              <div className="mt-2 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                <label className="flex items-center justify-between text-slate-300">
                  Email notifications
                  <input type="checkbox" checked={emailNotifications} onChange={() => setEmailNotifications((v) => !v)} />
                </label>
                <label className="flex items-center justify-between text-slate-300">
                  Tax deadline reminders
                  <input type="checkbox" checked={deadlineReminders} onChange={() => setDeadlineReminders((v) => !v)} />
                </label>
                <div className="flex items-center justify-between text-slate-500" title="Default theme">
                  Dark mode
                  <input type="checkbox" checked disabled />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">About</h4>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <p>F1 Tax Helper v1.0</p>
                <div className="mt-2 flex flex-col gap-1 text-blue-300">
                  <Link to="/privacy">Privacy Policy</Link>
                  <Link to="/terms">Terms</Link>
                  <Link to="/contact">Contact</Link>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Danger Zone</h4>
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
                  onClick={handleDeleteAccount}
                  className="w-full rounded-xl border border-red-500/30 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </div>
      </>
    )}
    </>
  )
}
