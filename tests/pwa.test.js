import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const manifest = JSON.parse(read('public/manifest.webmanifest'))
const rewrite = new RegExp(`^${JSON.parse(read('vercel.json')).rewrites[0].source}$`)

it('has a valid installable manifest whose icons exist', () => {
  expect(manifest.display).toBe('standalone')
  expect(manifest.start_url.startsWith('/')).toBe(true)
  expect(manifest.icons.some((i) => i.sizes === '192x192')).toBe(true)
  expect(manifest.icons.some((i) => i.sizes === '512x512')).toBe(true)
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  for (const icon of manifest.icons) expect(existsSync(new URL(`../public${icon.src}`, import.meta.url))).toBe(true)
})

it('does not rewrite the manifest or icons to index.html', () => {
  for (const path of ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/apple-touch-icon.png'])
    expect(rewrite.test(path)).toBe(false)
  expect(rewrite.test('/home')).toBe(true)
})

it('links the manifest and covers the notch, and registers no service worker', () => {
  const html = read('index.html')
  expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
  expect(html).toContain('viewport-fit=cover')
  expect(read('src/main.jsx')).not.toMatch(/serviceWorker/)
})
