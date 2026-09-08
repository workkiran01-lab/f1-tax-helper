// @vitest-environment jsdom
import React from 'react'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, act, configure } from '@testing-library/react'
import App from '../src/App.jsx'
import { ChatMain, StructuredMessage } from '../src/components/chat/ChatMain.jsx'
import { MemoryRouter } from 'react-router-dom'
import { seasonKey } from '../src/utils/storage.js'
vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))
configure({ getElementError: (message) => new Error(message) })
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
})
it('renders public tools without Supabase credentials and shares guest auth across routes', async () => {
  window.history.replaceState({}, '', '/login')
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /continue as guest/i }))
  await waitFor(() => expect(window.location.pathname).toBe('/welcome'))
  expect(localStorage.getItem('f1_guest_session')).toBe('true')
})
it('no-income questionnaire still asks exempt calendar years, then persists guest results on reload', async () => {
  localStorage.setItem('f1_guest_session', 'true')
  window.history.replaceState({}, '', '/questionnaire')
  const view = render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Yes, I am' }))
  fireEvent.click(await screen.findByRole('button', { name: 'No, I had no income' }))
  expect(await screen.findByText(/how many exempt student/i)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '5 calendar years' }))
  fireEvent.click(await screen.findByRole('combobox', { name: /select your country/i }))
  fireEvent.click(await screen.findByRole('option', { name: 'Nepal' }))
  fireEvent.click(
    screen.getByRole('button', { name: /next|see my results|continue|finish|get my results/i }),
  )
  await waitFor(() => expect(window.location.pathname).toBe('/results'))
  expect(JSON.parse(localStorage.getItem(seasonKey('questionnaire'))).taxYear).toBe(2026)
  view.unmount()
  render(<App />)
  expect(await screen.findByText(/here.s your tax summary/i)).toBeTruthy()
  expect(screen.getByText(/generally file only Form 8843/i)).toBeTruthy()
})
it('routes uncertain residency to review, without a resident or nonresident filing checklist', async () => {
  localStorage.setItem('f1_guest_session', 'true')
  localStorage.setItem(
    seasonKey('status'),
    JSON.stringify({ taxYear: 2026, badge: 'review', hasIncome: true, hasW2: true, forms: [] }),
  )
  window.history.replaceState({}, '', '/checklist')
  render(<App />)
  expect(await screen.findByText('Confirm tax residency before selecting forms')).toBeTruthy()
  expect(screen.queryByText('Form 1040-NR')).toBeNull()
})
it('old-year status and checklist data never masquerade as current preparation', async () => {
  localStorage.setItem('f1_guest_session', 'true')
  localStorage.setItem('f1_status_result', JSON.stringify({ badge: 'nra', hasIncome: false }))
  window.history.replaceState({}, '', '/checklist')
  render(<App />)
  expect(await screen.findByText('Get Your Personalized Checklist')).toBeTruthy()
})
it('opens 2026 preparation by default and allows explicit prior-year selection', async () => {
  window.history.replaceState({}, '', '/form-8843')
  render(<App />)
  const year = await screen.findByRole('combobox', { name: 'Income year' })
  expect(year.value).toBe('2026')
  fireEvent.change(year, { target: { value: '2025' } })
  expect(await screen.findByText('Tax year 2025')).toBeTruthy()
})
it('keeps homepage examples static when reduced motion is requested', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Animations reduced' }).disabled).toBe(true)
  expect(
    screen.getByRole('button', { name: 'Show Nepal example' }).getAttribute('aria-pressed'),
  ).toBe('true')
  expect(screen.getByRole('link', { name: 'Start Free Checkup →' })).toBeTruthy()
})
it('aborts an old chat on navigation and ignores its late response', async () => {
  let resolveFetch
  const fetchMock = vi.fn(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  const props = { initialContext: null, navigationKey: 'first' }
  const view = render(
    <MemoryRouter>
      <ChatMain {...props} />
    </MemoryRouter>,
  )
  fireEvent.change(screen.getByRole('textbox', { name: 'Your tax question' }), {
    target: { value: 'Which form?' },
  })
  fireEvent.click(screen.getByRole('button', { name: /send message/i }))
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const signal = fetchMock.mock.calls[0][1].signal
  view.rerender(
    <MemoryRouter>
      <ChatMain {...props} navigationKey="second" />
    </MemoryRouter>,
  )
  expect(signal.aborted).toBe(true)
  await act(async () =>
    resolveFetch(
      new Response('data: [DONE]', { headers: { 'Content-Type': 'text/event-stream' } }),
    ),
  )
  expect(screen.queryByText('Which form?')).toBeNull()
  expect(screen.getByRole('textbox', { name: 'Your tax question' }).disabled).toBe(false)
})
it('rejects model-produced unsafe citation links', () => {
  render(
    <StructuredMessage
      content={
        '### IRS Reference\n- [Fake](javascript:alert(1))\n- [Real](https://www.irs.gov/publications/p519)'
      }
    />,
  )
  expect(screen.queryByRole('link', { name: 'Fake' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Real' }).getAttribute('href')).toBe(
    'https://www.irs.gov/publications/p519',
  )
})
