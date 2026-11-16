// Bundled into one script (see README.md) and loaded by a page of a deployed preview of the
// site, because the production API only accepts requests from the site's own origin.
import { readChatStream } from '../../src/utils/chatStream.js'
import { runCases } from './runner.js'

async function ask(question) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(`HTTP ${response.status}: ${body.error || 'request failed'}`)
    error.fatal = response.status === 503 || response.status === 403
    throw error
  }
  let text = ''
  for await (const delta of readChatStream(response.body)) text += delta
  return text
}

window.runChatEval = (options = {}) => runCases({ ask, ...options })
