// One shared, reviewed season for the UI and server prompt. Never roll forward
// using the clock: a new year needs reviewed IRS forms, rules and regression tests.
export const TAX_YEAR = 2026
export const FILING_YEAR = 2027
export const REVIEWED_ON = '2026-09-07'
// Each IRS Form 8843 the app can fill: the file served from /public, its SHA-256 (a changed
// file pauses downloads until its year and field mapping are re-verified), and whether its
// AcroForm field names drop the zero padding (f1_01 became f1_1 in the 2026 form).
// 2026: byte-identical (same SHA-256) to the file the IRS serves at its Form 8843 link on
// 2026-11-15 (posted 2026-11-05; the form's footer reads "Created 5/11/26", i.e. May 11, 2026).
// Its 51 fields and layout match 2025; the text differs only in years and line labels.
export const FORM_8843_TEMPLATES = Object.freeze({
  2025: Object.freeze({
    file: '/form8843.pdf',
    sha256: 'b685fcb296ae6a86ee47d82ceaa5a7b64f0a04e1749420e89d6ddde5ab5a63c8',
    unpaddedFields: false,
  }),
  2026: Object.freeze({
    file: '/form8843-2026.pdf',
    sha256: '6e32cbf67c45464e7d93ee4c184a0be775bffd59f7574d054064ee4476b46c08',
    unpaddedFields: true,
  }),
})
export const FORM_8843_TEMPLATE_YEARS = Object.freeze(Object.keys(FORM_8843_TEMPLATES).map(Number))
export const SOURCES = Object.freeze({
  whereToFile: 'https://www.irs.gov/filing/where-to-file-forms-beginning-with-the-number-8',
  form8843: 'https://www.irs.gov/forms-pubs/about-form-8843',
  form8843Pdf: 'https://www.irs.gov/pub/irs-pdf/f8843.pdf',
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
// Line 4a asks for the days actually present during the tax year, so a form for a year that
// has not ended yet cannot be final. The app warns instead of blocking.
export function taxYearOpen(year, today = new Date()) {
  return today.getTime() < Date.UTC(Number(year) + 1, 0, 1)
}
export function yearOpenNotice(year) {
  return `The ${year} tax year is not over. The form asks for the days you were actually in the US during ${year}, so wait until December 31, recount your days, and check every entry before you print, sign or mail it.`
}
export function canGenerate8843(year) {
  return Object.hasOwn(FORM_8843_TEMPLATES, Number(year))
}

// Where to mail a Form 8843 that is filed on its own (no tax return required). Copied from
// the IRS "Where to file" page for forms beginning with 8 and reviewed on the date below.
// Addresses change: the guide always links the page and tells the student to confirm it.
// If the student files a 1040-NR, the form is attached to that return instead.
export const FORM_8843_MAILING = Object.freeze({
  standalone: Object.freeze([
    'Department of the Treasury',
    'Internal Revenue Service',
    'Austin, TX 73301',
  ]),
  source: SOURCES.whereToFile,
  reviewed: '2026-11-15',
})

