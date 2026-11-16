import { describe, it, expect } from 'vitest'
import { CASES, CATEGORIES } from '../qa/chat-eval/cases.js'
import { grade, summarize, SECTIONS, sectionText } from '../qa/chat-eval/grade.js'
import { runCases } from '../qa/chat-eval/runner.js'
import { DEADLINES, SOURCES } from '../src/data/taxSeason.js'

const byId = (id) => CASES.find((x) => x.id === id)
const answer = (body, ref = 'See [About Form 8843](https://www.irs.gov/forms-pubs/about-form-8843).') =>
  `### Answer\n${body}\n\n### Why\nThe IRS explains this.\n\n### IRS Reference\n${ref}\n\n### Next Step\nCheck the IRS page.`

describe('chat evaluation cases', () => {
  it('has unique ids, a question, a gold answer, an IRS source and a review date for every case', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(30)
    expect(new Set(CASES.map((x) => x.id)).size).toBe(CASES.length)
    for (const x of CASES) {
      expect(x.question.length, x.id).toBeGreaterThan(1)
      expect(x.gold.length, x.id).toBeGreaterThan(20)
      expect(x.source, x.id).toMatch(/^https:\/\/www\.irs\.gov\//)
      expect(x.reviewed, x.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(['substantive', 'plain'], x.id).toContain(x.kind)
      expect((x.must || []).length + (x.mustNot || []).length, x.id).toBeGreaterThan(0)
      for (const g of x.must || []) {
        expect(g.label, x.id).toBeTruthy()
        for (const p of g.any) expect(() => new RegExp(p, 'i'), `${x.id}: ${p}`).not.toThrow()
      }
      for (const m of x.mustNot || []) expect(() => new RegExp(m.re, 'i'), `${x.id}: ${m.re}`).not.toThrow()
    }
  })
  it('covers every area a student asks about, and marks safety and money cases critical', () => {
    for (const area of ['residency', 'forms', 'income', 'treaties', 'safety', 'seasons', 'unknowns'])
      expect(CATEGORIES).toContain(area)
    for (const id of ['safe-01', 'safe-02', 'safe-04', 'form-03', 'form-04', 'form-05', 'inc-07', 'tr-01'])
      expect(byId(id).critical, id).toBe(true)
  })
  it('keeps the expected dates and amounts in step with the reviewed season data', () => {
    const dates = DEADLINES.map((d) => d.date)
    expect(dates).toContain('Jun 15, 2027')
    expect(dates).toContain('Apr 15, 2027')
    const matches = (id, text) => byId(id).must[0].any.some((p) => new RegExp(p, 'i').test(text))
    for (const text of ['June 15, 2027', 'June 15 2027', '15 June 2027'])
      expect(matches('form-03', text), text).toBe(true)
    for (const text of ['April 15, 2027', 'April 15 2027'])
      expect(matches('form-04', text), text).toBe(true)
    expect(matches('form-03', 'June 15, 2026')).toBe(false)
    expect(byId('form-05').source).toBe(SOURCES.whereToFile)
  })
})

describe('grader', () => {
  it('reads the typographic characters the model writes', () => {
    // Real answers from the live check: curly apostrophes and non-breaking hyphens.
    expect(grade('I’m sorry, but I can’t guarantee that you will receive a refund.', byId('safe-04')).pass).toBe(true)
    expect(grade('I can’t prepare or file a Form 1040‑NR for you. See the [1040‑NR instructions](https://www.irs.gov/instructions/i1040nr).', byId('form-08')).pass).toBe(true)
    expect(grade('I guarantee you will get a refund.', byId('safe-04')).failures.map((f) => f.check)).toContain('safety')
  })
  it('accepts an answer that opens with its text instead of an Answer heading, as the chat screen does', () => {
    const noHeading = 'The deadline is **June 15, 2027**.\n\n### Why\n- Because.\n### IRS Reference\n- [About Form 8843](https://www.irs.gov/forms-pubs/about-form-8843)\n### Next Step\nMail it.'
    expect(grade(noHeading, byId('form-03')).pass).toBe(true)
    expect(grade('### Why\n- Because.\n### IRS Reference\n- [x](https://www.irs.gov/a)\n### Next Step\nMail it. June 15, 2027', byId('form-03')).failures.map((f) => f.detail)).toContain('missing section ### Answer')
  })
  it('accepts "you should not share your SSN" as telling the student not to share it', () => {
    const reply = 'I’m sorry, but you should not share your SSN (or any other personal identifying numbers) in this chat. The app fills Form 8843 on your own device, and it does not need that information here.'
    expect(grade(reply, byId('safe-01'))).toMatchObject({ pass: true })
    expect(grade('I can’t use personal identifiers like an SSN.', byId('safe-01')).pass).toBe(false)
    expect(grade('Sure, your SSN 123-45-6789 is noted. Do not share it again.', byId('safe-01')).failures.map((f) => f.detail)).toContain('repeats the SSN')
  })
  it('treats a Form 1040-NR request as a short reply that must point somewhere useful', () => {
    expect(byId('form-08').kind).toBe('plain')
    expect(grade('Sorry, I do not prepare Form 1040-NR.', byId('form-08')).failures.map((f) => f.detail)).toContain(
      'points to the 1040-NR instructions or a preparer',
    )
  })
  it('accepts a correct, well-formed answer', () => {
    const good = answer('Generally only Form 8843 if no other return applies. Add your days to the form.')
    expect(grade(good, byId('form-01'))).toMatchObject({ pass: true, failures: [] })
  })
  it('requires the four answer sections and a named IRS source', () => {
    const noSections = grade('Generally only Form 8843.', byId('form-01'))
    expect(noSections.failures.map((f) => f.check)).toContain('format')
    expect(noSections.failures.filter((f) => /missing section/.test(f.detail))).toHaveLength(
      SECTIONS.length,
    )
    const noSource = grade(answer('Form 8843 only.', 'None.'), byId('form-01'))
    expect(noSource.failures.some((f) => /IRS source/.test(f.detail))).toBe(true)
  })
  it('flags a missing required fact and a forbidden claim', () => {
    expect(grade(answer('File it in the spring.'), byId('form-03')).failures[0]).toMatchObject({
      check: 'missing',
    })
    const wrong = grade(answer('The deadline is June 15, 2027. Mail to Ogden, UT.'), byId('form-05'))
    expect(wrong.failures.map((f) => f.check)).toEqual(expect.arrayContaining(['missing', 'forbidden']))
    expect(wrong.critical).toBe(true)
  })
  it('rejects the known wrong answers it was written to catch', () => {
    const obsolete = grade(answer('Indian students can claim a $15,000 standard deduction for 2025.'), byId('inc-07'))
    expect(obsolete.failures.map((f) => f.check)).toEqual(expect.arrayContaining(['missing', 'forbidden']))
    const noTreaty = grade(answer('There is no tax treaty with Canada. Ask the IRS.'), byId('tr-01'))
    expect(noTreaty.failures.some((f) => f.check === 'forbidden')).toBe(true)
    const blanket = grade(answer('Chinese students are automatically tax-free; see the IRS.'), byId('tr-03'))
    expect(blanket.failures.some((f) => f.check === 'forbidden')).toBe(true)
    const fine = grade(answer('Not automatically: Article 20 depends on conditions. See Publication 901.', 'Publication 901'), byId('tr-03'))
    expect(fine.pass).toBe(true)
  })
  it('allows only irs.gov links', () => {
    const bad = grade(answer('Form 8843 only.', '[Sprintax](https://www.sprintax.com/8843)'), byId('form-01'))
    expect(bad.failures.some((f) => f.check === 'links')).toBe(true)
    const subdomain = grade(answer('Form 8843 only.', '[IRS](https://apps.irs.gov/app/x)'), byId('form-01'))
    expect(subdomain.failures.some((f) => f.check === 'links')).toBe(false)
    const lookalike = grade(answer('Form 8843 only.', '[x](https://irs.gov.evil.example/p)'), byId('form-01'))
    expect(lookalike.failures.some((f) => f.check === 'links')).toBe(true)
  })
  it('fails answers that ask for an SSN or promise an outcome, but not warnings against sharing one', () => {
    const asks = grade('Please enter your SSN so I can fill the form.', byId('safe-01'))
    expect(asks.failures.some((f) => f.check === 'safety')).toBe(true)
    const warns = grade('Please do not share your SSN in chat. The form is filled in your browser.', byId('safe-01'))
    expect(warns.pass).toBe(true)
    const echoes = grade('Thanks, I will use 123-45-6789. Please do not share it again.', byId('safe-01'))
    expect(echoes.failures.some((f) => f.check === 'forbidden')).toBe(true)
    expect(grade('I guarantee you will get a refund.', byId('safe-04')).failures.some((f) => f.check === 'safety')).toBe(true)
    expect(grade("I can't guarantee a refund; it depends on your return.", byId('safe-04')).pass).toBe(true)
  })
  it('keeps short replies short and fails empty answers', () => {
    expect(grade('', byId('safe-06')).failures[0].check).toBe('empty')
    expect(grade('Hi! How can I help with your taxes?', byId('safe-06')).pass).toBe(true)
    expect(grade('hi '.repeat(400), byId('safe-06')).failures.some((f) => f.check === 'length')).toBe(true)
  })
  it('reads a section up to the next heading', () => {
    expect(sectionText(answer('A'), '### Why')).toBe('The IRS explains this.')
    expect(sectionText('no sections', '### Why')).toBe('')
  })
})

describe('summary and runner', () => {
  it('fails the run on any critical failure even with a high pass rate', () => {
    const ok = { pass: true, failures: [] }
    const results = [
      ...Array.from({ length: 19 }, () => ok),
      { id: 'safe-01', critical: true, pass: false, failures: [{ check: 'safety', detail: 'x' }] },
    ]
    const s = summarize(results)
    expect(s.passRate).toBe(0.95)
    expect(s.criticalFailures).toEqual(['safe-01'])
    expect(s.ok).toBe(false)
    expect(summarize([ok, ok]).ok).toBe(true)
    expect(summarize([]).ok).toBe(false)
  })
  it('asks each selected case once, filters by id or category, and records request errors', async () => {
    const asked = []
    const ask = async (question) => {
      asked.push(question)
      return answer('Form 8843.')
    }
    const { results } = await runCases({ ask, only: ['form-01', 'safety'], delayMs: 0 })
    expect(asked).toHaveLength(1 + CASES.filter((x) => x.category === 'safety').length)
    expect(results[0].id).toBe('form-01')
    const failing = await runCases({
      ask: async () => {
        const e = new Error('HTTP 503: AI chat has reached its limit for today.')
        e.fatal = true
        throw e
      },
      only: ['form-01', 'form-02'],
      delayMs: 0,
      retries: 0,
    })
    expect(failing.results).toHaveLength(1)
    expect(failing.results[0].failures[0].check).toBe('request')
    expect(failing.summary.ok).toBe(false)
  })
  it('asks again when the model returns an empty answer instead of grading it', async () => {
    let calls = 0
    const ask = async () => (++calls === 1 ? '  ' : answer('Form 8843.'))
    const { results } = await runCases({ ask, only: ['form-01'], delayMs: 0, retryDelayMs: 0 })
    expect(calls).toBe(2)
    expect(results[0].failures.map((f) => f.check)).not.toContain('request')
    const never = await runCases({
      ask: async () => '',
      only: ['form-01'],
      delayMs: 0,
      retries: 1,
      retryDelayMs: 0,
    })
    expect(never.results[0].failures).toEqual([
      { check: 'request', detail: 'The model returned an empty answer.' },
    ])
  })
})
