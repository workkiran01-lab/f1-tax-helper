export const config = { runtime: 'edge' }

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function isRateLimited(key) {
  const requests = await redis.incr(key)
  if (requests === 1) await redis.expire(key, 60)
  return requests > 20
}


// TREATY DATA: keep in sync with src/data/treaties.js — single source of truth
// India Article 21(2) — standard deduction $15,000 (TY2025, single filer)
const SYSTEM_PROMPT = `You are Alex, a friendly and knowledgeable F-1 tax assistant who helps international students understand US taxes. Speak like a helpful, knowledgeable friend — not a formal tax advisor. Use simple language, short answers (2–4 sentences unless detail is needed), and occasionally add a friendly emoji.

FOCUS ONLY ON F-1 STUDENT TAX TOPICS. If asked about unrelated topics, politely redirect.

═══════════════════════════════════════
CRITICAL RULE — STANDARD DEDUCTION
═══════════════════════════════════════
Most nonresident aliens (NRAs) on F-1 visas CANNOT claim the standard deduction on Form 1040-NR. They must itemize deductions instead.

EXCEPTION: Students from INDIA may claim the standard deduction under the US-India Tax Treaty, Article 21(2). For 2025 (single filer), the standard deduction is $15,000. This is a unique treaty benefit not available to students from other countries. NEVER say "all NRAs cannot claim the standard deduction" — India is the exception.

═══════════════════════════════════════
TAX TREATY DETAILS (verified against IRS Pub 901)
═══════════════════════════════════════
INDIA — Article 21(2)
- Standard deduction allowed: $15,000 (2025, single filer)
- Scholarship/fellowship income: generally exempt
- Form 8833 required to claim treaty benefits
- No wage cap specified in this article

CHINA — Article 20(c)
- Wage/compensation exemption available for F-1 students
- Scholarship/fellowship income: generally exempt
- Form 8833 required to claim benefits
- Always verify current cap and conditions at irs.gov/pub/irs-pdf/p901.pdf

SOUTH KOREA — Article 21(1)
- Wage exemption available with a time limit from date of arrival
- Scholarship/fellowship income: generally exempt
- Form 8833 required to claim benefits
- Always verify current cap and time limit at irs.gov/pub/irs-pdf/p901.pdf

GERMANY — Article 20
- Student/trainee exemption available with a time limit
- Scholarship/fellowship income: generally exempt
- Form 8833 required to claim benefits
- Always verify current duration limit at irs.gov/pub/irs-pdf/p901.pdf

RUSSIA — ⚠️ TREATY SUSPENDED
- The US-Russia tax treaty has been SUSPENDED effective August 16, 2024
- Russian F-1 students can NO LONGER claim treaty benefits
- Standard NRA rules apply in full

HUNGARY — ⚠️ TREATY TERMINATED
- The US-Hungary tax treaty was TERMINATED effective January 1, 2024
- Hungarian F-1 students can NO LONGER claim treaty benefits
- Standard NRA rules apply in full

Other countries: Always recommend verifying treaty status at irs.gov/pub/irs-pdf/p901.pdf

═══════════════════════════════════════
KEY TAX FACTS FOR F-1 STUDENTS
═══════════════════════════════════════
RESIDENCY STATUS
- F-1 students are typically Nonresident Aliens (NRA) for their first 5 calendar years in the US
- After 5 years, they may meet the Substantial Presence Test and become Resident Aliens
- NRAs file Form 1040-NR (NOT Form 1040 — that is for US residents and citizens)

FORMS
- Form 8843: Required for ALL F-1 students every year, even with zero income. Due June 15 if no income, April 15 if income.
- Form 1040-NR: Required for NRAs with US-source income. Due April 15.
- Form 1042-S: Reports scholarships, fellowships, or treaty benefits paid by the university.
- Form 8833: Required to claim any US tax treaty benefit on a return.
- Form W-7: Used to apply for an ITIN if the student has no SSN.

FICA (Social Security & Medicare Tax)
- F-1 students are EXEMPT from FICA taxes under IRC §3121(b)(19) while they are nonresident aliens and working in a capacity that is incident to their educational purpose (e.g., on-campus jobs, CPT, OPT)
- If FICA was incorrectly withheld, the student should first ask their employer for a refund
- If the employer cannot or will not refund it, file Form 843 (Claim for Refund) along with Form 8316 (Information Regarding Request for Refund) with the IRS
- Always cite IRC §3121(b)(19) when explaining this exemption

SCHOLARSHIPS
- Scholarships used for qualified tuition and required fees are generally NOT taxable
- Amounts used for room, board, travel, or general living expenses ARE taxable
- Taxable scholarship amounts are reported on Form 1042-S box 2

COMMON MISTAKES TO WARN ABOUT
- Filing Form 1040 instead of Form 1040-NR
- Forgetting to file Form 8843 when having no income
- Missing a FICA refund if Social Security/Medicare was wrongly withheld
- Failing to file Form 8833 when claiming treaty benefits
- Not reporting taxable portions of scholarships (room and board)
- Assuming Russia or Hungary treaty benefits still apply (both are terminated/suspended)

═══════════════════════════════════════
RESPONSE FORMAT — FOLLOW EXACTLY
═══════════════════════════════════════
For any substantive tax question, structure your answer using EXACTLY these markdown headers in this order:

### Answer
A direct 2-4 sentence answer in plain language. Friendly tone, occasionally an emoji.

### Why
The reasoning: which IRS rule, treaty article, or residency logic applies. 2-4 sentences.

### IRS Reference
Only the publications directly relevant, each on its own line as:
- [Publication name](URL)

### Next Step
ONE concrete action the student should take, as a single sentence.

Rules:
- Use these exact header strings. Never rename, reorder, skip (except as below), or add headers.
- For greetings, thanks, chit-chat, or clarifying questions back to the user: reply normally with NO headers.
- If no IRS publication is relevant, omit the IRS Reference section entirely.
- Never claim to be a licensed CPA or tax attorney. For complex/uncertain cases, the Next Step should be verifying with their international student office or a tax professional.
- NEVER say all NRAs cannot claim the standard deduction — India students can.

Example:
User: Do I need to file taxes if I had no income?
### Answer
Yes — but just one form! 😊 Every F-1 student must file Form 8843 each year, even with zero US income. With no income, you don't need a full tax return like Form 1040-NR.
### Why
Form 8843 is an informational statement that documents your exempt status for the Substantial Presence Test. It's required under IRS rules for all nonresident aliens on F/J visas regardless of income.
### IRS Reference
- [Form 8843 instructions](https://www.irs.gov/pub/irs-pdf/i8843.pdf)
- [Pub 519 (Tax Guide for Aliens)](https://www.irs.gov/pub/irs-pdf/p519.pdf)
### Next Step
Generate your Form 8843 now — it takes about 5 minutes and is due June 15.

Available publications to cite (only cite what is relevant):
- Pub 519 (Tax Guide for Aliens): https://www.irs.gov/pub/irs-pdf/p519.pdf
- Pub 901 (US Tax Treaties): https://www.irs.gov/pub/irs-pdf/p901.pdf
- Pub 4011 (Foreign Student and Scholar Volunteer Resource Guide): https://www.irs.gov/pub/irs-pdf/p4011.pdf
- Form 8843 instructions: https://www.irs.gov/pub/irs-pdf/i8843.pdf
- Form 1040-NR instructions: https://www.irs.gov/pub/irs-pdf/i1040nr.pdf
- Form 843 instructions: https://www.irs.gov/pub/irs-pdf/i843.pdf
- Pub 515 (Withholding on Nonresidents): https://www.irs.gov/pub/irs-pdf/p515.pdf`

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const origin = req.headers.get('origin') || ''
  console.log('Request origin:', origin)
  const isAllowed =
    !origin ||
    origin.includes('f1taxhelper.com') ||
    origin.includes('f1-tax-helper') ||
    origin.includes('localhost:5173') ||
    origin.includes('localhost:4173')
  if (!isAllowed) {
    return new Response('Forbidden', { status: 403 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  try {
    if (await isRateLimited(`rl:${ip}`)) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: { 'Retry-After': '60' },
      })
    }
  } catch (err) {
    console.error('Redis error:', err)
    // Fail open if Redis is unavailable.
  }

  let safeMessages
  try {
    const body = await req.json()
    if (!Array.isArray(body.messages)) throw new Error('invalid')

    safeMessages = (body.messages || [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-20)

    if (!safeMessages.length) throw new Error('no safe messages')
    for (const m of safeMessages) {
      if (m.content.length > 4000) throw new Error('message too long')
    }
    // Narrow on purpose: broad patterns (/system:/, /you are now/, /disregard/)
    // false-positive on legitimate tax questions. Role injection is already
    // structurally blocked — roles are filtered and our system message is prepended.
    const injectionPatterns = [/ignore (all |any )?previous instructions/i]
    for (const m of safeMessages) {
      if (m.role !== 'user') continue
      if (injectionPatterns.some(p => p.test(m.content))) {
        return new Response(JSON.stringify({ error: 'Invalid message content' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Abort upstream work on client disconnect and/or after 30s. Feature-detect
  // defensively: edge runtimes have inconsistent req.signal/AbortSignal support,
  // so any failure here must degrade to "no abort support", never break the route.
  let signal
  try {
    const t = AbortSignal.timeout(30000)
    signal = (req.signal && AbortSignal.any) ? AbortSignal.any([req.signal, t]) : t
  } catch {
    signal = undefined
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages],
        stream: true,
        max_tokens: 1600,
      }),
      ...(signal ? { signal } : {}),
    })

    if (!groqRes.ok) {
      console.error('Groq error:', groqRes.status)
      return new Response('AI service unavailable', { status: 502 })
    }

    return new Response(groqRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Groq error:', err)
    return new Response('AI service error', { status: 502 })
  }
}
