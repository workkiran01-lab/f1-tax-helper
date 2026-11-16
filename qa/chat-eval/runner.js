// Runs every case through an `ask(question)` function and grades the answers. The caller
// supplies `ask`, so the same loop serves the Node script and a browser tab.
import { CASES } from './cases.js'
import { grade, summarize } from './grade.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The chat API allows 20 requests a minute per address, so the default pace stays under it.
export async function runCases({
  ask,
  cases = CASES,
  only,
  delayMs = 4000,
  retries = 2,
  minPassRate = 0.9,
  onResult = () => {},
} = {}) {
  const selected = only?.length
    ? cases.filter((x) => only.some((id) => x.id === id || x.category === id))
    : cases
  const results = []
  for (const [index, testCase] of selected.entries()) {
    let answer = ''
    let error = ''
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        answer = await ask(testCase.question)
        error = ''
        break
      } catch (e) {
        error = String(e?.message || e)
        if (e?.fatal) break
        await sleep(15000 * (attempt + 1))
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
    results.push(result)
    onResult(result, index + 1, selected.length)
    if (error && /daily|limit for today/i.test(error)) break
    if (index < selected.length - 1) await sleep(delayMs)
  }
  return { summary: summarize(results, { minPassRate }), results }
}
