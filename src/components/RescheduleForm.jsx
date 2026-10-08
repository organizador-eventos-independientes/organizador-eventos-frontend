import { useRef, useState } from 'react'
import Field from './Field'
import { validateNewDeadline } from '../lib/validation'
import { formatDate, todayYmd } from '../lib/format'

function failureMessage(err) {
  if (err?.status === 400) return 'No se pudo reprogramar.'
  if (err?.status === 404) return 'No se pudo reprogramar. Esta gestión ya no existe; recarga la página.'
  return 'No se pudo reprogramar. Revisa tu conexión e inténtalo de nuevo.'
}

// Reprogramar una gestión (US-06) dentro de su misma fila. Si `onSubmit` falla
// se mantiene la fecha seleccionada para poder reintentar.
export default function RescheduleForm({ idPrefix, subtask, onSubmit, onCancel }) {
  const [deadline, setDeadline] = useState(subtask.deadline.slice(0, 10))
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const inputRef = useRef(null)

  function update(value) {
    setDeadline(value)
    if (submitted) setError(validateNewDeadline(value))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setFormError('')

    const err = validateNewDeadline(deadline)
    setError(err)
    if (err) {
      inputRef.current?.focus()
      return
    }

    setBusy(true)
    try {
      await onSubmit(deadline)
    } catch (apiError) {
      setError(apiError?.fieldErrors?.deadline ?? '')
      setFormError(failureMessage(apiError))
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !busy) onCancel()
  }

  return (
    <form className="reschedule-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}
      <Field id={`${idPrefix}-deadline`} label="Nueva fecha objetivo" required error={error}
        hint={`Fecha actual: ${formatDate(subtask.deadline)}`}>
        {(p) => (
          <input {...p} ref={inputRef} name="deadline" type="date" min={todayYmd()} value={deadline}
            onChange={(e) => update(e.target.value)} autoFocus />
        )}
      </Field>
      <div className="reschedule-form__actions">
        <button type="button" className="btn btn--small btn--ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--small btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : formError ? 'Reintentar' : 'Guardar fecha'}
        </button>
      </div>
    </form>
  )
}
