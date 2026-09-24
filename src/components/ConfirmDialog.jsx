import { useEffect, useId, useRef, useState } from 'react'

// Modal de confirmación para acciones destructivas. `onConfirm` debe devolver
// una promesa: si falla, el modal sigue abierto y ofrece reintentar.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Eliminar',
  errorMessage = 'No se pudo eliminar. Inténtalo de nuevo.',
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setError('')
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  async function handleConfirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err?.status === 404 ? err.message : errorMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <h2 id={titleId} className="dialog__title">{title}</h2>
      <div className="dialog__body">{children}</div>
      <p className="dialog__warning">Esta acción no se puede deshacer.</p>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn btn--danger" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : error ? 'Reintentar' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
