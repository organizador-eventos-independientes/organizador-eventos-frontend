import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from './Field'
import { DAILY_LIMIT_MAX, DAILY_LIMIT_MIN, validateDailyLimit } from '../lib/validation'
import { formatDay, formatHours } from '../lib/format'

// Límite diario de horas de gestión (US-12). Si no es válido o falla al
// guardar, no se guarda: se conserva el valor escrito y se muestra el error.
// Si queda por debajo de lo planificado algún día, se muestran las opciones
// para resolverlo: usar el límite más bajo que cabe, o mover o reducir las
// gestiones de esos días (con `onReschedule`, en la misma página; si no, desde
// su evento).
export default function DailyLimitForm({ idPrefix, limit, onSave, onReschedule, description }) {
  const [value, setValue] = useState(limit != null ? String(limit) : '')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [conflict, setConflict] = useState(null)
  const conflictRef = useRef(null)

  // El aviso recibe el foco para que se lea y sus opciones queden a mano.
  useEffect(() => {
    if (conflict) conflictRef.current?.focus()
  }, [conflict])

  function update(next) {
    setValue(next)
    setConflict(null) // el conflicto era del valor anterior
    if (submitted) setError(validateDailyLimit(next))
  }

  async function save(hours) {
    setBusy(true)
    setFormError('')
    setConflict(null)
    try {
      await onSave(hours)
      setSubmitted(false)
    } catch (apiError) {
      if (apiError?.limitConflict) {
        setError('')
        setConflict(apiError.limitConflict)
        return
      }
      setError(apiError?.fieldErrors?.dailyLimit ?? '')
      setFormError(
        apiError?.status === 400
          ? 'No se pudo guardar el límite.'
          : apiError?.status
            ? 'No se pudo guardar el límite porque el servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
            : 'No se pudo guardar el límite. Revisa tu conexión e inténtalo de nuevo.',
      )
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)

    const err = validateDailyLimit(value)
    setError(err)
    if (err) return

    save(Number(value))
  }

  function applyMinimum() {
    setValue(String(conflict.minLimit))
    save(conflict.minLimit)
  }

  return (
    <form className="limit-form" onSubmit={handleSubmit} noValidate>
      {description && <p className="muted">{description}</p>}
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}
      <Field id={`${idPrefix}-daily-limit`} label="Horas de gestión por día" required error={error}
        hint={`Entre ${DAILY_LIMIT_MIN} y ${DAILY_LIMIT_MAX} horas.`}>
        {(p) => (
          <input {...p} name="dailyLimit" type="number" inputMode="decimal" min={DAILY_LIMIT_MIN}
            max={DAILY_LIMIT_MAX} step="0.5" placeholder="Ej. 6" value={value}
            onChange={(e) => update(e.target.value)} />
        )}
      </Field>

      {conflict && (
        <div ref={conflictRef} className="conflict" role="alert" tabIndex={-1}>
          <p className="conflict__title">{conflict.message}</p>
          <p className="conflict__question">¿Cómo quieres resolverlo?</p>
          <div className="conflict__options">
            <button type="button" className="conflict__option" onClick={applyMinimum}
              disabled={busy || conflict.minLimit == null}>
              <strong>Usar el mínimo posible</strong>
              <span>
                {conflict.minLimit != null
                  ? `Dejar el límite en ${formatHours(conflict.minLimit)}, lo justo para lo que ya tienes planificado.`
                  : `Algún día pasa de ${formatHours(DAILY_LIMIT_MAX)}: mueve o reduce sus gestiones.`}
              </span>
            </button>
          </div>
          <p className="conflict__question">O mueve o reduce las gestiones de estos días y vuelve a guardar el límite:</p>
          <ul className="conflict__days">
            {conflict.days.map((day) => (
              <li key={day.date}>
                <p>
                  <strong>{formatDay(day.date)}</strong>: {formatHours(day.planned)} planificadas,{' '}
                  {formatHours(day.excess)} de más.
                </p>
                <ul className="conflict__list">
                  {day.subtasks.map((s) => (
                    <li key={s.id} className="conflict__subtask">
                      <span>
                        {s.name} <span className="muted">· {s.eventName} · {formatHours(s.estimatedHours)}</span>
                      </span>
                      {onReschedule ? (
                        <button type="button" className="btn btn--small btn--ghost" onClick={() => onReschedule(s.id)}
                          aria-label={`Reprogramar gestión ${s.name}`}>
                          Reprogramar
                        </button>
                      ) : (
                        <Link to={`/evento/${s.eventId}`} className="btn btn--small btn--ghost"
                          aria-label={`Ver evento ${s.eventName} para editar la gestión ${s.name}`}>
                          Ver evento
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <button type="submit" className="btn btn--small btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar límite'}
        </button>
      </div>
    </form>
  )
}
