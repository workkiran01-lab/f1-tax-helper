import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ClipboardList, Copy, Check } from 'lucide-react'
import { IRSDisclaimer } from './IRSDisclaimer'

const MAX_INPUT = 2000

function buildWelcomeMessage(initialContext) {
  if (initialContext?.answers) {
    const country = initialContext.answers.country || 'your home country'
    const items = Array.isArray(initialContext.actionItems)
      ? initialContext.actionItems
      : []
    const itemsText = items.length ? items.map((i) => `- ${i}`).join('\n') : ''

    return {
      id: 1,
      role: 'assistant',
      content: `Hi! 👋 I can see you're an F-1 student from ${country}. Based on your questionnaire, here's what I already know about your situation:${itemsText ? `\n${itemsText}` : ''}\n\nWhat questions do you have?`,
    }
  }

  return {
    id: 1,
    role: 'assistant',
    content:
      "Hi! 👋 I'm your F1 Tax Helper. I help international students navigate US taxes. What questions do you have?",
  }
}


const suggestedQuestions = [
  'Do I need to file taxes?',
  'What is Form 8843?',
  'Do I qualify for a tax treaty?',
  'What is the filing deadline?',
]

export function ChatMain({ initialContext, navigationKey, onOpenChecklist, onMessagesChange }) {
  const welcome = useMemo(
    () => buildWelcomeMessage(initialContext),
    [initialContext],
  )
  const [messages, setMessages] = useState([welcome])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)

  const copyMessage = useCallback((id, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  useEffect(() => {
    setMessages([welcome])
    setInput('')
  }, [welcome, navigationKey])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ]

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Token': import.meta.env.VITE_APP_SECRET },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `API error: ${res.status}`)
      }

      // Add placeholder assistant message for streaming
      const streamMessageId = messages.length + 2
      setMessages((prev) => [
        ...prev,
        { id: streamMessageId, role: 'assistant', content: '' },
      ])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const delta = parsed?.choices?.[0]?.delta?.content
              if (typeof delta === 'string') {
                setMessages((prev) => {
                  const next = [...prev]
                  const last = next[next.length - 1]
                  next[next.length - 1] = { ...last, content: last.content + delta }
                  return next
                })
              }
            } catch {
              // ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Trim final message in case of trailing whitespace
      setMessages((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        next[next.length - 1] = { ...last, content: last.content.trim() || "I couldn't generate a response. Please try again." }
        return next
      })
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          content: `Sorry, something went wrong: ${err.message}. Please check your connection and try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (question) => {
    setInput(question)
  }

  const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-transparent">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-3 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] shadow-lg shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100">AI Tax Assistant</h1>
            <p className="text-xs text-slate-300">
              Ask me anything about F1 taxes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            ● Online
          </span>
          <button
            onClick={onOpenChecklist}
            className="hidden items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-slate-100 transition-all hover:bg-white/10 md:flex"
          >
            <ClipboardList className="h-4 w-4" />
            My Checklist
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-white/[0.02] px-4 py-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {message.role === 'assistant' && (
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-xs">
                    🤖
                  </div>
                </div>
              )}
              <div
                className={`group/bubble relative w-full rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white'
                    : 'rounded-tl-sm border border-white/10 bg-white/5 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content.split('\n').map((line, i) => {
                    const parts = line.split(/(\*\*[^*]+\*\*)/g)
                    return (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={j} className="font-semibold">
                                {part.slice(2, -2)}
                              </strong>
                            )
                          }
                          return part
                        })}
                      </p>
                    )
                  })}
                </div>
                {message.role === 'assistant' && message.content && (
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-0 transition-opacity group-hover/bubble:opacity-100 hover:bg-white/10 hover:text-slate-300"
                    aria-label="Copy message"
                  >
                    {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
              {message.role === 'assistant' && <IRSDisclaimer />}
              <p className="mt-1 px-1 text-xs text-slate-500">{timestamp}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 text-slate-200">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 bg-slate-900/80 px-4 py-4 backdrop-blur-xl shrink-0">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleSuggestionClick(question)}
              className="cursor-pointer rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/10"
            >
              {question}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Ask about tax treaties, deductions, deadlines..."
              disabled={isLoading}
              maxLength={MAX_INPUT}
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 pr-16 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
            />
            {input.length > 0 && (
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${input.length > MAX_INPUT * 0.9 ? 'text-amber-400' : 'text-slate-600'}`}>
                {MAX_INPUT - input.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            ➤
            <span className="sr-only">Send message</span>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          AI responses are for informational purposes only. Consult a tax professional for advice.
        </p>
        <p className="mt-1 text-center text-xs text-slate-600">
          By using F1 Tax Helper you agree to our{' '}
          <Link to="/terms" className="underline transition-colors hover:text-slate-400">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline transition-colors hover:text-slate-400">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
