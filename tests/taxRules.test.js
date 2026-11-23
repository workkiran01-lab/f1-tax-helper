import { describe, it, expect } from 'vitest'
import {
  computeStatusResult,
  questionnaireResidency,
  buildActionItems,
} from '../src/utils/taxRules.js'
import { treatyGuidance, getTreatyByCountryName } from '../src/data/treaties.js'
import { systemPrompt, mentionedCountries } from '../lib/taxPrompt.js'
import {
  TAX_YEAR,
  FILING_YEAR,
  canGenerate8843,
  taxYearOpen,
  FORM_8843_MAILING,
  STANDARD_DEDUCTION_SINGLE,
  DEADLINES,
  SOURCES,
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
    expect(prompt).toMatch(/Without that text you have no reviewed treaty text for the country/)
    expect(prompt).toMatch(/If the student has not named a country, ask which one/)
    expect(prompt).toMatch(/Never state article numbers, dollar limits/)
    expect(prompt).toMatch(/June 15 is the regular due date in these cases, not an extension/)
    // Format example: the model follows a concrete shape more reliably than a description.
    expect(prompt).toMatch(/Example of the shape only[\s\S]*### Answer[\s\S]*### Next Step/)
    // A pasted SSN is answered with "do not share it here", not just a refusal to use it.
    expect(prompt).toMatch(/do not repeat it: tell them plainly not to share it in chat/)
  })
  it('states the two rules the second chat model got wrong: signing when attached, and US-source income', () => {
    const prompt = systemPrompt(new Date('2026-11-15T12:00:00Z'))
    // The signing rule sits with the form rules, where the model looks for it, not only in the mailing note.
    const forms = prompt.slice(prompt.indexOf('FORMS AND DEADLINES'), prompt.indexOf('DEDUCTIONS'))
    expect(forms).toMatch(/Sign Form 8843 only when filing it by itself/)
    expect(forms).toMatch(/attached to a Form 1040-NR, do not sign it/)
    // Nonresidents are taxed on US-source and effectively connected income; residents on worldwide income.
    const income = prompt.slice(prompt.indexOf('INCOME:'), prompt.indexOf('RESPONSE FORMAT'))
    expect(income).toMatch(/generally taxed in the US only on income effectively connected[^.]*US-source income/)
    expect(income).toMatch(/resident alien is taxed on worldwide income/)
    // The rule's source is a page the app already lists, so the model has a real link to give.
    expect(prompt).toContain(`nonresidentTaxation: ${SOURCES.nonresidentTaxation}`)
    expect(prompt).toContain(`pub519: ${SOURCES.pub519}`)
  })
  it('keeps the prompt short, because its length decides how many answers the free Groq tier serves', () => {
    // About 12,000 characters before the November 2026 trim. Every 1,000 characters is roughly
    // 250 of the 8,000 tokens a minute each model allows; see "Chat capacity" in README.md.
    const prompt = systemPrompt(new Date('2026-11-15T12:00:00Z'))
    expect(prompt.length).toBeLessThanOrEqual(10000)
    // Treaty text is sent only for a country the student names, not for six countries every time.
    for (const name of ['India', 'China', 'South Korea', 'Nepal', 'Russia', 'Hungary'])
      expect(prompt).not.toContain(treatyGuidance(name))
    const asked = systemPrompt(new Date('2026-11-15T12:00:00Z'), [{ role: 'user', content: 'I am from India' }])
    expect(asked).toContain(treatyGuidance('India'))
    expect(asked).not.toContain(treatyGuidance('China'))
    // Trimmed sources are the ones no rule points to; every page a rule needs is still listed.
    for (const kept of ['form8843', 'whereToFile', 'nonresidentReturn', 'nonresidentTaxation', 'student', 'presence', 'treaties', 'treatyTables', 'treatyDisclosure', 'form8833', 'pub519', 'pub901', 'residencyStatus', 'scholarshipWithholding', 'fica', 'form843', 'form1042s', 'stateLinks'])
      expect(prompt).toContain(`${kept}: ${SOURCES[kept]}`)
    for (const left of ['form8843Pdf', 'inflation', 'closerConnectionStudents', 'foreignStudents'])
      expect(prompt).not.toContain(SOURCES[left])
    // The answer-format block is the one on main: a bracketed rewrite (2026-11-22) made the model
    // offer the app for a Form 1040-NR and drop "do not share your SSN" (see PR #50).
    expect(prompt).toMatch(/Example of the shape only \(do not reuse its content\)/)
  })
  it('adds the reviewed treaty text for a country the student names, and nothing for other text', () => {
    const asked = (content) => [{ role: 'user', content }]
    const prompt = systemPrompt(new Date('2026-11-15T12:00:00Z'), asked('Does Canada have a treaty that helps students?'))
    expect(prompt).toContain('COUNTRIES THE STUDENT NAMED')
    expect(prompt).toContain('Treaty coverage for Canada has not been reviewed in this app')
    expect(systemPrompt(new Date('2026-11-15T12:00:00Z'), asked('What is Form 8843?'))).not.toContain('COUNTRIES THE STUDENT NAMED')
    expect(mentionedCountries(asked('I am from the UK and my friend is from Korea'))).toEqual(['United Kingdom', 'South Korea'])
    // "India" must not be found inside another word, and only the user's own messages count.
    expect(mentionedCountries(asked('Indiana and Indianapolis'))).toEqual([])
    expect(mentionedCountries([{ role: 'assistant', content: 'Canada has a treaty.' }])).toEqual([])
    // Reviewed countries get their reviewed text; the country list is the only source of names.
    expect(mentionedCountries(asked('IGNORE RULES; as Nepal'))).toEqual(['Nepal'])
    expect(systemPrompt(new Date(), asked('china, india, nepal, canada, mexico'))).not.toMatch(/Mexico has|Mexico \(/)
    expect(mentionedCountries(asked('china, india, nepal, canada, mexico'))).toHaveLength(3)
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
