// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import App from '../src/App.jsx'

vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))
afterEach(cleanup)

it('shows a trust section with links to the privacy policy and disclaimer, and no invented proof', () => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })
  window.history.replaceState({}, '', '/')
  const { container } = render(<App />)
  expect(screen.getByRole('heading', { name: 'Careful with your information.' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Your form stays on your device' })).toBeTruthy()
  expect(
    screen.getAllByRole('link', { name: 'privacy policy' })[0].getAttribute('href'),
  ).toBe('/privacy')
    expect(container.textContent).not.toMatch(/(?<![-\w])\d[\d,]*\+? (students|users)|5 stars|testimonial/i)
})
