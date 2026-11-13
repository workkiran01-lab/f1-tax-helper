// @vitest-environment jsdom
// The app shell: one navigation on every signed-in screen, a Home that always
// names the next step, and one tax status shared by every page.
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../src/App.jsx'
import { computeJourney, draftSections } from '../src/utils/journey.js'
import { chatContextFor, currentTaxProfile } from '../src/utils/taxProfile.js'
import { seasonKey } from '../src/utils/storage.js'
import { sample8843 } from './pdfFixture.js'

vi.mock('../src/utils/supabase', () => ({ default: null, authConfigured: false }))

const guest = { id: 'guest', is_guest: true }
const store = (key, value, storage = localStorage) => storage.setItem(key, JSON.stringify(value))
const questionnaire = (overrides = {}, completedAt = '2026-11-01T00:00:00.000Z') => ({
  taxYear: 2026,
  completedAt,
  actionItems: ['Likely nonresident. Generally file only Form 8843.'],
  hasTreatyBenefit: false,
  answers: {
    isF1Visa: true,
    hasUSIncome: false,
    incomeTypes: [],
    yearsInUS: 2,
    country: 'Nepal',
    residencyStatus: 'Likely Nonresident Alien',
    ...overrides,
  },
})
const statusCheck = (overrides = {}) => ({
  taxYear: 2026,
  badge: 'nra',
  status: 'Likely Nonresident Alien (NRA)',
  checkedAt: '2026-11-05T00:00:00.000Z',
  hasIncome: true,
  hasW2: true,
  hasScholarship: false,
  forms: [],
  message: 'Eligible F-1 student days are excluded during the first five calendar years.',
  ...overrides,
})
const signInAsGuest = ({ named = true } = {}) => {
  localStorage.setItem('f1_guest_session', 'true')
  if (named) {
    store('display_name_guest', 'Ana Silva')
    store('university_guest', 'Example University')
  }
}
const open = (path) => {
  window.history.replaceState({}, '', path)
  return render(<App />)
}
const mainNavs = () => screen.queryAllByRole('navigation', { name: 'Main' })

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

describe('one tax status for the whole app', () => {
  it('uses whichever of the two checks was completed most recently', () => {
    expect(currentTaxProfile(guest)).toBeNull()
    store(seasonKey('questionnaire'), questionnaire())
    expect(currentTaxProfile(guest)).toMatchObject({
      source: 'questionnaire',
      label: 'Likely nonresident alien',
      hasIncome: false,
      deadline: 'June 15, 2027',
    })
    store(seasonKey('status'), statusCheck())
    expect(currentTaxProfile(guest)).toMatchObject({
      source: 'status-check',
      hasW2: true,
      deadline: 'April 15, 2027',
    })
    store(seasonKey('questionnaire'), questionnaire({}, '2026-11-09T00:00:00.000Z'))
    expect(currentTaxProfile(guest).source).toBe('questionnaire')
  })

  it('never offers a deadline or forms when residency needs review, and ignores other years', () => {
    store(seasonKey('status'), statusCheck({ badge: 'review' }))
    expect(currentTaxProfile(guest)).toMatchObject({ needsReview: true, deadline: null })
    store(seasonKey('status'), statusCheck({ taxYear: 2025 }))
    expect(currentTaxProfile(guest)).toBeNull()
  })

  it('gives the assistant the status-check result, which it used to ignore', () => {
    store(seasonKey('status'), statusCheck())
    const context = chatContextFor(currentTaxProfile(guest))
    expect(context.answers.residencyStatus).toBe('Likely Nonresident Alien')
    expect(context.actionItems[0]).toMatch(/first five calendar years/)
    expect(chatContextFor(null)).toBeNull()
  })
})

describe('filing journey', () => {
  const states = () => Object.fromEntries(computeJourney(guest).steps.map((s) => [s.id, s.state]))

  it('starts with the status check and locks what depends on it', () => {
    const journey = computeJourney(guest)
    expect(journey.next).toMatchObject({ id: 'status', to: '/questionnaire' })
    expect(states()).toEqual({
      status: 'current',
      form8843: 'locked',
      documents: 'locked',
      file: 'locked',
    })
    expect(journey.done).toBe(0)
  })

  it('moves to Form 8843 for a likely nonresident and reports draft progress honestly', () => {
    store(seasonKey('questionnaire'), questionnaire())
    expect(computeJourney(guest).next).toMatchObject({ id: 'form8843', action: 'Start Form 8843' })
    const draft = { ...sample8843(), taxYear: 2026, schoolPhone: '', dsoPhone: '' }
    store(seasonKey('8843-draft-v4', 'guest', 2026), draft, sessionStorage)
    const sections = draftSections('guest')
    expect(sections).toBeGreaterThan(0)
    expect(sections).toBeLessThan(5)
    const next = computeJourney(guest).next
    expect(next.action).toBe('Continue Form 8843')
    expect(next.about).toContain(`${5 - sections} of 5 sections left`)
  })

  it('keeps Form 8843 locked and points to the review when residency is uncertain', () => {
    store(seasonKey('status'), statusCheck({ badge: 'review' }))
    const journey = computeJourney(guest)
    expect(states().form8843).toBe('locked')
    expect(journey.next).toMatchObject({ id: 'documents', title: 'Confirm your residency' })
  })

  it('counts the same checklist My Taxes shows', () => {
    store(seasonKey('questionnaire'), questionnaire())
    store(seasonKey('checklist'), { passport: true, i20: true, 'not-an-item': true })
    expect(computeJourney(guest).steps.find((s) => s.id === 'documents').detail).toBe(
      '2 of 8 items done',
    )
  })
})

