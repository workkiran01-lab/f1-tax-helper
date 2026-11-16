#!/usr/bin/env node
// Usage: node qa/chat-eval/run.mjs [--url https://www.f1taxhelper.com/api/chat] [--only id,category]
//        [--delay 30000] [--min 0.9] [--out qa/chat-eval/results/latest.json]
// Calls the real chat API, so it spends free-tier model quota and the shared daily chat budget:
// run it after a prompt, model or season change, not on every commit. See README.md.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { readChatStream, wasCutShort } from '../../src/utils/chatStream.js'
import { runCases } from './runner.js'

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((pairs, arg, i, all) => (arg.startsWith('--') ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
)
const url = args.url || process.env.CHAT_URL || 'https://www.f1taxhelper.com/api/chat'
const origin = args.origin || new URL(url).origin

async function ask(question) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(`HTTP ${response.status}: ${body.error || 'request failed'}`)
    // A daily cap or a missing service will not clear by waiting a few seconds.
    error.fatal = response.status === 503 || response.status === 403
    throw error
  }
  let text = ''
  const stream = {}
  for await (const delta of readChatStream(response.body, stream)) text += delta
  return { text, model: response.headers.get('x-chat-model'), truncated: wasCutShort(stream) }
}

const { summary, results } = await runCases({
  ask,
  only: args.only?.split(','),
  delayMs: Number(args.delay) || 30000,
  minPassRate: Number(args.min) || 0.9,
  onResult: (r, i, n) =>
    console.log(
      `${String(i).padStart(2)}/${n} ${r.pass ? 'PASS' : r.critical ? 'FAIL!' : 'FAIL '} ${r.id}${
        r.pass ? '' : '  ' + r.failures.map((f) => `${f.check}: ${f.detail}`).join('; ')
      }`,
    ),
})
console.log('\n' + JSON.stringify(summary, null, 2))
const out = args.out || 'qa/chat-eval/results/latest.json'
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), url, summary, results }, null, 2))
console.log(`Wrote ${out}`)
process.exit(summary.ok ? 0 : 1)
