// @vitest-environment jsdom
import React, { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AnimatedProgress, StepTransition } from '../src/components/Motion.jsx'
import { ChatMain, StructuredMessage } from '../src/components/chat/ChatMain.jsx'
import App from '../src/App.jsx'
import { seasonKey } from '../src/utils/storage.js'

vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  Element.prototype.scrollIntoView = vi.fn()
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('makes exiting steps inert, then focuses the new heading in either direction', async () => {
  function Wizard() {
    const [step, setStep] = useState(0)
    return (
      <StepTransition stepKey={step} direction={step ? 1 : -1}>
        <h2>{step ? 'Second question' : 'First question'}</h2>
        <button onClick={() => setStep(step ? 0 : 1)}>{step ? 'Back' : 'Next'}</button>
      </StepTransition>
    )
  }
  render(<Wizard />)
  const first = screen.getByRole('heading', { name: 'First question' })
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(first.closest('.motion-step').hasAttribute('inert')).toBe(true)
  expect(first.closest('.motion-step').getAttribute('aria-hidden')).toBe('true')
  const second = await screen.findByRole('heading', { name: 'Second question' })
  await waitFor(() => expect(document.activeElement).toBe(second))
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  const restored = await screen.findByRole('heading', { name: 'First question' })
  await waitFor(() => expect(document.activeElement).toBe(restored))
})

it('exposes the actual progress immediately while the visual fill animates', () => {
  const view = render(<AnimatedProgress value={20} label="Preparation" />)
  const progress = screen.getByRole('progressbar', { name: 'Preparation' })
  expect(progress.getAttribute('aria-valuenow')).toBe('20')
  view.rerender(<AnimatedProgress value={80} label="Preparation" />)
  expect(progress.getAttribute('aria-valuenow')).toBe('80')
  view.rerender(<AnimatedProgress value={150} label="Preparation" />)
  expect(progress.getAttribute('aria-valuenow')).toBe('100')
})

it('keeps form inputs and validation intact when moving forward and back', async () => {
  window.history.replaceState({}, '', '/form-8843')
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Continue →' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Your information' })).toBeTruthy()
  for (const [name, value] of [
    ['First name', 'Test'],
    ['Last name', 'Student'],
    ['Country or countries of citizenship', 'Nepal'],
    ['Passport issuing country', 'Nepal'],
    ['Passport number', 'TEST12345'],
  ])
    fireEvent.change(screen.getByLabelText(name), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Continue →' }))
  expect(await screen.findByRole('heading', { name: 'Your addresses' })).toBeTruthy()
  expect(
    screen
      .getByRole('progressbar', { name: 'Form preparation progress' })
      .getAttribute('aria-valuenow'),
  ).toBe('20')
  fireEvent.click(screen.getByRole('button', { name: '← Back' }))
  expect((await screen.findByLabelText('First name')).value).toBe('Test')
  expect(screen.getByLabelText('Passport number').value).toBe('TEST12345')
})

it('animates collected items without losing the saved checklist on remount', async () => {
  localStorage.setItem('f1_guest_session', 'true')
  localStorage.setItem(
    seasonKey('status'),
    JSON.stringify({
      taxYear: 2026,
      badge: 'nra',
      hasIncome: false,
      hasW2: false,
      forms: [],
    }),
  )
  window.history.replaceState({}, '', '/checklist')
  const view = render(<App />)
  const buttons = await screen.findAllByRole('button', { name: /^Mark .+ as collected$/ })
  for (const button of buttons) fireEvent.click(button)
  expect(
    screen.getByRole('progressbar', { name: 'Documents collected' }).getAttribute('aria-valuenow'),
  ).toBe('100')
  expect(screen.getByText(/Documents collected. You can now/)).toBeTruthy()
  view.unmount()
  render(<App />)
  const collected = await screen.findAllByRole('button', { name: /^Mark .+ as not collected$/ })
  expect(collected).toHaveLength(buttons.length)
  expect(collected.every((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
  fireEvent.click(collected[0])
  expect(screen.queryByText(/Documents collected. You can now/)).toBeNull()
})

it('focuses a suggested chat question and prevents replacing it during a request', () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  )
  render(
    <MemoryRouter>
      <ChatMain />
    </MemoryRouter>,
  )
  const suggestion = screen.getByRole('button', { name: 'What is Form 8843?' })
  fireEvent.click(suggestion)
  const input = screen.getByRole('textbox', { name: 'Your tax question' })
  expect(input.value).toBe('What is Form 8843?')
  expect(document.activeElement).toBe(input)
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  expect(suggestion.disabled).toBe(true)
  expect(screen.getByRole('status').textContent).toContain('Preparing an answer')
  expect(fetch).toHaveBeenCalledTimes(1)
})

it('keeps collapsed chat explanations hidden from assistive technology', () => {
  render(
    <StructuredMessage
      content={'### Answer\nStart here.\n### Why\nA useful explanation.'}
      isStreaming={false}
    />,
  )
  const toggle = screen.getByRole('button', { name: 'WHY' })
  const panel = document.getElementById(toggle.getAttribute('aria-controls'))
  expect(panel.getAttribute('aria-hidden')).toBe('true')
  expect(panel.hasAttribute('inert')).toBe(true)
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(panel.getAttribute('aria-hidden')).toBe('false')
  fireEvent.click(toggle)
  expect(panel.hasAttribute('inert')).toBe(true)
})

it('lets users choose and pause homepage examples without changing the tax flow', async () => {
  render(<App />)
  const carousel = within(screen.getByRole('region', { name: 'Example tax checkups' }))
  fireEvent.click(carousel.getByRole('button', { name: 'Show India example' }))
  expect(await carousel.findByText('India 🇮🇳')).toBeTruthy()
  expect(
    carousel.getByRole('button', { name: 'Show India example' }).getAttribute('aria-pressed'),
  ).toBe('true')
  fireEvent.click(carousel.getByRole('button', { name: 'Play examples' }))
  fireEvent.click(carousel.getByRole('button', { name: 'Pause examples' }))
  expect(carousel.getByRole('button', { name: 'Play examples' }).getAttribute('aria-pressed')).toBe(
    'true',
  )
  expect(screen.getByRole('link', { name: 'Start Free Checkup →' }).getAttribute('href')).toBe(
    '/status-checker',
  )
})
