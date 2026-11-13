import { readChatStream, safeIRSUrl } from '../../utils/chatStream.js'
import { fitChatHistory } from '../../../lib/chatLimits.js'
import { useEffect, useMemo, useState, useRef, useCallback, useId } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ChevronDown, Copy, LoaderCircle } from 'lucide-react'
import { AnimatedCheck } from '../Motion'
import { IRSDisclaimer } from './IRSDisclaimer'

const MAX_INPUT = 2000

function buildWelcomeMessage(initialContext) {
  if (initialContext?.answers) {
    const country = initialContext.answers.country
    const items = Array.isArray(initialContext.actionItems) ? initialContext.actionItems : []
    const itemsText = items.length ? items.map((i) => `- ${i}`).join('\n') : ''

    return {
      id: 1,
      role: 'assistant',
      createdAt: Date.now(),
      content: `Hi! 👋 I can see you're an F-1 student${country ? ` from ${country}` : ''}. Based on your saved answers, here's what I already know about your situation:${itemsText ? `\n${itemsText}` : ''}\n\nWhat questions do you have?`,
    }
  }

  return {
    id: 1,
    role: 'assistant',
    createdAt: Date.now(),
    content:
      "Hi! 👋 I'm your F1 Tax Helper. I help international students navigate US taxes. What questions do you have?",
  }
}

