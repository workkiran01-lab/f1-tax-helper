import { useSyncExternalStore } from 'react'

// Appearance: 'system' follows the device, 'light' and 'dark' are explicit.
// public/theme.js applies the same rule before first paint.
const KEY = 'f1_theme'
const CHOICES = ['system', 'light', 'dark']
const listeners = new Set()
const media = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)')
    : null

export function getThemeChoice() {
  try {
    const saved = localStorage.getItem(KEY)
    return CHOICES.includes(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}
export function resolveTheme(choice = getThemeChoice()) {
  if (choice === 'light' || choice === 'dark') return choice
  return media()?.matches ? 'light' : 'dark'
}

function apply() {
  const resolved = resolveTheme()
  document.documentElement.setAttribute('data-theme', resolved)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'light' ? '#f2f2f7' : '#000000')
  listeners.forEach((listener) => listener())
}

// `origin` is the pointer event that asked for the change. Where the browser
// supports it, the new appearance opens out in a circle from that point.
export function setThemeChoice(choice, origin) {
  if (!CHOICES.includes(choice)) return
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    // Storage can be unavailable (private mode); the choice still applies now.
  }
  const changes = resolveTheme(choice) !== document.documentElement.getAttribute('data-theme')
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!changes || reduced || typeof document.startViewTransition !== 'function') return apply()
  const x = origin?.clientX ?? window.innerWidth / 2
  const y = origin?.clientY ?? window.innerHeight / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  document
    .startViewTransition(apply)
    .ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 520,
          easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      ),
    )
    .catch(() => {})
}

function subscribe(listener) {
  listeners.add(listener)
  const query = media()
  const onSystemChange = () => getThemeChoice() === 'system' && apply()
  const onStorage = (event) => event.key === KEY && apply()
  query?.addEventListener?.('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    query?.removeEventListener?.('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
  }
}

export default function useTheme() {
  const choice = useSyncExternalStore(subscribe, getThemeChoice, () => 'system')
  const theme = useSyncExternalStore(subscribe, resolveTheme, () => 'dark')
  return { choice, theme, setChoice: setThemeChoice }
}
