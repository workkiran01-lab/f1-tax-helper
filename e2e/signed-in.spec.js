import { test, expect } from '@playwright/test'
import { downloadForm8843, FORM_VALUES } from './helpers.js'
import {
  ANON_KEY,
  SESSION_STORAGE_KEY,
  USER_ID,
  mockSupabase,
  seedSession,
} from './supabaseMock.js'

// Signed-in journeys against a build whose Supabase address is fake. Every request to it is
// answered by e2e/supabaseMock.js, so the tests check what the app sends and what it does with
// the answer, not that a real project works. They run under the production hostname, which is
// what switches the anonymous usage counter on (see playwright.config.js).

const PROFILE = { display_name: 'Ada Student', university: 'Example University' }
const userKey = `f1:2026:${USER_ID}:checklist`

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('f1_disclaimer_ack_v1', 'true'))
})

// A signed-in student whose name and school are already on the account.
async function signedIn(page, options = {}) {
  const supabase = await mockSupabase(page, { metadata: PROFILE, ...options })
  await seedSession(page, supabase.state.user)
  return supabase
}

const hasSession = (page) =>
  page.evaluate((key) => localStorage.getItem(key) !== null, SESSION_STORAGE_KEY)

test.describe('signing in', () => {
  test('Google sign-in lands on Home, asks for a name and school and saves them to the account', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    const supabase = await mockSupabase(page)
    await page.goto('/login')
    await page.getByRole('button', { name: /continue with google/i }).click()
    await expect(page).toHaveURL(/\/home$/)
    expect(supabase.authorizations()).toHaveLength(1)
    expect(supabase.authorizations()[0].query.provider).toBe('google')
    expect(await hasSession(page)).toBe(true)

    await expect(page.getByRole('heading', { name: /two quick things/i })).toBeVisible()
    await page.getByLabel('Full name').fill(PROFILE.display_name)
    await page.getByLabel('University').fill(PROFILE.university)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hi,? ada/i)
    await expect.poll(() => supabase.userUpdates().length).toBe(1)
    expect(supabase.userUpdates()[0].body.data).toEqual(PROFILE)
    expect(errors).toEqual([])
  })

  test('a signed-in student stays signed in after a reload, and Login sends them to Home', async ({
    page,
  }) => {
    await signedIn(page)
    await page.goto('/home')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hi,? ada/i)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hi,? ada/i)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/home$/)
  })

  test('a signed-out visitor on a signed-in screen is sent to Login', async ({ page }) => {
    await mockSupabase(page)
    await page.goto('/taxes')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })
})

test.describe('account sync', () => {
  test('finishing the status check saves the answers to the account and counts one status check', async ({
    page,
  }) => {
    const supabase = await signedIn(page)
    await page.goto('/questionnaire')
    await page.getByRole('button', { name: 'Yes, I am' }).click()
    await page.getByRole('button', { name: 'No, I had no income' }).click()
    await page.getByRole('button', { name: '5 calendar years' }).click()
    await page.getByRole('combobox', { name: /select your country/i }).click()
    await page.getByRole('option', { name: 'Nepal' }).click()
    await page.getByRole('button', { name: /^continue/i }).click()
    await expect(page).toHaveURL(/\/taxes$/)

    await expect.poll(() => supabase.userUpdates().length).toBe(1)
    const { data } = supabase.userUpdates()[0].body
    expect(data).toMatchObject(PROFILE)
    expect(data.questionnaire).toMatchObject({ taxYear: 2026, answers: { country: 'Nepal' } })
    await expect.poll(() => supabase.countNames().filter((n) => n === 'status_check_done')).toHaveLength(1)
  })

  test('a failed account sync keeps the answers in this browser and says so', async ({ page }) => {
    await signedIn(page, { fail: { updateUser: 500 } })
    await page.goto('/questionnaire')
    await page.getByRole('button', { name: 'Yes, I am' }).click()
    await page.getByRole('button', { name: 'No, I had no income' }).click()
    await page.getByRole('button', { name: '5 calendar years' }).click()
    await page.getByRole('combobox', { name: /select your country/i }).click()
    await page.getByRole('option', { name: 'Nepal' }).click()
    await page.getByRole('button', { name: /^continue/i }).click()
    await expect(page).toHaveURL(/\/taxes$/)
    await expect(page.getByText(/account sync is temporarily unavailable/i)).toBeVisible()
    await expect(page.getByText('What this means for you')).toBeVisible()
  })

  test('saving the profile on the Account screen updates the account', async ({ page }) => {
    const supabase = await signedIn(page)
    await page.goto('/account')
    await page.getByLabel('Full name').fill('Grace Student')
    await page.getByLabel('University').fill('Other University')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    expect(supabase.userUpdates().at(-1).body.data).toEqual({
      display_name: 'Grace Student',
      university: 'Other University',
    })
  })

  test('the profile still saves in this browser when the account is unreachable', async ({
    page,
  }) => {
    await signedIn(page, { fail: { updateUser: 500 } })
    await page.goto('/account')
    await page.getByLabel('Full name').fill('Grace Student')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText(/saved in this browser/i)).toBeVisible()
    // The new name is kept in this browser even though the account could not be updated.
    expect(
      await page.evaluate((id) => localStorage.getItem(`display_name_${id}`), USER_ID),
    ).toBe('"Grace Student"')
  })
})

