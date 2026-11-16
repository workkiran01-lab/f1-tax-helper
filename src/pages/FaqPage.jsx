import { InfoLayout } from '../components/info/InfoLayout.jsx'
import { RichText } from '../components/info/RichText.jsx'
import { FAQ_ITEMS } from '../data/guide.js'

export default function FaqPage() {
  return (
    <InfoLayout
      eyebrow="FAQ"
      title="Frequently asked questions"
      intro="Short answers for international students. The tax guide has the longer version, with IRS sources."
    >
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.id}
            id={item.id}
            className="group scroll-mt-24 rounded-2xl border border-line bg-surface p-4 sm:p-5"
          >
            <summary className="cursor-pointer list-none text-[17px] font-semibold leading-snug text-ink marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {item.q}
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-ink-4 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
              <RichText text={item.a} />
            </p>
          </details>
        ))}
      </div>
    </InfoLayout>
  )
}
