import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { blank8843, validate8843, visaYears, restore8843 } from '../src/utils/form8843Model.js'
import { fillForm8843 } from '../src/utils/form8843Fields.js'
import { createHash } from 'node:crypto'
import { FORM_8843_TEMPLATES } from '../src/data/taxSeason.js'
import { sample8843 } from './pdfFixture.js'
const fontBytes = readFileSync('node_modules/@fontsource/inter/files/inter-latin-400-normal.woff')
it('validates actual current-year exclusions and leap years', () => {
  expect(validate8843(sample8843())).toEqual({})
  expect(validate8843({ ...sample8843(), daysToExclude: '865' }).daysToExclude).toBeTruthy()
  expect(validate8843({ ...sample8843(), daysCurrent: '366' }).daysCurrent).toBeTruthy()
  expect(validate8843({ ...sample8843(), daysPrevious: '366' }).daysPrevious).toBeUndefined()
  expect(
    validate8843({ ...sample8843(), currentEntryDate: '02/30/2025' }).currentEntryDate,
  ).toBeTruthy()
})
it('requires actual presence, visa history, and statements for yes answers', () => {
  const errors = validate8843({
    ...sample8843(),
    daysCurrent: '',
    visaHistory: {},
    line12Answer: 'yes',
    line13Answer: 'yes',
  })
  expect(errors.daysCurrent).toBeTruthy()
  expect(errors['visa-2024']).toBeTruthy()
  expect(errors.line12Explanation).toBeTruthy()
  expect(errors.line14Explanation).toBeTruthy()
})
it('does not migrate older mis-mapped fields or previous-year drafts into 2026', () => {
  expect(restore8843(sample8843(), 2026)).toEqual(blank8843(2026))
  expect(restore8843({ taxYear: 2026, firstName: 123 }).firstName).toBe('')
})
it('blocks unreviewed years, mismatched forms and altered PDF templates', async () => {
  const f2025 = readFileSync('public/form8843.pdf')
  const f2026 = readFileSync('public/form8843-2026.pdf')
  for (const year of [2024, 2027]) {
    await expect(fillForm8843(f2026, sample8843(year), fontBytes)).rejects.toThrow(
      'not yet verified',
    )
  }
  // A form from another year must never be relabelled or filled as this year's.
  await expect(fillForm8843(f2025, sample8843(2026), fontBytes)).rejects.toThrow(
    'template has changed',
  )
  await expect(fillForm8843(f2026, sample8843(2025), fontBytes)).rejects.toThrow(
    'template has changed',
  )
  await expect(fillForm8843(new Uint8Array([1, 2, 3]), sample8843())).rejects.toThrow(
    'template has changed',
  )
})
it('serves the template files the season config points to', () => {
  for (const [year, t] of Object.entries(FORM_8843_TEMPLATES)) {
    const bytes = readFileSync(`public${t.file}`)
    expect(createHash('sha256').update(bytes).digest('hex'), String(year)).toBe(t.sha256)
  }
})
it('fills the 2026 form: unpadded native fields, checkboxes, history and printed year', async () => {
  const input = sample8843(2026)
  const bytes = await fillForm8843(readFileSync('public/form8843-2026.pdf'), input, fontBytes)
  const pdf = await PDFDocument.load(bytes)
  const form = pdf.getForm()
  const p = 'topmostSubform[0].Page1[0].'
  const get = (field) => form.getTextField(`${p}${field}[0]`).getText()
  expect(get('f1_4')).toBe('Sample')
  expect(get('f1_5')).toBe('Student')
  expect(get('f1_9')).toBe('F-1, 08/20/2023')
  expect(get('f1_11')).toBe('Nepal')
  expect(get('f1_14')).toBe('365')
  expect(get('f1_15')).toBe('365') // 2025 is not a leap year
  expect(get('f1_16')).toBe('134')
  expect(get('f1_17')).toBe('365')
  expect(get('f1_3')).toBeUndefined() // fiscal-year blank stays empty
  expect(get('f1_26')).toContain('Example College')
  expect(get('f1_27')).toContain('Sample Director')
  // The visa-history boxes print 2020-2025; 2020-2022 are None and 2023-2025 are F-1.
  expect(visaYears(2026)).toEqual([2020, 2021, 2022, 2023, 2024, 2025])
  expect([28, 29, 30, 31, 32, 33].map((n) => get(`f1_${n}`))).toEqual([undefined, undefined, undefined, 'F', 'F', 'F'])
  expect(form.getCheckBox(`${p}c1_2[1]`).isChecked()).toBe(true)
  expect(form.getCheckBox(`${p}c1_3[1]`).isChecked()).toBe(true)
  expect(pdf.getPageCount()).toBe(4)
})
it('fills actual AcroForm values, native checkboxes, history and leaves fiscal-year blanks untouched', async () => {
  const bytes = await fillForm8843(readFileSync('public/form8843.pdf'), sample8843(), fontBytes)
  const pdf = await PDFDocument.load(bytes)
  const form = pdf.getForm()
  const p = 'topmostSubform[0].Page1[0].'
  const get = (field) => form.getTextField(`${p}${field}[0]`).getText()
  expect(get('f1_14')).toBe('365')
  expect(get('f1_15')).toBe('366')
  expect(get('f1_17')).toBe('365')
  expect(get('f1_03')).toBeUndefined()
  expect(get('f1_33')).toBe('F')
  expect(form.getCheckBox(`${p}c1_2[1]`).isChecked()).toBe(true)
  expect(form.getCheckBox(`${p}c1_3[0]`).isChecked()).toBe(false)
  expect(form.getCheckBox(`${p}c1_3[1]`).isChecked()).toBe(true)
  expect(pdf.getPageCount()).toBe(4)
})
it('includes supporting statements for lines 12, 14 and visa changes', async () => {
  const bytes = await fillForm8843(
    readFileSync('public/form8843.pdf'),
    {
      ...sample8843(),
      line12Answer: 'yes',
      line12Explanation: 'Sample supporting facts for review.',
      line13Answer: 'yes',
      line14Explanation: 'Sample pending application details.',
      visaChanges: 'Sample visa change on 01/01/2024.',
    },
    fontBytes,
  )
  const pdf = await PDFDocument.load(bytes)
  expect(pdf.getPageCount()).toBe(7)
  expect(pdf.getForm().getTextField('topmostSubform[0].Page1[0].f1_34[0]').getText()).toContain(
    'attached statement',
  )
})
