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

const metaTag = (key, name) => () => {
  const el = document.createElement('meta')
  el.setAttribute(key, name)
  return el
}

// The last title this hook wrote. A page that sets its own title (the legal pages) replaces it,
// and the hook then leaves that title alone instead of overwriting it.
let titleSetByHook = null

// Keeps the canonical address, description and social tags in step with the route, and the title
// for pages in PAGE_META. index.html serves every route, so without this every page would carry
// the home page's details. Routes with no entry fall back to the home page's description.
export function useRouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const url = canonicalUrl(pathname)
    setMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url)
    setMeta('meta[property="og:url"]', metaTag('property', 'og:url'), 'content', url)
    const own = PAGE_META[pathname.replace(/\/+$/, '') || '/']
    const meta = own ?? PAGE_META['/']
    if (own) {
      document.title = own.title
      titleSetByHook = own.title
    } else if (titleSetByHook !== null && document.title === titleSetByHook) {
      document.title = meta.title
      titleSetByHook = meta.title
    }
    setMeta('meta[name="description"]', metaTag('name', 'description'), 'content', meta.description)
    setMeta('meta[property="og:description"]', metaTag('property', 'og:description'), 'content', meta.description)
    setMeta('meta[property="og:title"]', metaTag('property', 'og:title'), 'content', meta.title)
  }, [pathname])
}
