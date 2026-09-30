import { Link, NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { logout } from '../api/auth'
import { setSession, useSession } from '../lib/session'

// Barra superior: cambio de tema a la izquierda; módulos y usuario a la derecha
// (solo con sesión iniciada). "Cerrar sesión" aparece al pasar el cursor sobre
// el usuario, o al enfocarlo con teclado o tocarlo en pantallas táctiles.
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
          <div className="user-menu">
            <button type="button" className="user-menu__trigger" aria-haspopup="true"
              title={`Usuario: ${session.user.username}`}>
              <span className="user-menu__name">{session.user.name}</span>
              <span aria-hidden="true">▾</span>
            </button>
            <div className="user-menu__panel">
              <button type="button" className="user-menu__item" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
