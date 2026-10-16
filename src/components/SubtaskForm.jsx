import { useRef, useState } from 'react'
import DurationInput from './DurationInput'
import Field from './Field'
import OverloadConflict from './OverloadConflict'
import { validateSubtask } from '../lib/validation'
import { formatDate, parseDuration, toDurationText, toHours, todayYmd } from '../lib/format'

const FIELD_ORDER = ['name', 'deadline', 'estimatedHours']

function toFormValues(subtask) {
  return {
    name: subtask?.name ?? '',
    deadline: subtask?.deadline?.slice(0, 10) ?? '',
    estimatedHours: toDurationText(subtask?.estimatedHours),
  }
}

// Formulario inline de gestión logística. Si `onSubmit` falla se conservan
// los valores ingresados y se muestra el error. `eventDate` (fecha del evento)
// es el último día permitido para el plazo. Si ese día pasa del límite diario,
// se muestran las mismas opciones para resolverlo que al reprogramar en Hoy.
export default function SubtaskForm({
  idPrefix, initialSubtask, eventDate, submitLabel, onSubmit, onCancel, resetOnSuccess = false,
}) {
  const [values, setValues] = useState(() => toFormValues(initialSubtask))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [conflict, setConflict] = useState(null)
  const formRef = useRef(null)

  const input = (name) => formRef.current?.querySelector(`[name="${name}"]`)

  function update(field, value) {
    const next = { ...values, [field]: value }
    setValues(next)
    setConflict(null) // el conflicto era del plazo y las horas anteriores
    if (submitted) setErrors(validateSubtask(next, initialSubtask, eventDate))
  }

  function focusFirstError(errs) {
    const first = FIELD_ORDER.find((f) => errs[f])
    if (first) input(first)?.focus()
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)

    const errs = validateSubtask(values, initialSubtask, eventDate)
    setErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(errs)
      return
    }

    save({ deadline: values.deadline, estimatedHours: toHours(parseDuration(values.estimatedHours)) })
  }

  // `changes`: { deadline, estimatedHours }
  async function save(changes) {
    setBusy(true)
    setFormError('')
    setConflict(null)
    try {
      await onSubmit({ name: values.name.trim(), ...changes })
      if (resetOnSuccess) {
        setValues(toFormValues(null))
        setSubmitted(false)
        setErrors({})
        input('name')?.focus()
      }
    } catch (err) {
      if (err?.conflict) {
        setErrors({})
        setConflict(err.conflict)
        return
      }
      const serverErrors = err?.fieldErrors ?? {}
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors)
        focusFirstError(serverErrors)
      }
      setFormError(
        err?.status === 400 && err.message
          ? `No se pudo guardar la gestión. ${err.message}`
          : 'No se pudo guardar la gestión. Revisa tu conexión e inténtalo de nuevo.',
      )
    } finally {
      setBusy(false)
    }
  }

  // Opciones del conflicto (US-08), las mismas que al reprogramar en Hoy.
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
    <form ref={formRef} className="subtask-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}
      <div className="subtask-form__grid">
        <Field id={`${idPrefix}-name`} label="Gestión" required error={errors.name}>
          {(p) => (
            <input {...p} name="name" type="text" maxLength={120} autoComplete="off"
              placeholder="Ej. Reservar salón" value={values.name}
              onChange={(e) => update('name', e.target.value)} autoFocus />
          )}
        </Field>
        <Field id={`${idPrefix}-deadline`} label="Plazo" required error={errors.deadline}
          hint={eventDate ? `Hasta la fecha del evento: ${formatDate(eventDate)}.` : undefined}>
          {(p) => (
            <input {...p} name="deadline" type="date" min={todayYmd()} max={eventDate?.slice(0, 10)}
              value={values.deadline} onChange={(e) => update('deadline', e.target.value)} />
          )}
        </Field>
        <Field id={`${idPrefix}-hours`} label="Horas estimadas" required error={errors.estimatedHours}
          hint="Horas:minutos, ej. 2:45. Las flechas suben y bajan de 15 en 15 minutos.">
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
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : formError ? 'Reintentar' : submitLabel}
        </button>
      </div>
    </form>
  )
}
