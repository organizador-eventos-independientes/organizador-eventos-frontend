import { useState } from 'react'
import Field from './Field'
import { statusFailureMessage } from '../lib/today'

// Posponer una gestión (US-09, escenario 2) dentro de su misma fila, como al
// reprogramar: solo pide la nota opcional que explica por qué. Si algo falla
// se mantiene lo escrito.
export default function PostponeForm({ idPrefix, onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [noteError, setNoteError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    setNoteError('')
    try {
      await onSubmit({ status: 'Pospuesta', statusNote: note.trim() })
    } catch (apiError) {
      setBusy(false)
      setNoteError(apiError?.fieldErrors?.statusNote ?? '')
      setFormError(statusFailureMessage(apiError))
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !busy) onCancel()
  }

  return (
    <form className="postpone-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}
      <Field id={`${idPrefix}-note`} label="Nota (opcional)" error={noteError}
        hint="Por qué la pospones, p. ej. “Esperando confirmación del salón”.">
        {(p) => (
          <input {...p} type="text" placeholder="Escribe una nota…" value={note}
            onChange={(e) => setNote(e.target.value)} autoFocus />
        )}
      </Field>

      <div className="reschedule-form__actions">
        <button type="button" className="btn btn--small btn--ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--small btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : formError ? 'Reintentar' : 'Posponer'}
        </button>
      </div>
    </form>
  )
}
