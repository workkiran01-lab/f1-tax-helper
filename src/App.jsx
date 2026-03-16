import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import QuestionnairePage from './pages/QuestionnairePage'
import ChecklistPage from './pages/ChecklistPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Disclaimer from './pages/Disclaimer'
import ComingSoon from './pages/ComingSoon'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/questionnaire" element={<QuestionnairePage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/tax-guide" element={<ComingSoon title="Tax Guide" />} />
        <Route path="/faq" element={<ComingSoon title="FAQ" />} />
        <Route path="/blog" element={<ComingSoon title="Blog" />} />
        <Route path="/tax-treaties" element={<ComingSoon title="Tax Treaties" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
