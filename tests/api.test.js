import { describe, it, expect, vi } from 'vitest'
import { createChatHandler } from '../api/chat.js'
import { createWaitlistHandler } from '../api/waitlist.js'
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
  it('fails closed during Redis outages without making a paid request', async () => {
    const fetchImpl = vi.fn()
    const response = await createChatHandler({
      env,
      fetchImpl,
      limiter: async () => {
        throw new Error('Redis offline')
      },
    })(request())
    expect(response.status).toBe(503)
    expect(fetchImpl).not.toHaveBeenCalled()
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
  })
  it('does not report signup success or send email on invalid address or Redis failure', async () => {
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
