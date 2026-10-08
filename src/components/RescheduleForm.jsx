import { useEffect, useRef, useState } from 'react'
import Field from './Field'
import { validateNewDeadline } from '../lib/validation'
import { formatDate, formatDay, formatHours, todayYmd } from '../lib/format'

function failureMessage(err) {
  if (err?.status === 400) return 'No se pudo reprogramar.'
  if (err?.status === 404) return 'No se pudo reprogramar. Esta gestión ya no existe; recarga la página.'
  // status 0: no hubo respuesta (sin conexión); otro: falló el servidor.
  if (err?.status) return 'No se pudo reprogramar porque el servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return 'No se pudo reprogramar. Revisa tu conexión e inténtalo de nuevo.'
}

// Reprogramar una gestión (US-06) dentro de su misma fila. Si ese día pasa del
// límite diario, no se guarda: se muestra el conflicto con opciones para
// resolverlo (US-07). Si algo falla se mantiene la fecha seleccionada.
export default function RescheduleForm({ idPrefix, subtask, onSubmit, onCancel }) {
  const [deadline, setDeadline] = useState(subtask.deadline.slice(0, 10))
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [conflict, setConflict] = useState(null)
  const inputRef = useRef(null)
  const conflictRef = useRef(null)

  // El aviso recibe el foco para que se lea y sus opciones queden a mano.
  useEffect(() => {
    if (conflict) conflictRef.current?.focus()
  }, [conflict])

  function update(value) {
    setDeadline(value)
    setConflict(null) // el conflicto era de la fecha anterior
    if (submitted) setError(validateNewDeadline(value))
  }

  // `changes`: { deadline, estimatedHours? }
  async function save(changes) {
    setBusy(true)
    setFormError('')
    setConflict(null)
    try {
      await onSubmit(changes)
    } catch (apiError) {
      setBusy(false)
      if (apiError?.conflict) {
        setConflict(apiError.conflict)
        return
      }
      setError(apiError?.fieldErrors?.deadline ?? '')
      setFormError(failureMessage(apiError))
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)

    const err = validateNewDeadline(deadline)
    setError(err)
    if (err) {
      inputRef.current?.focus()
      return
    }
    save({ deadline })
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !busy) onCancel()
  }

  // Opciones del conflicto (US-07, escenario 3).
  function moveToAnotherDay() {
    inputRef.current?.focus()
    try {
      inputRef.current?.showPicker()
    } catch {
      // Sin soporte para abrir el calendario: basta con el foco en el campo.
    }
  }

  const reduceHours = () => save({ deadline: conflict.date, estimatedHours: conflict.availableHours })

  function postpone() {
    setDeadline(conflict.nextFreeDate)
    save({ deadline: conflict.nextFreeDate })
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

      {conflict && (
        <div ref={conflictRef} className="conflict" role="alert" tabIndex={-1}>
          <p className="conflict__title">{conflict.message}</p>
          {conflict.planned > 0 ? (
            <>
              <p>El {formatDay(conflict.date)} ya tienes {formatHours(conflict.planned)} de gestión planificadas:</p>
              <ul className="conflict__list">
                {conflict.subtasks.map((s) => (
                  <li key={s.id}>
                    {s.name} <span className="muted">· {s.eventName} · {formatHours(s.estimatedHours)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              El {formatDay(conflict.date)} no tienes otras gestiones (0 h), pero esta sola suma{' '}
              {formatHours(conflict.hours)}.
            </p>
          )}
          <p className="conflict__question">¿Cómo quieres resolverlo?</p>
          <div className="conflict__options">
            <button type="button" className="conflict__option" onClick={moveToAnotherDay} disabled={busy}>
              <strong>Mover a otro día</strong>
              <span>Elige otra fecha en el calendario.</span>
            </button>
            <button type="button" className="conflict__option" onClick={reduceHours}
              disabled={busy || conflict.availableHours <= 0}>
              <strong>Reducir horas estimadas</strong>
              <span>
                {conflict.availableHours > 0
                  ? `Dejarla en ${formatHours(conflict.availableHours)} ese día.`
                  : 'Ese día ya no te queda tiempo libre.'}
              </span>
            </button>
            <button type="button" className="conflict__option" onClick={postpone}
              disabled={busy || !conflict.nextFreeDate}>
              <strong>Posponer</strong>
              <span>
                {conflict.nextFreeDate
                  ? `Pasarla al ${formatDay(conflict.nextFreeDate)}, el primer día con espacio.`
                  : `Esta gestión sola pasa de tu límite de ${formatHours(conflict.limit)}; reduce sus horas.`}
              </span>
            </button>
          </div>
        </div>
      )}

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
