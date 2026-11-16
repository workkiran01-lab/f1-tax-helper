import { InfoLayout, SourceLinks, Callout, formatReviewed } from '../components/info/InfoLayout.jsx'
import { GuideBlocks } from '../components/info/GuideBlocks.jsx'
import { RichText } from '../components/info/RichText.jsx'
import { GUIDE_INTRO, GUIDE_SCOPE, GUIDE_SECTIONS, REVIEW_LOG } from '../data/guide.js'

export default function TaxGuidePage() {
  return (
    <InfoLayout eyebrow="Guide" title="Tax guide for F-1 students" intro={GUIDE_INTRO}>
      <Callout>
        <RichText text={GUIDE_SCOPE} />
      </Callout>

      <nav aria-label="On this page" className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-medium text-ink-4">On this page</p>
        <ol className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
          {[...GUIDE_SECTIONS, { id: 'review-log', title: 'Review log' }].map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ink-3 transition-colors hover:text-tint-ink">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-6">
        {GUIDE_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-title`}
            className="scroll-mt-24 rounded-3xl border border-line bg-surface p-5 sm:p-7"
          >
            <h2 id={`${section.id}-title`} className="text-[21px] font-bold leading-snug text-ink">
              {section.title}
            </h2>
            <GuideBlocks blocks={section.blocks} />
            <SourceLinks sources={section.sources} />
          </section>
        ))}

        <section
          id="review-log"
          aria-labelledby="review-log-title"
          className="scroll-mt-24 rounded-3xl border border-line bg-surface p-5 sm:p-7"
        >
          <h2 id="review-log-title" className="text-[21px] font-bold leading-snug text-ink">
            Review log
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
            Dates, addresses and rules on this site are checked against IRS pages and corrected
            when they change. Newest first.
          </p>
          <ul className="mt-4 space-y-3">
            {REVIEW_LOG.map((entry) => (
              <li key={entry.date} className="text-[15px] leading-relaxed text-ink-3">
                <time dateTime={entry.date} className="font-semibold text-ink">
                  {formatReviewed(entry.date)}
                </time>
                {': '}
                {entry.text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </InfoLayout>
  )
}
