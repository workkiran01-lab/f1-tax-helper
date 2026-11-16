import { test, expect } from '@playwright/test'
import { downloadForm8843 } from './helpers.js'

// Guest-mode smoke tests against the production build. The AI endpoint is mocked so
// no paid model is called, and nothing here needs a Supabase account.

const sse = (text, finishReason) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n` +
  (finishReason
    ? `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finishReason }] })}\n\n`
    : '') +
  'data: [DONE]\n\n'

test.describe('pre-rendered information pages', () => {
  // Built by scripts/prerender.mjs. `vite preview` serves dist/tax-guide.html for /tax-guide,
  // as the vercel.json rewrite does in production.
  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false })
    for (const [path, heading, text] of [
      ['/tax-guide', /tax guide for f-1 students/i, 'Scholarships and fellowships'],
      ['/faq', /frequently asked questions/i, 'Is my scholarship taxable?'],
      ['/tax-treaties', /tax treaty lookup/i, 'This app has reviewed notes for a few countries only'],
    ])
      test(`${path} shows its text`, async ({ page }) => {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
        await expect(page.getByText(text).first()).toBeVisible()
      })
  })
  test('the app takes over the guide without showing a loading skeleton, and keeps the section in view', async ({
    page,
  }) => {
    // Record whether a skeleton ever appears while the app starts on top of the static HTML.
    await page.addInitScript(() => {
      window.__sawSkeleton = false
      new MutationObserver(() => {
        if (document.querySelector('[role="status"][aria-label="Loading"]')) window.__sawSkeleton = true
      }).observe(document, { childList: true, subtree: true })
    })
    await page.goto('/tax-guide#scholarships')
    await expect(page.getByRole('heading', { level: 2, name: 'Scholarships and fellowships' })).toBeInViewport()
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => window.__sawSkeleton)).toBe(false)
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  })
})

test.describe('public pages', () => {
  for (const [path, heading] of [
    ['/', /Answer 5 questions/i],
    ['/privacy', /privacy/i],
    ['/terms', /terms/i],
    ['/disclaimer', /disclaimer|not tax advice|information/i],
    ['/tax-guide', /tax guide for f-1 students/i],
    ['/faq', /frequently asked questions/i],
    ['/tax-treaties', /tax treaty lookup/i],
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

  test('there is no blog: that address is the not-found page, not a waitlist form', async ({
    page,
  }) => {
    await page.goto('/blog')
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByText(/join waitlist|coming soon/i)).toHaveCount(0)
  })

  test('the guide says the app does not prepare Form 1040-NR and sets the page canonical', async ({
    page,
  }) => {
    await page.goto('/tax-guide')
    await expect(page.getByText(/does not prepare, file or e-file Form 1040-NR/).first()).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.f1taxhelper.com/tax-guide',
    )
    await expect(page).toHaveTitle(/Tax guide for F-1 students/)
    // Every outside link on the page is an official IRS page.
    const hrefs = await page.locator('a[href^="http"]').evaluateAll((els) => els.map((e) => e.href))
    expect(hrefs.length).toBeGreaterThan(10)
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/www\.irs\.gov\//)
  })

  test('the FAQ opens a question and the treaty lookup shows Canada as not reviewed', async ({
    page,
  }) => {
    await page.goto('/faq')
    await page.getByText('Can F1 Tax Helper prepare or file my Form 1040-NR?').click()
    await expect(page.getByText(/This app prepares Form 8843 only/)).toBeVisible()
    await page.goto('/tax-treaties')
    await page.getByLabel('Find your country').fill('cana')
    await page.getByRole('button', { name: 'Canada' }).click()
    await expect(page.getByText('Not reviewed in this app')).toBeVisible()
    await expect(page.getByText(/does not mean no treaty exists/)).toBeVisible()
  })

  test('moving between pages keeps the title, description and canonical in step', async ({
    page,
  }) => {
    const description = () => page.locator('meta[name="description"]').getAttribute('content')
    await page.goto('/faq')
    await expect(page).toHaveTitle(/^FAQ/)
    await page.getByText('Is F1 Tax Helper free, and is this tax advice?').click()
    await page.getByRole('link', { name: 'disclaimer', exact: true }).click()
    await expect(page).toHaveURL(/\/disclaimer$/)
    await expect(page).toHaveTitle(/Disclaimer/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://www.f1taxhelper.com/disclaimer',
    )
    expect(await description()).toMatch(/^Free Form 8843 generator/)
    await page.goto('/blog')
    await expect(page).toHaveTitle(/^F1 Tax Helper/)
  })

  test('the home page links to the guide, FAQ and treaties', async ({ page }) => {
    await page.goto('/')
    const learn = page.getByRole('navigation', { name: 'Learn' })
    for (const name of ['Tax guide', 'FAQ', 'Treaties']) await expect(learn.getByRole('link', { name })).toBeVisible()
    await learn.getByRole('link', { name: 'Tax guide' }).click()
    await expect(page).toHaveURL(/\/tax-guide$/)
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

  test('chat says so when an answer was cut off at the cap, and not when it finished', async ({
    page,
  }) => {
    let reason = 'length'
    await page.route('**/api/chat', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sse('The deadline is', reason),
      }),
    )
    await page.goto('/chat')
    const send = async (text) => {
      await page.getByLabel('Your tax question').fill(text)
      await page.getByRole('button', { name: 'Send message' }).click()
    }
    await send('When is the deadline?')
    await expect(page.getByText('The deadline is')).toBeVisible()
    await expect(page.getByRole('note').filter({ hasText: 'cut short' })).toHaveCount(1)
    reason = 'stop'
    await send('And for wages?')
    await expect(page.getByText('The deadline is')).toHaveCount(2)
    await expect(page.getByRole('note').filter({ hasText: 'cut short' })).toHaveCount(1)
  })

  test('chat shows a friendly message when the service is down', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'AI chat is temporarily unavailable. Please try again later.',
        }),
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

  for (const year of [2026, 2025])
    test(`a completed ${year} Form 8843 downloads and shows the print, sign and mail guide`, async ({
      page,
    }) => {
      await downloadForm8843(page, year)
      await expect(page.getByRole('heading', { name: 'Print, sign and mail' })).toBeVisible()
      await expect(page.getByText('Austin, TX 73301')).toBeVisible()
      await expect(page.getByText(/Do not sign the form/)).toBeVisible()
    })
})
