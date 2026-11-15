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

test.describe('first visit', () => {
  test('asks for the disclaimer once, then stays out of the way', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /continue as guest/i }).click()
    const gate = page.getByRole('dialog', { name: 'Before you start' })
    await expect(gate).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(gate).toBeVisible()
    await gate.getByRole('button', { name: 'I understand' }).click()
    await expect(gate).toBeHidden()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hi/i)
    await expect(gate).toBeHidden()
    await expect(page.getByText(/not tax or legal advice/i)).toBeVisible()
  })
})

test.describe('guest journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('f1_disclaimer_ack_v1', 'true'))
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

  test('a completed Form 8843 downloads and shows the print, sign and mail guide', async ({
    page,
  }) => {
    await page.goto('/form-8843')
    await page.getByLabel('First name').waitFor()
    await page.getByLabel('Income year').selectOption('2025')
    const valueFor = (name) =>
      /date/i.test(name)
        ? '08/15/2022'
        : /zip/i.test(name)
          ? '10001'
          : /state/i.test(name)
            ? 'NY'
            : /phone/i.test(name)
              ? '2125550100'
              : /days/i.test(name)
                ? '100'
                : 'Test'
    // Fill every visible field with a valid value, then advance, until the review step.
    for (let step = 0; step < 6; step++) {
      const fields = page.locator(
        'input:not([type=radio]):not([type=checkbox]):visible, textarea:visible',
      )
      for (const field of await fields.all()) {
        const name = (await field.getAttribute('name')) || ''
        if (/tinOrSSN|middleInitial/.test(name) || (await field.inputValue())) continue
        await field.fill(valueFor(name))
      }
      for (const select of await page
        .locator('select:visible:not([aria-label="Income year"])')
        .all())
        if (!(await select.inputValue())) await select.selectOption('F-1')
      for (const radio of await page.locator('input[type=radio][value=no]:visible').all())
        await radio.check({ force: true })
      const generate = page.getByRole('button', { name: /Generate & download 2025 form/ })
      if (await generate.count()) break
      await page.getByRole('button', { name: /Continue|Review my information/ }).click()
      await page.waitForTimeout(400)
    }
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: /Generate & download 2025 form/ }).click()
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/i)
    await expect(page.getByRole('heading', { name: 'Print, sign and mail' })).toBeVisible()
    await expect(page.getByText('Austin, TX 73301')).toBeVisible()
    await expect(page.getByText(/Do not sign the form/)).toBeVisible()
  })
})
