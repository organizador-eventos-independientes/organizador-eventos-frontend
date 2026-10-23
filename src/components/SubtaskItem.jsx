import { useState } from 'react'
import PostponeForm from './PostponeForm'
import RescheduleForm from './RescheduleForm'
import { daysBetween, relativeDeadline, statusFailureMessage } from '../lib/today'
import { formatDate, formatHours, todayYmd } from '../lib/format'

// Clase de la etiqueta de cada estado.
const STATUS_CLASS = { Pendiente: 'pending', Hecha: 'done', Pospuesta: 'postponed' }

// Una gestión tal como se ve en Hoy y en el detalle del evento: las etiquetas
// (el evento, si `showEvent`, y debajo su estado) arriba a la derecha; el
// nombre, la fecha, las horas y la nota a la izquierda; y debajo los botones o
// el formulario abierto (`openForm`: 'reschedule' o 'postpone') en la misma fila.
//
// El estado se cambia con dos botones (US-09): "Hecha" y "Posponer". Cada uno
// lleva la gestión a su estado y, si ya está en él, pasa a decir "Pendiente"
// para devolverla. "Hecha" y "Pendiente" guardan al instante; "Posponer" abre
// antes la nota opcional.
//
// `itemKey` identifica la fila en la página: arma los ids de los campos y de
// los botones "Reprogramar" (`reprogramar-…`) y "Posponer" (`posponer-…`), que
// reciben el foco al cerrar su formulario. `onCloseForm(mode)` dice cuál se
// cerró. `actionsBefore` y `actionsAfter` son los botones propios de cada
// vista, antes y después de los de la gestión.
export default function SubtaskItem({
  itemKey,
  subtask: s,
  showEvent = false,
  openForm = null,
  moved = false,
  onOpenForm,
  onCloseForm,
  onReschedule,
  onSaveStatus,
  onMovedEnd,
  actionsBefore,
  actionsAfter,
}) {
  // Estado al que se está pasando con "Hecha" o "Pendiente" mientras se guarda.
  // Los botones no se deshabilitan: así no pierden el foco al cambiar de texto.
  const [saving, setSaving] = useState(null)
  const [statusError, setStatusError] = useState('')

  const status = s.status ?? 'Pendiente'
  const deadline = s.deadline.slice(0, 10)
  const daysLeft = daysBetween(todayYmd(), deadline)
  // Una hecha ya no vence: solo se muestra su fecha.
  const when = status === 'Hecha' ? null : daysLeft < 0 ? 'overdue' : daysLeft === 0 ? 'today' : 'upcoming'

  async function saveStatus(next) {
    if (saving) return
    setSaving(next)
    setStatusError('')
    try {
      await onSaveStatus({ status: next, statusNote: '' })
    } catch (err) {
      setStatusError(statusFailureMessage(err))
    } finally {
      setSaving(null)
    }
  }

  function openFormFor(mode) {
    if (saving) return
    setStatusError('')
    onOpenForm(mode)
  }

  const busy = saving ? true : undefined
  // Texto del botón que lleva a `next`: dice 'Guardando…' mientras se guarda.
  const label = (next) => (saving === next ? 'Guardando…' : next)

  return (
    <li
      className={`subtasks__item today-item${openForm ? ' today-item--editing' : ''}${moved ? ' today-item--moved' : ''}`}
      onAnimationEnd={(e) => e.animationName === 'moved-flash' && onMovedEnd?.()}>
      <div className="today-item__tags">
        {showEvent && (
          <span className={`badge badge--${s.eventType} today-item__type`} title={s.eventName}>
            <span className="cap-text">{s.eventName}</span>
          </span>
        )}
        <span className={`today-item__status today-item__status--${STATUS_CLASS[status] ?? 'pending'}`}>
          {status}
        </span>
      </div>
      <p className="subtasks__name today-item__name">{s.name}</p>
      <p className="muted subtasks__meta today-item__meta">
        {when && <span className={`today-group__when today-item__when--${when}`}>{relativeDeadline(daysLeft)}</span>}
        <span>{formatDate(deadline)}</span>
        <span>{formatHours(s.estimatedHours)}</span>
      </p>
      {status === 'Pospuesta' && s.statusNote && <p className="today-item__status-note">{s.statusNote}</p>}

      {openForm === 'reschedule' ? (
        <RescheduleForm idPrefix={itemKey} subtask={s} onSubmit={onReschedule}
          onCancel={() => onCloseForm('reschedule')} />
      ) : openForm === 'postpone' ? (
        <PostponeForm idPrefix={itemKey} onSubmit={onSaveStatus} onCancel={() => onCloseForm('postpone')} />
      ) : (
        <div className="today-item__actions">
          {statusError && (
            <p className="alert alert--error today-item__error" role="alert">
              {statusError}
            </p>
          )}
          {actionsBefore}
          <button type="button" id={`reprogramar-${itemKey}`} className="btn btn--small btn--ghost"
            onClick={() => openFormFor('reschedule')} aria-label={`Reprogramar gestión ${s.name}`}>
            Reprogramar
          </button>
          {status === 'Hecha' ? (
            <button type="button" className="btn btn--small btn--ghost" aria-disabled={busy}
              onClick={() => saveStatus('Pendiente')} aria-label={`Volver a pendiente la gestión ${s.name}`}>
              {label('Pendiente')}
            </button>
          ) : (
            <button type="button" className="btn btn--small btn--ghost" aria-disabled={busy}
              onClick={() => saveStatus('Hecha')} aria-label={`Marcar como hecha la gestión ${s.name}`}>
              {label('Hecha')}
            </button>
          )}
          {status === 'Pospuesta' ? (
            <button type="button" id={`posponer-${itemKey}`} className="btn btn--small btn--ghost" aria-disabled={busy}
              onClick={() => saveStatus('Pendiente')} aria-label={`Volver a pendiente la gestión ${s.name}`}>
              {label('Pendiente')}
            </button>
          ) : (
            <button type="button" id={`posponer-${itemKey}`} className="btn btn--small btn--ghost" aria-disabled={busy}
              onClick={() => openFormFor('postpone')} aria-label={`Posponer gestión ${s.name}`}>
              Posponer
            </button>
          )}
          {actionsAfter}
        </div>
      )}
    </li>
  )
}
