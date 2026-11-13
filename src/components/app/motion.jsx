import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'

// Two springs for the whole app. `snappy` answers a touch (tab highlight,
// toggles); `settle` moves larger things (screens, sheets, the progress ring).
export const snappy = { type: 'spring', stiffness: 520, damping: 38, mass: 0.9 }
export const settle = { type: 'spring', stiffness: 260, damping: 30, mass: 1 }

// A screen arriving. Tabs rise into place; step-by-step flows push in from the
// side, so the motion says whether you moved across the app or deeper into it.
export function ScreenTransition({ screenKey, push = false, children }) {
  return (
    <motion.div
      key={screenKey}
      initial={push ? { opacity: 0, x: 28 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={settle}
    >
      {children}
    </motion.div>
  )
}

// One orchestrated arrival for a screen's main blocks, in reading order.
export function Sequence({ children, className, as = 'div' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial="hidden"
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }}
    >
      {children}
    </Tag>
  )
}
export function SequenceItem({ children, className, as = 'div', ...props }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: settle } }}
      {...props}
    >
      {children}
    </Tag>
  )
}

// A number that counts to its value instead of snapping.
export function CountUp({ value, className }) {
  const ref = useRef(null)
  const previous = useRef(0)
  const reduced = useReducedMotion()
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduced) {
      node.textContent = String(value)
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, {
      duration: 0.7,
      ease: [0.32, 0.72, 0, 1],
      onUpdate: (v) => {
        node.textContent = String(Math.round(v))
      },
    })
    previous.current = value
    return () => controls.stop()
  }, [value, reduced])
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  )
}

// Progress as a ring that draws itself. The accessible value lives on the
// wrapper; the drawing is decoration.
export function ProgressRing({ value, total, size = 64, stroke = 6, label, children }) {
  const radius = (size - stroke) / 2
  const fraction = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg aria-hidden="true" width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-line"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-tint"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: fraction }}
          transition={{ ...settle, delay: 0.25 }}
          style={{ opacity: fraction === 0 ? 0 : 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

// A dialog that rises from the bottom edge on phones and scales in at the
// centre on larger screens. Rendered at the document root so page transforms
// never offset it.
export function Sheet({ open, onClose, labelledBy, children, tone = 'default' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onClose?.()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={`relative w-full max-w-md rounded-t-4xl border bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-sheet sm:rounded-4xl sm:pb-6 ${
              tone === 'danger' ? 'border-bad/30' : 'border-line'
            }`}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={settle}
          >
            <div
              aria-hidden="true"
              className="mx-auto mb-4 h-1 w-9 rounded-full bg-line-strong sm:hidden"
            />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
