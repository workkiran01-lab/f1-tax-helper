import { motion, useReducedMotion } from 'framer-motion'
export default function Reveal({ children, ...props }) {
  const reduceMotion = useReducedMotion()
  const revealOnScroll = !reduceMotion && typeof IntersectionObserver !== 'undefined'
  return (
    <motion.section
      {...props}
      initial={revealOnScroll ? { opacity: 0, y: 14 } : false}
      animate={revealOnScroll ? undefined : { opacity: 1, y: 0 }}
      whileInView={revealOnScroll ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}
