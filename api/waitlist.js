export const config = { runtime: 'edge' }
import { jsonError, allowedOrigin, readJsonLimited, rateLimit } from '../lib/apiSafety.js'
export function createWaitlistHandler({
  fetchImpl = (...args) => fetch(...args),
  limiter = rateLimit,
  env = process.env,
} = {}) {
  return async function handler(req) {
    if (req.method !== 'POST') return jsonError('Method not allowed.', 405, { Allow: 'POST' })
    if (!allowedOrigin(req, env)) return jsonError('Forbidden origin.', 403)
    let email
    try {
      email = (await readJsonLimited(req, 2048))?.email
    } catch (error) {
      return jsonError('Invalid request body.', error.status || 400)
    }
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      return jsonError('Enter a valid email address.', 400)
    if (!env.RESEND_API_KEY) return jsonError('Waitlist signup is temporarily unavailable.', 503)
    try {
      if (await limiter(req, 'waitlist', 5, env))
        return jsonError('Please wait a minute before trying again.', 429, { 'Retry-After': '60' })
    } catch {
      return jsonError('Waitlist signup is temporarily unavailable.', 503)
    }
    try {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'waitlist@f1taxhelper.com',
          to: 'f1taxhelper01@gmail.com',
          subject: 'New Waitlist Signup',
          text: `New waitlist signup: ${email.trim()}`,
        }),
      })
      if (!res.ok) return jsonError('Signup could not be saved. Please try again.', 502)
      return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
      return jsonError('Signup could not be saved. Please try again.', 502)
    }
  }
}
export default createWaitlistHandler()
