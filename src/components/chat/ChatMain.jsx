import { useEffect, useMemo, useState } from 'react'
import { Send, Bot } from 'lucide-react'
import Button from '../ui/Button'

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

const GROQ_SYSTEM_PROMPT = `You are Alex, a friendly F-1 tax assistant who helps international students understand US taxes.

Speak like a helpful, knowledgeable friend — not a formal tax advisor.
Use simple language, short answers (2–4 sentences), and occasionally add a friendly emoji.

FOCUS ONLY ON F-1 STUDENT TAX TOPICS.

Key facts:
- F-1 students are usually NONRESIDENT aliens for their first 5 calendar years in the US
- During those 5 years they are generally EXEMPT from FICA (Social Security and Medicare taxes)
- All F-1 students must file Form 8843 every year, even if they had zero income
- Students with wage income usually file Form 1040-NR by April 15
- Students with no wage income usually file Form 8843 only by June 15
- Form 1042-S reports scholarships, fellowships, or treaty benefits
- Scholarships used for tuition are usually not taxable; room and board are taxable
- Many countries have tax treaties with the US (China, India, South Korea, etc.)
- F-1 nonresidents should NOT file Form 1040 (that form is for US residents/citizens)
- Many F-1 students use Sprintax to prepare 1040-NR and 8843

Common mistakes to warn about:
- Filing Form 1040 instead of 1040-NR
- Forgetting to file Form 8843 when having no income
- Missing a refund if FICA was wrongly withheld
- Forgetting to report income from Form 1042-S

Guidelines:
- Keep explanations simple and short
- Give practical examples when helpful
- If something is complicated or uncertain, say:
  "You might want to double-check this with your university's international office 😊"`

const suggestedQuestions = [
  'Do I need to file taxes?',
  'Am I FICA exempt?',
  'What is a 1040-NR?',
]

export function ChatMain({ initialContext, navigationKey }) {
  const welcome = useMemo(
    () => buildWelcomeMessage(initialContext),
    [initialContext],
  )
  const [messages, setMessages] = useState([welcome])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
        { role: 'system', content: GROQ_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ]

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: apiMessages,
          stream: true,
        }),
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

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="hidden items-center gap-3 border-b border-border bg-card p-4 lg:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">F1 Tax Assistant</h1>
          <p className="text-xs text-muted-foreground">
            AI-powered tax guidance for F-1 students
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
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
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-primary px-4 py-3 text-primary-foreground md:max-w-[70%]">
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-2">
        <div className="flex flex-wrap justify-center gap-2">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleSuggestionClick(question)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask a tax question..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          AI guidance only — always verify with a licensed tax professional
        </p>
      </div>
    </div>
  )
}
