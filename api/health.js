export const config = { runtime: 'edge' }
import { jsonError, rateLimit } from '../lib/apiSafety.js'

// Public liveness check used by the scheduled uptime workflow. It calls the read-only
// public.ping() function through Supabase REST (supabase/migrations/202611150001_ping.sql),
// a real database query that also keeps a free project from being auto-paused. It reports
// only ok/down: never URLs, keys or errors.
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
        const res = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/rpc/ping`, {
          method: 'POST',
          signal: AbortSignal.timeout(8000),
          headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: '{}',
        })
        if (res.ok && (await res.json()) === true) supabase = 'ok'
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
