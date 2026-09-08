import { useEffect, useRef } from 'react'
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

function StepFrame({ children, direction, focusOnEnter }) {
  const reduced = useReducedMotion()
  const present = useIsPresent()
  const ref = useRef(null)
  const shouldFocus = useRef(focusOnEnter)

  useEffect(() => {
    if (!present || !shouldFocus.current) return
    const target = ref.current?.querySelector('h2') || ref.current
    target?.setAttribute('tabindex', '-1')
    target?.focus({ preventScroll: true })
  }, [present])

  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      inert={present ? undefined : ''}
      aria-hidden={present ? undefined : true}
      className="motion-step"
      custom={direction}
      variants={{
        enter: (d) => ({ opacity: 0, x: reduced ? 0 : d * 28 }),
        center: { opacity: 1, x: 0 },
        exit: (d) => ({ opacity: 0, x: reduced ? 0 : d * -18 }),
      }}
      initial={reduced ? false : 'enter'}
      animate="center"
      exit="exit"
      transition={{ duration: reduced ? 0 : 0.22, ease }}
    >
      {children}
    </motion.div>
  )
}

export function StepTransition({ stepKey, direction = 1, children, className = '' }) {
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
  }, [])
  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <StepFrame key={stepKey} direction={direction} focusOnEnter={mounted.current}>
          {children}
        </StepFrame>
      </AnimatePresence>
    </div>
  )
}

export function AnimatedProgress({ value, label, className = '', barClassName = '' }) {
  const reduced = useReducedMotion()
  const progress = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className={`motion-progress h-1.5 overflow-hidden rounded-full bg-[#1e293b] ${className}`}
    >
      <motion.div
        className={`relative h-full w-full origin-left rounded-full bg-[#3b82f6] ${barClassName}`}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        transition={{ duration: reduced ? 0 : 0.55, ease }}
      />
    </div>
  )
}

export function AnimatedCheck({ checked = true, className = 'h-4 w-4' }) {
  const reduced = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      initial={false}
      animate={{ scale: reduced ? 1 : checked ? [0.7, 1.16, 1] : 0.7 }}
      transition={{ duration: reduced ? 0 : 0.3 }}
    >
      <motion.path
        d="m5 12 4 4L19 6"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.25, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}

export function InteractiveSurface({ children, className = '', ...props }) {
  const reduced = useReducedMotion()
  const x = useMotionValue(50)
  const y = useMotionValue(50)
  const glow = useMotionTemplate`radial-gradient(320px circle at ${x}% ${y}%, rgba(59,130,246,0.12), transparent 75%)`
  function trackPointer(event) {
    if (reduced || event.pointerType !== 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set(((event.clientX - rect.left) / rect.width) * 100)
    y.set(((event.clientY - rect.top) / rect.height) * 100)
  }
  return (
    <motion.div
      onPointerMove={trackPointer}
      whileHover={reduced ? undefined : { y: -5 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={`motion-surface relative ${className}`}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className="motion-spotlight pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ backgroundImage: reduced ? 'none' : glow }}
      />
      {children}
    </motion.div>
  )
}

export function Stagger({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion()
  const revealOnScroll = !reduced && typeof IntersectionObserver !== 'undefined'
  return (
    <motion.div
      className={className}
      initial={revealOnScroll ? 'hidden' : false}
      animate={revealOnScroll ? undefined : 'visible'}
      whileInView={revealOnScroll ? 'visible' : undefined}
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        visible: {
          transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: reduced ? 0 : delay },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: reduced ? 0 : 22 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: reduced ? 0 : 0.5, ease }}
    >
      {children}
    </motion.div>
  )
}
