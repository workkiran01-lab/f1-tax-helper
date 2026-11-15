import { BrandMark } from '../Brand'
import { cn } from '../../utils/cn'

// Grey placeholder blocks that shimmer while a screen loads. Reduced-motion users get
// still blocks (the global media query disables the animation).
export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />
}

// Stands in for a lazily loaded screen inside the app shell: a title, a hero card and
// two small cards, matching the layout of Home so nothing jumps when the page arrives.
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto w-full max-w-5xl px-5 pt-6 lg:px-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-56 !rounded-xl" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 !rounded-4xl" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-32 !rounded-3xl" />
            <Skeleton className="h-32 !rounded-3xl" />
          </div>
          <Skeleton className="h-48 !rounded-3xl" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

// Full-screen moment while the saved sign-in is checked.
export function SessionSplash() {
  return (
    <div
      role="status"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4"
    >
      <div className="splash-pulse">
        <BrandMark size="lg" />
      </div>
      <p className="text-sm text-ink-3">Checking your secure session…</p>
    </div>
  )
}
