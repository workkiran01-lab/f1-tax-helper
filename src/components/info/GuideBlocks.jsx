import { Link } from 'react-router-dom'
import { DEADLINES, DEADLINE_NOTE, FORM_8843_MAILING, TAX_YEAR, taxYearOpen, yearOpenNotice } from '../../data/taxSeason.js'
import { RichText } from './RichText.jsx'
import { Callout, formatReviewed } from './InfoLayout.jsx'

// Renders the content blocks defined in src/data/guide.js.
export function GuideBlocks({ blocks, today = new Date() }) {
  return blocks.map((block, i) => {
    switch (block.type) {
      case 'p':
        return (
          <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-3">
            <RichText text={block.text} />
          </p>
        )
      case 'ul':
        return (
          <ul key={i} className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-3">
            {block.items.map((item) => (
              <li key={item}>
                <RichText text={item} />
              </li>
            ))}
          </ul>
        )
      case 'note':
        return (
          <Callout key={i} tone={block.tone === 'warn' ? 'warn' : 'info'}>
            <RichText text={block.text} />
          </Callout>
        )
      case 'dates':
        return (
          <div key={i} className="mt-4 rounded-2xl border border-line bg-surface-2 p-4">
            <dl className="space-y-2 text-sm">
              {block.ids.map((id) => {
                const d = DEADLINES.find((x) => x.id === id)
                return (
                  <div key={id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                    <dt className="w-28 shrink-0 font-semibold text-ink">{d.date}</dt>
                    <dd className="text-ink-3">{d.label}</dd>
                  </div>
                )
              })}
            </dl>
            <p className="mt-3 text-xs text-ink-4">{DEADLINE_NOTE}</p>
          </div>
        )
      case 'mailing':
        return (
          <div key={i} className="mt-3 rounded-2xl border border-line bg-surface-2 p-4">
            <address className="text-[15px] not-italic leading-relaxed text-ink">
              {FORM_8843_MAILING.standalone.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 text-xs text-ink-4">
              Copied from the IRS where-to-file page and reviewed {formatReviewed(FORM_8843_MAILING.reviewed)}.
              Addresses change: confirm it on the form instructions or that page before you mail.
            </p>
          </div>
        )
      case 'yearOpen':
        return taxYearOpen(TAX_YEAR, today) ? (
          <Callout key={i} tone="warn">
            {yearOpenNotice(TAX_YEAR)}
          </Callout>
        ) : null
      case 'cta':
        return (
          <Link
            key={i}
            to={block.to}
            className="mt-5 inline-flex rounded-full bg-tint px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-tint-hover"
          >
            {block.label}
          </Link>
        )
      default:
        return null
    }
  })
}
