import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createChatHandler } from '../api/chat.js'
import { dailyBudget, rateLimit } from '../lib/apiSafety.js'

const env = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon', GROQ_API_KEY: 'k' }
const req = (ip = '203.0.113.9') =>
  new Request('https://f1taxhelper.com/api/chat', { headers: { 'x-forwarded-for': ip } })
const counter = (n) => vi.fn(async () => new Response(JSON.stringify(n)))
afterEach(() => vi.restoreAllMocks())

describe('shared limiter', () => {
  it('counts in Supabase and compares with the limit', async () => {
    expect(await rateLimit(req(), 'chat', 20, env, counter(20))).toBe(false)
    expect(await rateLimit(req(), 'chat', 20, env, counter(21))).toBe(true)
  })
  it('sends a hashed key, never the raw address', async () => {
    const fetchImpl = counter(1)
    await rateLimit(req('198.51.100.77'), 'chat', 20, env, fetchImpl)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://x.supabase.co/rest/v1/rpc/rate_hit')
    const body = JSON.parse(init.body)
    expect(body.p_key).toMatch(/^rl:chat:[0-9a-f]{32}$/)
    expect(init.body).not.toContain('198.51.100.77')
  })
  it('falls back to a per-instance limit, logs, and never throws when Supabase is down', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const down = vi.fn(async () => new Response('no', { status: 500 }))
    const ip = `fallback-${crypto.randomUUID()}`
    for (let i = 0; i < 3; i++) expect(await rateLimit(req(ip), 'chat', 3, env, down)).toBe(false)
    expect(await rateLimit(req(ip), 'chat', 3, env, down)).toBe(true)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Shared limiter unavailable'))
    const boom = vi.fn(async () => { throw new Error('network') })
    await expect(rateLimit(req(), 'chat', 3, env, boom)).resolves.toBeTypeOf('boolean')
  })
  it('uses the local limiter when Supabase is not configured', async () => {
    const fetchImpl = vi.fn()
    expect(await rateLimit(req(`local-${crypto.randomUUID()}`), 'chat', 5, {}, fetchImpl)).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('daily budget', () => {
  it('reports exhaustion once the shared count passes the cap', async () => {
    expect(await dailyBudget('chat', 3000, env, counter(3000))).toBe(false)
    expect(await dailyBudget('chat', 3000, env, counter(3001))).toBe(true)
  })
  it('uses an unguessable key: no date in it, stable per secret and day, different per secret', async () => {
    const key = async (secret) => {
      const fetchImpl = counter(1)
      await dailyBudget('chat', 10, { ...env, GROQ_API_KEY: secret }, fetchImpl)
      return JSON.parse(fetchImpl.mock.calls[0][1].body).p_key
    }
    const a = await key('secret-one')
    expect(a).toMatch(/^budget:chat:[0-9a-f]{32}$/)
    expect(a).not.toContain(new Date().toISOString().slice(0, 10))
    expect(await key('secret-one')).toBe(a)
    expect(await key('secret-two')).not.toBe(a)
  })
  it('keys per-address counters the same way', async () => {
    const key = async (secret) => {
      const fetchImpl = counter(1)
      await rateLimit(req('198.51.100.7'), 'chat', 20, { ...env, GROQ_API_KEY: secret }, fetchImpl)
      return JSON.parse(fetchImpl.mock.calls[0][1].body).p_key
    }
    expect(await key('secret-one')).not.toBe(await key('secret-two'))
  })
  it('counts locally when the shared counter is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const down = vi.fn(async () => { throw new Error('offline') })
    expect(await dailyBudget('chat', 2, env, down)).toBe(false)
    expect(await dailyBudget('chat', 2, env, down)).toBe(false)
    expect(await dailyBudget('chat', 2, env, down)).toBe(true)
  })
  it('stops AI chat before any paid request once the cap is reached', async () => {
    const fetchImpl = vi.fn()
    const handler = createChatHandler({ env, fetchImpl, limiter: async () => false, budget: async () => true })
    const res = await handler(
      new Request('https://f1taxhelper.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://f1taxhelper.com' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Do I need Form 8843?' }] }),
      }),
    )
    expect(res.status).toBe(503)
    expect(res.headers.get('retry-after')).toBe('3600')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('configuration stays consistent', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
  it('no longer references Upstash anywhere users or developers read', () => {
    for (const file of ['src/pages/PrivacyPage.jsx', 'README.md', '.env.example', 'package.json', 'lib/apiSafety.js'])
      expect(read(file)).not.toMatch(/upstash/i)
  })
  it('the migration restricts keys and locks the table', () => {
    const sql = read('supabase/migrations/202611150002_rate_limit.sql')
    expect(sql).toContain('enable row level security')
    expect(sql).toContain("^(rl|budget):")
    expect(sql).toContain('grant execute on function public.rate_hit')
  })
})
