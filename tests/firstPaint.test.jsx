// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.resetModules()
})

async function load() {
  const firstPaint = await import('../src/utils/firstPaint.js')
  const { Sequence, SequenceItem } = await import('../src/components/app/motion.jsx')
  return { ...firstPaint, Sequence, SequenceItem }
}
const hero = (Sequence, SequenceItem) => (
  <Sequence>
    <SequenceItem>
      <h1>Answer 5 questions.</h1>
    </SequenceItem>
  </Sequence>
)
const opacityOf = (container) => container.querySelector('h1').parentElement.style.opacity

describe('entry animations and pre-rendered HTML', () => {
  it('starts hidden on a normal load, so the hero fades in', async () => {
    const { Sequence, SequenceItem, skipEntryAnimation } = await load()
    expect(skipEntryAnimation()).toBe(false)
    expect(opacityOf(render(hero(Sequence, SequenceItem)).container)).toBe('0')
  })
  it('starts visible over pre-rendered HTML, so text already on screen does not vanish', async () => {
    const { Sequence, SequenceItem, startOverPrerenderedHtml } = await load()
    startOverPrerenderedHtml()
    expect(opacityOf(render(hero(Sequence, SequenceItem)).container)).not.toBe('0')
  })
  it('animates again for anything mounted after the first paint', async () => {
    const { Sequence, SequenceItem, startOverPrerenderedHtml, endFirstPaint, skipEntryAnimation } = await load()
    startOverPrerenderedHtml()
    endFirstPaint()
    expect(skipEntryAnimation()).toBe(false)
    expect(opacityOf(render(hero(Sequence, SequenceItem)).container)).toBe('0')
  })
})
