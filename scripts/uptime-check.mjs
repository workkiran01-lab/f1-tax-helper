#!/usr/bin/env node
// Daily check run by .github/workflows/uptime.yml: the site and Supabase answer, and AI chat
// answers one short question. A failure fails the workflow, and GitHub emails the person who
// last edited it. The classification is separate from the network calls so tests can cover it.
//
// "The service is busy" is normal on the free Groq tier and must not wake anyone up: it is
// retried once and then reported as a warning. Everything else that is not a 200 fails.
import { pathToFileURL } from 'node:url'

export const BASE_URL = 'https://www.f1taxhelper.com'
const QUESTION = 'In one word: what form do F-1 students with no income file?'
// The busy answer from api/chat.js. Other 503s (a missing key, a dead rate limiter, a used-up
// daily allowance) must not be mistaken for it, whatever their Retry-After says.
const BUSY = /lots of students are asking questions right now/i

// What a chat response means. `error` is the `error` text of the JSON body, if any.
export function classifyChat({ status, error = '' } = {}) {
  if (status === 200) return { level: 'ok', message: 'AI chat answered.' }
  if (status === 503 && BUSY.test(error))
    return { level: 'busy', message: 'AI chat is busy (Groq free-tier limit); not an outage.' }
  return { level: 'fail', message: `AI chat answered ${status || 'with no response'}: ${String(error).slice(0, 160)}` }
}

// Seconds to wait before asking again: Groq's figure, at least 5, at most 60, 30 if absent.
export function busyWait(retryAfter) {
  const n = Number(retryAfter)
  return Number.isFinite(n) && n > 0 ? Math.min(60, Math.max(5, Math.round(n))) : 30
}

async function getHealth({ fetchImpl, sleep, base, log }) {
  let last = 'no response'
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetchImpl(`${base}/api/health`, { signal: AbortSignal.timeout(30000) })
      if (res.ok) return { ok: true }
      last = `HTTP ${res.status}`
    } catch (error) {
      last = String(error?.name || 'Error')
    }
    log(`health attempt ${attempt} failed: ${last}`)
    if (attempt < 3) await sleep(10000)
  }
  return { ok: false, message: `The health check failed (${last}).` }
}

async function askChat({ fetchImpl, base }) {
  try {
    const res = await fetchImpl(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ messages: [{ role: 'user', content: QUESTION }] }),
      signal: AbortSignal.timeout(60000),
    })
    let error = ''
    if (res.status !== 200) error = (await res.json().catch(() => ({})))?.error || ''
    // Read an answer to the end so the model is really asked, then drop it. Nothing is logged.
    else await res.arrayBuffer()
    return { status: res.status, error, model: res.headers.get('x-chat-model'), retryAfter: res.headers.get('retry-after') }
  } catch (error) {
    return { status: 0, error: String(error?.name || 'Error') }
  }
}

// Returns { ok, notes: [{ level: 'warning' | 'error', message }] }; never throws.
export async function runUptimeCheck({
  fetchImpl = (...args) => fetch(...args),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  base = BASE_URL,
  log = () => {},
} = {}) {
  const notes = []
  const health = await getHealth({ fetchImpl, sleep, base, log })
  if (!health.ok) notes.push({ level: 'error', message: health.message })

  let reply = await askChat({ fetchImpl, base })
  let verdict = classifyChat(reply)
  log(`chat status: ${reply.status}${reply.model ? ` model: ${reply.model}` : ''}`)
  if (verdict.level === 'busy') {
    await sleep(busyWait(reply.retryAfter) * 1000)
    reply = await askChat({ fetchImpl, base })
    verdict = classifyChat(reply)
    log(`chat status after waiting: ${reply.status}${reply.model ? ` model: ${reply.model}` : ''}`)
  } else if (verdict.level === 'fail' && reply.status === 0) {
    // A dropped connection is retried once; a real status code is not.
    await sleep(10000)
    reply = await askChat({ fetchImpl, base })
    verdict = classifyChat(reply)
    log(`chat status on retry: ${reply.status}`)
  }
  if (verdict.level === 'fail') notes.push({ level: 'error', message: verdict.message })
  if (verdict.level === 'busy') notes.push({ level: 'warning', message: verdict.message })
  return { ok: !notes.some((n) => n.level === 'error'), notes }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ok, notes } = await runUptimeCheck({ log: (line) => console.log(line) })
  for (const note of notes) console.log(`::${note.level}::${note.message}`)
  console.log(ok ? 'Uptime check passed.' : 'Uptime check FAILED.')
  process.exit(ok ? 0 : 1)
}
