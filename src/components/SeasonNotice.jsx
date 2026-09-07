import { CalendarDays, ExternalLink } from 'lucide-react'
import { TAX_YEAR, FILING_YEAR, SOURCES } from '../data/taxSeason.js'

export default function SeasonNotice({ compact = false }) {
  return (
    <aside className="season-notice rounded-xl border border-primary/25 bg-primary-soft p-4 text-sm text-body">
      <div className="flex items-center gap-2 font-medium text-headline">
        <CalendarDays className="h-4 w-4 text-primary" />
        {FILING_YEAR} filing season · {TAX_YEAR} income
      </div>
      {!compact && (
        <p className="mt-2 leading-relaxed">
          Start preparing now. The IRS has released a draft 2026 Form 8843; downloads for 2026 will
          open after the final form is verified. Prior-year 2025 filing remains available.
        </p>
      )}
      {!compact && (
        <a
          href={SOURCES.form8843}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
        >
          Check IRS form updates <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </aside>
  )
}
