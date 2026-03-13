import { ArrowRight, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from './ui/Button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background px-4 py-20 md:py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Free for all F-1 visa holders</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            US Taxes Simplified for{' '}
            <span className="text-primary">International Students</span>
          </h1>

          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            Navigate the complexities of US tax filing with confidence. Our
            AI-powered platform provides personalized guidance tailored
            specifically for F-1 visa holders, helping you understand your
            obligations and file correctly.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/questionnaire"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-border text-foreground hover:bg-secondary"
            >
              Learn More
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <span>IRS Compliant</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span>Trusted by 10,000+ students</span>
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <span>Available 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
