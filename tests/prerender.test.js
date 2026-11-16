import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { render } from '../src/prerender.jsx'
import { injectPage, checkPage, escapeHtml } from '../scripts/prerender.mjs'
import { PAGE_META, PRERENDERED_ROUTES, canonicalUrl } from '../src/data/site.js'

const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')

describe('pre-rendered pages', () => {
  it('render each page with its heading and real text, never hidden by an animation start state', () => {
    const guide = render('/tax-guide').html
    expect(guide).toMatch(/<h1[^>]*>[^<]*Tax guide for F-1 students/i)
    expect(guide).toContain('Scholarships and fellowships')
    expect(guide).toContain('This app does not prepare, file or e-file Form 1040-NR')
    const faq = render('/faq').html
    expect(faq).toContain('Is my scholarship taxable?')
    // An answer, not just the questions: the FAQ has no h2s, so check a sentence from one answer.
    expect(faq).toContain('leaving out the tax-free part for tuition and required course costs')
    expect(render('/tax-treaties').html).toMatch(/<h1[^>]*>[^<]*Tax treaty lookup/i)
    for (const path of PRERENDERED_ROUTES) expect(render(path).html).not.toMatch(/opacity:\s*0[;"]/)
  })
  it('refuses a page that is not on the list', () => {
    expect(() => render('/chat')).toThrow(/No pre-rendered page/)
  })
  it('puts the page and its own head details into the built shell, once', () => {
    for (const path of PRERENDERED_ROUTES) {
      const page = injectPage(template, render(path))
      expect(() => checkPage(path, page)).not.toThrow()
      expect(page).toContain(`<title>${escapeHtml(PAGE_META[path].title)}</title>`)
      expect(page).toContain(`<meta name="description" content="${escapeHtml(PAGE_META[path].description)}" />`)
      expect(page.match(/rel="canonical"/g)).toHaveLength(1)
      expect(page).toContain(`<link rel="canonical" href="${canonicalUrl(path)}" />`)
      expect(page).toContain(`<meta property="og:url" content="${canonicalUrl(path)}" />`)
      expect(page.match(/<div id="root">/g)).toHaveLength(1)
      // The shell's scripts stay, so the app still starts.
      expect(page).toContain('/src/main.jsx')
    }
  })
  it('escapes head values and fails loudly on a broken shell or page', () => {
    const page = injectPage(template, { html: '<h1>x</h1>', title: 'A "B" <C>', description: 'd & e', url: 'https://www.f1taxhelper.com/x' })
    expect(page).toContain('<title>A &quot;B&quot; &lt;C&gt;</title>')
    expect(page).toContain('content="d &amp; e"')
    expect(() => injectPage(template.replace('<div id="root"></div>', ''), render('/faq'))).toThrow(/empty #root/)
    expect(() => checkPage('/x', injectPage(template, { html: '<p>no heading</p>', title: 't', description: 'd', url: 'u' }))).toThrow(/no <h1>/)
    expect(() => checkPage('/x', '<div id="root"><h1 style="opacity:0;">x</h1></div>')).toThrow(/opacity 0/)
  })
  it('keeps the route list, page details, sitemap and Vercel rewrites in step', () => {
    const rewrites = vercel.rewrites
    const catchAll = rewrites.findIndex((r) => r.destination === '/index.html')
    expect(catchAll).toBeGreaterThan(-1)
    for (const path of PRERENDERED_ROUTES) {
      expect(PAGE_META[path], path).toBeTruthy()
      expect(sitemap).toContain(`<loc>${canonicalUrl(path)}</loc>`)
      const i = rewrites.findIndex((r) => r.source === path && r.destination === `${path}.html`)
      // Ahead of the catch-all, or the catch-all would serve the empty shell instead.
      expect(i, path).toBeGreaterThan(-1)
      expect(i, path).toBeLessThan(catchAll)
    }
    // The home page is not pre-rendered: index.html is the shell for every other route.
    expect(PRERENDERED_ROUTES).not.toContain('/')
  })
})
