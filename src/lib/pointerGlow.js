// Luz bajo el cursor (App.css): al mover el puntero sobre un botón, un chip,
// un botón de filtro o una opción del conflicto, guarda su posición dentro de
// él en --glow-x / --glow-y. En pantallas táctiles no hay cursor: la posición
// se toma al tocar y la luz se enciende ahí mientras dura el toque. Un solo
// par de listeners para toda la app.
const SELECTOR = '.btn, .chip, .filters__toggle, .conflict__option'

function placeGlow(e) {
  const el = e.target instanceof Element ? e.target.closest(SELECTOR) : null
  if (!el) return
  const { left, top } = el.getBoundingClientRect()
  el.style.setProperty('--glow-x', `${e.clientX - left}px`)
  el.style.setProperty('--glow-y', `${e.clientY - top}px`)
}

export function startPointerGlow() {
  document.addEventListener('pointermove', placeGlow, { passive: true })
  document.addEventListener('pointerdown', placeGlow, { passive: true })
  // Safari de iOS solo aplica :active (la respuesta al toque) si la página
  // escucha toques.
  document.addEventListener('touchstart', () => {}, { passive: true })
}
