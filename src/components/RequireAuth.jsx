import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../lib/session'

// Envuelve las rutas privadas (US-11). Sin sesión redirige a /login sin montar
// ninguna página con datos, y recuerda la ruta pedida para volver tras entrar.
export default function RequireAuth() {
  const session = useSession()
  const location = useLocation()

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
