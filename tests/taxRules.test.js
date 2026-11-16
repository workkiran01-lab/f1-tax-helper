import { describe, it, expect } from 'vitest'
import {
  computeStatusResult,
  questionnaireResidency,
  buildActionItems,
} from '../src/utils/taxRules.js'
import { treatyGuidance, getTreatyByCountryName } from '../src/data/treaties.js'
import { systemPrompt } from '../lib/taxPrompt.js'
import {
  TAX_YEAR,
  FILING_YEAR,
  canGenerate8843,
  taxYearOpen,
  FORM_8843_MAILING,
  STANDARD_DEDUCTION_SINGLE,
  DEADLINES,
} from '../src/data/taxSeason.js'
const baseline = {
  visa: 'f1',
  years: '3-4',
  days: 'gte183',
  income: 'none',
  status_change: 'no',
  compliance: 'yes',
}
describe('student residency screening', () => {
  it.each(['1-2', '3-4', '5'])(
    'excludes eligible student days through year %s, even with 183+ actual days',
    (years) => {
      expect(computeStatusResult({ ...baseline, years }).badge).toBe('nra')
    },
  )
  it.each([
    { years: '6plus' },
    { years: 'unknown' },
    { visa: 'j1-other' },
    { status_change: 'yes' },
    { compliance: 'unsure' },
    { days: 'zero' },
    { visa: 'other' },
  ])('requires review rather than assigning a resident return: %j', (patch) => {
    const result = computeStatusResult({ ...baseline, ...patch })
    expect(result.badge).toBe('review')
    expect(result.forms).toEqual([])
  })
  it('preserves only 8843 for eligible students with no income', () => {
    const result = computeStatusResult(baseline)
    expect(result.forms.map((f) => f.id)).toEqual(['form-8843'])
    expect(result.deadline).toContain('June 15, 2027')
  })
  it.each([
    ['w2', 'April'],
    ['both', 'April'],
    ['scholarship', 'June'],
  ])('uses the correct expected deadline for %s income', (income, month) => {
    expect(computeStatusResult({ ...baseline, income }).deadline).toContain(`${month} 15, 2027`)
  })
  it('does not classify a sixth or unknown year as resident', () => {
    expect(questionnaireResidency(5)).toBe('Likely Nonresident Alien')
    expect(questionnaireResidency(6)).toBe('Residency review needed')
    expect(questionnaireResidency(0)).toBe('Residency review needed')
    expect(
      buildActionItems({ residencyStatus: questionnaireResidency(6), hasUSIncome: false }, '').join(
        ' ',
      ),
    ).not.toContain('only Form 8843')
  })
})
describe('reviewed season and treaty sources', () => {
  it('separates income year, season and verified IRS PDF year', () => {
    expect([TAX_YEAR, FILING_YEAR]).toEqual([2026, 2027])
    expect(canGenerate8843(2026)).toBe(true) // IRS 2026 form reviewed 2026-11-15
    expect(canGenerate8843(2025)).toBe(true)
    expect(canGenerate8843(2027)).toBe(false) // never roll forward with the clock
    expect(canGenerate8843(2024)).toBe(false)
    expect(STANDARD_DEDUCTION_SINGLE).toEqual({ 2025: 15750, 2026: 16100 })
    expect(DEADLINES.map((d) => d.date)).toContain('Mar 15, 2027')
  })
  it('treats a tax year as open until January 1 of the next year (UTC)', () => {
    expect(taxYearOpen(2026, new Date('2026-11-15T00:00:00Z'))).toBe(true)
    expect(taxYearOpen(2026, new Date('2026-12-31T23:59:59Z'))).toBe(true)
    expect(taxYearOpen(2026, new Date('2027-01-01T00:00:00Z'))).toBe(false)
    expect(taxYearOpen(2025, new Date('2026-11-15T00:00:00Z'))).toBe(false)
  })
  it('tells the chat model the date and that 2026 days are not final until the year ends', () => {
    const during = systemPrompt(new Date('2026-11-15T12:00:00Z'))
    expect(during).toContain('TODAY: 2026-11-15')
    expect(during).toMatch(/2026 tax year has not ended/)
    expect(during).toMatch(/wait until December 31/)
    const after = systemPrompt(new Date('2027-01-05T12:00:00Z'))
    expect(after).toContain('TODAY: 2027-01-05')
    expect(after).toContain('The 2026 tax year has ended.')
    expect(after).not.toMatch(/wait until December 31/)
    expect(during).not.toMatch(/irs-dft|draft 2026/i)
  })
  it('gives the model the answer shape, the app scope and the reviewed mailing address', () => {
    const prompt = systemPrompt(new Date('2026-11-15T12:00:00Z'))
    for (const heading of ['### Answer', '### Why', '### IRS Reference', '### Next Step'])
      expect(prompt).toContain(heading)
    expect(prompt).toMatch(/Never use bold text, colons, numbering or other labels/)
    expect(prompt).toMatch(/does not prepare, file or e-file Form 1040-NR/)
    expect(prompt).toContain(FORM_8843_MAILING.standalone.join(', '))
    expect(prompt).toContain(`checked ${FORM_8843_MAILING.reviewed}`)
    expect(prompt).toMatch(/June 15 is the regular due date in these cases, not an extension/)
    // Format example: the model follows a concrete shape more reliably than a description.
    expect(prompt).toMatch(/Example of the shape only[\s\S]*### Answer[\s\S]*### Next Step/)
    // A pasted SSN is answered with "do not share it here", not just a refusal to use it.
    expect(prompt).toMatch(/do not repeat it: tell them plainly not to share it in chat/)
  })
  it('never treats unreviewed treaty coverage as an absence', () => {
    for (const name of ['Canada', 'Mexico', 'United Kingdom']) {
      expect(getTreatyByCountryName(name).status).toBe('unreviewed')
      expect(treatyGuidance(name)).toContain('does not mean no treaty')
    }
  })
  it('does not promise scholarship exemptions or require universal 8833', () => {
    const india = treatyGuidance('India')
    expect(india).toContain('$16,100')
    expect(india).toContain('not a blanket exemption')
    expect(india).toContain('not universally required')
    expect(getTreatyByCountryName('Russia').status).toBe('suspended')
    expect(getTreatyByCountryName('Hungary').status).toBe('terminated')
  })
})
