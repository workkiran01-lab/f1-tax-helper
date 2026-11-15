export const config = { runtime: 'edge' }
import { jsonError, rateLimit } from '../lib/apiSafety.js'

// Public liveness check used by the scheduled uptime workflow. It makes one cheap
// authenticated Supabase REST request (which also counts as database activity, so a
// free project is not auto-paused) and reports only ok/down: never URLs, keys or errors.
export function createHealthHandler({
  fetchImpl = (...args) => fetch(...args),
  limiter = rateLimit,
  env = process.env,
} = {}) {
  return async function handler(req) {
    if (req.method !== 'GET') return jsonError('Method not allowed.', 405, { Allow: 'GET' })
    try {
      if (await limiter(req, 'health', 30, env))
        return jsonError('Too many requests.', 429, { 'Retry-After': '60' })
    } catch {
      return jsonError('Health check unavailable.', 503)
    }
    const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
    const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
    let supabase = 'down'
    if (url && key) {
      try {
        const res = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/`, {
          signal: AbortSignal.timeout(8000),
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        })
        if (res.ok) supabase = 'ok'
        await res.body?.cancel()
      } catch {
        // reported as down below
      }
    }
    const ok = supabase === 'ok'
    return new Response(JSON.stringify({ ok, supabase }), {
      status: ok ? 200 : 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  }
}

export default createHealthHandler()
