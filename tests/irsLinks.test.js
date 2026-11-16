import { describe, it, expect } from 'vitest'
import { collectIrsUrls, KNOWN_DEAD } from '../scripts/check-irs-links.mjs'
import { SOURCES } from '../src/data/taxSeason.js'

describe('IRS links', () => {
  const urls = collectIrsUrls()
  it('finds the addresses the app, the prompt and the chat test set use', () => {
    expect(urls.length).toBeGreaterThan(15)
    expect(urls).toContain(SOURCES.treaties)
    expect(urls).toContain(SOURCES.whereToFile)
  })
  it('never uses an address the IRS has retired (checked live in November 2026)', () => {
    for (const dead of KNOWN_DEAD) expect(urls, dead).not.toContain(dead)
  })
  it('keeps every shared source on the official host, once each', () => {
    const values = Object.values(SOURCES)
    for (const url of values) expect(new URL(url).hostname).toBe('www.irs.gov')
    expect(new Set(values).size).toBe(values.length)
  })
})
