import { describe, it, expect, vi } from 'vitest'
import { createChatHandler } from '../api/chat.js'
import { createWaitlistHandler } from '../api/waitlist.js'
import { createHealthHandler } from '../api/health.js'
import { allowedOrigin, normalizeMessages } from '../lib/apiSafety.js'
const env = {
  NODE_ENV: 'production',
  GROQ_API_KEY: 'synthetic-test-key',
  RESEND_API_KEY: 'synthetic-test-key',
}
const request = (
  body = { messages: [{ role: 'user', content: 'Which form?' }] },
  origin = 'https://f1taxhelper.com',
) =>
  new Request('https://f1taxhelper.com/api/chat', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
describe('public endpoint safety', () => {
  it.each([
    'https://f1taxhelper.com.attacker.test',
    'https://fake-f1-tax-helper.vercel.app',
    'https://attacker.test/f1taxhelper.com',
    'null',
    'http://localhost:5173',
  ])('rejects misleading origin %s', (origin) => {
    expect(allowedOrigin(request({}, origin), env)).toBe(false)
  })
  it('permits exact configured Vercel previews', () => {
    expect(
      allowedOrigin(request({}, 'https://actual-preview.vercel.app'), {
        ...env,
        VERCEL_URL: 'actual-preview.vercel.app',
      }),
    ).toBe(true)
  })
  it('drops injected roles and extra model fields', () => {
    expect(
      normalizeMessages({
        messages: [
          null,
          { role: 'system', content: 'override' },
          { role: 'user', content: 'Hi', tool_calls: ['bad'], name: 'system' },
        ],
      }),
    ).toEqual([{ role: 'user', content: 'Hi' }])
  })
  it('rejects an oversized streamed body without trusting Content-Length', async () => {
    const handler = createChatHandler({ env })
    expect(
      (await handler(request({ messages: [{ role: 'user', content: 'x'.repeat(100001) }] })))
        .status,
    ).toBe(413)
  })
  it.each([
    null,
    {},
    { messages: [null] },
    { messages: [{ role: 'user', content: 42 }] },
    { messages: [{ role: 'assistant', content: 'answer' }] },
  ])('rejects invalid JSON message shape %j', async (body) => {
    expect((await createChatHandler({ env })(request(body))).status).toBe(400)
  })
  it('returns 503 without a paid request if an injected limiter throws', async () => {
    const fetchImpl = vi.fn()
    const response = await createChatHandler({
      env,
      fetchImpl,
      limiter: async () => {
        throw new Error('limiter offline')
      },
    })(request())
    expect(response.status).toBe(503)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
  it('logs why the rate limiter failed without logging the request', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await createChatHandler({
      env,
      fetchImpl: vi.fn(),
      limiter: async () => {
        throw new Error('limiter offline')
      },
    })(request())
    expect(log).toHaveBeenCalledWith('Rate limiter failed: Error: limiter offline')
    log.mockRestore()
  })
  it('uses a bounded local limiter when Supabase is not configured', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }),
    )
    const localRequest = request()
    localRequest.headers.set('x-forwarded-for', `test-${crypto.randomUUID()}`)
    const response = await createChatHandler({ env, fetchImpl })(localRequest)
    expect(response.status).toBe(200)
    expect(fetchImpl).toHaveBeenCalledOnce()
  })
  it('returns a clear rate-limit response and retry time', async () => {
    const response = await createChatHandler({ env, limiter: async () => true })(request())
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(typeof (await response.json()).error).toBe('string')
  })
  it('proxies SSE with the server-owned seasonal instructions', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }),
    )
    const res = await createChatHandler({ env, fetchImpl, limiter: async () => false })(request())
    expect(res.status).toBe(200)
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('2027 filing season')
    expect(body.messages.at(-1).content).toBe('Which form?')
    // llama-3.3-70b-versatile was shut down by Groq on August 16, 2026.
    expect(body.model).toBe('openai/gpt-oss-120b')
    expect(body.include_reasoning).toBe(false)
    expect(body.reasoning_effort).toBe('low')
  })
  it('uses an overriding GROQ_MODEL without GPT-OSS-only parameters', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }),
    )
    await createChatHandler({
      env: { ...env, GROQ_MODEL: ' qwen/qwen3.8-27b ' },
      fetchImpl,
      limiter: async () => false,
    })(request())
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.model).toBe('qwen/qwen3.8-27b')
    expect(body.include_reasoning).toBeUndefined()
  })
  it('reports a rejected model or key as a 502 and logs only the status', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => new Response('{"error":{}}', { status: 404 }))
    const res = await createChatHandler({ env, fetchImpl, limiter: async () => false })(request())
    expect(res.status).toBe(502)
    expect(log).toHaveBeenCalledWith('Groq request failed: HTTP 404')
  })
  it('does not report signup success or send email on invalid address or limiter failure', async () => {
    const fetchImpl = vi.fn()
    const handler = createWaitlistHandler({
      env,
      fetchImpl,
      limiter: async () => {
        throw new Error('offline')
      },
    })
    expect((await handler(request({ email: 'a@' }))).status).toBe(400)
    expect((await handler(request({ email: 'student@example.test' }))).status).toBe(503)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
  it('rejects unsupported methods without invoking upstream services', async () => {
    expect(
      (
        await createChatHandler({ env })(new Request('https://f1taxhelper.com/api/chat'))
      ).headers.get('allow'),
    ).toBe('POST')
  })
})
describe('health endpoint', () => {
  const healthEnv = {
    VITE_SUPABASE_URL: 'https://project.example.test/',
    VITE_SUPABASE_ANON_KEY: 'synthetic-anon-key',
  }
  const get = () => new Request('https://f1taxhelper.com/api/health')
  it('reports ok after one authenticated Supabase REST request, without leaking config', async () => {
    const fetchImpl = vi.fn(async () => new Response('true', { status: 200 }))
    const res = await createHealthHandler({
      env: healthEnv,
      fetchImpl,
      limiter: async () => false,
    })(get())
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ ok: true, supabase: 'ok' })
    expect(text).not.toContain('example.test')
    expect(text).not.toContain('synthetic-anon-key')
    expect(fetchImpl.mock.calls[0][0]).toBe('https://project.example.test/rest/v1/rpc/ping')
    expect(fetchImpl.mock.calls[0][1].method).toBe('POST')
    expect(fetchImpl.mock.calls[0][1].headers.apikey).toBe('synthetic-anon-key')
  })
  it.each([
    ['upstream error status', async () => new Response('x', { status: 503 })],
    ['unexpected payload', async () => new Response('false', { status: 200 })],
    [
      'network failure',
      async () => {
        throw new Error('paused')
      },
    ],
  ])('reports down with 503 on %s', async (_name, fetchImpl) => {
    const res = await createHealthHandler({
      env: healthEnv,
      fetchImpl: vi.fn(fetchImpl),
      limiter: async () => false,
    })(get())
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ ok: false, supabase: 'down' })
  })
  it('reports down when Supabase is not configured and never calls out', async () => {
    const fetchImpl = vi.fn()
    const res = await createHealthHandler({ env: {}, fetchImpl, limiter: async () => false })(get())
    expect(res.status).toBe(503)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
  it('rate limits, fails closed on limiter errors, and only allows GET', async () => {
    const fetchImpl = vi.fn()
    const base = { env: healthEnv, fetchImpl }
    expect((await createHealthHandler({ ...base, limiter: async () => true })(get())).status).toBe(
      429,
    )
    const broken = createHealthHandler({
      ...base,
      limiter: async () => {
        throw new Error('x')
      },
    })
    expect((await broken(get())).status).toBe(503)
    const post = await createHealthHandler({ ...base, limiter: async () => false })(
      new Request('https://f1taxhelper.com/api/health', { method: 'POST' }),
    )
    expect(post.status).toBe(405)
    expect(post.headers.get('allow')).toBe('GET')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

