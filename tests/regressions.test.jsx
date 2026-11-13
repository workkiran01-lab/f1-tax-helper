// @vitest-environment jsdom
// Regression coverage for the November 2026 bug sweep (docs/BUGFIXES-2026-11.md).
import React from 'react'
import { existsSync, readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'
import { ChatMain, StructuredMessage } from '../src/components/chat/ChatMain.jsx'
import { CHAT_LIMITS, fitChatHistory } from '../lib/chatLimits.js'
import { allowedOrigin, normalizeMessages } from '../lib/apiSafety.js'
import { readChatStream } from '../src/utils/chatStream.js'
import { blank8843, firstErrorStep, validate8843 } from '../src/utils/form8843Model.js'
import { COUNTRIES, treatyGuidance } from '../src/data/treaties.js'
import { seasonKey } from '../src/utils/storage.js'

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
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const sse = (text) =>
  new Response(
    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`,
    { headers: { 'Content-Type': 'text/event-stream' } },
  )
const renderChat = (props = {}) =>
  render(
    <MemoryRouter>
      <ChatMain {...props} />
    </MemoryRouter>,
  )
async function ask(question) {
  const input = screen.getByRole('textbox', { name: 'Your tax question' })
  await waitFor(() => expect(input.disabled).toBe(false))
  fireEvent.change(input, { target: { value: question } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
}

describe('chat history stays within the server limits', () => {
  it('fits an over-long answer and a long conversation to what the API accepts', () => {
    const long = [
      { role: 'assistant', content: 'Welcome context' },
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'a'.repeat(6500) },
      { role: 'user', content: 'Follow-up' },
    ]
    // The raw history is what the client used to send, and the server rejects it.
    expect(() => normalizeMessages({ messages: long })).toThrow('4,000')
    const fitted = fitChatHistory(long, { pinFirst: true })
    expect(() => normalizeMessages({ messages: fitted })).not.toThrow()
    expect(fitted.at(-1)).toEqual({ role: 'user', content: 'Follow-up' })
    expect(fitted[0].content).toBe('Welcome context')

    const many = Array.from({ length: 41 }, (_, i) => ({
      role: i % 2 ? 'user' : 'assistant',
      content: `${i}:${'x'.repeat(1800)}`,
    }))
    const withLatest = [...many, { role: 'user', content: 'Latest' }]
    expect(() => normalizeMessages({ messages: withLatest.slice(-20) })).toThrow('too long')
    const trimmed = fitChatHistory(withLatest, { pinFirst: true })
    expect(normalizeMessages({ messages: trimmed }).at(-1).content).toBe('Latest')
    expect(trimmed.length).toBeLessThanOrEqual(CHAT_LIMITS.maxMessages)
    expect(trimmed.reduce((n, m) => n + m.content.length, 0)).toBeLessThanOrEqual(
      CHAT_LIMITS.maxTotalChars,
    )
    expect(trimmed[0].content.startsWith('0:')).toBe(true)
    // The retained window never opens with an answer whose question was dropped.
    expect(trimmed[1].role).toBe('user')
  })

  it('keeps a conversation usable after a very long answer', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sse(`### Answer\n${'Long answer. '.repeat(500)}`))
      .mockResolvedValueOnce(sse('Short follow-up answer.'))
    vi.stubGlobal('fetch', fetchMock)
    renderChat()
    await ask('Do I need to file?')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await ask('And the deadline?')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const body = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(() => normalizeMessages(body)).not.toThrow()
    expect(await screen.findByText('Short follow-up answer.')).toBeTruthy()
  })
})

