export default function ComingSoon({ title }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          This section is coming soon. We&apos;re building more tools to make
          US taxes easier for F-1 students.
        </p>
      </div>
    </main>
  )
}

