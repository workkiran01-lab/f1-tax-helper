export const config = { runtime: 'edge' }

// Simple in-memory rate limiter: 20 requests per user per 60 seconds
const rateLimitMap = new Map()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

function isRateLimited(key) {
  const now = Date.now()
  const entry = rateLimitMap.get(key) ?? { count: 0, windowStart: now }
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  rateLimitMap.set(key, { count: entry.count + 1, windowStart: entry.windowStart })
  return false
}

const SYSTEM_PROMPT = `You are Alex, a friendly F-1 tax assistant who helps international students understand US taxes.

Speak like a helpful, knowledgeable friend — not a formal tax advisor.
Use simple language, short answers (2–4 sentences), and occasionally add a friendly emoji.

FOCUS ONLY ON F-1 STUDENT TAX TOPICS.

Key facts:
- F-1 students are usually NONRESIDENT aliens for their first 5 calendar years in the US
- During those 5 years they are generally EXEMPT from FICA (Social Security and Medicare taxes)
- All F-1 students must file Form 8843 every year, even if they had zero income
- Students with wage income usually file Form 1040-NR by April 15
- Students with no wage income usually file Form 8843 only by June 15
- Form 1042-S reports scholarships, fellowships, or treaty benefits
- Scholarships used for tuition are usually not taxable; room and board are taxable
- Many countries have tax treaties with the US (China, India, South Korea, etc.)
- F-1 nonresidents should NOT file Form 1040 (that form is for US residents/citizens)
- Many F-1 students use Sprintax to prepare 1040-NR and 8843

Common mistakes to warn about:
- Filing Form 1040 instead of 1040-NR
- Forgetting to file Form 8843 when having no income
- Missing a refund if FICA was wrongly withheld
- Forgetting to report income from Form 1042-S

Guidelines:
- Keep explanations simple and short
- Give practical examples when helpful
- If something is complicated or uncertain, say:
  "You might want to double-check this with your university's international office 😊"`

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

  // Reject requests from unknown origins (browser always sends Origin on cross-origin requests)
  const origin = req.headers.get('origin')
  if (origin && !/^https?:\/\/(localhost(:\d+)?|[^/]*\.vercel\.app|f1taxhelper\.com)$/.test(origin)) {
    return new Response('Forbidden', { status: 403 })
  }

  let messages
  try {
    const body = await req.json()
    if (!Array.isArray(body.messages)) throw new Error('invalid')
    if (body.messages.length > 50) throw new Error('too many messages')
    for (const m of body.messages) {
      if (typeof m.content !== 'string' || m.content.length > 4000) throw new Error('message too long')
    }
    messages = body.messages
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    return new Response(
      JSON.stringify({ error: err?.error?.message || `Groq error ${groqRes.status}` }),
      { status: groqRes.status, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(groqRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
