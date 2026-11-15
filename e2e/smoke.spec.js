import { test, expect } from '@playwright/test'

// Guest-mode smoke tests against the production build. The AI endpoint is mocked so
// no paid model is called, and nothing here needs a Supabase account.

const sse = (text) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`

test.describe('public pages', () => {
  for (const [path, heading] of [
    ['/', /Answer 5 questions/i],
    ['/privacy', /privacy/i],
    ['/terms', /terms/i],
    ['/disclaimer', /disclaimer|not tax advice|information/i],
  ]) {
    test(`${path} renders`, async ({ page }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(heading)
      expect(errors).toEqual([])
    })
  }

  test('unknown routes show the not-found page, not a blank screen', async ({ page }) => {
    await page.goto('/definitely-not-a-page')
    await expect(page.getByRole('heading').first()).toBeVisible()
  })
})

test.describe('guest journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /continue as guest/i }).click()
    await expect(page).toHaveURL(/\/home$/)
  })

  test('home greets the guest and every app tab opens', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hi/i)
    const tab = (label) =>
      page.getByRole('navigation', { name: 'Main' }).filter({ visible: true }).getByRole('link', {
        name: label,
      })
    await tab('My Taxes').click()
    await expect(page).toHaveURL(/\/taxes$/)
    await tab('Ask AI').click()
    await expect(page).toHaveURL(/\/chat$/)
    await tab('Home').click()
    await expect(page).toHaveURL(/\/home$/)
    // Form 8843 is a focus flow: it hides the tabs and offers a clear way back.
    await tab('Form 8843').click()
    await expect(page).toHaveURL(/\/form-8843$/)
    await page.getByRole('link', { name: 'Back to Home' }).click()
    await expect(page).toHaveURL(/\/home$/)
  })

  test('chat sends a question and shows the streamed answer', async ({ page }) => {
    let body
    await page.route('**/api/chat', async (route) => {
      body = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sse('File Form 8843 even with no income.'),
      })
    })
    await page.goto('/chat')
    await page.getByLabel('Your tax question').fill('Do I need to file with no income?')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText('File Form 8843 even with no income.')).toBeVisible()
    expect(body.messages.at(-1)).toMatchObject({
      role: 'user',
      content: 'Do I need to file with no income?',
    })
  })

  test('chat shows a friendly message when the service is down', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI chat is temporarily unavailable. Please try again later.' }),
      }),
    )
    await page.goto('/chat')
    await page.getByLabel('Your tax question').fill('Hello')
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible()
  })

  test('the appearance switch changes the theme and survives a reload', async ({ page }) => {
    await page.goto('/account')
    const root = page.locator('html')
    await page.getByRole('radio', { name: /light/i }).first().click()
    await expect(root).toHaveAttribute('data-theme', 'light')
    await page.reload()
    await expect(root).toHaveAttribute('data-theme', 'light')
  })

  test('the Form 8843 screen opens in guest mode', async ({ page }) => {
    await page.goto('/form-8843')
    await expect(page.getByRole('heading', { name: /form 8843/i }).first()).toBeVisible()
  })
})
