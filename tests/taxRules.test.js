import { describe, it, expect } from 'vitest'
import {
  computeStatusResult,
  questionnaireResidency,
  buildActionItems,
} from '../src/utils/taxRules.js'
import { treatyGuidance, getTreatyByCountryName } from '../src/data/treaties.js'
import {
  TAX_YEAR,
  FILING_YEAR,
  canGenerate8843,
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
    expect(canGenerate8843(2026)).toBe(false)
    expect(canGenerate8843(2025)).toBe(true)
    expect(STANDARD_DEDUCTION_SINGLE).toEqual({ 2025: 15750, 2026: 16100 })
    expect(DEADLINES.map((d) => d.date)).toContain('Mar 15, 2027')
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
