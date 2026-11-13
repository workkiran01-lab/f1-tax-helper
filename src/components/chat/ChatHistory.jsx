import { MessageSquare, Plus, X } from 'lucide-react'

const groupLabel = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const startOfDay = (offset) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
  if (date >= startOfDay(0)) return 'Today'
  if (date >= startOfDay(1)) return 'Yesterday'
  if (date >= startOfDay(7)) return 'This week'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const groupConversations = (conversations) => {
  const groups = new Map()
  for (const conv of [...conversations].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))) {
    const label = groupLabel(conv.timestamp || Date.now())
    groups.set(label, [...(groups.get(label) || []), conv])
  }
  return [...groups.entries()]
}

// Past conversations only. Account actions live on the Account page.
export function ChatHistory({ conversations = [], activeId, onSelect, onNewChat, onClose }) {
  return (
    <div className="flex h-full flex-col border-r border-line bg-chrome">
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <h2 className="text-sm font-semibold text-ink">Conversations</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversations"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2 xl:hidden"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div className="shrink-0 px-3 pb-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-line px-3 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New chat
        </button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-sm text-ink-3">
            Your conversations are saved in this browser and appear here.
          </p>
        ) : (
          groupConversations(conversations).map(([label, items]) => (
            <div key={label}>
              <h3 className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {label}
              </h3>
              {items.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => onSelect(conv)}
                  aria-current={conv.id === activeId ? 'true' : undefined}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors hover:bg-surface-2 hover:text-ink ${
                    conv.id === activeId ? 'bg-surface-2 text-ink' : 'text-ink-2'
                  }`}
                >
                  <MessageSquare aria-hidden="true" className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
