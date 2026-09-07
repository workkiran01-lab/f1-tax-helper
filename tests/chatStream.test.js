import { it, expect } from 'vitest'
import { readChatStream, safeIRSUrl } from '../src/utils/chatStream.js'
const encode = new TextEncoder()
const body = (chunks) =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encode.encode(chunk))
      controller.close()
    },
  })
it('handles split JSON, CRLF and a final DONE event without a newline', async () => {
  let text = ''
  for await (const part of readChatStream(
    body(['data: {"cho', 'ices":[{"delta":{"content":"Hello"}}]}\r\n\r\n', 'data: [DONE]']),
  ))
    text += part
  expect(text).toBe('Hello')
})
it('rejects incomplete answers and provider error events', async () => {
  const consume = async (stream) => {
    for await (const ignored of readChatStream(stream)) {
      void ignored
    }
  }
  await expect(
    consume(body(['data: {"choices":[{"delta":{"content":"partial"}}]}\n'])),
  ).rejects.toThrow('ended early')
  await expect(consume(body(['data: {"error":{"message":"failed"}}\n']))).rejects.toThrow(
    'interrupted',
  )
})
it.each([
  'javascript:alert(1)',
  'https://irs.gov.attacker.test/path',
  'data:text/html,bad',
  'https://attacker@irs.gov/path',
  '//irs.gov/path',
])('rejects unsafe IRS citation %s', (url) => expect(safeIRSUrl(url)).toBeNull())
it('allows official HTTPS citations', () =>
  expect(safeIRSUrl('https://www.irs.gov/publications/p519')).toBe(
    'https://www.irs.gov/publications/p519',
  ))
