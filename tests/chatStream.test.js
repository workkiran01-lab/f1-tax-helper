import { it, expect } from 'vitest'
import { readChatStream, safeIRSUrl, wasCutShort } from '../src/utils/chatStream.js'
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

const consumeAll = async (stream, state) => {
  let text = ''
  for await (const part of readChatStream(stream, state)) text += part
  return text
}
it('reports why the model stopped, so a cut-off answer can be told from a finished one', async () => {
  const cut = {}
  await consumeAll(
    body([
      'data: {"choices":[{"delta":{"content":"The deadline is"}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n',
      'data: [DONE]\n\n',
    ]),
    cut,
  )
  expect(cut.finishReason).toBe('length')
  expect(wasCutShort(cut)).toBe(true)
  const done = {}
  await consumeAll(
    body([
      'data: {"choices":[{"delta":{"content":"June 15."}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ]),
    done,
  )
  expect(done.finishReason).toBe('stop')
  expect(wasCutShort(done)).toBe(false)
})
it('works without a state object and when no reason is sent', async () => {
  expect(
    await consumeAll(body(['data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n', 'data: [DONE]\n\n'])),
  ).toBe('Hi')
  const state = {}
  await consumeAll(body(['data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n', 'data: [DONE]\n\n']), state)
  expect(wasCutShort(state)).toBe(false)
  expect(wasCutShort(undefined)).toBe(false)
})
