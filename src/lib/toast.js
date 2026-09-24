import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

// toast({ type: 'success' | 'error', message })
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
