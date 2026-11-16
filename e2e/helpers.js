import { expect } from '@playwright/test'

// Fills every visible field of the Form 8843 wizard with a valid value, advances to the review
// step, generates the form for `year` and returns the download. The values are fixed so a test
// can check that none of them leaves the browser.
export const FORM_VALUES = Object.freeze({
  text: 'Test',
  date: '08/15/2022',
  zip: '10001',
  state: 'NY',
  phone: '2125550100',
  days: '100',
})

export async function downloadForm8843(page, year) {
  const valueFor = (name) =>
    /date/i.test(name)
      ? FORM_VALUES.date
      : /zip/i.test(name)
        ? FORM_VALUES.zip
        : /state/i.test(name)
          ? FORM_VALUES.state
          : /phone/i.test(name)
            ? FORM_VALUES.phone
            : /days/i.test(name)
              ? FORM_VALUES.days
              : FORM_VALUES.text
  await page.goto('/form-8843')
  await page.getByLabel('First name').waitFor()
  await page.getByLabel('Income year').selectOption(String(year))
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
    // Click through the DOM: the step is still animating in, which makes Playwright's
    // own check() flaky on the phone project.
    for (const radio of await page.locator('input[type=radio][value=no]:visible').all())
      if (!(await radio.isChecked())) await radio.evaluate((el) => el.click())
    const generate = page.getByRole('button', {
      name: new RegExp(`Generate & download ${year} form`),
    })
    if (await generate.count()) break
    await page.getByRole('button', { name: /Continue|Review my information/ }).click()
    await page.waitForTimeout(700)
  }
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: new RegExp(`Generate & download ${year} form`) }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/\.pdf$/i)
  return file
}
