import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import ToastProvider from './components/ToastProvider'
import EventListPage from './pages/EventListPage'
import EventCreatePage from './pages/EventCreatePage'
import EventDetailPage from './pages/EventDetailPage'
import { USE_MOCK } from './api/client'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <header className="topbar">
          <Link to="/eventos" className="topbar__brand">Organizador de eventos</Link>
          {USE_MOCK && (
            <span className="topbar__mode" title="Define VITE_API_URL para conectar con el backend">
              Usuario (Prueba)
            </span>
          )}
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/eventos" replace />} />
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
