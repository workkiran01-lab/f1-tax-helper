import { Plus, MessageSquare, User, X } from 'lucide-react'
import Button from '../ui/Button'

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
  return (
    <div className="flex h-full flex-col bg-primary">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
            <span className="text-sm font-bold text-primary-foreground">F1</span>
          </div>
          <span className="font-semibold text-primary-foreground">Tax Helper</span>
        </div>
      </div>

      <div className="px-3 pb-4 shrink-0">
        <button
          onClick={onNewChat}
          className="text-white border border-white/20 hover:bg-slate-800 px-3 py-2 rounded w-full justify-start gap-2 flex items-center"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {conversations.length === 0 ? (
          <p className="text-slate-400 text-sm px-4 py-2">
            No conversations yet — ask your first question
          </p>
        ) : (
          groupConversations(conversations).map(({ label, items }) => (
            <div key={label} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-primary-foreground/50 uppercase tracking-wider mb-2">
                {label}
              </h3>
              <div className="space-y-1">
                {items.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => onSelect && onSelect(conv)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-primary-foreground/10 hover:text-white rounded-md transition-colors truncate"
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

      <div className="border-t border-primary-foreground/10 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-primary-foreground">Student User</p>
            <p className="text-xs text-primary-foreground/50">Free Plan</p>
          </div>
        </button>
      </div>
    </div>
  )
}
