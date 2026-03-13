import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import QuestionnairePage from './pages/QuestionnairePage'
import ChecklistPage from './pages/ChecklistPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/questionnaire" element={<QuestionnairePage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
