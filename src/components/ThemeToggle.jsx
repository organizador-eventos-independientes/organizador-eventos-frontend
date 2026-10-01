import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

// Misma clave que lee el script de index.html, que aplica el tema antes del
// primer pintado para que no haya parpadeo al cargar.
const STORAGE_KEY = 'organizador-eventos.theme'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

function getSavedTheme() {
  try {
    const theme = localStorage.getItem(STORAGE_KEY)
    return theme === 'light' || theme === 'dark' ? theme : null
  } catch {
    return null
  }
}

// Alterna entre tema claro y oscuro y recuerda la elección. Mientras el usuario
// no elija uno, se sigue el tema del sistema operativo.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    function followSystem(e) {
      if (!getSavedTheme()) setTheme(e.matches ? 'dark' : 'light')
    }
    darkQuery.addEventListener('change', followSystem)
    return () => darkQuery.removeEventListener('change', followSystem)
  }, [])

  function toggleTheme(e) {
    const next = theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento (p. ej. navegación privada): el tema dura hasta recargar.
    }

    const apply = () => {
      document.documentElement.dataset.theme = next
      flushSync(() => setTheme(next))
    }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply()
      return
    }

    // El tema nuevo se revela en un círculo que crece desde el botón hasta
    // cubrir la pantalla.
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(apply)
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  }

  const label = theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
      <span key={theme} className="theme-toggle__icon">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  )
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
