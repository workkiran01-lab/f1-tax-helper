import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ChatMain } from '../components/chat/ChatMain'
import { ChatChecklistPanel } from '../components/chat/ChatChecklistPanel'
import DisclaimerBanner from '../components/DisclaimerBanner'
import Button from '../components/ui/Button'
import { X } from 'lucide-react'

const CHAT_STORAGE_KEY = 'f1-conversations'

const loadConversations = () => {
  const stored = localStorage.getItem(CHAT_STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [conversations, setConversations] = useState(loadConversations)
  const [selectedConversation, setSelectedConversation] = useState(null)
  
  const location = useLocation()
  const [navKey, setNavKey] = useState(location.key)
  const sessionId = useRef(Date.now().toString())
  
  const { answers, actionItems } = location.state || {}

  const initialContext = useMemo(() => ({ answers, actionItems }), [answers, actionItems])
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), [])
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    if (location.key) {
      setNavKey(location.key)
      sessionId.current = Date.now().toString()
      setSelectedConversation(null)
      setChecklistOpen(false)
    }
  }, [location.key])

  const handleSelectConversation = useCallback((conv) => {
    setSelectedConversation(conv)
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  const handleNewChat = useCallback(() => {
    setSelectedConversation(null)
    setNavKey(Date.now().toString())
    sessionId.current = Date.now().toString()
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      // We only want to save the active conversation, so if a past one is selected, do nothing
      if (document.getElementById('past-conversation-view')) return

      const chatContainer = document.querySelector('.flex-1.space-y-4.overflow-y-auto.p-4')
      if (!chatContainer) return
      
      const messageNodes = chatContainer.querySelectorAll('.flex.justify-start, .flex.justify-end')
      if (!messageNodes || messageNodes.length === 0) return

      const activeMsgs = Array.from(messageNodes).map((node, i) => {
        const role = node.classList.contains('justify-end') ? 'user' : 'assistant'
        const contentNode = node.querySelector('.whitespace-pre-wrap')
        return {
          id: i + 1,
          role,
          content: contentNode ? contentNode.innerText : ''
        }
      }).filter(m => m.content)

      if (activeMsgs.length > 0) {
        const firstUser = activeMsgs.find(m => m.role === 'user')
        const lastMsg = activeMsgs[activeMsgs.length - 1]

        // Only save when the AI has responded
        if (firstUser && lastMsg.role === 'assistant') {
          const currentConvs = loadConversations()
          const id = sessionId.current
          const title = firstUser.content.slice(0, 30)

          const existingIdx = currentConvs.findIndex(c => c.id === id)
          const newConv = {
            id,
            title,
            timestamp: existingIdx >= 0 ? currentConvs[existingIdx].timestamp : Date.now(),
            messages: activeMsgs
          }

          if (existingIdx >= 0) {
            currentConvs[existingIdx] = newConv
          } else {
            currentConvs.unshift(newConv)
          }

          localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(currentConvs))
          setConversations(currentConvs)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-background flex-col">
      <DisclaimerBanner />
      <div className="flex flex-1 min-h-0">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
          onClick={handleCloseSidebar}
          aria-hidden
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ChatSidebar 
          conversations={conversations} 
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {selectedConversation ? (
          <div id="past-conversation-view" className="flex flex-1 flex-col h-full bg-background overflow-hidden relative z-10">
            <div className="hidden items-center gap-3 border-b border-border bg-card p-4 lg:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                <span className="text-sm">F1</span>
              </div>
              <div>
                <h1 className="font-semibold text-foreground">F1 Tax Assistant</h1>
                <p className="text-xs text-muted-foreground">{selectedConversation.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-b border-border bg-card p-4 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenSidebar}
                className="text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <span className="text-sm font-semibold text-primary-foreground">F1</span>
                </div>
                <span className="font-semibold text-foreground">Past Conversation</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-muted text-foreground'
                        : 'rounded-bl-md bg-primary text-primary-foreground'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-card p-4 flex justify-center shrink-0">
              <p className="text-sm text-muted-foreground">This is a past conversation. Click &quot;New Chat&quot; to start a new one.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col h-full overflow-hidden relative z-10">
            <div className="flex items-center gap-3 border-b border-border bg-card p-4 lg:hidden shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenSidebar}
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

            <div className="flex-1 overflow-hidden relative">
              <ChatMain
                initialContext={initialContext}
                navigationKey={navKey}
                onOpenChecklist={() => setChecklistOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      <div
        className={`fixed inset-y-0 right-0 z-50 w-[380px] transform bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:border-l lg:border-border lg:shadow-none ${
          checklistOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <h2 className="font-semibold text-foreground">My Checklist</h2>
          <button
            onClick={() => setChecklistOpen(false)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <ChatChecklistPanel />
        </div>
      </div>
      </div>
    </div>
  )
}
