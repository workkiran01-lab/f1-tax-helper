import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { SITE_ORIGIN, canonicalUrl, PAGE_META } from '../src/data/site.js'
import { USAGE_HOSTS } from '../src/utils/usage.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

describe('one public host', () => {
  // f1taxhelper.com redirects to www.f1taxhelper.com, so every address search engines read
  // has to name www; a canonical that redirects somewhere else sends mixed signals.
  it('uses the www host in the page head, sitemap and robots.txt', () => {
    const host = new URL(SITE_ORIGIN).host
    expect(host).toBe('www.f1taxhelper.com')
    const html = read('index.html')
    for (const re of [/property="og:image" content="([^"]+)"/, /name="twitter:image" content="([^"]+)"/])
      expect(new URL(html.match(re)[1]).host, String(re)).toBe(host)
    const locs = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs.length).toBeGreaterThan(8)
    for (const loc of locs) expect(new URL(loc).host, loc).toBe(host)
    expect(read('public/robots.txt')).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)
    expect(USAGE_HOSTS).toContain(host)
  })
  // index.html serves every route. A fixed canonical there would tell a crawler that reads the
  // raw HTML that /tax-guide is a copy of the home page, so useRouteMeta sets it per route.
  it('leaves the canonical address and og:url to the route, not the shared page shell', () => {
    const html = read('index.html')
    expect(html).not.toMatch(/rel="canonical"/)
    expect(html).not.toMatch(/property="og:url"/)
  })
  it('lists every public information page in the sitemap, and nothing from the signed-in app', () => {
    const locs = [...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
    for (const path of ['/', '/tax-guide', '/faq', '/tax-treaties', '/form-8843', '/status-checker', '/privacy', '/terms'])
      expect(locs, path).toContain(path)
    for (const path of ['/home', '/taxes', '/account', '/chat', '/login', '/blog']) expect(locs).not.toContain(path)
  })
  it('builds canonical addresses without queries, hashes or trailing slashes', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_ORIGIN}/`)
    expect(canonicalUrl('/tax-guide/')).toBe(`${SITE_ORIGIN}/tax-guide`)
    expect(canonicalUrl('/tax-treaties?country=canada#x')).toBe(`${SITE_ORIGIN}/tax-treaties`)
  })
  it('gives each described page its own title and description', () => {
    const titles = Object.values(PAGE_META).map((m) => m.title)
    expect(new Set(titles).size).toBe(titles.length)
    for (const { title, description } of Object.values(PAGE_META)) {
      expect(title.length).toBeLessThanOrEqual(70)
      expect(description.length).toBeGreaterThan(60)
      expect(description.length).toBeLessThanOrEqual(200)
    }
  })
})
