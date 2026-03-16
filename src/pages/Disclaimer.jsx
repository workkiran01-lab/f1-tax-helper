export default function Disclaimer() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Disclaimer
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          F1 Tax Helper is not a tax preparation service and does not provide
          tax, legal, or financial advice. The content and AI-generated
          responses are for general guidance for F-1 students and may not apply
          to your specific situation.
        </p>
        <p className="text-sm text-muted-foreground md:text-base">
          Using this app does not create a client relationship with any tax
          professional. You should review IRS instructions, official guidance,
          or consult a qualified tax advisor before filing.
        </p>
        <p className="text-sm text-muted-foreground md:text-base">
          If you are unsure about any recommendation or form, you might want to
          double-check this with your university&apos;s international office 😊
        </p>
      </div>
    </main>
  )
}

