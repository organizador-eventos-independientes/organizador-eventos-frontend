import { useEffect, useRef } from 'react'
import { formatDay, formatHours } from '../lib/format'

// Conflicto por sobrecarga diaria (US-07 y US-08): lo que ya hay ese día y tres
// opciones para resolverlo. Lo usan reprogramar (Hoy) y crear o editar una
// gestión (detalle del evento), con los datos que devuelve el backend.
export default function OverloadConflict({ conflict, busy, onMove, onReduce, onPostpone }) {
  const ref = useRef(null)

  // El aviso recibe el foco para que se lea y sus opciones queden a mano.
  useEffect(() => {
    ref.current?.focus()
  }, [conflict])

  return (
    <div ref={ref} className="conflict" role="alert" tabIndex={-1}>
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
        <button type="button" className="conflict__option" onClick={onMove} disabled={busy}>
          <strong>Mover a otro día</strong>
          <span>Elige otra fecha en el calendario.</span>
        </button>
        <button type="button" className="conflict__option" onClick={onReduce}
          disabled={busy || conflict.availableHours <= 0}>
          <strong>Reducir horas estimadas</strong>
          <span>
            {conflict.availableHours > 0
              ? `Dejarla en ${formatHours(conflict.availableHours)} ese día.`
              : 'Ese día ya no te queda tiempo libre.'}
          </span>
        </button>
        <button type="button" className="conflict__option" onClick={onPostpone}
          disabled={busy || !conflict.nextFreeDate}>
          <strong>Posponer</strong>
          <span>
            {conflict.nextFreeDate
              ? `Pasarla al ${formatDay(conflict.nextFreeDate)}, el primer día con espacio.`
              : conflict.hours > conflict.limit
                ? `Esta gestión sola pasa de tu límite de ${formatHours(conflict.limit)}; reduce sus horas.`
                : 'No queda ningún día con espacio hasta la fecha del evento.'}
          </span>
        </button>
      </div>
    </div>
  )
}
