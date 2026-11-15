// @vitest-environment jsdom
// Ask AI polish: lists and safe links in answers, adaptive suggestions, streaming cursor.
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChatMain, MarkdownLines } from '../src/components/chat/ChatMain.jsx'
import { suggestionsFor } from '../src/utils/chatSuggestions.js'

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('answer formatting', () => {
  it('renders bullet and numbered lists as real lists, with bold text', () => {
    const { container } = render(
      <MarkdownLines text={'You need:\n- **Form 8843**\n- Your I-20\n\n1. Print it\n2. Sign it'} />,
    )
    expect(container.querySelectorAll('ul > li')).toHaveLength(2)
    expect(container.querySelectorAll('ol > li')).toHaveLength(2)
    expect(container.querySelector('strong').textContent).toBe('Form 8843')
    expect(container.textContent).not.toContain('- ')
  })

  it('links only IRS pages; any other link keeps its label as plain text', () => {
    const { container } = render(
      <MarkdownLines
        text={
          'See [About Form 8843](https://www.irs.gov/forms-pubs/about-form-8843) or [click](https://evil.example/x) or [js](javascript:alert(1)).'
        }
      />,
    )
    const links = [...container.querySelectorAll('a')]
    expect(links.map((a) => a.href)).toEqual(['https://www.irs.gov/forms-pubs/about-form-8843'])
    expect(links[0].rel).toContain('noopener')
    expect(container.textContent).toContain('click')
    expect(container.textContent).toContain('js')
  })

  it('never renders raw HTML from a message', () => {
    const { container } = render(<MarkdownLines text={'<img src=x onerror=alert(1)> hi'} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img')
  })
})

describe('suggestions', () => {
  it('adapts to income, and never repeats an asked question', () => {
    expect(suggestionsFor({ answers: { hasUSIncome: true } })).toContain(
      'Which forms do I need for my income?',
    )
    expect(suggestionsFor({ answers: { hasUSIncome: false } })).toContain(
      'Do I still need to file with no income?',
    )
    expect(suggestionsFor(null)).toContain('Do I need to file taxes?')
    const after = suggestionsFor(null, ['Do I need to file taxes?', ' what is form 8843? '])
    expect(after).not.toContain('Do I need to file taxes?')
    expect(after).not.toContain('What is Form 8843?')
    expect(after).toContain('Where do I mail it?')
    expect(after.length).toBeLessThanOrEqual(4)
  })
})

describe('streaming', () => {
  it('shows a cursor while the answer streams and removes it when done', async () => {
    const enc = new TextEncoder()
    let controller
    const body = new ReadableStream({
      start(c) {
        controller = c
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })),
    )
    const { container } = render(
      <MemoryRouter>
        <ChatMain />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Your tax question'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    controller.enqueue(
      enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Partial' } }] })}\n\n`),
    )
    await screen.findByText('Partial')
    expect(container.querySelector('.stream-caret')).not.toBeNull()
    controller.enqueue(enc.encode('data: [DONE]\n\n'))
    controller.close()
    await waitFor(() => expect(container.querySelector('.stream-caret')).toBeNull())
  })
})
