// Luz bajo el cursor (App.css): al mover el puntero sobre un botón, un chip,
// un botón de filtro o una opción del conflicto, guarda su posición dentro de
// él en --glow-x / --glow-y. Un solo listener para toda la app; en pantallas
// sin cursor (táctiles) no hace nada.
const SELECTOR = '.btn, .chip, .filters__toggle, .conflict__option'

export function startPointerGlow() {
  if (!window.matchMedia('(hover: hover)').matches) return
  document.addEventListener(
    'pointermove',
    (e) => {
      const el = e.target instanceof Element ? e.target.closest(SELECTOR) : null
      if (!el) return
      const { left, top } = el.getBoundingClientRect()
      el.style.setProperty('--glow-x', `${e.clientX - left}px`)
      el.style.setProperty('--glow-y', `${e.clientY - top}px`)
    },
    { passive: true },
  )
}
