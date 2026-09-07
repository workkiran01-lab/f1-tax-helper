import { TAX_YEAR, FORM_8843_TEMPLATE_YEAR, daysInYear } from '../data/taxSeason.js'
export const presenceYears = (year) => [Number(year), Number(year) - 1, Number(year) - 2]
export const visaYears = (year) => Array.from({ length: 6 }, (_, i) => Number(year) - 6 + i)
export function blank8843(year = TAX_YEAR) {
  return {
    taxYear: Number(year),
    firstName: '',
    middleInitial: '',
    lastName: '',
    tinOrSSN: '',
    countryOfCitizenship: '',
    passportCountry: '',
    passportNumber: '',
    usStreet: '',
    usCity: '',
    usState: '',
    usZip: '',
    foreignAddress: '',
    schoolName: '',
    schoolStreet: '',
    schoolCity: '',
    schoolState: '',
    schoolZip: '',
    schoolPhone: '',
    dsoName: '',
    dsoStreet: '',
    dsoCity: '',
    dsoState: '',
    dsoZip: '',
    dsoPhone: '',
    currentEntryDate: '',
    currentImmigrationStatus: 'F-1',
    daysCurrent: '',
    daysPrevious: '',
    daysPrior: '',
    daysToExclude: '',
    visaHistory: Object.fromEntries(visaYears(year).map((y) => [y, ''])),
    visaChanges: '',
    line12Answer: '',
    line12Explanation: '',
    line13Answer: '',
    line14Explanation: '',
  }
}
export function restore8843(raw, year = TAX_YEAR) {
  const blank = blank8843(year)
  if (!raw || Number(raw.taxYear) !== Number(year)) return blank
  const strings = Object.fromEntries(
    Object.keys(blank)
      .filter((k) => typeof blank[k] === 'string')
      .map((k) => [k, typeof raw[k] === 'string' ? raw[k] : blank[k]]),
  )
  return {
    ...blank,
    ...strings,
    visaHistory: Object.fromEntries(
      visaYears(year).map((y) => [
        y,
        typeof raw.visaHistory?.[y] === 'string' ? raw.visaHistory[y] : '',
      ]),
    ),
  }
}
const required = [
  ['firstName', 'lastName', 'countryOfCitizenship', 'passportCountry', 'passportNumber'],
  ['foreignAddress'],
  ['schoolName', 'schoolStreet', 'schoolCity', 'schoolState', 'schoolZip', 'schoolPhone'],
  ['dsoName', 'dsoStreet', 'dsoCity', 'dsoState', 'dsoZip', 'dsoPhone'],
  [
    'currentEntryDate',
    'currentImmigrationStatus',
    'daysCurrent',
    'daysPrevious',
    'daysPrior',
    'daysToExclude',
    'line12Answer',
    'line13Answer',
  ],
]
export function validate8843(data, step, today = new Date()) {
  const errors = {}
  const steps = step === undefined ? [0, 1, 2, 3, 4] : [step]
  if (![TAX_YEAR, FORM_8843_TEMPLATE_YEAR].includes(Number(data.taxYear)))
    errors.taxYear = 'Select a supported tax year.'
  for (const i of steps)
    for (const key of required[i]) if (!String(data[key] ?? '').trim()) errors[key] = 'Required'
  // The official PDF uses a Latin font. Reject unsupported glyphs before any
  // download instead of silently skipping a field or generating missing text.
  for (const [key, value] of Object.entries(data))
    if (typeof value === 'string') {
      if (/[^\x20-\x7E\n\r]/.test(value))
        errors[key] = 'Use Latin characters as shown on your passport, and plain punctuation.'
      if (value.length > (key.includes('Explanation') || key === 'visaChanges' ? 1500 : 180))
        errors[key] = 'This entry is too long for the form.'
    }
  const limits = { firstName: 40, lastName: 35, passportNumber: 50, currentImmigrationStatus: 100 }
  for (const [key, max] of Object.entries(limits))
    if ((data[key] || '').length > max)
      errors[key] = `Use at most ${max} characters so this field stays legible.`
  if (steps.includes(0)) {
    if (data.middleInitial && !/^[A-Za-z]$/.test(data.middleInitial))
      errors.middleInitial = 'Enter one letter.'
    if (data.tinOrSSN && !/^(\d{9}|\d{3}-\d{2}-\d{4})$/.test(data.tinOrSSN))
      errors.tinOrSSN = 'Enter 9 digits, or leave blank if none.'
  }
  for (const [index, prefix] of [
    [1, 'us'],
    [2, 'school'],
    [3, 'dso'],
  ])
    if (steps.includes(index)) {
      const applicable =
        prefix !== 'us' || ['Street', 'City', 'State', 'Zip'].some((s) => data[prefix + s]?.trim())
      if (applicable) {
        for (const suffix of ['Street', 'City', 'State', 'Zip'])
          if (!data[prefix + suffix]?.trim())
            errors[prefix + suffix] = 'Complete the address, or clear an inapplicable US address.'
        if (!/^[A-Za-z]{2}$/.test(data[prefix + 'State'] || ''))
          errors[prefix + 'State'] = 'Use the 2-letter state code.'
        if (!/^\d{5}(-\d{4})?$/.test(data[prefix + 'Zip'] || ''))
          errors[prefix + 'Zip'] = 'Use a 5-digit ZIP, optionally followed by -1234.'
      }
      if (prefix !== 'us' && (data[prefix + 'Phone'] || '').replace(/\D/g, '').length !== 10)
        errors[prefix + 'Phone'] = 'Enter a 10-digit US phone number.'
    }
  if (steps.includes(4)) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data.currentEntryDate || '')
    if (!match) errors.currentEntryDate = 'Use MM/DD/YYYY.'
    else {
      const [, month, day, year] = match.map(Number)
      const date = new Date(Date.UTC(year, month - 1, day))
      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day ||
        date > today ||
        year > Number(data.taxYear)
      )
        errors.currentEntryDate = 'Use a valid entry date no later than the tax year or today.'
    }
    for (const [i, key] of ['daysCurrent', 'daysPrevious', 'daysPrior'].entries()) {
      const max = daysInYear(Number(data.taxYear) - i)
      if (!/^\d{1,3}$/.test(data[key] || '') || Number(data[key]) > max)
        errors[key] = `Enter an integer from 0 to ${max}, including 0 for no presence.`
    }
    if (
      !/^\d{1,3}$/.test(data.daysToExclude || '') ||
      Number(data.daysToExclude) > Number(data.daysCurrent)
    )
      errors.daysToExclude = 'Excluded days cannot exceed actual days in the selected tax year.'
    for (const year of visaYears(data.taxYear))
      if (
        !['F-1', 'F-2', 'J-1', 'J-2', 'M-1', 'Q-1', 'None', 'Changed'].includes(
          data.visaHistory?.[year],
        )
      )
        errors[`visa-${year}`] = 'Select the visa held, or None if no F/J/M/Q status.'
    if (Object.values(data.visaHistory || {}).includes('Changed') && !data.visaChanges?.trim())
      errors.visaChanges = 'List the visa types and the dates each changed.'
    for (const key of ['line12Answer', 'line13Answer'])
      if (!['yes', 'no'].includes(data[key])) errors[key] = 'Select Yes or No.'
    if (data.line12Answer === 'yes' && !data.line12Explanation?.trim())
      errors.line12Explanation =
        'Describe facts supporting continued student day exclusions; these require individual review.'
    if (data.line13Answer === 'yes' && !data.line14Explanation?.trim())
      errors.line14Explanation = 'Explain the permanent-residence application or steps taken.'
  }
  return errors
}
