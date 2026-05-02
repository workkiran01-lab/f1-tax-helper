import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import QuestionnairePage from './pages/QuestionnairePage'
import ChecklistPage from './pages/ChecklistPage'
import ResultsPage from './pages/ResultsPage'
import WelcomePage from './pages/WelcomePage'
import Disclaimer from './pages/Disclaimer'
import ComingSoon from './pages/ComingSoon'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import StatusCheckerPage from './pages/StatusCheckerPage'
import useAuth from './hooks/useAuth'

const ChatPage     = lazy(() => import('./pages/ChatPage'))
const Form8843Page = lazy(() => import('./pages/Form8843Page'))
const AboutPage    = lazy(() => import('./pages/AboutPage'))

function LazySuspense({ children }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    }>
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
  const { user, loading } = useAuth()

  if (loading) {
    return <FullScreenSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <LazySuspense><ChatPage /></LazySuspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/questionnaire"
        element={
          <ProtectedRoute>
            <QuestionnairePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklist"
        element={
          <ProtectedRoute>
            <ChecklistPage />
          </ProtectedRoute>
        }
      />
      <Route path="/status-checker" element={<StatusCheckerPage />} />
      <Route path="/form-8843" element={<LazySuspense><Form8843Page /></LazySuspense>} />
      <Route path="/about" element={<LazySuspense><AboutPage /></LazySuspense>} />
      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/tax-guide" element={<ComingSoon title="Tax Guide" />} />
      <Route path="/faq" element={<ComingSoon title="FAQ" />} />
      <Route path="/blog" element={<ComingSoon title="Blog" />} />
      <Route path="/tax-treaties" element={<ComingSoon title="Tax Treaties" />} />
      <Route path="/dashboard" element={<Navigate to="/welcome" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
