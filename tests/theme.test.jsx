// @vitest-environment jsdom
// Light and dark appearance: the saved choice, the device default, the switch.
import React from 'react'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App.jsx'
import { getThemeChoice, resolveTheme, setThemeChoice } from '../src/hooks/useTheme.js'

vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))

// The device prefers light when `deviceLight` is true; nobody asks for reduced motion.
let deviceLight = false
const stubMedia = () => {
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes('prefers-color-scheme: light') ? deviceLight : false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}
const theme = () => document.documentElement.getAttribute('data-theme')

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  deviceLight = false
  stubMedia()
  document.documentElement.removeAttribute('data-theme')
  window.history.replaceState({}, '', '/')
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => cleanup())

describe('appearance', () => {
  it('follows the device until the student chooses, then remembers the choice', () => {
    expect(getThemeChoice()).toBe('system')
    expect(resolveTheme()).toBe('dark')
    deviceLight = true
    expect(resolveTheme()).toBe('light')

    setThemeChoice('dark')
    expect(localStorage.getItem('f1_theme')).toBe('dark')
    expect(theme()).toBe('dark')
    expect(resolveTheme()).toBe('dark')

    setThemeChoice('system')
    expect(theme()).toBe('light')
    setThemeChoice('sepia')
    expect(getThemeChoice()).toBe('system')
  })

  it('ignores a corrupted saved value', () => {
    localStorage.setItem('f1_theme', '"><script>')
    expect(getThemeChoice()).toBe('system')
  })

  it('applies the saved appearance before the app loads, within the content policy', () => {
    const html = readFileSync('index.html', 'utf8')
    // An external file, not inline: the site's CSP only allows scripts from 'self'.
    expect(html).toMatch(/<script src="\/theme\.js"><\/script>/)
    expect(html.indexOf('/theme.js')).toBeLessThan(html.indexOf('/src/main.jsx'))
    expect(JSON.parse(readFileSync('vercel.json', 'utf8')).rewrites[0].source).toContain(
      'theme\\.js',
    )
    localStorage.setItem('f1_theme', 'light')
    // eslint-disable-next-line no-new-func -- runs the shipped pre-paint script as the browser would
    new Function(readFileSync('public/theme.js', 'utf8'))()
    expect(theme()).toBe('light')
  })

  it('switches from the landing page with one tap, in both directions', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Switch to light appearance' })[0])
    expect(theme()).toBe('light')
    expect(localStorage.getItem('f1_theme')).toBe('light')
    fireEvent.click(screen.getAllByRole('button', { name: 'Switch to dark appearance' })[0])
    expect(theme()).toBe('dark')
  })

  it('offers Automatic, Light and Dark in Account', async () => {
    localStorage.setItem('f1_guest_session', 'true')
    localStorage.setItem('display_name_guest', JSON.stringify('Ana Silva'))
    localStorage.setItem('university_guest', JSON.stringify('Example University'))
    window.history.replaceState({}, '', '/account')
    render(<App />)
    const picker = within(await screen.findByRole('radiogroup', { name: 'Appearance' }))
    expect(picker.getByRole('radio', { name: 'Automatic' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    fireEvent.click(picker.getByRole('radio', { name: 'Light' }))
    expect(theme()).toBe('light')
    expect(picker.getByRole('radio', { name: 'Light' }).getAttribute('aria-checked')).toBe('true')
    fireEvent.click(picker.getByRole('radio', { name: 'Automatic' }))
    expect(theme()).toBe('dark')
    expect(localStorage.getItem('f1_theme')).toBe('system')
  })

  it('defines the same colour roles for light as for dark', () => {
    const css = readFileSync('src/index.css', 'utf8')
    const names = (block) =>
      new Set([...block.matchAll(/--([a-z0-9-]+):\s*\d+ \d+ \d+;/g)].map((m) => m[1]))
    const dark = css.slice(css.indexOf(':root {'), css.indexOf(":root[data-theme='light']"))
    const lightStart = css.indexOf(":root[data-theme='light']")
    const light = css.slice(lightStart, css.indexOf('}', lightStart))
    const missing = [...names(dark)].filter((n) => !n.startsWith('hero-') && !names(light).has(n))
    expect(missing).toEqual([])
  })
})