describe('app shell', () => {
  it('shows the same four places on every signed-in screen and moves between them', async () => {
    signInAsGuest()
    open('/home')
    expect(await screen.findByRole('heading', { name: 'Hi, Ana' })).toBeTruthy()
    // Sidebar (desktop) and tab bar (phone) are both in the document; CSS shows one.
    expect(mainNavs()).toHaveLength(2)
    for (const nav of mainNavs())
      expect(
        within(nav)
          .getAllByRole('link')
          .map((a) => a.textContent),
      ).toEqual(['Home', 'My Taxes', 'Form 8843', 'Ask AI'])
    const tabs = within(mainNavs()[1])
    expect(tabs.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page')

    fireEvent.click(tabs.getByRole('link', { name: 'My Taxes' }))
    expect(await screen.findByRole('heading', { name: 'My Taxes' })).toBeTruthy()
    expect(window.location.pathname).toBe('/taxes')
    expect(
      within(mainNavs()[1]).getByRole('link', { name: 'My Taxes' }).getAttribute('aria-current'),
    ).toBe('page')

    fireEvent.click(within(mainNavs()[1]).getByRole('link', { name: 'Ask AI' }))
    expect(await screen.findByRole('heading', { name: 'Ask AI' })).toBeTruthy()
    expect(mainNavs()).toHaveLength(2)
  })

  it('hides the tab bar in step-by-step flows and offers a way out', async () => {
    signInAsGuest()
    open('/questionnaire')
    expect(await screen.findByRole('button', { name: 'Yes, I am' })).toBeTruthy()
    expect(mainNavs()).toHaveLength(1)
    fireEvent.click(screen.getByRole('link', { name: 'Save & exit' }))
    await waitFor(() => expect(window.location.pathname).toBe('/home'))
  })

  it('keeps public tools free of app chrome for signed-out visitors', async () => {
    open('/form-8843')
    expect(await screen.findByRole('heading', { name: 'Your information' })).toBeTruthy()
    expect(mainNavs()).toHaveLength(0)
    expect(screen.getByRole('link', { name: 'Exit' }).getAttribute('href')).toBe('/')
  })

  it('redirects addresses from before the shell', async () => {
    signInAsGuest()
    for (const [from, to] of [
      ['/welcome', '/home'],
      ['/dashboard', '/home'],
      ['/results', '/taxes'],
      ['/checklist', '/taxes'],
    ]) {
      const view = open(from)
      await waitFor(() => expect(window.location.pathname).toBe(to))
      view.unmount()
    }
  })

  it('sends signed-out visitors to sign in before any app screen', async () => {
    for (const path of ['/home', '/taxes', '/account', '/chat']) {
      const view = open(path)
      await waitFor(() => expect(window.location.pathname).toBe('/login'))
      view.unmount()
    }
  })
})

describe('Home', () => {
  it('asks for a name once, then always shows one next step', async () => {
    signInAsGuest({ named: false })
    open('/home')
    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Ana Silva' } })
    fireEvent.change(screen.getByLabelText('University'), { target: { value: 'Example U' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Hi, Ana' })).toBeTruthy()
    expect(screen.getByText('Your next step')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Check your tax status' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Check my tax status' }).getAttribute('href')).toBe(
      '/questionnaire',
    )
    expect(
      screen
        .getByRole('progressbar', { name: 'Filing steps completed' })
        .getAttribute('aria-valuenow'),
    ).toBe('0')
  })

  it('advances after the status check and shows the personal deadline', async () => {
    signInAsGuest()
    store(seasonKey('questionnaire'), questionnaire())
    open('/home')
    expect(await screen.findByRole('heading', { name: 'Prepare Form 8843' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Start Form 8843' }).getAttribute('href')).toBe(
      '/form-8843',
    )
    expect(screen.getByText('1 of 4 done')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /expected deadline: June 15, 2027/ })).toBeTruthy()
    // The last step explains why it is locked instead of offering a dead link.
    expect(screen.getByText('Unlocks when the IRS releases the 2026 form')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Print, sign and mail/ })).toBeNull()
  })
})

describe('My Taxes, Ask AI and Account', () => {
  it('shows status, guidance and checklist together, and updates Home progress', async () => {
    signInAsGuest()
    store(seasonKey('questionnaire'), questionnaire())
    open('/taxes#checklist')
    expect(await screen.findByText('Likely nonresident alien')).toBeTruthy()
    expect(screen.getByText(/Nepal · no US income reported for 2026/)).toBeTruthy()
    expect(screen.getByText(/Generally file only Form 8843/)).toBeTruthy()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Mark Passport (copy) as collected' }))
    expect(screen.getByText('1 of 8 items collected')).toBeTruthy()
    fireEvent.click(within(mainNavs()[1]).getByRole('link', { name: 'Home' }))
    expect(await screen.findByText('1 of 8 items done')).toBeTruthy()
  })

  it('starts the assistant from the status the rest of the app shows', async () => {
    signInAsGuest()
    store(seasonKey('status'), statusCheck())
    open('/chat')
    expect(await screen.findByText('Using your status: likely nonresident alien')).toBeTruthy()
    expect(await screen.findByText(/first five calendar years/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Account and settings' })).toBeTruthy()
  })

  it('edits the profile and signs out from Account', async () => {
    signInAsGuest()
    open('/account')
    const name = await screen.findByLabelText('Full name')
    expect(name.value).toBe('Ana Silva')
    fireEvent.change(name, { target: { value: 'Ana Maria Silva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Saved.')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('display_name_guest'))).toBe('Ana Maria Silva')

    fireEvent.click(screen.getByRole('button', { name: 'Delete my saved data' }))
    const dialog = await screen.findByRole('dialog', { name: 'Delete your saved data?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(window.location.pathname).toBe('/'))
    expect(localStorage.getItem('f1_guest_session')).toBeNull()
  })
})
