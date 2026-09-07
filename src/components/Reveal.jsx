import { motion, useReducedMotion } from 'framer-motion'
export default function Reveal({ children, ...props }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.section
      {...props}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}
