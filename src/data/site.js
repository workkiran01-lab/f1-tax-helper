// The one public address of the site. The apex domain (f1taxhelper.com) redirects here, so
// canonical links, the sitemap and robots.txt all use this host (tests/site.test.js).
export const SITE_ORIGIN = 'https://www.f1taxhelper.com'
export const SUPPORT_EMAIL = 'support@f1taxhelper.com'

// 'YYYY-MM-DD' to 'November 16, 2026', independent of the reader's time zone.
export function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function canonicalUrl(path = '/') {
  const clean = String(path).split(/[?#]/)[0].replace(/\/+$/, '')
  return `${SITE_ORIGIN}${clean || '/'}`
}

// Public pages written to static HTML at build time (src/prerender.jsx, scripts/prerender.mjs)
// so search engines and no-JS readers get the text. Each needs a PAGE_META entry, a sitemap
// entry and a rewrite in vercel.json ahead of the catch-all; tests/prerender.test.js checks all three.
export const PRERENDERED_ROUTES = Object.freeze(['/tax-guide', '/faq', '/tax-treaties'])

// Titles and descriptions for the pages this file owns. Other pages set their own title.
export const PAGE_META = Object.freeze({
  '/': {
    title: 'F1 Tax Helper — US Taxes for International Students',
    description:
      'Free Form 8843 generator and AI tax guidance for F-1 international students. Check your nonresident status and tax treaty benefits in minutes — no login required.',
  },
  '/tax-guide': {
    title: 'Tax guide for F-1 students — F1 Tax Helper',
    description:
      'A plain-language guide for F-1 and J-1 students: nonresident status, Form 8843, Form 1040-NR, scholarships, Social Security and Medicare tax, treaties and state taxes, with IRS sources.',
  },
  '/faq': {
    title: 'FAQ — F1 Tax Helper',
    description:
      'Short answers for international students: do I file with no income, when is Form 8843 due, where to mail it, treaties, FICA, and what this app does not do.',
  },
  '/tax-treaties': {
    title: 'Tax treaty lookup for students — F1 Tax Helper',
    description:
      'Find your country: which treaty notes this app has reviewed, and where to check the IRS directory for the rest. Not reviewed does not mean there is no treaty.',
  },
})
