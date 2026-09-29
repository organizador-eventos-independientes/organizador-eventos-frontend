import { BrowserRouter, Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import ToastProvider from './components/ToastProvider'
import EventListPage from './pages/EventListPage'
import EventCreatePage from './pages/EventCreatePage'
import EventDetailPage from './pages/EventDetailPage'
import TodayPage from './pages/TodayPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <header className="topbar">
          <Link to="/eventos" className="topbar__brand">Organizador de eventos</Link>
          <nav className="topbar__nav" aria-label="Principal">
            <NavLink to="/hoy" className="topbar__link">Hoy</NavLink>
            <NavLink to="/eventos" className="topbar__link">Mis eventos</NavLink>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/eventos" replace />} />
            <Route path="/hoy" element={<TodayPage />} />
            <Route path="/eventos" element={<EventListPage />} />
            <Route path="/eventos/nuevo" element={<EventCreatePage />} />
            <Route path="/evento/:id" element={<EventDetailPage />} />
            <Route path="*" element={<Navigate to="/eventos" replace />} />
          </Routes>
        </main>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