test.describe('anonymous usage counts', () => {
  test('a signed-in visit and a Form 8843 download send only event names, never the account or the form', async ({
    page,
  }) => {
    const supabase = await signedIn(page)
    await page.goto('/home')
    await expect.poll(() => supabase.countNames()).toContain('visit')
    await page.goto('/chat')
    await downloadForm8843(page, 2026)
    await expect
      .poll(() => supabase.countNames())
      .toEqual(expect.arrayContaining(['visit', 'form8843_started', 'form8843_downloaded']))

    const names = supabase.countNames()
    for (const once of ['form8843_started', 'form8843_downloaded'])
      expect(names.filter((n) => n === once), once).toHaveLength(1)
    expect(names.filter((n) => n === 'visit')).toHaveLength(1)
    for (const count of supabase.counts()) {
      expect(Object.keys(count.body)).toEqual(['p_event'])
      // The counter uses the public key, not the student's own session.
      expect(count.headers.authorization).toBe(`Bearer ${ANON_KEY}`)
      expect(count.headers.apikey).toBe(ANON_KEY)
      expect(count.headers.cookie).toBeUndefined()
    }
    // Nothing typed into the form reached Supabase in any request.
    const sent = JSON.stringify(supabase.state.requests.map((r) => [r.body, r.query]))
    for (const value of Object.values(FORM_VALUES)) expect(sent, value).not.toContain(value)
  })

  for (const [setting, value] of [
    ['doNotTrack', '1'],
    ['globalPrivacyControl', true],
  ])
    test(`${setting} turns the usage counter off`, async ({ page }) => {
      await page.addInitScript(
        ([name, v]) => Object.defineProperty(Navigator.prototype, name, { get: () => v }),
        [setting, value],
      )
      const supabase = await signedIn(page)
      await page.goto('/home')
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/hi,? ada/i)
      await page.goto('/taxes')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForTimeout(500)
      expect(supabase.counts()).toHaveLength(0)
    })
})

test.describe('signing out and deleting the account', () => {
  test('signing out ends the session and clears this student’s data from the browser', async ({
    page,
  }) => {
    const supabase = await signedIn(page)
    await page.goto('/account')
    await page.evaluate((key) => localStorage.setItem(key, '{"w2":true}'), userKey)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(supabase.logouts()).toHaveLength(1)
    expect(supabase.logouts()[0].query.scope).toBe('local')
    expect(await hasSession(page)).toBe(false)
    expect(await page.evaluate((key) => localStorage.getItem(key), userKey)).toBeNull()
    await page.goto('/taxes')
    await expect(page).toHaveURL(/\/login$/)
    await page.reload()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('a failed sign-out says so and keeps the session', async ({ page }) => {
    await signedIn(page, { fail: { logout: 500 } })
    await page.goto('/account')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByText(/sign out failed/i)).toBeVisible()
    await expect(page).toHaveURL(/\/account$/)
    expect(await hasSession(page)).toBe(true)
  })

  test('deleting the account calls the delete function, signs out and clears this browser', async ({
    page,
  }) => {
    const supabase = await signedIn(page)
    await page.goto('/account')
    await page.evaluate((key) => localStorage.setItem(key, '{"w2":true}'), userKey)
    await page.getByRole('button', { name: 'Delete account' }).click()
    const dialog = page.getByRole('dialog', { name: /delete your account/i })
    await expect(dialog).toBeVisible()
    // Nothing is deleted until it is confirmed.
    expect(supabase.deleteCalls()).toHaveLength(0)
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(supabase.deleteCalls()).toHaveLength(1)
    // The function takes no arguments: it deletes the signed-in user and nobody else.
    expect(supabase.deleteCalls()[0].body ?? {}).toEqual({})
    expect(supabase.deleteCalls()[0].headers.authorization).toMatch(/^Bearer ey/)
    expect(await hasSession(page)).toBe(false)
    expect(await page.evaluate((key) => localStorage.getItem(key), userKey)).toBeNull()
    await page.goto('/taxes')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('cancelling the delete dialog deletes nothing', async ({ page }) => {
    const supabase = await signedIn(page)
    await page.goto('/account')
    await page.getByRole('button', { name: 'Delete account' }).click()
    const dialog = page.getByRole('dialog', { name: /delete your account/i })
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
    expect(supabase.deleteCalls()).toHaveLength(0)
    expect(await hasSession(page)).toBe(true)
  })

  test('a failed deletion keeps the student signed in with their data and shows how to get help', async ({
    page,
  }) => {
    const supabase = await signedIn(page, { fail: { deleteUser: 500 } })
    await page.goto('/account')
    await page.evaluate((key) => localStorage.setItem(key, '{"w2":true}'), userKey)
    await page.getByRole('button', { name: 'Delete account' }).click()
    const dialog = page.getByRole('dialog', { name: /delete your account/i })
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(dialog.getByText(/account deletion did not complete/i)).toBeVisible()
    await expect(dialog.getByText('support@f1taxhelper.com')).toBeVisible()
    expect(supabase.deleteCalls()).toHaveLength(1)
    expect(supabase.logouts()).toHaveLength(0)
    expect(await hasSession(page)).toBe(true)
    expect(await page.evaluate((key) => localStorage.getItem(key), userKey)).not.toBeNull()
  })
})
