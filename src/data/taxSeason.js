// One shared, reviewed season for the UI and server prompt. Never roll forward
// using the clock: a new year needs reviewed IRS forms, rules and regression tests.
export const TAX_YEAR = 2026
export const FILING_YEAR = 2027
export const REVIEWED_ON = '2026-09-07'
export const FORM_8843_TEMPLATE_YEAR = 2025
export const FORM_8843_TEMPLATE_SHA256 =
  'b685fcb296ae6a86ee47d82ceaa5a7b64f0a04e1749420e89d6ddde5ab5a63c8'
export const SOURCES = Object.freeze({
  form8843: 'https://www.irs.gov/forms-pubs/about-form-8843',
  form8843Pdf: 'https://www.irs.gov/pub/irs-pdf/f8843.pdf',
  form8843Draft: 'https://www.irs.gov/pub/irs-dft/f8843--dft.pdf',
  nonresidentReturn: 'https://www.irs.gov/instructions/i1040nr',
  student:
    'https://www.irs.gov/individuals/international-taxpayers/exempt-individual-who-is-a-student',
  presence: 'https://www.irs.gov/individuals/international-taxpayers/substantial-presence-test',
  treaties:
    'https://www.irs.gov/individuals/international-taxpayers/united-states-income-tax-treaties-a-to-z',
  treatyDisclosure:
    'https://www.irs.gov/individuals/international-taxpayers/claiming-tax-treaty-benefits',
  inflation:
    'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
})
export const STANDARD_DEDUCTION_SINGLE = Object.freeze({ 2025: 15750, 2026: 16100 })
export const DEADLINE_NOTE =
  'Expected 2027 dates under current IRS rules; check final instructions, state deadlines and any disaster relief before filing. An extension to file does not extend time to pay.'
export const DEADLINES = [
  {
    date: 'Feb 1, 2027',
    label: 'W-2 furnished by employer (Jan 31 falls on Sunday)',
    color: 'blue',
  },
  { date: 'Mar 15, 2027', label: 'Form 1042-S generally furnished by payer', color: 'violet' },
  {
    date: 'Apr 15, 2027',
    label: '1040-NR: employee wages subject to US income tax withholding',
    color: 'red',
  },
  {
    date: 'Jun 15, 2027',
    label: '1040-NR: no employee wages subject to US income tax withholding',
    color: 'amber',
  },
  {
    date: 'Jun 15, 2027',
    label: 'Standalone Form 8843, when no income tax return is required',
    color: 'green',
  },
]
export function filingDeadline(hasWithholdingWages, year = TAX_YEAR) {
  return `${hasWithholdingWages ? 'April' : 'June'} 15, ${Number(year) + 1}`
}
export function daysInYear(year) {
  return new Date(Date.UTC(Number(year), 1, 29)).getUTCMonth() === 1 ? 366 : 365
}
export function canGenerate8843(year) {
  return Number(year) === FORM_8843_TEMPLATE_YEAR
}