describe('chat presentation', () => {
  it('gives each message its own time instead of re-stamping all with the current time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 10, 9, 5))
    renderChat()
    const at = (date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const first = at(new Date(2026, 10, 10, 9, 5))
    expect(screen.getByText(first)).toBeTruthy()
    vi.setSystemTime(new Date(2026, 10, 10, 11, 42))
    fireEvent.change(screen.getByRole('textbox', { name: 'Your tax question' }), {
      target: { value: 'still typing' },
    })
    expect(screen.getByText(first)).toBeTruthy()
    expect(screen.queryByText(at(new Date(2026, 10, 10, 11, 42)))).toBeNull()
  })

  it('shows one typing indicator, not an extra empty answer bubble, before the first token', async () => {
    let push
    const stream = new ReadableStream({
      start(controller) {
        push = controller
      },
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
        ),
    )
    renderChat()
    const disclaimers = () => screen.getAllByText(/not tax advice|verify/i).length
    const before = disclaimers()
    await ask('Which form?')
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await act(async () => {})
    expect(screen.getByRole('status')).toBeTruthy()
    expect(disclaimers()).toBe(before)
    await act(async () => {
      push.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content: 'File Form 8843.' } }] })}\n\n`,
        ),
      )
    })
    expect(await screen.findByText('File Form 8843.')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
    await act(async () => {
      push.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      push.close()
    })
  })

  it('explains a network failure in plain language and restores the question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderChat()
    await ask('Which form?')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/could not reach the ai assistant/i)
    expect(alert.textContent).not.toMatch(/failed to fetch/i)
    expect(screen.getByRole('textbox', { name: 'Your tax question' }).value).toBe('Which form?')
  })

  it('never shows a raw JSON parser message for a malformed stream event', async () => {
    const body = new Response('data: {"choices":[{"delta"\n\n').body
    const consume = async () => {
      for await (const part of readChatStream(body)) void part
    }
    await expect(consume()).rejects.toThrow('The AI response was interrupted')
  })

  it('keeps an IRS reference that is cited by name instead of rendering an empty box', () => {
    render(<StructuredMessage content={'### Answer\nYes.\n### IRS Reference\n- Publication 519'} />)
    expect(screen.getByText('Publication 519')).toBeTruthy()
    cleanup()
    render(
      <StructuredMessage
        content={'### Answer\nYes.\n### IRS Reference\n[x](javascript:alert(1))'}
      />,
    )
    expect(screen.queryByText('IRS REFERENCE')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('Form 8843 step validation', () => {
  it('reports only the fields of the step being validated', () => {
    const data = {
      ...blank8843(2025),
      firstName: 'Test',
      lastName: 'Student',
      countryOfCitizenship: 'Brazil',
      passportCountry: 'Brazil',
      passportNumber: 'TEST12345',
      foreignAddress: 'Rua Uruguai 1, São Paulo',
      currentImmigrationStatus: 'F-1 '.repeat(40),
      line12Answer: 'no',
      line12Explanation: 'café',
    }
    expect(validate8843(data, 0)).toEqual({})
    expect(validate8843(data, 1).foreignAddress).toMatch(/Latin/)
    // A hidden explanation (its answer is No) must not block the last step.
    expect(validate8843(data, 4).line12Explanation).toBeUndefined()
    expect(validate8843({ ...data, line12Answer: 'yes' }, 4).line12Explanation).toMatch(/Latin/)
    const all = validate8843(data)
    expect(all.foreignAddress).toBeTruthy()
    expect(all.currentImmigrationStatus).toBeTruthy()
    expect(firstErrorStep(all)).toBe(1)
    expect(firstErrorStep({ 'visa-2024': 'Select', dsoPhone: 'x' })).toBe(3)
  })

  it('does not trap the user on step 1 because of an entry on a later step', async () => {
    window.history.replaceState({}, '', '/form-8843')
    render(<App />)
    await screen.findByRole('heading', { name: 'Your information' })
    for (const [name, value] of [
      ['First name', 'Test'],
      ['Last name', 'Student'],
      ['Country or countries of citizenship', 'Brazil'],
      ['Passport issuing country', 'Brazil'],
      ['Passport number', 'TEST12345'],
    ])
      fireEvent.change(screen.getByLabelText(name), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue →' }))
    fireEvent.change(await screen.findByLabelText('Address in country of residence'), {
      target: { value: 'São Paulo' },
    })
    fireEvent.click(screen.getByRole('button', { name: '← Back' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue →' }))
    // Before the fix this stayed on "Your information" with nothing highlighted.
    const address = await screen.findByLabelText('Address in country of residence')
    fireEvent.click(screen.getByRole('button', { name: 'Continue →' }))
    await waitFor(() => expect(address.getAttribute('aria-invalid')).toBe('true'))
    expect(screen.getByRole('heading', { name: 'Your addresses' })).toBeTruthy()
  })
})

describe('questionnaire and dashboard flow', () => {
  it('lets a student undo "No" on the F-1 question instead of dead-ending the tab', async () => {
    localStorage.setItem('f1_guest_session', 'true')
    window.history.replaceState({}, '', '/questionnaire')
    const view = render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: "No, I'm not" }))
    expect(await screen.findByText('Important Notice')).toBeTruthy()
    view.unmount()
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /change my answer/i }))
    expect(await screen.findByRole('button', { name: 'Yes, I am' })).toBeTruthy()
  })

  it('restarts from question 1 when "Edit my answers" is chosen, not from saved progress', async () => {
    localStorage.setItem('f1_guest_session', 'true')
    localStorage.setItem(
      seasonKey('questionnaire'),
      JSON.stringify({
        taxYear: 2026,
        completedAt: '2026-11-01T00:00:00.000Z',
        actionItems: [],
        answers: {
          hasUSIncome: false,
          incomeTypes: [],
          residencyStatus: 'Likely Nonresident Alien',
        },
      }),
    )
    sessionStorage.setItem(
      seasonKey('questionnaire-progress', 'guest'),
      JSON.stringify({
        currentStep: 3,
        stopped: false,
        answers: {
          isF1Visa: true,
          hasUSIncome: true,
          incomeTypes: ['w2'],
          yearsInUS: null,
          country: null,
          residencyStatus: null,
        },
      }),
    )
    window.history.replaceState({}, '', '/taxes')
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit my answers' }))
    expect(await screen.findByRole('button', { name: 'Yes, I am' })).toBeTruthy()
    expect(screen.getByText(/Question 1 of 5/)).toBeTruthy()
  })

  it('shows one status, from the questionnaire, when it is newer than the status check', async () => {
    localStorage.setItem('f1_guest_session', 'true')
    localStorage.setItem(
      seasonKey('status'),
      JSON.stringify({
        taxYear: 2026,
        badge: 'nra',
        status: 'Likely Nonresident Alien (NRA)',
        checkedAt: '2026-10-01T00:00:00.000Z',
        hasIncome: false,
        forms: [],
      }),
    )
    localStorage.setItem(
      seasonKey('questionnaire'),
      JSON.stringify({
        taxYear: 2026,
        completedAt: '2026-11-01T00:00:00.000Z',
        actionItems: [],
        answers: {
          hasUSIncome: false,
          incomeTypes: [],
          residencyStatus: 'Residency review needed',
        },
      }),
    )
    window.history.replaceState({}, '', '/checklist')
    render(<App />)
    expect(await screen.findByText('Confirm tax residency before selecting forms')).toBeTruthy()
    expect(screen.getByText('Residency review needed')).toBeTruthy()
    expect(screen.getByText(/From your questionnaire/)).toBeTruthy()
    expect(screen.queryByText(/Likely nonresident alien/i)).toBeNull()
  })

  it('lets a guest stay on the sign-in page to upgrade to an account', async () => {
    localStorage.setItem('f1_guest_session', 'true')
    window.history.replaceState({}, '', '/login')
    render(<App />)
    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeTruthy()
    await act(async () => {})
    expect(window.location.pathname).toBe('/login')
  })

  it('opens IRS links from the status result in a new tab', async () => {
    window.history.replaceState({}, '', '/status-checker')
    render(<App />)
    for (const label of [
      '31–182 days',
      'F-1 Student',
      'This is my 1st or 2nd year',
      'Yes',
      'Yes, from a US employer (W-2)',
      'No',
    ])
      fireEvent.click(await screen.findByRole('button', { name: label }))
    const link = await screen.findByRole('link', { name: 'IRS instructions →' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(screen.getByRole('link', { name: 'Prepare form →' }).getAttribute('href')).toBe(
      '/form-8843',
    )
  })
})

describe('configuration and static assets', () => {
  const env = { NODE_ENV: 'development' }
  const from = (origin) => new Request('http://localhost/api/chat', { headers: { Origin: origin } })
  it('accepts the vercel dev origin locally but never in production', () => {
    expect(allowedOrigin(from('http://localhost:3000'), env)).toBe(true)
    expect(allowedOrigin(from('http://localhost:3000'), { NODE_ENV: 'production' })).toBe(false)
  })
  it('ships every static file that index.html and robots.txt point to', () => {
    const html = readFileSync('index.html', 'utf8')
    for (const [, file] of html.matchAll(/https:\/\/f1taxhelper\.com\/([\w.-]+\.\w+)"/g))
      expect(existsSync(`public/${file}`), file).toBe(true)
    expect(readFileSync('public/robots.txt', 'utf8')).toContain('sitemap.xml')
    expect(existsSync('public/sitemap.xml')).toBe(true)
    const rewrite = JSON.parse(readFileSync('vercel.json', 'utf8')).rewrites[0].source
    for (const file of ['og-image\\.png', 'sitemap\\.xml']) expect(rewrite).toContain(file)
  })
  it('defines every theme colour that components reference', async () => {
    const { default: config } = await import('../tailwind.config.js')
    for (const name of ['primary-foreground', 'secondary', 'accent', 'accent-foreground', 'ring'])
      expect(config.theme.extend.colors[name], name).toBeTruthy()
  })
  it('lists previously missing places and keeps them on the review path', () => {
    for (const name of ['Kosovo', 'Democratic Republic of the Congo', 'Hong Kong']) {
      expect(COUNTRIES).toContain(name)
      expect(treatyGuidance(name)).toMatch(/has not been reviewed/)
    }
    expect(new Set(COUNTRIES).size).toBe(COUNTRIES.length)
  })
})
