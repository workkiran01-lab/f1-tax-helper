// Server-side entry for the build-time pre-render (scripts/prerender.mjs). It renders the public
// information pages to HTML so the text is in the page before any script runs. The browser then
// renders the same pages with createRoot (src/main.jsx), which replaces this markup.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import TaxGuidePage from './pages/TaxGuidePage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import TaxTreatiesPage from './pages/TaxTreatiesPage.jsx'
import { PAGE_META, PRERENDERED_ROUTES, canonicalUrl } from './data/site.js'

const PAGES = { '/tax-guide': TaxGuidePage, '/faq': FaqPage, '/tax-treaties': TaxTreatiesPage }

export { PRERENDERED_ROUTES }

// The page's HTML and the head details for it.
export function render(path) {
  const Page = PAGES[path]
  if (!Page || !PRERENDERED_ROUTES.includes(path)) throw new Error(`No pre-rendered page for ${path}`)
  return {
    html: renderToString(
      <StaticRouter location={path}>
        <Page />
      </StaticRouter>,
    ),
    title: PAGE_META[path].title,
    description: PAGE_META[path].description,
    url: canonicalUrl(path),
  }
}
