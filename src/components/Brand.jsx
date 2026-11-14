import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

// The app's mark: one rounded blue tile, used everywhere the product names itself.
export function BrandMark({ size = 'md', className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-b from-[rgb(64,140,255)] to-[rgb(30,98,228)] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]',
        size === 'lg' ? 'h-14 w-14 rounded-[18px] text-xl' : 'h-8 w-8 rounded-[10px] text-[13px]',
        className,
      )}
    >
      F1
    </span>
  )
}

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-[15px] font-semibold text-ink">Tax Helper</span>
    </Link>
  )
}
