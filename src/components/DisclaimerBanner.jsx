import { Link } from 'react-router-dom'

export default function DisclaimerBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6">
          F1 Tax Helper provides general educational information only and does
          not provide tax, legal, or financial advice.
        </p>
        <Link
          className="font-medium underline underline-offset-4 hover:text-amber-800"
          to="/disclaimer"
        >
          Read full disclaimer
        </Link>
      </div>
    </div>
  )
}
