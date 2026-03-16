export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          F1 Tax Helper is a learning and planning tool for international
          students. We do not provide professional tax, legal, or financial
          advice.
        </p>
        <p className="text-sm text-muted-foreground md:text-base">
          Any information you enter is used only to help you understand your
          potential US tax obligations as an F-1 student. You are responsible
          for reviewing, updating, and filing your own tax documents with the
          IRS or your tax software.
        </p>
        <p className="text-sm text-muted-foreground md:text-base">
          For specific questions about how your data is handled, please contact
          us at{' '}
          <a
            href="mailto:work.kiran01@gmail.com"
            className="text-primary underline underline-offset-2"
          >
            work.kiran01@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  )
}

