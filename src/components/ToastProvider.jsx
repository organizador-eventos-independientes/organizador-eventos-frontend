import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from '../lib/toast'

const DURATION_MS = { success: 4000, error: 8000 }
// Lo que dura la animación de salida (.toast--leaving en App.css).
const EXIT_MS = 200

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  // Primero se marca para que salga deslizándose y luego se quita.
  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), EXIT_MS)
  }, [])

  const toast = useCallback(
    ({ type = 'success', message }) => {
      const id = nextId.current++
      const duration = DURATION_MS[type] ?? 5000
      setToasts((list) => [...list, { id, type, message, duration }])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}${t.leaving ? ' toast--leaving' : ''}`}
            role={t.type === 'error' ? 'alert' : 'status'} style={{ '--toast-ms': `${t.duration}ms` }}>
            <span className="toast__icon" aria-hidden="true">{t.type === 'error' ? '!' : '✓'}</span>
            <p className="toast__msg">{t.message}</p>
            <button type="button" className="toast__close" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
