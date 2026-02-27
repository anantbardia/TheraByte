import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './components/AuthPage'
import PatientApp from './layouts/PatientApp'
import TherapistApp from './layouts/TherapistApp'
import ChatSession from './pages/ChatSession'
import PatientProfile from './pages/PatientProfile'
import PatientTools from './pages/PatientTools'
import PatientSessions from './pages/PatientSessions'
import TherapistPatients from './pages/TherapistPatients'
import TherapistPatientView from './pages/TherapistPatientView'
import VideoSession from './pages/VideoSession'
import CommunityGroups from './pages/CommunityGroups'
import Assessment from './pages/Assessment'
import SessionFeedback from './pages/SessionFeedback'
import TermsAndConditions from './pages/TermsAndConditions'
import { NoiseOverlay } from './components/Decorations'
import './App.css'

function AppContent({ auth, setAuth, logout }) {
  // Not logged in → show landing or auth
  if (!auth) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage onLogin={setAuth} />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Patient view
  if (auth.type === 'user') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/app" element={<PatientApp auth={auth} onLogout={logout} />}>
            <Route index element={<ChatSession auth={auth} />} />
            <Route path="chat" element={<ChatSession auth={auth} />} />
            <Route path="profile" element={<PatientProfile auth={auth} />} />
            <Route path="tools" element={<PatientTools auth={auth} />} />
            <Route path="sessions" element={<PatientSessions auth={auth} />} />
            <Route path="video" element={<VideoSession auth={auth} />} />
            <Route path="video/:roomId" element={<VideoSession auth={auth} />} />
            <Route path="community" element={<CommunityGroups auth={auth} />} />
            <Route path="assessment" element={<Assessment auth={auth} />} />
            <Route path="feedback" element={<SessionFeedback auth={auth} />} />
          </Route>
          <Route path="*" element={<Navigate to="/app" />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Therapist view
  if (auth.type === 'therapist') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/therapist" element={<TherapistApp auth={auth} onLogout={logout} />}>
            <Route index element={<TherapistPatients auth={auth} />} />
            <Route path="patients" element={<TherapistPatients auth={auth} />} />
            <Route path="patient/:userId" element={<TherapistPatientView auth={auth} />} />
            <Route path="video/:roomId" element={<VideoSession auth={auth} />} />
          </Route>
          <Route path="*" element={<Navigate to="/therapist" />} />
        </Routes>
      </BrowserRouter>
    )
  }
}

function App() {
  // Persist auth across page refreshes using sessionStorage
  const [auth, setAuth] = useState(() => {
    try {
      const saved = sessionStorage.getItem('therabyte_auth')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const handleSetAuth = (data) => {
    setAuth(data)
    try { sessionStorage.setItem('therabyte_auth', JSON.stringify(data)) } catch { }
  }

  const logout = () => {
    setAuth(null)
    try { sessionStorage.removeItem('therabyte_auth') } catch { }
  }

  return (
    <>
      <NoiseOverlay />
      <AppContent auth={auth} setAuth={handleSetAuth} logout={logout} />
    </>
  )
}

export default App
