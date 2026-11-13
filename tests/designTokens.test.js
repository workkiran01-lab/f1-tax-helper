// The palette lives in one place (src/index.css). Components that hard-code a
// colour drift from it, which is how the app ended up with thirty near-identical
// hex values before the tokens existed.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../tailwind.config.js'

const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.jsx') ? [path] : []
  })

describe('design tokens', () => {
  it('keeps hex colours out of component class names', () => {
    const offenders = files('src').flatMap((path) =>
      (readFileSync(path, 'utf8').match(/[a-z-]+-\[#[0-9a-fA-F]{3,8}\]/g) || []).map(
        (match) => `${path}: ${match}`,
      ),
    )
    expect(offenders).toEqual([])
  })

  it('defines every colour variable the Tailwind theme refers to', () => {
    const css = readFileSync('src/index.css', 'utf8')
    const used = new Set(
      Object.values(config.theme.extend.colors).flatMap((value) =>
        [...String(value).matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]),
      ),
    )
    expect(used.size).toBeGreaterThan(15)
    for (const name of used) expect(css, name).toMatch(new RegExp(`--${name}:\\s*\\d+ \\d+ \\d+;`))
  })

  it('turns motion off for people who ask for reduced motion', () => {
    const css = readFileSync('src/index.css', 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce/)
    expect(readFileSync('src/App.jsx', 'utf8')).toContain('reducedMotion="user"')
  })
})
