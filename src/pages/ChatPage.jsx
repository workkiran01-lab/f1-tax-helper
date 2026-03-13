import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ChatMain } from '../components/chat/ChatMain'
import Button from '../components/ui/Button'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { answers, actionItems } = location.state || {}

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border bg-card p-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-semibold text-primary-foreground">F1</span>
            </div>
            <span className="font-semibold text-foreground">F1 Tax Assistant</span>
          </div>
        </div>

        <ChatMain
          initialContext={{ answers, actionItems }}
          navigationKey={location.key}
        />
      </div>
    </div>
  )
}
