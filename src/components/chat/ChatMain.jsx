import { readChatStream, safeIRSUrl } from '../../utils/chatStream.js'
import { TAX_YEAR, FILING_YEAR } from '../../data/taxSeason.js'
import { useEffect, useMemo, useState, useRef, useCallback, useId } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ClipboardList, Copy, LoaderCircle, Send } from 'lucide-react'
import { AnimatedCheck } from '../Motion'
import { IRSDisclaimer } from './IRSDisclaimer'

const MAX_INPUT = 2000

function buildWelcomeMessage(initialContext) {
  if (initialContext?.answers) {
    const country = initialContext.answers.country || 'your home country'
    const items = Array.isArray(initialContext.actionItems) ? initialContext.actionItems : []
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
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#8b5cf6]">WHY</span>
        <ChevronDown
          className={`h-3 w-3 text-[#8b5cf6] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
          <div className="mt-1.5 border-l-2 border-l-[#8b5cf6] pl-3">
            <MarkdownLines text={text} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReferenceSection({ text }) {
  const links = [...text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].filter(([, , url]) =>
    safeIRSUrl(url),
  )
  return (
    <div className="rounded-lg border border-[#1e293b] bg-[#080c14] p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#475569]">
        IRS REFERENCE
      </p>
      {links.map(([, label, url], i) => (
        <a
          key={i}
          href={safeIRSUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-mono text-xs text-[#3b82f6] hover:underline"
        >
          {label}
        </a>
      ))}
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
                <span className="text-[#3b82f6]">→</span>
                <span className="text-sm font-medium text-[#3b82f6]">{section.text}</span>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export function ChatMain({ initialContext, navigationKey, onOpenChecklist, onMessagesChange }) {
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
    const userMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    const responseId = crypto.randomUUID()
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setRequestError('')
    nearBottom.current = true
    try {
      const apiMessages = [
        ...messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ].slice(-20)
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
      setMessages((prev) => [...prev, { id: responseId, role: 'assistant', content: '' }])
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
      setRequestError(error.message)
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

  const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0a0e1a] px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs font-bold border border-[#1e293b] px-2 py-1 text-[#3b82f6]">
            AX
          </div>
          <div>
            <h1 className="font-mono text-[10px] uppercase tracking-widest text-[#3b82f6]">
              AI TAX ASSISTANT
            </h1>
            <p className="text-xs text-[#64748b]">Questions about {TAX_YEAR} income</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            {FILING_YEAR} season
          </span>
          <button
            onClick={onOpenChecklist}
            className="inline-flex items-center gap-2 rounded-xl border border-[#1e293b] bg-transparent px-3 py-2 text-sm text-[#cbd5e1] transition-colors hover:border-[#2d4a6e] hover:text-[#f8fafc]"
          >
            <ClipboardList className="h-4 w-4" />
            My Checklist
          </button>
        </div>
      </div>

      <div
        onScroll={(e) => {
          const el = e.currentTarget
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 bg-[#080c14] px-4 py-6"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`motion-message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}
            >
              <div
                className={`group/bubble relative w-full rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'rounded-tr-sm bg-[#3b82f6] text-white'
                    : 'rounded-tl-sm border border-[#1e293b] border-l-2 border-l-[#3b82f6] bg-[#0f1629] text-[#cbd5e1]'
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
              <p className="mt-1 px-1 text-xs text-slate-500">{timestamp}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div role="status" className="motion-message flex justify-start">
            <span className="sr-only">Preparing an answer…</span>
            <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tl-sm border border-[#1e293b] border-l-2 border-l-[#3b82f6] bg-[#0f1629] px-4 py-3 text-[#cbd5e1]">
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

      <div
        className="border-t border-[#1e293b] bg-[#0a0e1a] px-4 py-4 shrink-0"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-3 hidden sm:flex flex-wrap gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={isLoading}
              onClick={() => handleSuggestionClick(question)}
              className="motion-button cursor-pointer rounded-full border border-[#1e293b] bg-[#131c2e] text-xs px-3 py-1.5 text-[#64748b] hover:bg-[#1a2540] hover:border-[#2d4a6e] hover:text-[#cbd5e1] disabled:opacity-50"
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
              className="w-full rounded-xl border border-[#1e293b] bg-[#131c2e] px-4 py-3 pr-16 text-sm text-[#f8fafc] placeholder:text-[#475569] focus:border-[#3b82f6] focus:outline-none transition-colors disabled:opacity-50"
            />
            {input.length > 0 && (
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${input.length > MAX_INPUT * 0.9 ? 'text-amber-400' : 'text-slate-600'}`}
              >
                {MAX_INPUT - input.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="motion-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Send aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Do not share SSNs, passport numbers or tax documents here. AI answers can be wrong; verify
          before filing.
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
