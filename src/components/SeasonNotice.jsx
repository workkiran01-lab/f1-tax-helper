import { CalendarDays, ExternalLink } from 'lucide-react'
import { TAX_YEAR, FILING_YEAR, SOURCES, taxYearOpen } from '../data/taxSeason.js'

export default function SeasonNotice({ compact = false }) {
  return (
    <aside className="season-notice rounded-xl border border-primary/25 bg-primary-soft p-4 text-sm text-body">
      <div className="flex items-center gap-2 font-medium text-headline">
        <CalendarDays className="h-4 w-4 text-tint-ink" />
        {FILING_YEAR} filing season · {TAX_YEAR} income
      </div>
      {!compact && (
        <p className="mt-2 leading-relaxed">
          The final {TAX_YEAR} Form 8843 is available to fill in and download here.
          {taxYearOpen(TAX_YEAR) &&
            ` It asks for your actual days in the US during ${TAX_YEAR}, so recount them after December 31 before you print or mail it.`}{' '}
          Prior-year 2025 filing remains available.
        </p>
      )}
      {!compact && (
        <a
          href={SOURCES.form8843}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-tint-ink hover:underline"
        >
          Check IRS form updates <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </aside>
  )
}
