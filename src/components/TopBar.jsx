import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { logout } from '../api/auth'
import { setSession, useSession } from '../lib/session'

// Barra superior: logo, título y módulos a la izquierda; cambio de tema y
// usuario a la derecha (módulos y usuario solo con sesión iniciada).
// "Configuración" y "Cerrar sesión" aparecen al pasar el cursor sobre el
// usuario, o al enfocarlo con teclado o tocarlo en pantallas táctiles.
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
        <Link to="/eventos" className="topbar__brand">
          <Logo variant="barra" />
          <span className="brand-name">Slap Slap</span>
          <span className="brand-name">/ organizador de eventos</span>
        </Link>
        {session && (
          <nav className="topbar__nav" aria-label="Principal">
            <NavLink to="/hoy" className="topbar__link">Hoy</NavLink>
            <NavLink to="/eventos" className="topbar__link">Mis eventos</NavLink>
          </nav>
        )}
      </div>
      <div className="topbar__end">
        <ThemeToggle />
        {session && (
          <div className="user-menu">
            <button type="button" className="user-menu__trigger" aria-haspopup="true"
              title={`Usuario: ${session.user.username}`}>
              <span className="user-menu__name">{session.user.name}</span>
              <span className="user-menu__caret" aria-hidden="true">▾</span>
            </button>
            <div className="user-menu__panel">
              <div className="user-menu__box">
                {/* Al navegar se suelta el foco para que el menú se cierre. */}
                <Link to="/configuracion" className="user-menu__item" onClick={(e) => e.currentTarget.blur()}>
                  Configuración
                </Link>
                <button type="button" className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
