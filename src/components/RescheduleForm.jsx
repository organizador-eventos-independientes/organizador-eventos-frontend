import { useRef, useState } from 'react'
import DurationInput from './DurationInput'
import Field from './Field'
import OverloadConflict from './OverloadConflict'
import { validateDuration, validateNewDeadline } from '../lib/validation'
import { formatDate, formatHours, parseDuration, toDurationText, toHours, todayYmd } from '../lib/format'

const FIELD_ORDER = ['deadline', 'estimatedHours']

function validate(values, eventDate) {
  const errors = {}
  const deadlineError = validateNewDeadline(values.deadline, eventDate)
  if (deadlineError) errors.deadline = deadlineError
  const hoursError = validateDuration(values.estimatedHours)
  if (hoursError) errors.estimatedHours = hoursError
  return errors
}

function failureMessage(err) {
  if (err?.status === 400) return 'No se pudo reprogramar.'
  if (err?.status === 404) return 'No se pudo reprogramar. Esta gestión ya no existe; recarga la página.'
  // status 0: no hubo respuesta (sin conexión); otro: falló el servidor.
  if (err?.status) return 'No se pudo reprogramar porque el servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return 'No se pudo reprogramar. Revisa tu conexión e inténtalo de nuevo.'
}

// Reprogramar una gestión (US-06) dentro de su misma fila: nueva fecha objetivo
// y, si hace falta, nuevas horas estimadas. Si ese día pasa del límite diario,
// no se guarda: se muestra el conflicto con opciones para resolverlo (US-07).
// Si algo falla se mantienen los valores elegidos. La nueva fecha va de hoy a
// la fecha del evento (`subtask.eventDate`).
export default function RescheduleForm({ idPrefix, subtask, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    deadline: subtask.deadline.slice(0, 10),
    estimatedHours: toDurationText(subtask.estimatedHours),
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [conflict, setConflict] = useState(null)
  const formRef = useRef(null)

  const input = (name) => formRef.current?.querySelector(`[name="${name}"]`)

  function focusFirstError(errs) {
    const first = FIELD_ORDER.find((f) => errs[f])
    input(first ?? 'deadline')?.focus()
  }

  function update(field, value) {
    const next = { ...values, [field]: value }
    setValues(next)
    setConflict(null) // el conflicto era de la fecha y las horas anteriores
    if (submitted) setErrors(validate(next, subtask.eventDate))
  }

  // `changes`: { deadline, estimatedHours }
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
      const serverErrors = apiError?.fieldErrors ?? {}
      setErrors(serverErrors)
      setFormError(failureMessage(apiError))
      focusFirstError(serverErrors)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)

    const errs = validate(values, subtask.eventDate)
    setErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(errs)
      return
    }
    save({ deadline: values.deadline, estimatedHours: toHours(parseDuration(values.estimatedHours)) })
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !busy) onCancel()
  }

  // Opciones del conflicto (US-07, escenario 3).
  function moveToAnotherDay() {
    const deadlineInput = input('deadline')
    deadlineInput?.focus()
    try {
      deadlineInput?.showPicker()
    } catch {
      // Sin soporte para abrir el calendario: basta con el foco en el campo.
    }
  }

  function reduceHours() {
    setValues((v) => ({ ...v, estimatedHours: toDurationText(conflict.availableHours) }))
    save({ deadline: conflict.date, estimatedHours: conflict.availableHours })
  }

  function postpone() {
    setValues((v) => ({ ...v, deadline: conflict.nextFreeDate }))
    save({ deadline: conflict.nextFreeDate, estimatedHours: conflict.hours })
  }

  return (
    <form ref={formRef} className="reschedule-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}
      <div className="reschedule-form__fields">
        <Field id={`${idPrefix}-deadline`} label="Nueva fecha objetivo" required error={errors.deadline}
          hint={
            <>
              <span className="field__hint-line">Fecha actual: {formatDate(subtask.deadline)}</span>
              {subtask.eventDate && (
                <span className="field__hint-line">Fecha del evento: {formatDate(subtask.eventDate)}</span>
              )}
            </>
          }>
          {(p) => (
            <input {...p} name="deadline" type="date" min={todayYmd()} max={subtask.eventDate?.slice(0, 10)}
              value={values.deadline} onChange={(e) => update('deadline', e.target.value)} autoFocus />
          )}
        </Field>
        <Field id={`${idPrefix}-hours`} label="Horas estimadas" required error={errors.estimatedHours}
          hint={`Horas actuales: ${formatHours(subtask.estimatedHours)}`}>
          {(p) => (
            <DurationInput fieldProps={p} value={values.estimatedHours}
              onChange={(value) => update('estimatedHours', value)} />
          )}
        </Field>
      </div>

      {conflict && (
        <OverloadConflict conflict={conflict} busy={busy}
          onMove={moveToAnotherDay} onReduce={reduceHours} onPostpone={postpone} />
      )}

      <div className="reschedule-form__actions">
        <button type="button" className="btn btn--small btn--ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--small btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : formError ? 'Reintentar' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
