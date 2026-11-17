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

describe('the nav label while the session is being checked', () => {
  async function nav({ overStatic }) {
    vi.doMock('../src/hooks/useAuth', () => ({
      default: () => ({ user: null, loading: true, signOut: () => {} }),
    }))
    const firstPaint = await import('../src/utils/firstPaint.js')
    if (overStatic) firstPaint.startOverPrerenderedHtml()
    const { Navbar } = await import('../src/components/Navbar.jsx')
    const { MemoryRouter } = await import('react-router-dom')
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    ).container.textContent
  }
  afterEach(() => vi.doUnmock('../src/hooks/useAuth'))
  it('keeps "Sign in" over a pre-rendered page instead of flipping to "Loading…"', async () => {
    const text = await nav({ overStatic: true })
    expect(text).toContain('Sign in')
    expect(text).not.toContain('Loading…')
  })
  it('still says "Loading…" on a page that was not pre-rendered', async () => {
    expect(await nav({ overStatic: false })).toContain('Loading…')
  })
})
