import { Redis } from '@upstash/redis'

export const jsonError = (message, status, headers = {}) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
export function allowedOrigin(req, env = process.env) {
  const origin = req.headers.get('origin')
  // Public guest endpoints also accept non-browser clients; origin is not auth.
  if (!origin) return true
  const allowed = new Set([
    'https://f1taxhelper.com',
    'https://www.f1taxhelper.com',
    'https://f1-tax-helper.vercel.app',
  ])
  for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL])
    if (host) allowed.add(`https://${host}`)
  for (const value of (env.ALLOWED_ORIGINS || '').split(','))
    if (value.trim()) allowed.add(value.trim())
  if (env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:5173')
    allowed.add('http://localhost:4173')
  }
  try {
    const parsed = new URL(origin)
    return parsed.origin === origin && allowed.has(parsed.origin)
  } catch {
    return false
  }
}
export async function readJsonLimited(req, maxBytes) {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    throw Object.assign(new Error('Send JSON with Content-Type application/json.'), { status: 415 })
  if (Number(req.headers.get('content-length')) > maxBytes)
    throw Object.assign(new Error('Request too large.'), { status: 413 })
  const reader = req.body?.getReader()
  if (!reader) throw Object.assign(new Error('Invalid request body.'), { status: 400 })
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw Object.assign(new Error('Request too large.'), { status: 413 })
      }
      text += decoder.decode(value, { stream: true })
    }
    return JSON.parse(text + decoder.decode())
  } finally {
    reader.releaseLock()
  }
}
export function normalizeMessages(body) {
  if (!body || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 60)
    throw new Error('Invalid messages.')
  const messages = body.messages
    .filter((m) => m && ['user', 'assistant'].includes(m.role))
    .slice(-20)
    .map((m) => {
      if (typeof m.content !== 'string' || !m.content.trim() || m.content.length > 4000)
        throw new Error('Each message must contain 1–4,000 characters.')
      return { role: m.role, content: m.content.trim() }
    })
  if (!messages.length || messages.at(-1).role !== 'user')
    throw new Error('End the conversation with a user question.')
  if (messages.reduce((sum, m) => sum + m.content.length, 0) > 24000)
    throw new Error('Conversation too long. Start a new chat.')
  return messages
}
let redis
const localWindows = new Map()

function localRateLimit(req, route, limit) {
  const now = Date.now()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const key = `${route}:${ip}`
  const previous = localWindows.get(key)
  const current =
    !previous || previous.resetAt <= now
      ? { count: 1, resetAt: now + 60000 }
      : { ...previous, count: previous.count + 1 }
  localWindows.set(key, current)

  // Keep the fallback bounded in long-lived development/server instances.
  if (localWindows.size > 1000)
    for (const [entryKey, window] of localWindows)
      if (window.resetAt <= now) localWindows.delete(entryKey)

  return current.count > limit
}

export async function rateLimit(req, route, limit, env = process.env) {
  // Small deployments can run without Upstash. This per-instance fallback keeps
  // the app usable, while Redis remains the production-grade global limiter.
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN)
    return localRateLimit(req, route, limit)
  redis ||= new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
  // Vercel overwrites x-forwarded-for at its edge. Never trust a caller-supplied user ID.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  // Increment and TTL initialization are atomic; interrupted requests cannot leave
  // permanent bans, and Redis outages never permit unlimited paid API requests.
  const count = await redis.eval(
    "local n = redis.call('INCR', KEYS[1]); if n == 1 or redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], 60) end; return n",
    [`rl:${route}:${ip}`],
    [],
  )
  return Number(count) > limit
}
