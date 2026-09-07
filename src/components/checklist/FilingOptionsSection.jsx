import { ArrowUpRight, Building2, FileText, GraduationCap, Landmark, Rocket } from 'lucide-react'

const filingOptions = [
  {
    name: 'Sprintax',
    description: 'Nonresident tax preparation software; check supported forms and pricing',
    url: 'https://www.sprintax.com',
    Icon: Rocket,
  },
  {
    name: 'Glacier Tax Prep',
    description: 'Widely used by universities for nonresident alien tax filing',
    url: 'https://www.glaciertax.com',
    Icon: Building2,
  },
  {
    name: 'IRS Free File',
    description: 'Partner programs vary: verify Form 1040-NR support and eligibility first',
    url: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free',
    Icon: Landmark,
  },
  {
    name: 'VITA',
    description: 'Ask for a site trained for foreign student and nonresident returns',
    url: 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers',
    Icon: FileText,
  },
  {
    name: 'University Tax Workshop',
    description: 'Many universities offer free workshops for international students',
    url: 'https://www.google.com/search?q=university+free+tax+workshop+international+students',
    Icon: GraduationCap,
  },
]

export function FilingOptionsSection({ className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-primary/20 bg-card p-5 shadow-sm md:p-6 ${className}`.trim()}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground md:text-lg">
          Review your filing options
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Collecting documents does not confirm filing readiness. Verify your tax year, residency
          and the service’s support for your return.
        </p>
      </div>

      <div className="space-y-3">
        {filingOptions.map(({ name, description, url, Icon }) => (
          <div
            key={name}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                <p className="text-xs text-muted-foreground md:text-sm">{description}</p>
              </div>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:text-sm"
            >
              <span>Visit →</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
