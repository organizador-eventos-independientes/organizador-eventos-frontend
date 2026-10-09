import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import { logout } from '../api/auth'
import { setSession, useSession } from '../lib/session'

// Barra superior: logo, título y módulos a la izquierda; cambio de tema y
// usuario a la derecha (módulos y usuario solo con sesión iniciada). En
// pantallas angostas los módulos bajan a una fila de pestañas (App.css).
// "Configuración" y "Cerrar sesión" aparecen al pasar el cursor sobre el
// usuario o al pulsarlo (con el dedo, el ratón o el teclado).
// La barra queda fija arriba al desplazar la página (App.css).
export default function TopBar() {
  const session = useSession()
  const navigate = useNavigate()
  const barRef = useRef(null)
  const menuRef = useRef(null)
  // El pulpo saluda al pasar el cursor por la marca, tocarla o enfocarla, y
  // termina el saludo completo aunque el cursor se vaya antes.
  const [waving, setWaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Su alto (cambia si baja a una segunda línea) se publica en --topbar-h para
  // que al desplazar la página hasta un elemento este no quede debajo de ella.
  useEffect(() => {
    const bar = barRef.current
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--topbar-h', `${bar.offsetHeight}px`)
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  // El menú se cierra al elegir una opción, al tocar fuera de él o con Escape.
  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      setMenuOpen(false)
      menuRef.current?.querySelector('.user-menu__trigger')?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function handleLogout() {
    // logout() toma el token al llamarse; la sesión local se cierra sin esperar
    // la respuesta del servidor.
    logout().catch(() => {})
    setMenuOpen(false)
    navigate('/login', { replace: true })
    setSession(null)
  }

  const initial = (session?.user.name || session?.user.username || '?').trim().charAt(0).toUpperCase()

  return (
    <header ref={barRef} className={`topbar${session ? ' topbar--nav' : ''}`}>
      <Link to="/eventos" className="topbar__brand"
        onPointerEnter={() => setWaving(true)} onFocus={() => setWaving(true)}
        onAnimationEnd={(e) => e.animationName === 'logo-wave' && setWaving(false)}>
        <Logo variant="barra" waving={waving} />
        <span className="brand-name">
          <span>Slap Slap</span>
          <span className="brand-name__sep" aria-hidden="true"> / </span>
          <span className="brand-name__sub">organizador de eventos</span>
        </span>
      </Link>
      {session && (
        <nav className="topbar__nav" aria-label="Principal">
          <NavLink to="/hoy" className="topbar__link">Hoy</NavLink>
          <NavLink to="/eventos" className="topbar__link">Mis eventos</NavLink>
        </nav>
      )}
      <div className="topbar__end">
        <ThemeToggle />
        {session && (
          // Al salir el foco del menú (con Tab) este se cierra.
          <div ref={menuRef} className={`user-menu${menuOpen ? ' user-menu--open' : ''}`}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenuOpen(false)}>
            <button type="button" className="user-menu__trigger" aria-haspopup="true" aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)} title={`Usuario: ${session.user.username}`}>
              {/* En pantallas angostas se ve la inicial en un círculo en vez del nombre. */}
              <span className="user-menu__avatar" aria-hidden="true">{initial}</span>
              <span className="user-menu__name">{session.user.name}</span>
              <span className="user-menu__caret" aria-hidden="true">▾</span>
            </button>
            <div className="user-menu__panel">
              <div className="user-menu__box">
                <p className="user-menu__who">
                  <strong>{session.user.name}</strong>
                  <span className="muted">@{session.user.username}</span>
                </p>
                <Link to="/configuracion" className="user-menu__item" onClick={() => setMenuOpen(false)}>
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
