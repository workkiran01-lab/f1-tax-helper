import { DollarSign, Sparkles, GraduationCap, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: DollarSign,
    title: 'Free to Use',
    description:
      'No hidden fees or premium tiers. Our core tax guidance features are completely free for all F-1 visa holders.',
  },
  {
    icon: Sparkles,
    title: 'AI Powered',
    description:
      'Our intelligent system analyzes your unique situation to provide accurate, personalized tax advice in seconds.',
  },
  {
    icon: GraduationCap,
    title: 'Built for F-1 Students',
    description:
      'Specifically designed for international students. We understand the unique tax rules that apply to your visa status.',
  },
  {
    icon: Globe,
    title: 'Covers 50+ Countries',
    description:
      'Tax treaties, foreign income rules, and country-specific guidance for students from over 50 nations worldwide.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background px-4 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Why Choose F1 Tax Helper?
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to navigate US taxes as an international student
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-primary p-8 text-center md:p-12">
          <h3 className="mb-4 text-2xl font-bold text-primary-foreground md:text-3xl">
            Ready to simplify your tax filing?
          </h3>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Join thousands of international students who have successfully
            navigated US taxes with our help.
          </p>
          <Link
            to="/chat"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-medium text-primary transition-colors hover:bg-background/90"
          >
            Start for Free
          </Link>
        </div>
      </div>
    </section>
  )
}
