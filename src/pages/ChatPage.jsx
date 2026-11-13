import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { History, Plus } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { TAX_YEAR } from '../data/taxSeason.js'
import { readStored, seasonKey, writeStored } from '../utils/storage.js'
import { chatContextFor, currentTaxProfile } from '../utils/taxProfile.js'
import { displayNameFor, initialOf } from '../utils/displayName.js'
import { ChatHistory } from '../components/chat/ChatHistory'
import { ChatMain, StructuredMessage } from '../components/chat/ChatMain'
import DisclaimerBanner from '../components/DisclaimerBanner'

const loadConversations = (key) => {
  const stored = readStored(key, [])
  return Array.isArray(stored)
    ? stored.filter(
        (c) =>
          c &&
          typeof c.id === 'string' &&
          Array.isArray(c.messages) &&
          c.messages.every(
            (m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string',
          ),
      )
    : []
}

const iconButton =
  'flex h-11 w-11 items-center justify-center rounded-full border border-[#1e293b] bg-[#0f172a] text-[#f8fafc] transition-colors hover:border-[#2d4a6e]'

export default function ChatPage() {
  const { user } = useAuth()
  const uid = user?.id || 'guest'
  const chatStorageKey = seasonKey('conversations', uid)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState(() => loadConversations(chatStorageKey))
  const [selectedConversation, setSelectedConversation] = useState(null)

  const location = useLocation()
  const [navKey, setNavKey] = useState(location.key)
  const sessionId = useRef(crypto.randomUUID())

  // The assistant starts from the same status My Taxes shows.
  const profile = currentTaxProfile(user)
  const contextKey = JSON.stringify(chatContextFor(profile))
  const initialContext = useMemo(() => JSON.parse(contextKey), [contextKey])

  useEffect(() => {
    const escape = (e) => e.key === 'Escape' && setHistoryOpen(false)
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  useEffect(() => {
    setConversations(loadConversations(chatStorageKey))
  }, [chatStorageKey])

  useEffect(() => {
    if (location.key) {
      setNavKey(location.key)
      sessionId.current = crypto.randomUUID()
      setSelectedConversation(null)
    }
  }, [location.key])

  const handleSelectConversation = useCallback((conv) => {
    setSelectedConversation(conv)
    setHistoryOpen(false)
  }, [])

  const handleNewChat = useCallback(() => {
    setSelectedConversation(null)
    setNavKey(crypto.randomUUID())
    sessionId.current = crypto.randomUUID()
    setHistoryOpen(false)
  }, [])

  const handleMessagesChange = useCallback(
    (msgs) => {
      if (selectedConversation) return
      const firstUser = msgs.find((m) => m.role === 'user')
      const lastMsg = msgs[msgs.length - 1]
      if (!firstUser || lastMsg?.role !== 'assistant' || !lastMsg.content) return

      const id = sessionId.current
      const title = firstUser.content.slice(0, 40)
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === id)
        const newConv = {
          id,
          title,
          timestamp: existingIdx >= 0 ? prev[existingIdx].timestamp : Date.now(),
          messages: msgs,
        }
        const next =
          existingIdx >= 0
            ? prev.map((c, i) => (i === existingIdx ? newConv : c))
            : [newConv, ...prev]
        writeStored(chatStorageKey, next.slice(0, 50))
        return next
      })
    },
    [chatStorageKey, selectedConversation],
  )

  const name = displayNameFor(user) || (user?.is_guest ? 'Guest' : 'Student')

  return (
    <div className="relative flex h-[calc(100dvh-var(--tabbar))] flex-col overflow-hidden bg-[#080c14] text-[#cbd5e1] lg:h-dvh">
      <DisclaimerBanner />
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#1e293b] px-5 py-3 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Ask AI</h1>
          <p className="text-[13px] leading-snug text-[#94a3b8]">
            {profile
              ? `Using your status: ${profile.label.toLowerCase()}`
              : `Questions about ${TAX_YEAR} income`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label="Past conversations"
            className={`${iconButton} xl:hidden`}
          >
            <History aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            aria-label="New chat"
            className={iconButton}
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
          </button>
          <Link
            to="/account"
            aria-label="Account and settings"
            className={`${iconButton} text-[15px] font-semibold lg:hidden`}
          >
            {initialOf(name)}
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {historyOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 xl:hidden"
            onClick={() => setHistoryOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          inert={!historyOpen ? '' : undefined}
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out xl:hidden ${
            historyOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ChatHistory
            conversations={conversations}
            activeId={selectedConversation?.id}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onClose={() => setHistoryOpen(false)}
          />
        </div>
        <div className="hidden w-72 shrink-0 xl:block">
          <ChatHistory
            conversations={conversations}
            activeId={selectedConversation?.id}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {selectedConversation ? (
            <div id="past-conversation-view" className="flex min-h-0 flex-1 flex-col">
              <p className="shrink-0 truncate border-b border-[#1e293b] bg-[#0a0e1a] px-5 py-2.5 text-sm text-[#94a3b8]">
                Past conversation ·{' '}
                <span className="text-[#f8fafc]">{selectedConversation.title}</span>
              </p>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {selectedConversation.messages.map((message, index) => (
                  <div
                    key={message.id ?? index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 md:max-w-[70%] ${
                        message.role === 'user'
                          ? 'rounded-tr-sm bg-[#2563eb] text-white'
                          : 'rounded-tl-sm border border-[#1e293b] bg-[#0f172a] text-[#cbd5e1]'
                      }`}
                    >
                      <StructuredMessage content={message.content} isStreaming={false} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#1e293b] bg-[#0a0e1a] px-5 py-3">
                <p className="text-sm text-[#94a3b8]">Past conversations are read-only.</p>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="min-h-11 shrink-0 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                >
                  Start a new chat
                </button>
              </div>
            </div>
          ) : (
            <ChatMain
              key={`${uid}:${navKey}`}
              initialContext={initialContext}
              navigationKey={navKey}
              onMessagesChange={handleMessagesChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
