import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuestionnairePage from './pages/QuestionnairePage'
import DashboardPage from './pages/DashboardPage'
import MyTaxesPage from './pages/MyTaxesPage'
import AccountPage from './pages/AccountPage'
import AppShell from './components/app/AppShell'
import Disclaimer from './pages/Disclaimer'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import StatusCheckerPage from './pages/StatusCheckerPage'
// Loaded with the app, not lazily: these pages are pre-rendered to static HTML at build time
// (scripts/prerender.mjs), and a lazy page would swap that HTML for a loading skeleton.
import TaxGuidePage from './pages/TaxGuidePage'
import FaqPage from './pages/FaqPage'
import TaxTreatiesPage from './pages/TaxTreatiesPage'
import useAuth, { AuthProvider } from './hooks/useAuth'
import { useRouteMeta } from './hooks/useRouteMeta.js'
import { MotionConfig } from 'framer-motion'
import { PageSkeleton, SessionSplash } from './components/app/Skeleton'
import { trackEvent } from './utils/usage.js'
import { endFirstPaint } from './utils/firstPaint.js'

const ChatPage = lazy(() => import('./pages/ChatPage'))
const Form8843Page = lazy(() => import('./pages/Form8843Page'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

function LazySuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-bg">
          <PageSkeleton />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading, exitPath } = useAuth()

  if (loading) {
    return <SessionSplash />
  }

  if (!user) {
    return <Navigate to={exitPath} replace />
  }

  return children
}

function InApp({ children, focus = false }) {
  return (
    <ProtectedRoute>
      <AppShell focus={focus}>{children}</AppShell>
    </ProtectedRoute>
  )
}

// The page someone lands on may be pre-rendered, and then it must not replay its fade-in
// (index.css). Once they move to another page, pages animate in as usual.
function usePrerenderedMark() {
  const { pathname } = useLocation()
  const landedOn = useRef(pathname)
  useEffect(() => {
    if (pathname !== landedOn.current) document.documentElement.removeAttribute('data-prerendered')
  }, [pathname])
}

function AppRoutes() {
  useRouteMeta()
  usePrerenderedMark()
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      {/* The app: one shell, four places, plus Account. */}
      <Route
        path="/home"
        element={
          <InApp>
            <DashboardPage />
          </InApp>
        }
      />
      <Route
        path="/taxes"
        element={
          <InApp>
            <MyTaxesPage />
          </InApp>
        }
      />
      <Route
        path="/account"
        element={
          <InApp>
            <AccountPage />
          </InApp>
        }
      />
      <Route
        path="/chat"
        element={
          <InApp>
            <LazySuspense>
              <ChatPage />
            </LazySuspense>
          </InApp>
        }
      />
      {/* Step-by-step flows hide the tab bar. The last two also work signed out. */}
      <Route
        path="/questionnaire"
        element={
          <InApp focus>
            <QuestionnairePage />
          </InApp>
        }
      />
      <Route
        path="/status-checker"
        element={
          <AppShell focus>
            <StatusCheckerPage />
          </AppShell>
        }
      />
      <Route
        path="/form-8843"
        element={
          <AppShell focus>
            <LazySuspense>
              <Form8843Page />
            </LazySuspense>
          </AppShell>
        }
      />
      <Route
        path="/about"
        element={
          <LazySuspense>
            <AboutPage />
          </LazySuspense>
        }
      />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      {/* Public information pages. There is no blog: that address is the not-found page. */}
      <Route
        path="/tax-guide"
        element={<TaxGuidePage />}
      />
      <Route
        path="/faq"
        element={<FaqPage />}
      />
      <Route
        path="/tax-treaties"
        element={<TaxTreatiesPage />}
      />
      <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
      <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
      {/* Addresses from before the app shell keep working. */}
      <Route path="/welcome" element={<Navigate to="/home" replace />} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="/results" element={<Navigate to="/taxes" replace />} />
      <Route path="/checklist" element={<Navigate to="/taxes" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    trackEvent('visit', { once: true }) // one anonymous count per browser tab session
  }, [])
  // The first render is committed: later mounts play their entry animations (see firstPaint.js).
  useEffect(() => endFirstPaint(), [])
  return (
    <BrowserRouter>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <AppRoutes />
        </MotionConfig>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
