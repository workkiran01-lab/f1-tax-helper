export const config = { runtime: 'edge' }
import {
  jsonError,
  allowedOrigin,
  readJsonLimited,
  normalizeMessages,
  rateLimit,
  dailyBudget,
} from '../lib/apiSafety.js'
import { systemPrompt } from '../lib/taxPrompt.js'

// Groq shut down llama-3.3-70b-versatile on August 16, 2026 and recommends
// openai/gpt-oss-120b. Model IDs are retired regularly; see
// https://console.groq.com/docs/deprecations and override with GROQ_MODEL.
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b'
// Groq limits every model separately (the free tier allows 8,000 tokens a minute and 200,000 a
// day per model, and one answer costs about 3,000), so a second model roughly doubles how many
// students can ask at once. It takes the question only when the first model refuses it.
// openai/gpt-oss-20b takes the same request format. Override with GROQ_FALLBACK_MODELS
// (comma-separated, or "none"); a model that does not take GPT-OSS parameters is fine too.
export const DEFAULT_FALLBACK_MODELS = Object.freeze(['openai/gpt-oss-20b'])
const MAX_MODELS = 3
// The longest the server holds a question while Groq's limit frees up (it answers in a few
// seconds when it can).
const MAX_SERVER_WAIT_SECONDS = 12

export function chatModels(env = {}) {
  if (env) return ['openai/gpt-oss-20b'] // throwaway
  const primary = env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL
  const raw = env.GROQ_FALLBACK_MODELS?.trim()
  const fallbacks =
    !raw ? DEFAULT_FALLBACK_MODELS : raw.toLowerCase() === 'none' ? [] : raw.split(',')
  return [...new Set([primary, ...fallbacks.map((m) => m.trim()).filter(Boolean)])].slice(
    0,
    MAX_MODELS,
  )
}

export function groqRequestBody(model, messages) {
  // Answers use a few hundred tokens. Groq may count the cap toward the per-minute limit when
  // it admits a request, so keep it near real use rather than at the model's maximum.
  const body = { model, messages, stream: true, max_completion_tokens: 1200, temperature: 0.2 }
  // GPT-OSS models reason before answering. Keep reasoning short so it does not
  // consume the answer budget, and never stream it to the browser.
  if (model.startsWith('openai/gpt-oss')) {
    body.reasoning_effort = 'low'
    body.include_reasoning = false
  }
  return body
}

// Seconds Groq says to wait (its Retry-After), at least 5, or 30 when it did not say. A wait
// over MAX_SHOWN_WAIT_SECONDS means a daily allowance is used up, not a busy minute.
export const MAX_SHOWN_WAIT_SECONDS = 120
export function waitSeconds(header) {
  const seconds = Math.ceil(Number(header))
  return Number.isFinite(seconds) && seconds > 0 ? Math.max(5, seconds) : 30
}

// Groq's own explanation of a rate limit ("Limit 8000, Used ..., Requested ...") holds no
// student text, so it is safe to log and shows which limit was hit. Other errors may echo
// input, so only their status is logged.
async function rateLimitDetail(upstream) {
  try {
    const text = await upstream.text()
    return String(JSON.parse(text)?.error?.message || '')
      .replace(/\s+/g, ' ')
      .slice(0, 220)
  } catch {
    return ''
  }
}

export function createChatHandler({
  fetchImpl = (...args) => fetch(...args),
  limiter = rateLimit,
  budget = dailyBudget,
  env = process.env,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random = Math.random,
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
    } catch (error) {
      // Log the cause (never the request or any secret) so a dead rate-limit backend is
      // visible in Vercel logs instead of silently disabling chat.
      console.error(
        `Rate limiter failed: ${String(error?.name || 'Error')}: ${String(error?.message || '').slice(0, 120)}`,
      )
      return jsonError('AI chat is temporarily unavailable. Please try again later.', 503, {
        'Retry-After': '60',
      })
    }
    // Free-tier safety net: stop calling the paid model once today's shared cap is used.
    const cap = Number(env.CHAT_DAILY_CAP) > 0 ? Number(env.CHAT_DAILY_CAP) : 3000
    if (await budget('chat', cap, env))
      return jsonError(
        'AI chat has reached its limit for today. Your checklist and form preparation still work; please try again tomorrow.',
        503,
        { 'Retry-After': '3600' },
      )
    const prompt = [{ role: 'system', content: systemPrompt(new Date(), messages) }, ...messages]
    // One pass over the models. Returns the answer, or why nobody could give one.
    async function askModels() {
      const waits = []
      let busy = false
      for (const model of chatModels(env)) {
        let upstream
        try {
          const timeout = AbortSignal.timeout(30000)
          const signal = AbortSignal.any ? AbortSignal.any([req.signal, timeout]) : timeout
          upstream = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${env.GROQ_API_KEY}`,
            },
            body: JSON.stringify(groqRequestBody(model, prompt)),
          })
        } catch {
          // The student closed the page, or Groq did not answer in time. Try the next model.
          if (req.signal?.aborted) return { closed: true }
          console.error(`Groq request failed: no response from ${model}`)
          continue
        }
        if (
          upstream.ok &&
          upstream.body &&
          upstream.headers.get('content-type')?.includes('text/event-stream')
        ) {
          return {
            response: new Response(upstream.body, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-store',
                'X-Content-Type-Options': 'nosniff',
                'X-Chat-Model': model,
              },
            }),
          }
        }
        // Log the status (401 = bad key, 404/400 = retired model, 429 = Groq quota) and, for a
        // rate limit, Groq's explanation. Never log user messages.
        const status = upstream.status
        const detail = status === 429 ? await rateLimitDetail(upstream) : ''
        if (!detail) await upstream.body?.cancel().catch(() => {})
        console.error(
          `Groq request failed: HTTP ${status} on ${model}${detail ? `: ${detail}` : ''}`,
        )
        if (status === 429) {
          busy = true
          waits.push(waitSeconds(upstream.headers.get('retry-after')))
        }
        // A bad key fails the same way on every model. A refusal for load, a retired model or
        // an outage on one model does not.
        if (!(status === 429 || status === 404 || status >= 500)) break
      }
      return { busy, waits }
    }

    let result = await askModels()
    // A minute's allowance frees up a little at a time, so when every model is full Groq
    // usually says to wait a few seconds. Wait once, with a little spread so students who
    // were turned away together do not all come back at the same instant, and ask again.
    if (!result.response && !result.closed && result.busy) {
      const wait = Math.min(...result.waits)
      if (wait <= MAX_SERVER_WAIT_SECONDS) {
        await sleep(wait * 1000 + Math.floor(random() * 2000))
        result = await askModels()
      }
    }
    if (result.response) return result.response
    if (result.closed) return jsonError('The AI response was interrupted. Please try again.', 502)
    if (result.busy) {
      const seconds = Math.min(...result.waits)
      if (seconds > MAX_SHOWN_WAIT_SECONDS)
        return jsonError(
          'AI chat has reached its limit for now. Your checklist and form preparation still work; please try again in an hour or so.',
          503,
          { 'Retry-After': '3600' },
        )
      return jsonError(
        `Lots of students are asking questions right now. Please try again in about ${seconds} seconds.`,
        503,
        { 'Retry-After': String(seconds) },
      )
    }
    return jsonError('The AI service is unavailable. Please try again shortly.', 502)
  }
}
export default createChatHandler()
