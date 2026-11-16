import { beforeEach, describe, it, expect, vi } from 'vitest'
import { chatModels, createChatHandler, groqRequestBody, waitSeconds } from '../api/chat.js'
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
  it('tells the model which treaty countries the student named, from the reviewed list', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }),
    )
    await createChatHandler({ env, fetchImpl, limiter: async () => false })(
      request({ messages: [{ role: 'user', content: 'Does Canada have a student treaty?' }] }),
    )
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.messages[0].content).toContain('Treaty coverage for Canada has not been reviewed')
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
  describe('when Groq refuses a question', () => {
    const sse = () =>
      new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
    const rateLimited = (retryAfter = '27') =>
      new Response(
        JSON.stringify({
          error: {
            message:
              'Rate limit reached for model `openai/gpt-oss-120b` on tokens per minute (TPM): Limit 8000, Used 6100, Requested 3300.',
          },
        }),
        { status: 429, headers: retryAfter ? { 'retry-after': retryAfter } : {} },
      )
    const sleeps = []
    beforeEach(() => {
      sleeps.length = 0
    })
    const run = (fetchImpl, extraEnv = {}) =>
      createChatHandler({
        env: { ...env, ...extraEnv },
        fetchImpl,
        limiter: async () => false,
        sleep: async (ms) => sleeps.push(ms),
        random: () => 0.5,
      })(request())
    const modelOf = (fetchImpl, call) => JSON.parse(fetchImpl.mock.calls[call][1].body).model

    it('answers from the second model when the first is over its limit, and says which', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn().mockResolvedValueOnce(rateLimited()).mockResolvedValueOnce(sse())
      const res = await run(fetchImpl)
      expect(res.status).toBe(200)
      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(modelOf(fetchImpl, 0)).toBe('openai/gpt-oss-120b')
      expect(modelOf(fetchImpl, 1)).toBe('openai/gpt-oss-20b')
      expect(res.headers.get('x-chat-model')).toBe('openai/gpt-oss-20b')
      // The second model gets the same instructions and the same question.
      const [first, second] = [0, 1].map((i) => JSON.parse(fetchImpl.mock.calls[i][1].body))
      expect(second.messages).toEqual(first.messages)
      expect(second.reasoning_effort).toBe('low')
      // The log shows which limit was hit, and nothing the student wrote.
      const logged = log.mock.calls.map((c) => c.join(' ')).join('\n')
      expect(logged).toContain('HTTP 429 on openai/gpt-oss-120b')
      expect(logged).toContain('tokens per minute')
      expect(logged).not.toContain('Which form?')
    })
    it('uses the first model when it is available and never calls the second', async () => {
      const fetchImpl = vi.fn(async () => sse())
      const res = await run(fetchImpl)
      expect(res.headers.get('x-chat-model')).toBe('openai/gpt-oss-120b')
      expect(fetchImpl).toHaveBeenCalledTimes(1)
    })
    it('falls back after an outage or a model that has been retired', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      for (const status of [500, 503, 404]) {
        const fetchImpl = vi
          .fn()
          .mockResolvedValueOnce(new Response('{"error":{}}', { status }))
          .mockResolvedValueOnce(sse())
        expect((await run(fetchImpl)).status, String(status)).toBe(200)
      }
    })
    it('falls back when the first model does not answer', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(sse())
      expect((await run(fetchImpl)).status).toBe(200)
    })
    it('asks the student to wait, for as long as Groq says, when every model stays over its limit for long', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn(async () => rateLimited('27'))
      const res = await run(fetchImpl)
      expect(res.status).toBe(503)
      expect(res.headers.get('retry-after')).toBe('27')
      expect((await res.json()).error).toMatch(/try again in about 27 seconds/)
      // 27 seconds is too long to hold the question, so each model was asked once.
      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(sleeps).toEqual([])
    })
    it('waits a few seconds once and asks again when Groq says the limit frees up soon', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(rateLimited('9'))
        .mockResolvedValueOnce(rateLimited('10'))
        .mockResolvedValueOnce(sse())
      const res = await run(fetchImpl)
      expect(res.status).toBe(200)
      expect(res.headers.get('x-chat-model')).toBe('openai/gpt-oss-120b')
      expect(fetchImpl).toHaveBeenCalledTimes(3)
      // The shorter wait, plus spread (0.5 of 2 seconds).
      expect(sleeps).toEqual([10000])
    })
    it('waits only once, then tells the student how long to wait', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn(async () => rateLimited('9'))
      const res = await run(fetchImpl)
      expect(res.status).toBe(503)
      expect(res.headers.get('retry-after')).toBe('9')
      expect(fetchImpl).toHaveBeenCalledTimes(4)
      expect(sleeps).toHaveLength(1)
    })
    it('reports Groq\'s wait, at least 5 seconds, and 30 when Groq did not say', () => {
      expect([waitSeconds('0.2'), waitSeconds('27'), waitSeconds('500'), waitSeconds(null), waitSeconds('soon')]).toEqual([5, 27, 500, 30, 30])
    })
    it('says the limit is reached, not "about a minute", when the wait is hours (a daily allowance)', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn(async () => rateLimited('6240'))
      const res = await run(fetchImpl)
      expect(res.status).toBe(503)
      expect(res.headers.get('retry-after')).toBe('3600')
      const { error } = await res.json()
      expect(error).toMatch(/reached its limit for now/)
      expect(error).not.toMatch(/\d+ seconds/)
      expect(sleeps).toEqual([])
    })
    it('does not retry on another model when the key is rejected', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn(async () => new Response('{"error":{}}', { status: 401 }))
      const res = await run(fetchImpl)
      expect(res.status).toBe(502)
      expect(fetchImpl).toHaveBeenCalledTimes(1)
      expect(log).toHaveBeenCalledWith('Groq request failed: HTTP 401 on openai/gpt-oss-120b')
    })
    it('reports a 502 when every model is unavailable for another reason', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchImpl = vi.fn(async () => new Response('{"error":{}}', { status: 404 }))
      const res = await run(fetchImpl)
      expect(res.status).toBe(502)
      expect(fetchImpl).toHaveBeenCalledTimes(2)
    })
    it('stops when the student has closed the page', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const controller = new AbortController()
      controller.abort()
      const fetchImpl = vi.fn().mockRejectedValue(new Error('aborted'))
      const closed = new Request('https://f1taxhelper.com/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: { Origin: 'https://f1taxhelper.com', 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Which form?' }] }),
      })
      const res = await createChatHandler({ env, fetchImpl, limiter: async () => false })(closed)
      expect(res.status).toBe(502)
      expect(fetchImpl).toHaveBeenCalledTimes(1)
    })
    it('chooses models from GROQ_MODEL and GROQ_FALLBACK_MODELS', () => {
      expect(chatModels({})).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b'])
      expect(chatModels({ GROQ_FALLBACK_MODELS: ' ' })).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b'])
      expect(chatModels({ GROQ_FALLBACK_MODELS: 'none' })).toEqual(['openai/gpt-oss-120b'])
      expect(chatModels({ GROQ_MODEL: 'x/a', GROQ_FALLBACK_MODELS: 'x/a, x/b ,x/c,x/d' })).toEqual(['x/a', 'x/b', 'x/c'])
    })
    it('caps how many tokens an answer may use so the request does not claim more of the minute than it needs', () => {
      expect(groqRequestBody('openai/gpt-oss-120b', []).max_completion_tokens).toBeLessThanOrEqual(1500)
    })
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

