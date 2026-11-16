import { Link } from 'react-router-dom'
import { SUPPORT_EMAIL } from '../../data/site.js'

// Text with [label](address) links and **bold**. Only app paths, official irs.gov pages and the
// support address become links; any other address keeps just its label, so content can never
// link somewhere unreviewed.
const PATTERN = /(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/
const linkClass = 'text-tint-ink underline-offset-2 hover:underline'

export function linkKind(href) {
  if (/^\/[a-z0-9/-]*(#[a-z0-9-]+)?$/i.test(href)) return 'app'
  if (href === `mailto:${SUPPORT_EMAIL}`) return 'mail'
  try {
    const url = new URL(href)
    return url.protocol === 'https:' && url.hostname === 'www.irs.gov' && !url.username && !url.password ? 'irs' : null
  } catch {
    return null
  }
}

export function RichText({ text }) {
  return String(text)
    .split(PATTERN)
    .map((part, i) => {
      const link = part.match(LINK)
      if (link) {
        const [, label, href] = link
        const kind = linkKind(href)
        if (kind === 'app')
          return (
            <Link key={i} to={href} className={linkClass}>
              {label}
            </Link>
          )
        if (kind === 'irs')
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {label}
              <span className="sr-only"> (IRS, opens in a new tab)</span>
            </a>
          )
        if (kind === 'mail')
          return (
            <a key={i} href={href} className={linkClass}>
              {label}
            </a>
          )
        return label
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
        return (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        )
      return part
    })
}
