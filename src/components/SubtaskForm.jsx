import { useRef, useState } from 'react'
import DurationInput from './DurationInput'
import Field from './Field'
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
// es el último día permitido para el plazo.
export default function SubtaskForm({
  idPrefix, initialSubtask, eventDate, submitLabel, onSubmit, onCancel, resetOnSuccess = false,
}) {
  const [values, setValues] = useState(() => toFormValues(initialSubtask))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const formRef = useRef(null)

  function update(field, value) {
    const next = { ...values, [field]: value }
    setValues(next)
    if (submitted) setErrors(validateSubtask(next, initialSubtask, eventDate))
  }

  function focusFirstError(errs) {
    const first = FIELD_ORDER.find((f) => errs[f])
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setFormError('')

    const errs = validateSubtask(values, initialSubtask, eventDate)
    setErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(errs)
      return
    }

    setBusy(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        deadline: values.deadline,
        estimatedHours: toHours(parseDuration(values.estimatedHours)),
      })
      if (resetOnSuccess) {
        setValues(toFormValues(null))
        setSubmitted(false)
        setErrors({})
        formRef.current?.querySelector('[name="name"]')?.focus()
      }
    } catch (err) {
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
