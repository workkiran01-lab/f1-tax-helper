import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FloatingChatButton({ state }) {
  return (
    <Link
      to="/chat"
      state={state}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
    >
      <MessageCircle className="h-4 w-4" />
      Chat
    </Link>
  )
}
