import { Link, NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { logout } from '../api/auth'
import { setSession, useSession } from '../lib/session'

// Barra superior. Los módulos y el usuario solo aparecen con sesión iniciada.
export default function TopBar() {
  const session = useSession()
  const navigate = useNavigate()

  function handleLogout() {
    // logout() toma el token al llamarse; la sesión local se cierra sin esperar
    // la respuesta del servidor.
    logout().catch(() => {})
    navigate('/login', { replace: true })
    setSession(null)
  }

  return (
    <header className="topbar">
      <div className="topbar__start">
        <ThemeToggle />
        <Link to="/eventos" className="topbar__brand">Organizador de eventos</Link>
      </div>
      {session && (
        <div className="topbar__end">
          <nav className="topbar__nav" aria-label="Principal">
            <NavLink to="/hoy" className="topbar__link">Hoy</NavLink>
            <NavLink to="/eventos" className="topbar__link">Mis eventos</NavLink>
          </nav>
          <div className="topbar__user">
            <span className="topbar__username" title={`Usuario: ${session.user.username}`}>{session.user.name}</span>
            <button type="button" className="btn btn--small btn--ghost" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
