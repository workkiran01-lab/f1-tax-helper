import { Navbar } from '../components/Navbar'
import { HeroSection } from '../components/HeroSection'
import { HowItWorksSection } from '../components/HowItWorksSection'
import { FeaturesSection } from '../components/FeaturesSection'
import { Footer } from '../components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <Footer />
    </main>
  )
}
