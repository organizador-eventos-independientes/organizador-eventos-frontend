import { useCallback, useEffect, useId, useRef, useState } from 'react'
import DailyLimitForm from './DailyLimitForm'
import { getDailyLimit, updateDailyLimit } from '../api/events'
import { formatHours } from '../lib/format'
import { useToast } from '../lib/toast'

// Configuración (US-12): el engranaje de la barra, junto al cambio de tema,
// abre una ventana con el límite diario de horas de gestión del organizador.
// Es el único lugar de la app donde se cambia. Si nunca lo guardó se muestran
// las 6 h por defecto. Cada vez que se abre se vuelve a cargar.
// La ventana se cierra con la X, con Escape, al pulsar fuera de ella, al
// guardar el límite o al ir a un evento desde el aviso de conflicto.
export default function SettingsButton() {
  const { toast } = useToast()
  const titleId = useId()
  const ref = useRef(null)
  // Si el clic empezó fuera de la ventana (en el fondo oscuro).
  const pressedOutside = useRef(false)
  const [open, setOpen] = useState(false)
  const [limit, setLimit] = useState(null) // { hours, isDefault }
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setLimit(null)
    try {
      setLimit(await getDailyLimit())
    } catch (err) {
      // status 0: no hubo respuesta (sin conexión); otro: falló el servidor.
      setError(
        err?.status
          ? 'No pudimos cargar tu configuración porque el servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
          : 'No pudimos cargar tu configuración. Revisa tu conexión e inténtalo de nuevo.',
      )
    }
  }, [])

  // Entra y sale con la misma animación que ConfirmDialog (.dialog--closing).
  useEffect(() => {
    const dialog = ref.current
    if (open) {
      dialog.classList.remove('dialog--closing')
      if (!dialog.open) dialog.showModal()
      return
    }
    if (!dialog.open) return
    dialog.classList.add('dialog--closing')
    function onEnd(e) {
      if (e.target !== dialog) return
      dialog.classList.remove('dialog--closing')
      dialog.close()
    }
    dialog.addEventListener('animationend', onEnd)
    return () => dialog.removeEventListener('animationend', onEnd)
  }, [open])

  function openDialog() {
    setOpen(true)
    load()
  }

  const close = () => setOpen(false)

  async function save(hours) {
    setLimit(await updateDailyLimit(hours))
    toast({ message: 'Límite actualizado.' })
    close()
  }

  // El fondo es parte del <dialog>: se distingue por quedar fuera de su caja.
  function isOutside(e) {
    if (e.target !== e.currentTarget) return false
    const box = e.currentTarget.getBoundingClientRect()
    return e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom
  }

  return (
    <>
      <button type="button" className="icon-btn settings-toggle" onClick={openDialog} aria-haspopup="dialog"
        aria-label="Configuración" title="Configuración">
        <GearIcon />
      </button>
      <dialog
        ref={ref}
        className="dialog dialog--settings"
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault()
          close()
        }}
        // Si el navegador la cierra por su cuenta, el estado se pone al día.
        onClose={close}
        onPointerDown={(e) => {
          pressedOutside.current = isOutside(e)
        }}
        onClick={(e) => pressedOutside.current && isOutside(e) && close()}
      >
        <div className="settings__head">
          <h2 id={titleId} className="dialog__title">Configuración</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar" title="Cerrar">
            <CloseIcon />
          </button>
        </div>

        <section className="settings__section" aria-labelledby={`${titleId}-limit`}>
          <h3 id={`${titleId}-limit`} className="settings__subtitle">Límite diario de horas de gestión</h3>
          <p className="muted">Lo máximo que quieres dedicar a organizar en un día, sumando todos tus eventos.</p>
          {error ? (
            <div className="alert alert--error alert--block" role="alert">
              <p>{error}</p>
              <button type="button" className="btn btn--ghost" onClick={load}>Reintentar</button>
            </div>
          ) : limit === null ? (
            <p className="loading" role="status">Cargando…</p>
          ) : (
            <>
              <p className="limit-current" aria-live="polite">
                Tu límite actual: <strong>{formatHours(limit.hours)}</strong>
                {limit.isDefault && <span className="muted"> (valor por defecto)</span>}
              </p>
              <DailyLimitForm idPrefix="settings" limit={limit.hours} onSave={save} onNavigate={close} />
            </>
          )}
        </section>
      </dialog>
    </>
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

function GearIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
