// Consume complete SSE events, including a final event without a trailing newline.
export async function* readChatStream(body) {
  if (!body) throw new Error('The AI returned an empty response.')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let ended = false
  function parse(line) {
    if (!line.startsWith('data:')) return null
    const data = line.slice(5).trim()
    if (data === '[DONE]') {
      ended = true
      return null
    }
    if (!data) return null
    const event = JSON.parse(data)
    if (event.error) throw new Error('The AI response was interrupted. Please try again.')
    return event.choices?.[0]?.delta?.content || null
  }
  try {
    while (!ended) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      if (buffer.length > 100000) throw new Error('The AI response was too large.')
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      if (done && buffer) {
        lines.push(buffer)
        buffer = ''
      }
      for (const line of lines) {
        const delta = parse(line.replace(/\r$/, ''))
        if (typeof delta === 'string' && delta) yield delta
        if (ended) break
      }
      if (done) break
    }
    if (!ended)
      throw new Error(
        'The response ended early. Please retry; the partial answer may be incomplete.',
      )
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
export function safeIRSUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      ['irs.gov', 'www.irs.gov'].includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}
