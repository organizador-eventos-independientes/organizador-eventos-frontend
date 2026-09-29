import { useSyncExternalStore } from 'react'

// Sesión del organizador (US-11): { token, user: { id, username, name } } o null.
// Se guarda en localStorage para que siga abierta al recargar la página.
const STORAGE_KEY = 'organizador-eventos.session'
const listeners = new Set()

function readStoredSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return stored?.token && stored.user ? stored : null
  } catch {
    return null
  }
}

let session = readStoredSession()

function notify() {
  listeners.forEach((listener) => listener())
}

export const getSession = () => session

export function setSession(next) {
  session = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sin almacenamiento (p. ej. navegación privada): la sesión dura hasta recargar.
  }
  notify()
}

// Cierra la sesión si el servidor rechazó el token y este sigue siendo el actual.
export function expireSession(token) {
  if (session?.token === token) setSession(null)
}

// Iniciar o cerrar sesión en otra pestaña se refleja en esta.
window.addEventListener('storage', (e) => {
  if (e.key !== null && e.key !== STORAGE_KEY) return
  session = readStoredSession()
  notify()
})

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Sesión actual; el componente se vuelve a renderizar al iniciar o cerrar sesión.
export const useSession = () => useSyncExternalStore(subscribe, getSession)
