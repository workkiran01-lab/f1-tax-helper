import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PAGE_META, canonicalUrl } from '../data/site.js'

function setMeta(selector, create, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

// Keeps the canonical address (and, for pages in PAGE_META, the title and description) in step
// with the route. index.html alone would tell search engines every page is the home page.
export function useRouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const url = canonicalUrl(pathname)
    setMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url)
    setMeta('meta[property="og:url"]', () => {
      const el = document.createElement('meta')
      el.setAttribute('property', 'og:url')
      return el
    }, 'content', url)
    const meta = PAGE_META[pathname.replace(/\/+$/, '') || '/']
    if (!meta) return
    document.title = meta.title
    for (const [selector, attr, value] of [
      ['meta[name="description"]', 'content', meta.description],
      ['meta[property="og:title"]', 'content', meta.title],
      ['meta[property="og:description"]', 'content', meta.description],
    ])
      document.head.querySelector(selector)?.setAttribute(attr, value)
  }, [pathname])
}
