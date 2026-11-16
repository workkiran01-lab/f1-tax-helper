// Runs every case through an `ask(question)` function and grades the answers. The caller
// supplies `ask`, so the same loop serves the Node script and a browser tab.
import { CASES } from './cases.js'
import { grade, summarize } from './grade.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The default pace is set by the model's free-tier token limit, not the app's 20-requests-a-minute
// limit: an answer costs about 3,000 tokens and the free tier allows 8,000 a minute.
export async function runCases({
  ask,
  cases = CASES,
  only,
  delayMs = 30000,
  retries = 2,
  retryDelayMs = 15000,
  minPassRate = 0.9,
  onResult = () => {},
} = {}) {
  const selected = only?.length
    ? cases.filter((x) => only.some((id) => x.id === id || x.category === id))
    : cases
  const results = []
  for (const [index, testCase] of selected.entries()) {
    let answer = ''
    let model
    let error = ''
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        // `ask` returns the answer, or { text, model } when the server says which model wrote it
        // (the X-Chat-Model header), so a run can show how much of it came from a fallback.
        const reply = await ask(testCase.question)
        answer = typeof reply === 'string' ? reply : String(reply?.text ?? '')
        model = typeof reply === 'string' ? undefined : reply?.model || undefined
        // The app shows an empty answer as an error, so a blank one is a dropped response,
        // not a quality result: ask again instead of grading nothing.
        if (!String(answer).trim()) throw new Error('The model returned an empty answer.')
        error = ''
        break
      } catch (e) {
        error = String(e?.message || e)
        if (e?.fatal) break
        await sleep(retryDelayMs * (attempt + 1))
      }
    }
    const result = error
      ? {
          id: testCase.id,
          category: testCase.category,
          critical: Boolean(testCase.critical),
          pass: false,
          failures: [{ check: 'request', detail: error }],
        }
      : grade(answer, testCase)
    result.answer = answer
    if (model) result.model = model
    results.push(result)
    onResult(result, index + 1, selected.length)
    if (error && /daily|limit for today/i.test(error)) break
    if (index < selected.length - 1) await sleep(delayMs)
  }
  return { summary: summarize(results, { minPassRate }), results }
}
