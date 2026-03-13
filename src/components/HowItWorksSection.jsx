import { ClipboardList, Lightbulb, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Answer a Few Questions',
    description:
      'Tell us about your visa status, income sources, and time spent in the US. Our simple questionnaire takes just 5 minutes to complete.',
  },
  {
    number: '02',
    icon: Lightbulb,
    title: 'Get Personalized Guidance',
    description:
      'Receive tailored advice based on your specific situation. Understand which forms you need, what deductions apply, and key deadlines.',
  },
  {
    number: '03',
    icon: CheckCircle2,
    title: 'File with Confidence',
    description:
      "Use our step-by-step instructions to complete your tax return accurately. We'll help you avoid common mistakes that trigger audits.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-secondary px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to understand and complete your US tax obligations
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-5xl font-bold text-primary/10">
                  {step.number}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
              </div>

              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
