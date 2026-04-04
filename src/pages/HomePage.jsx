import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { HeroSection } from '../components/HeroSection'
import { HowItWorksSection } from '../components/HowItWorksSection'
import { FeaturesSection } from '../components/FeaturesSection'
import { Footer } from '../components/Footer'
import supabase from '../utils/supabase'

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const redirectIfAuthenticated = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!isMounted) return
      if (session?.user) {
        navigate('/welcome', { replace: true })
      }
    }

    redirectIfAuthenticated()

    return () => {
      isMounted = false
    }
  }, [navigate])

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
