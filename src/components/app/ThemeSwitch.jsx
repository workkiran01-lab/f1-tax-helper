import { AnimatePresence, motion } from 'framer-motion'
import { Monitor, Moon, Sun } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import { cn } from '../../utils/cn'
import { snappy } from './motion'

// One tap between light and dark, from anywhere. The icon shows where the tap
// will take you; the sun and moon trade places as they turn.
export function ThemeToggle({ className }) {
  const { theme, setChoice } = useTheme()
  const next = theme === 'light' ? 'dark' : 'light'
  const Icon = theme === 'light' ? Moon : Sun
  return (
    <button
      type="button"
      onClick={(event) => setChoice(next, event)}
      aria-label={`Switch to ${next} appearance`}
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-ink hover:bg-surface-3',
        className,
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={snappy}
          className="flex"
        >
          <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

const OPTIONS = [
  { value: 'system', label: 'Automatic', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
]

// The full choice, for Account: follow the device, or pick one.
export function ThemePicker() {
  const { choice, setChoice } = useTheme()
  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-2 p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = choice === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={(event) => setChoice(value, event)}
            className={cn(
              'relative flex min-h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-medium transition-colors',
              selected ? 'text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            {selected && (
              <motion.span
                layoutId="theme-thumb"
                transition={snappy}
                className="absolute inset-0 rounded-xl bg-surface shadow-raised"
              />
            )}
            <Icon aria-hidden="true" className="relative h-4 w-4" />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
