// Server-side entry for the build-time pre-render (scripts/prerender.mjs). It renders the public
// pages to HTML so the text is in the page before any script runs. The browser then renders the
// same pages with createRoot (src/main.jsx), which replaces this markup.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import HomePage from './pages/HomePage.jsx'
import TaxGuidePage from './pages/TaxGuidePage.jsx'
import FaqPage from './pages/FaqPage.jsx'
import TaxTreatiesPage from './pages/TaxTreatiesPage.jsx'
import { StaticAuthProvider } from './hooks/useAuth.js'
import { APP_SHELL_FILE, PAGE_META, PRERENDERED_ROUTES, canonicalUrl, prerenderedFile } from './data/site.js'

const PAGES = {
  '/': HomePage,
  '/tax-guide': TaxGuidePage,
  '/faq': FaqPage,
  '/tax-treaties': TaxTreatiesPage,
}

export { APP_SHELL_FILE, PRERENDERED_ROUTES, prerenderedFile }

// The page's HTML and the head details for it. Auth is a fixed signed-out visitor: the static
// page is the same for everyone, and the app fills in the real session when it starts.
export function render(path) {
  const Page = PAGES[path]
  if (!Page || !PRERENDERED_ROUTES.includes(path)) throw new Error(`No pre-rendered page for ${path}`)
  return {
    html: renderToString(
      <StaticRouter location={path}>
        <StaticAuthProvider>
          <MotionConfig reducedMotion="user">
            <Page />
          </MotionConfig>
        </StaticAuthProvider>
      </StaticRouter>,
    ),
    title: PAGE_META[path].title,
    description: PAGE_META[path].description,
    url: canonicalUrl(path),
  }
}
