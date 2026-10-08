import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ToastProvider from './components/ToastProvider'
import TopBar from './components/TopBar'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import EventListPage from './pages/EventListPage'
import EventCreatePage from './pages/EventCreatePage'
import EventDetailPage from './pages/EventDetailPage'
import TodayPage from './pages/TodayPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <TopBar />
        <main className="main">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegisterPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Navigate to="/eventos" replace />} />
              <Route path="/hoy" element={<TodayPage />} />
              <Route path="/eventos" element={<EventListPage />} />
              <Route path="/eventos/nuevo" element={<EventCreatePage />} />
              <Route path="/crear" element={<Navigate to="/eventos/nuevo" replace />} />
              <Route path="/evento/:id" element={<EventDetailPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/eventos" replace />} />
            </Route>
          </Routes>
        </main>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
