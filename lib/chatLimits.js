// Chat request limits shared by the server validator (lib/apiSafety.js) and the
// browser client. Keeping one source prevents the client from building a
// history that the server is guaranteed to reject.
export const CHAT_LIMITS = Object.freeze({
  maxMessages: 20,
  maxMessageChars: 4000,
  maxTotalChars: 24000,
})

// Fit a conversation to the server limits instead of letting a long answer or a
// long conversation make every later request fail. The newest messages win;
// with `pinFirst`, the opening context message is kept as well.
export function fitChatHistory(messages, { pinFirst = false, limits = CHAT_LIMITS } = {}) {
  const normalized = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map((m) => {
      const content = m.content.trim()
      return {
        role: m.role,
        content:
          content.length > limits.maxMessageChars
            ? `${content.slice(0, limits.maxMessageChars - 1).trimEnd()}…`
            : content,
      }
    })
    .filter((m) => m.content)
  if (!normalized.length) return []
  const last = normalized.at(-1)
  const pinned = pinFirst && normalized.length > 1 ? normalized[0] : null
  const middle = normalized.slice(pinned ? 1 : 0, -1)
  let budget = limits.maxTotalChars - last.content.length - (pinned?.content.length || 0)
  let slots = limits.maxMessages - 1 - (pinned ? 1 : 0)
  const kept = []
  for (let i = middle.length - 1; i >= 0 && slots > 0; i -= 1) {
    if (middle[i].content.length > budget) break
    kept.unshift(middle[i])
    budget -= middle[i].content.length
    slots -= 1
  }
  // Never open the retained window with an answer whose question was dropped.
  while (kept.length && kept[0].role === 'assistant') kept.shift()
  return [pinned, ...kept, last].filter(Boolean)
}
