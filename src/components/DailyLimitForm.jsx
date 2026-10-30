import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Field from './Field'
import { DAILY_LIMIT_MAX, DAILY_LIMIT_MIN, validateDailyLimit } from '../lib/validation'
import { formatDay, formatHours } from '../lib/format'

// Límite diario de horas de gestión (US-12). Si no es válido o falla al
// guardar, no se guarda: se conserva el valor escrito y se muestra el error.
// Si queda por debajo de lo planificado algún día, se muestran las opciones
// para resolverlo: usar el límite más bajo que cabe, o mover o reducir las
// gestiones de esos días desde su evento (`onNavigate` se llama al ir a él).

// Título corto del conflicto, armado con los días que devuelve el backend:
// "Con 2 h no te alcanza: el lunes, 13 de octubre ya tienes 6 h."
function conflictTitle({ limit, days }) {
  const where =
    days.length === 1
      ? `el ${formatDay(days[0].date)} ya tienes ${formatHours(days[0].planned)}`
      : `${days.length} días ya tienen más`
  return `Con ${formatHours(limit)} no te alcanza: ${where}.`
}

export default function DailyLimitForm({ idPrefix, limit, onSave, onNavigate }) {
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

      {/* Lo principal a la vista: qué pasa y un botón para usar el mínimo que
          cabe. Las gestiones que habría que mover van plegadas debajo (abiertas
          solo si ningún límite cabe, porque entonces es la única salida). */}
      {conflict && (
        <div ref={conflictRef} className="conflict limit-conflict" role="alert" tabIndex={-1}>
          <p className="conflict__title">{conflictTitle(conflict)}</p>
          {conflict.minLimit != null ? (
            <div>
              <button type="button" className="btn btn--small btn--primary" onClick={applyMinimum} disabled={busy}>
                {busy ? 'Guardando…' : `Usar el mínimo: ${formatHours(conflict.minLimit)}`}
              </button>
            </div>
          ) : (
            <p>Ningún límite alcanza (el máximo es {formatHours(DAILY_LIMIT_MAX)}): mueve o reduce gestiones.</p>
          )}
          <details className="limit-conflict__more" open={conflict.minLimit == null}>
            <summary>
              {conflict.minLimit != null ? 'O mueve gestiones de ' : 'Gestiones de '}
              {conflict.days.length === 1 ? 'ese día' : 'esos días'}
            </summary>
            <ul className="limit-conflict__days">
              {conflict.days.map((day) => (
                <li key={day.date}>
                  <p>
                    <strong>{formatDay(day.date)}</strong>{' '}
                    <span className="muted">· sobran {formatHours(day.excess)}</span>
                  </p>
                  <ul className="limit-conflict__list">
                    {day.subtasks.map((s) => (
                      <li key={s.id}>
                        <Link to={`/evento/${s.eventId}`} onClick={onNavigate}
                          aria-label={`Ver evento ${s.eventName} para editar la gestión ${s.name}`}>
                          {s.name}
                        </Link>{' '}
                        <span className="muted">· {s.eventName} · {formatHours(s.estimatedHours)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Con el aviso abierto, guardar el mismo valor daría el mismo aviso: el
          botón vuelve al cambiar el valor. */}
      {!conflict && (
        <div>
          <button type="submit" className="btn btn--small btn--primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar límite'}
          </button>
        </div>
      )}
    </form>
  )
}
