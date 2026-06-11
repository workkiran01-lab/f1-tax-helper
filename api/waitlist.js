export const config = { runtime: 'edge' }

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function isRateLimited(key) {
  const requests = await redis.incr(key)
  if (requests === 1) await redis.expire(key, 60)
  return requests > 5
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  try {
    if (await isRateLimited(`rl:wl:${ip}`)) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '60' },
      })
    }
  } catch (err) {
    console.error('Redis error:', err)
    // Fail open if Redis is unavailable.
  }

  let email
  try {
    const body = await req.json()
    email = body.email
  } catch {
    return new Response('Invalid request', { status: 400 })
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response('Invalid email', { status: 400 })
  }

  let res
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'waitlist@f1taxhelper.com',
        to: 'f1taxhelper01@gmail.com',
        subject: 'New Waitlist Signup',
        text: `New waitlist signup: ${email}`,
      }),
    })
  } catch (err) {
    console.error('Resend error:', err)
    return new Response('Failed to send', { status: 502 })
  }

  if (!res.ok) {
    return new Response('Failed to send', { status: 502 })
  }

  return new Response('OK', { status: 200 })
}
