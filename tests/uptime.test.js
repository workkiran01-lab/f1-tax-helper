import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { classifyChat, busyWait, runUptimeCheck } from '../scripts/uptime-check.mjs'

const BUSY_TEXT = 'Lots of students are asking questions right now. Please try again in about 12 seconds.'
const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

describe('classifyChat', () => {
  it('accepts 200, treats only the busy message as busy, and fails everything else', () => {
    expect(classifyChat({ status: 200 }).level).toBe('ok')
    expect(classifyChat({ status: 503, error: BUSY_TEXT }).level).toBe('busy')
    // Not busy even though some carry a Retry-After: these are outages or used-up allowances.
    for (const [status, error] of [
      [503, 'AI chat has reached its limit for now. Your checklist and form preparation still work; please try again in an hour or so.'],
      [503, 'AI chat has reached its limit for today. Your checklist and form preparation still work; please try again tomorrow.'],
      [503, 'AI chat is temporarily unavailable. Please try again later.'],
      [502, 'The AI service is unavailable. Please try again shortly.'],
      [502, 'The AI response was interrupted. Please try again.'],
      [429, 'Too many requests. Please wait a minute and try again.'],
      [403, 'Forbidden origin.'],
      [0, 'TimeoutError'],
    ])
      expect(classifyChat({ status, error }).level, `${status} ${error}`).toBe('fail')
  })
  it('does not read the busy text from a 502', () => {
    expect(classifyChat({ status: 502, error: BUSY_TEXT }).level).toBe('fail')
  })
})

describe('busyWait', () => {
  it('follows Retry-After within 5 to 60 seconds and defaults to 30', () => {
    expect([busyWait('12'), busyWait('2'), busyWait('900'), busyWait(null), busyWait('soon')]).toEqual([12, 5, 60, 30, 30])
  })
})

function fakeSite({ health = () => json(200, { ok: true }), chat }) {
  const calls = []
  const sleeps = []
  return {
    calls,
    sleeps,
    fetchImpl: async (url, init = {}) => {
      calls.push(`${init.method || 'GET'} ${new URL(url).pathname}`)
      return new URL(url).pathname === '/api/health' ? health() : chat(calls.filter((c) => c.includes('/api/chat')).length)
    },
    sleep: async (ms) => void sleeps.push(ms),
  }
}
const ok = () => new Response('data: {"choices":[{"delta":{"content":"8843"}}]}\n\ndata: [DONE]\n\n', {
  status: 200,
  headers: { 'Content-Type': 'text/event-stream', 'X-Chat-Model': 'openai/gpt-oss-120b' },
})

describe('runUptimeCheck', () => {
  it('passes when health and chat answer, and prints the model that answered', async () => {
    const site = fakeSite({ chat: ok })
    const lines = []
    const result = await runUptimeCheck({ ...site, log: (l) => lines.push(l) })
    expect(result).toEqual({ ok: true, notes: [] })
    expect(lines.join('\n')).toContain('model: openai/gpt-oss-120b')
    expect(site.sleeps).toEqual([])
  })
  it('retries a busy answer once after the stated wait and passes if the second answer works', async () => {
    const site = fakeSite({ chat: (n) => (n === 1 ? json(503, { error: BUSY_TEXT }, { 'Retry-After': '12' }) : ok()) })
    const result = await runUptimeCheck(site)
    expect(result.ok).toBe(true)
    expect(result.notes).toEqual([])
    expect(site.sleeps).toEqual([12000])
    expect(site.calls.filter((c) => c.includes('/api/chat'))).toHaveLength(2)
  })
  it('only warns, and does not fail, when chat is still busy after the retry', async () => {
    const site = fakeSite({ chat: () => json(503, { error: BUSY_TEXT }, { 'Retry-After': '9' }) })
    const result = await runUptimeCheck(site)
    expect(result.ok).toBe(true)
    expect(result.notes.map((n) => n.level)).toEqual(['warning'])
    expect(site.calls.filter((c) => c.includes('/api/chat'))).toHaveLength(2)
  })
  it('fails at once on a 502, a used-up allowance, or a rate-limiter outage, without retrying', async () => {
    for (const [status, error] of [
      [502, 'The AI service is unavailable. Please try again shortly.'],
      [503, 'AI chat has reached its limit for now. Your checklist and form preparation still work; please try again in an hour or so.'],
      [503, 'AI chat is temporarily unavailable. Please try again later.'],
    ]) {
      const site = fakeSite({ chat: () => json(status, { error }, { 'Retry-After': '60' }) })
      const result = await runUptimeCheck(site)
      expect(result.ok, `${status} ${error}`).toBe(false)
      expect(result.notes[0].level).toBe('error')
      expect(site.calls.filter((c) => c.includes('/api/chat'))).toHaveLength(1)
    }
  })
  it('retries a dropped connection once, then fails', async () => {
    let n = 0
    const site = fakeSite({ chat: () => { n += 1; throw new TypeError('fetch failed') } })
    const result = await runUptimeCheck(site)
    expect(n).toBe(2)
    expect(result.ok).toBe(false)
  })
  it('fails when the health check keeps failing, after three tries', async () => {
    const site = fakeSite({ health: () => json(500, {}), chat: ok })
    const result = await runUptimeCheck(site)
    expect(result.ok).toBe(false)
    expect(result.notes[0].message).toMatch(/health check failed/)
    expect(site.calls.filter((c) => c.includes('/api/health'))).toHaveLength(3)
    expect(site.sleeps).toEqual([10000, 10000])
  })
  it('never writes the question or answer text to its log', async () => {
    const site = fakeSite({ chat: ok })
    const lines = []
    await runUptimeCheck({ ...site, log: (l) => lines.push(l) })
    expect(lines.join('\n')).not.toMatch(/8843|what form do/i)
  })
})

describe('the workflow', () => {
  const workflow = readFileSync(new URL('../.github/workflows/uptime.yml', import.meta.url), 'utf8')
  it('runs every day and calls the tested script rather than its own shell logic', () => {
    expect(workflow).toMatch(/cron: '\d+ \d+ \* \* \*'/)
    expect(workflow).toContain('node scripts/uptime-check.mjs')
    expect(workflow).toContain('actions/checkout@')
    expect(workflow).not.toMatch(/curl /)
  })
})
