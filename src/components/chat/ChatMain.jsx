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

  useEffect(() => {
    setMessages([welcome])
    setInput('')
  }, [welcome, navigationKey])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
    }
    setMessages([...messages, newMessage])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          content:
            "Thanks for your question! I'm processing your request and will provide personalized guidance based on your F-1 visa status. Please note that this is AI-generated guidance and you should verify with a licensed tax professional.",
        },
      ])
    }, 1000)
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
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a tax question..."
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
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
