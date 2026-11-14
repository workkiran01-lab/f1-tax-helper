import { cn } from '../../utils/cn'

// A small coloured square behind an icon. Colour carries meaning across the
// app: blue for the student's status and forms, green for done, amber for
// dates, violet for the assistant, grey for settings.
const TONES = {
  blue: 'from-[rgb(64,140,255)] to-[rgb(30,98,228)]',
  green: 'from-[rgb(60,210,110)] to-[rgb(24,160,78)]',
  amber: 'from-[rgb(255,178,48)] to-[rgb(240,130,10)]',
  violet: 'from-[rgb(160,120,255)] to-[rgb(112,72,236)]',
  red: 'from-[rgb(255,110,100)] to-[rgb(226,54,54)]',
  teal: 'from-[rgb(60,200,210)] to-[rgb(14,140,160)]',
  grey: 'from-[rgb(150,152,164)] to-[rgb(108,110,122)]',
}
const SIZES = {
  sm: 'h-7 w-7 rounded-lg [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-9 w-9 rounded-[10px] [&>svg]:h-5 [&>svg]:w-5',
  lg: 'h-12 w-12 rounded-2xl [&>svg]:h-6 [&>svg]:w-6',
}

export default function IconTile({ icon: Icon, tone = 'blue', size = 'md', className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-b text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      <Icon strokeWidth={2.2} />
    </span>
  )
}