// Each message keeps the time it was created. Rendering "now" for every bubble
// made all timestamps identical and made them change on each re-render.
function formatTime(createdAt) {
  if (!Number.isFinite(createdAt)) return ''
  return new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const suggestedQuestions = [
  'Do I need to file taxes?',
  'What is Form 8843?',
  'Do I qualify for a tax treaty?',
  'What is the filing deadline?',
]

// ── Sectioned-answer parsing & rendering ────────────────────────────────────

const SECTION_TYPES = {
  Answer: 'answer',
  Why: 'why',
  'IRS Reference': 'reference',
  'Next Step': 'next',
}

// Parses the full accumulated content on every render (cheap at these sizes).
// A partially streamed header line (e.g. "### Ans") doesn't match the full-line
// regex, so it stays attached to the previous section until it completes.
function parseSections(content) {
  const headerRe = /^### (Answer|Why|IRS Reference|Next Step)\s*$/
  const lines = content.split('\n')
  const raw = []
  let current = { type: 'plain', lines: [] }
  let sawHeader = false

  for (const line of lines) {
    const m = line.match(headerRe)
    if (m) {
      sawHeader = true
      raw.push(current)
      current = { type: SECTION_TYPES[m[1]], lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  raw.push(current)

  if (!sawHeader) return { plain: content }

  const sections = raw
    .map((s) => ({ type: s.type, text: s.lines.join('\n').trim() }))
    .filter((s) => s.type !== 'plain' || s.text)
  return { sections }
}

function MarkdownLines({ text }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {text.split('\n').map((line, i) => {
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
  )
}

function WhySection({ text, isStreaming }) {
  const contentId = useId()
  // Expanded while streaming so text visibly arrives, collapsed once complete —
  // unless the user toggled it themselves. Historical messages mount collapsed.
  const [open, setOpen] = useState(isStreaming)
  const userToggled = useRef(false)
  const prevStreaming = useRef(isStreaming)

  useEffect(() => {
    if (prevStreaming.current && !isStreaming && !userToggled.current) {
      setOpen(false)
    }
    prevStreaming.current = isStreaming
  }, [isStreaming])

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          userToggled.current = true
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center gap-1.5"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-violet">WHY</span>
        <ChevronDown
          className={`h-3 w-3 text-violet transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={contentId}
        aria-hidden={!open}
        inert={open ? undefined : ''}
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-1.5 border-l-2 border-l-violet pl-3">
            <MarkdownLines text={text} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Markdown links, allowing one level of parentheses inside the URL.
const MARKDOWN_LINK = /\[([^\]]+)\]\(((?:[^()\s]|\([^()]*\))+)\)/g

function ReferenceSection({ text }) {
  const links = [...text.matchAll(MARKDOWN_LINK)].filter(([, , url]) => safeIRSUrl(url))
  // Models sometimes cite a publication by name or paste a bare URL. Keep that
  // text (unsafe Markdown links removed) instead of rendering an empty box.
  const fallback = links.length
    ? ''
    : text
        .replace(MARKDOWN_LINK, '')
        .split('\n')
        .map((line) => line.replace(/^\s*[-*]\s*/, '').trim())
        .filter(Boolean)
        .join('\n')
  if (!links.length && !fallback) return null
  return (
    <div className="rounded-lg border border-line bg-bg p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-5">
        IRS REFERENCE
      </p>
      {links.map(([, label, url], i) => (
        <a
          key={i}
          href={safeIRSUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-mono text-xs text-tint-ink hover:underline"
        >
          {label}
        </a>
      ))}
      {fallback && (
        <p className="whitespace-pre-wrap break-words font-mono text-xs text-ink-3">{fallback}</p>
      )}
    </div>
  )
}

export function StructuredMessage({ content, isStreaming }) {
  const parsed = parseSections(content)

  if (parsed.plain !== undefined) {
    return <MarkdownLines text={parsed.plain} />
  }

  return (
    <div className="space-y-3">
      {parsed.sections.map((section, i) => {
        switch (section.type) {
          case 'plain':
          case 'answer':
            return <MarkdownLines key={i} text={section.text} />
          case 'why':
            return <WhySection key={i} text={section.text} isStreaming={isStreaming} />
          case 'reference':
            return <ReferenceSection key={i} text={section.text} />
          case 'next':
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="text-tint-ink">→</span>
                <span className="text-sm font-medium text-tint-ink">{section.text}</span>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export function ChatMain({ initialContext, navigationKey, onMessagesChange }) {
  const welcome = useMemo(() => buildWelcomeMessage(initialContext), [initialContext])
  const [messages, setMessages] = useState([welcome])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const requestRef = useRef(null)
  const nearBottom = useRef(true)
  const [requestError, setRequestError] = useState('')

  const copyMessage = useCallback((id, content) => {
    navigator.clipboard
      ?.writeText(content)
      .then(() => {
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      })
      .catch(() => setRequestError('Copy is unavailable. Select and copy the text instead.'))
  }, [])

  useEffect(() => {
    if (nearBottom.current)
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!isLoading) onMessagesChange?.(messages)
  }, [messages, isLoading, onMessagesChange])

  useEffect(() => {
    requestRef.current?.abort()
    requestRef.current = null
    setMessages([welcome])
    setInput('')
    setIsLoading(false)
    setRequestError('')
    return () => {
      requestRef.current?.abort()
      requestRef.current = null
    }
  }, [welcome, navigationKey])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading || requestRef.current) return
    const controller = new AbortController()
    requestRef.current = controller
    const current = () => requestRef.current === controller && !controller.signal.aborted
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    const responseId = crypto.randomUUID()
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setRequestError('')
    nearBottom.current = true
    try {
      // Trim to the server's limits. Sending the raw history made every request
      // fail once an answer passed 4,000 characters or the total passed 24,000.
      const apiMessages = fitChatHistory([...messages, { role: 'user', content: text }], {
        pinFirst: true,
      })
      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          typeof body.error === 'string'
            ? body.error
            : 'AI chat is temporarily unavailable. Please try again.',
        )
      }
      if (!current()) return
      setMessages((prev) => [
        ...prev,
        { id: responseId, role: 'assistant', content: '', createdAt: Date.now() },
      ])
      let content = ''
      for await (const delta of readChatStream(res.body)) {
        if (!current()) return
        content += delta
        const value = content
        setMessages((prev) => prev.map((m) => (m.id === responseId ? { ...m, content: value } : m)))
      }
      if (!content.trim()) throw new Error('The AI returned an empty answer. Please try again.')
    } catch (error) {
      if (!current()) return
      setRequestError(
        error instanceof TypeError || !error?.message
          ? 'Could not reach the AI assistant. Check your connection and try again.'
          : error.message,
      )
      setInput(text)
      setMessages((prev) => prev.filter((m) => m.id !== responseId && m.id !== userMessage.id))
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setIsLoading(false)
      }
    }
  }

  const handleSuggestionClick = (question) => {
    setInput(question)
    inputRef.current?.focus()
  }

  // The typing indicator stands in for the answer until its first token arrives.
  const lastMessage = messages[messages.length - 1]
  const awaitingFirstToken =
    isLoading && !(lastMessage?.role === 'assistant' && lastMessage.content)
  const visibleMessages = messages.filter((m) => m.role !== 'assistant' || m.content)

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div
        onScroll={(e) => {
          const el = e.currentTarget
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 bg-bg px-4 py-6"
      >
        {visibleMessages.map((message) => (
          <div
            key={message.id}
            className={`motion-message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
            >
              <div
                className={`group/bubble relative w-full rounded-[22px] px-4 py-3 text-[15px] ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-tint text-white'
                    : 'rounded-bl-md bg-surface text-ink-2'
                }`}
              >
                {message.role === 'assistant' ? (
                  <StructuredMessage
                    content={message.content}
                    isStreaming={
                      isLoading &&
                      message.id === messages[messages.length - 1].id &&
                      message.role === 'assistant'
                    }
                  />
                ) : (
                  <MarkdownLines text={message.content} />
                )}
                {message.role === 'assistant' && message.content && (
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-0 transition-opacity group-hover/bubble:opacity-100 focus:opacity-100 hover:bg-white/10 hover:text-slate-300"
                    aria-label="Copy message"
                  >
                    {copiedId === message.id ? (
                      <AnimatedCheck className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
              {message.role === 'assistant' && <IRSDisclaimer />}
              {formatTime(message.createdAt) && (
                <p className="mt-1 px-1 text-xs text-slate-500">{formatTime(message.createdAt)}</p>
              )}
            </div>
          </div>
        ))}
        {awaitingFirstToken && (
          <div role="status" className="motion-message flex justify-start">
            <span className="sr-only">Preparing an answer…</span>
            <div className="max-w-[85%] sm:max-w-[70%] rounded-[22px] rounded-bl-md bg-surface px-4 py-3.5 text-ink-2">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-ink-3 [animation:typing-dot_1.2s_ease-in-out_infinite]" />
                <span className="h-2 w-2 rounded-full bg-ink-3 [animation:typing-dot_1.2s_ease-in-out_0.15s_infinite]" />
                <span className="h-2 w-2 rounded-full bg-ink-3 [animation:typing-dot_1.2s_ease-in-out_0.3s_infinite]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="material shrink-0 border-t border-line/70 px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] sm:flex-wrap">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={isLoading}
              onClick={() => handleSuggestionClick(question)}
              className="shrink-0 cursor-pointer rounded-full bg-surface-2 px-3.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-3 hover:text-ink disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
        {requestError && (
          <p role="alert" className="mb-3 text-sm text-warning">
            {requestError}
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              aria-label="Your tax question"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.nativeEvent.isComposing && !isLoading && handleSend()
              }
              placeholder="Ask about tax treaties, deductions, deadlines..."
              disabled={isLoading}
              maxLength={MAX_INPUT}
              className="min-h-12 w-full rounded-full border border-line bg-surface-2 px-5 pr-16 text-[16px] text-ink placeholder:text-ink-5 disabled:opacity-50"
            />
            {input.length > 0 && (
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${input.length > MAX_INPUT * 0.9 ? 'text-amber-400' : 'text-ink-5'}`}
              >
                {MAX_INPUT - input.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tint text-white hover:bg-tint-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
            )}
            <span className="sr-only">Send message</span>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ink-4">
          Do not share SSNs, passport numbers or tax documents here. AI answers can be wrong; verify
          before filing.
        </p>
        <p className="mt-1 text-center text-xs text-ink-5">
          By using F1 Tax Helper you agree to our{' '}
          <Link to="/terms" className="underline transition-colors hover:text-ink-2">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline transition-colors hover:text-ink-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
