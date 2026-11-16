// @vitest-environment jsdom
// The app reports each allowlisted usage event at the right moment, and nothing else.
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'
import { ChatMain } from '../src/components/chat/ChatMain.jsx'

const trackEvent = vi.fn()
vi.mock('../src/utils/usage.js', () => ({
  trackEvent: (...args) => trackEvent(...args),
  USAGE_EVENTS: [],
}))
vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  Element.prototype.scrollIntoView = vi.fn()
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  trackEvent.mockClear()
})

const names = () => trackEvent.mock.calls.map(([name]) => name)

it('counts one visit per tab session when the app loads, and nothing else', () => {
  render(<App />)
  expect(trackEvent).toHaveBeenCalledWith('visit', { once: true })
  expect(names()).toEqual(['visit'])
})

it('counts a finished status check once, not each answer', async () => {
  window.history.replaceState({}, '', '/status-checker')
  render(<App />)
  const answers = [
    '31–182 days',
    'F-1 Student',
    'This is my 1st or 2nd year',
    'Yes',
    'Yes, from a US employer (W-2)',
  ]
  for (const label of answers) fireEvent.click(await screen.findByRole('button', { name: label }))
  expect(names()).not.toContain('status_check_done')
  fireEvent.click(await screen.findByRole('button', { name: 'No' }))
  await screen.findByRole('link', { name: 'IRS instructions →' })
  expect(names().filter((n) => n === 'status_check_done')).toHaveLength(1)
})

it('counts a sent chat message but never sends its text anywhere in the event', async () => {
  const body = `data: ${JSON.stringify({ choices: [{ delta: { content: 'Answer.' } }] })}\n\ndata: [DONE]\n\n`
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })),
  )
  render(
    <MemoryRouter>
      <ChatMain />
    </MemoryRouter>,
  )
  const input = screen.getByRole('textbox', { name: 'Your tax question' })
  await waitFor(() => expect(input.disabled).toBe(false))
  fireEvent.change(input, { target: { value: 'My passport is X1234567, do I file?' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await waitFor(() => expect(names()).toContain('chat_message'))
  expect(trackEvent).toHaveBeenCalledWith('chat_message')
  expect(JSON.stringify(trackEvent.mock.calls)).not.toContain('X1234567')
})
