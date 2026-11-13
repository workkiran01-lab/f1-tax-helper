import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuestionnairePage from './pages/QuestionnairePage'
import DashboardPage from './pages/DashboardPage'
import MyTaxesPage from './pages/MyTaxesPage'
import AccountPage from './pages/AccountPage'
import AppShell from './components/app/AppShell'
import Disclaimer from './pages/Disclaimer'
import ComingSoon from './pages/ComingSoon'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import StatusCheckerPage from './pages/StatusCheckerPage'
import useAuth, { AuthProvider } from './hooks/useAuth'
import { MotionConfig } from 'framer-motion'

const ChatPage = lazy(() => import('./pages/ChatPage'))
const Form8843Page = lazy(() => import('./pages/Form8843Page'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

function LazySuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-10 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">Checking your secure session…</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading, exitPath } = useAuth()

  if (loading) {
    return <FullScreenSpinner />
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

function AppRoutes() {
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
      <Route path="/tax-guide" element={<ComingSoon title="Tax Guide" />} />
      <Route path="/faq" element={<ComingSoon title="FAQ" />} />
      <Route path="/blog" element={<ComingSoon title="Blog" />} />
      <Route path="/tax-treaties" element={<ComingSoon title="Tax Treaties" />} />
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
