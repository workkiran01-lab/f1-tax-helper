import { ExternalLink } from 'lucide-react'
import { FORM_8843_MAILING, filingDeadline } from '../../data/taxSeason.js'

// Shown after the form is downloaded: exactly what to do with the paper, in order.
// This app never submits anything to the IRS.
export default function MailingGuide({ year }) {
  const deadline = filingDeadline(false, year)
  const steps = [
    ['Review every entry', 'Check your name, dates and days in the US against your records.'],
    ['Print, then sign and date page 2', 'The form is not valid for filing unsigned.'],
    [
      'Choose how it goes in',
      'If you are also filing Form 1040-NR, attach Form 8843 to that return and mail them together as the return instructions say. If you are not filing a return, mail it on its own.',
    ],
    [
      'Mail it by the deadline',
      `Standalone, the usual deadline for ${year} is ${deadline}. Consider a mail service with tracking, and keep a copy for your records.`,
    ],
  ]
  return (
    <section aria-labelledby="mailing-title" className="rounded-3xl border border-line bg-surface-2 p-5">
      <h3 id="mailing-title" className="text-[17px] font-semibold text-ink">
        Print, sign and mail
      </h3>
      <ol className="mt-4 space-y-4">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint/15 text-[13px] font-bold text-tint-ink"
            >
              {i + 1}
            </span>
            <div>
              <p className="text-[15px] font-medium text-ink">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-3">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-medium text-ink-3">Mail a standalone Form 8843 to</p>
        <address className="mt-1.5 text-[15px] not-italic leading-snug text-ink">
          {FORM_8843_MAILING.standalone.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
        <p className="mt-3 text-xs leading-relaxed text-ink-4">
          Copied from the IRS on {FORM_8843_MAILING.reviewed}. Addresses change, so confirm it on
          the IRS page before you mail.
        </p>
        <a
          href={FORM_8843_MAILING.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-tint-ink hover:underline"
        >
          Check the IRS address <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  )
}
