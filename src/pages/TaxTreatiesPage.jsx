import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { InfoLayout, SourceLinks, Callout } from '../components/info/InfoLayout.jsx'
import { COUNTRIES, TREATIES, getTreatyByCountryName, treatyGuidance } from '../data/treaties.js'
import { SOURCES } from '../data/taxSeason.js'

const STATUS_LABEL = {
  active: 'Reviewed: treaty in effect',
  suspended: 'Reviewed: provisions suspended',
  terminated: 'Reviewed: treaty ended',
  none: 'Reviewed: not in the IRS directory',
}

export function statusLabel(treaty) {
  return treaty.verified ? (STATUS_LABEL[treaty.status] ?? 'Reviewed') : 'Not reviewed in this app'
}

const REVIEWED = Object.values(TREATIES).filter((t) => t.verified)
const IRS_SOURCES = [
  { label: 'United States income tax treaties, A to Z', url: SOURCES.treaties },
  { label: 'Tax treaty tables', url: SOURCES.treatyTables },
  { label: 'Publication 901, U.S. Tax Treaties', url: SOURCES.pub901 },
  { label: 'Claiming tax treaty benefits (Form 8833 and its exceptions)', url: SOURCES.treatyDisclosure },
]

function CountryResult({ treaty }) {
  const reviewed = treaty.verified
  return (
    <section
      aria-labelledby="country-title"
      className="mt-4 rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="country-title" className="text-[21px] font-bold text-ink">
          {treaty.name}
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            reviewed ? 'bg-ok/15 text-ok-ink' : 'bg-warning-soft text-warn-ink'
          }`}
        >
          {statusLabel(treaty)}
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-3">{treatyGuidance(treaty.name)}</p>
      {!reviewed && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
          Open the IRS treaty directory below, find {treaty.name}, and read the student and
          scholarship articles. If you are unsure, ask your school's international student office
          or a qualified tax preparer.
        </p>
      )}
      <SourceLinks sources={IRS_SOURCES} />
    </section>
  )
}

export default function TaxTreatiesPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const slug = params.get('country') ?? ''
  const selected = Object.hasOwn(TREATIES, slug) ? TREATIES[slug] : null
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? COUNTRIES.filter((name) => name.toLowerCase().includes(q)).slice(0, 8) : []
  }, [query])

  const choose = (name) => {
    setParams({ country: getTreatyByCountryName(name).slug }, { replace: true })
    setQuery('')
  }

  return (
    <InfoLayout
      eyebrow="Treaties"
      title="Tax treaty lookup for students"
      intro="Some countries have a tax treaty with the US that can help students. This app has reviewed notes for a few countries only. Every other country is marked not reviewed, which does not mean there is no treaty."
    >
      <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <label htmlFor="country-search" className="text-sm font-medium text-ink">
          Find your country
        </label>
        <input
          id="country-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing, for example Canada"
          className="mt-2 w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-5 focus:border-tint focus:outline-none"
        />
        <p role="status" className="sr-only">
          {query.trim() ? `${matches.length} matching ${matches.length === 1 ? 'country' : 'countries'}` : ''}
        </p>
        {matches.length > 0 && (
          <ul aria-label="Matching countries" className="mt-3 flex flex-wrap gap-2">
            {matches.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => choose(name)}
                  className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && matches.length === 0 && (
          <p className="mt-3 text-sm text-ink-3">
            No country in the list matches that. Check the spelling, or search the IRS directory
            below.
          </p>
        )}
      </div>

      {selected ? (
        <CountryResult treaty={selected} />
      ) : (
        <SourceLinks sources={IRS_SOURCES} />
      )}

      <section aria-labelledby="reviewed-title" className="mt-8">
        <h2 id="reviewed-title" className="text-[21px] font-bold text-ink">
          Countries reviewed in this app
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {REVIEWED.map((t) => (
            <li key={t.slug} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-[17px] font-semibold text-ink">{t.name}</p>
              <p className="mt-0.5 text-xs text-ink-4">
                {statusLabel(t)}
                {t.article ? ` · ${t.article}` : ''}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-3">
                {t.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <Callout>
        Before you rely on a treaty: your citizenship alone does not decide it. Your residence
        before you arrived, the purpose and length of your stay, the type of income and the
        treaty's saving clause all matter. Form 8833 is not required for every claim, and Forms
        8233 and W-8BEN are withholding documents for the payer, not return attachments.
      </Callout>
    </InfoLayout>
  )
}
