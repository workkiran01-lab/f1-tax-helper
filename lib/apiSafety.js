import { CHAT_LIMITS } from './chatLimits.js'

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
    // Vite dev, Vite preview and `vercel dev` (the documented way to run the API locally).
    allowed.add('http://localhost:5173')
    allowed.add('http://localhost:4173')
    allowed.add('http://localhost:3000')
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
    .slice(-CHAT_LIMITS.maxMessages)
    .map((m) => {
      if (
        typeof m.content !== 'string' ||
        !m.content.trim() ||
        m.content.length > CHAT_LIMITS.maxMessageChars
      )
        throw new Error('Each message must contain 1–4,000 characters.')
      return { role: m.role, content: m.content.trim() }
    })
  if (!messages.length || messages.at(-1).role !== 'user')
    throw new Error('End the conversation with a user question.')
  if (messages.reduce((sum, m) => sum + m.content.length, 0) > CHAT_LIMITS.maxTotalChars)
    throw new Error('Conversation too long. Start a new chat.')
  return messages
}
const localWindows = new Map()
const localDays = new Map()

function clientIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

// Counter keys are an HMAC with a server-only secret (the GROQ key, which is already a
// server secret), truncated. The Supabase anon key ships in the browser, so a guessable
// key such as budget:chat:<date> could be filled from outside to switch chat off for
// everyone. Raw addresses are never stored either. Without a secret, a plain hash is used.
function secretFor(env) {
  return env.RATE_LIMIT_SECRET || env.GROQ_API_KEY || ''
}

async function keyedHash(value, secret) {
  const data = new TextEncoder().encode(value)
  if (!secret) {
    const digest = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  return [...mac.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function localRateLimit(key, limit) {
  const now = Date.now()
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

// Shared counter in Supabase (public.rate_hit, see supabase/migrations/202611150002_rate_limit.sql).
// It is free, needs no extra service, and is shared by every server instance.
async function sharedHit(key, windowSeconds, env, fetchImpl) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const res = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/rpc/rate_hit`, {
    method: 'POST',
    signal: AbortSignal.timeout(1500),
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_key: key, p_window_seconds: windowSeconds }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const count = Number(await res.json())
  if (!Number.isFinite(count)) throw new Error('bad counter response')
  return count
}

function logSharedFailure(error) {
  console.error(
    `Shared limiter unavailable, using local fallback: ${String(error?.name || 'Error')}: ${String(error?.message || '').slice(0, 80)}`,
  )
}

// Never throws and never blocks users because the counter is down: when the shared
// counter is unavailable it falls back to a per-instance limit. Spend is bounded by
// dailyBudget below and by the provider's own account limits.
export async function rateLimit(req, route, limit, env = process.env, fetchImpl = (...a) => fetch(...a)) {
  const id = await keyedHash(clientIp(req), secretFor(env))
  const key = `rl:${route}:${id}`
  try {
    const count = await sharedHit(key, 60, env, fetchImpl)
    if (count !== null) return count > limit
  } catch (error) {
    logSharedFailure(error)
  }
  return localRateLimit(key, limit)
}

// A global daily ceiling on paid AI requests, shared across instances. Returns true
// once today's cap is reached.
export async function dailyBudget(route, cap, env = process.env, fetchImpl = (...a) => fetch(...a)) {
  const day = new Date().toISOString().slice(0, 10)
  const key = `budget:${route}:${await keyedHash(`${route}:${day}`, secretFor(env))}`
  const localKey = `${route}:${day}`
  try {
    const count = await sharedHit(key, 172800, env, fetchImpl)
    if (count !== null) return count > cap
  } catch (error) {
    logSharedFailure(error)
  }
  const used = (localDays.get(localKey) || 0) + 1
  localDays.clear()
  localDays.set(localKey, used)
  return used > cap
}
