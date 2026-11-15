import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

// A quiet, always-present statement of what this app is. It replaces the old yellow
// banner that sat above every screen; the one-time acknowledgement is DisclaimerGate.
export default function DisclaimerNote({ className }) {
  return (
    <p
      className={cn(
        'mx-auto max-w-2xl px-5 pb-6 pt-2 text-center text-xs leading-relaxed text-ink-4',
        className,
      )}
    >
      General information, not tax or legal advice. Check with a qualified tax professional or your
      school’s DSO before filing.{' '}
      <Link to="/disclaimer" className="underline underline-offset-2 hover:text-ink-2">
        Disclaimer
      </Link>
    </p>
  )
}
