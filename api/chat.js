export const config = { runtime: 'edge' }
import {
  jsonError,
  allowedOrigin,
  readJsonLimited,
  normalizeMessages,
  rateLimit,
} from '../lib/apiSafety.js'
import { SYSTEM_PROMPT } from '../lib/taxPrompt.js'

export function createChatHandler({
  fetchImpl = (...args) => fetch(...args),
  limiter = rateLimit,
  env = process.env,
} = {}) {
  return async function handler(req) {
    if (req.method !== 'POST') return jsonError('Method not allowed.', 405, { Allow: 'POST' })
    if (!allowedOrigin(req, env)) return jsonError('Forbidden origin.', 403)
    let messages
    try {
      messages = normalizeMessages(await readJsonLimited(req, 100000))
    } catch (error) {
      return jsonError(
        error.status ? error.message : 'Invalid request body or messages.',
        error.status || 400,
      )
    }
    if (!env.GROQ_API_KEY)
      return jsonError(
        'AI chat is temporarily unavailable. Your checklist and form preparation still work.',
        503,
      )
    try {
      if (await limiter(req, 'chat', 20, env))
        return jsonError('Too many requests. Please wait a minute and try again.', 429, {
          'Retry-After': '60',
        })
    } catch {
      return jsonError('AI chat is temporarily unavailable. Please try again later.', 503, {
        'Retry-After': '60',
      })
    }
    try {
      const timeout = AbortSignal.timeout(30000)
      const signal = AbortSignal.any ? AbortSignal.any([req.signal, timeout]) : timeout
      const upstream = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
          stream: true,
          max_tokens: 1600,
          temperature: 0.2,
        }),
      })
      if (
        !upstream.ok ||
        !upstream.body ||
        !upstream.headers.get('content-type')?.includes('text/event-stream')
      ) {
        await upstream.body?.cancel()
        return jsonError('The AI service is unavailable. Please try again shortly.', 502)
      }
      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch {
      return jsonError('The AI response was interrupted. Please try again.', 502)
    }
  }
}
export default createChatHandler()
