import { Plus, MessageSquare, User, X } from 'lucide-react'
import Button from '../ui/Button'

const chatHistory = [
  { id: 1, title: 'Tax filing requirements', date: 'Today' },
  { id: 2, title: 'FICA exemption question', date: 'Today' },
  { id: 3, title: '1040-NR vs 1040', date: 'Yesterday' },
  { id: 4, title: 'Tax treaty benefits', date: 'Yesterday' },
  { id: 5, title: 'W-2 form questions', date: 'Mar 5' },
  { id: 6, title: 'OPT tax obligations', date: 'Mar 3' },
]

export function ChatSidebar({ onClose }) {
  return (
    <div className="flex h-full flex-col bg-primary">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
            <span className="text-sm font-bold text-primary-foreground">F1</span>
          </div>
          <span className="font-semibold text-primary-foreground">Tax Helper</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <div className="px-3 pb-4">
        <Button
          className="w-full justify-start gap-2 border-0 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {chatHistory.map((chat, index) => (
            <div key={chat.id}>
              {(index === 0 || chatHistory[index - 1].date !== chat.date) && (
                <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground/50">
                  {chat.date}
                </p>
              )}
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  index === 0
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm">{chat.title}</span>
              </button>
            </div>
          ))}
        </div>
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
