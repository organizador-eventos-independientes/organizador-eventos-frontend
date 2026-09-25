import { useRef, useState } from 'react'
import Field from './Field'
import { EVENT_TYPES, validateEvent } from '../lib/validation'
import { fromDateTimeLocal, nowDateTimeLocal, toDateTimeLocal } from '../lib/format'

const EMPTY = { name: '', type: '', client: '', date: '', location: '' }
const FIELD_ORDER = ['name', 'type', 'client', 'date', 'location']

function toFormValues(event) {
  if (!event) return EMPTY
  return {
    name: event.name ?? '',
    type: event.type ?? '',
    client: event.client ?? '',
    date: toDateTimeLocal(event.date),
    location: event.location ?? '',
  }
}

// Formulario controlado de evento. `onSubmit(data)` debe devolver una promesa;
// si lanza un ApiError con fieldErrors, se muestran junto a cada campo y se
// conservan los datos ingresados.
export default function EventForm({
  initialEvent,
  submitLabel = 'Guardar',
  errorPrefix = 'No se pudo guardar el evento.',
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => toFormValues(initialEvent))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const formRef = useRef(null)

  function update(field, value) {
    const next = { ...values, [field]: value }
    setValues(next)
    // Tras el primer intento de guardar, la validación es en vivo.
    if (submitted) setErrors(validateEvent(next, initialEvent))
  }

  function focusFirstError(errs) {
    const first = FIELD_ORDER.find((f) => errs[f])
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setFormError('')

    const errs = validateEvent(values, initialEvent)
    setErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(errs)
      return
    }

    setBusy(true)
    try {
      await onSubmit({
        name: values.name.trim(),
        type: values.type,
        client: values.client.trim(),
        date: fromDateTimeLocal(values.date),
        location: values.location.trim(),
      })
    } catch (err) {
      const serverErrors = err?.fieldErrors ?? {}
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors)
        focusFirstError(serverErrors)
      }
      setFormError(`${errorPrefix} ${err?.message || 'Inténtalo de nuevo.'}`)
    } finally {
      setBusy(false)
    }
  }

  const selectedType = EVENT_TYPES.find((t) => t.value === values.type)

  return (
    <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}

      <Field id="event-name" label="Nombre del evento" required error={errors.name}
        hint="Un nombre corto que te ayude a reconocerlo, ej. “Boda Ana y Luis”.">
        {(p) => (
          <input {...p} name="name" type="text" maxLength={120} autoComplete="off"
            placeholder="Ej. Boda Ana y Luis" value={values.name}
            onChange={(e) => update('name', e.target.value)} />
        )}
      </Field>

      <Field id="event-type" label="Tipo de evento" required error={errors.type}
        hint={selectedType ? selectedType.hint : 'El tipo te ayuda a organizar y filtrar tus eventos.'}>
        {(p) => (
          <select {...p} name="type" value={values.type} onChange={(e) => update('type', e.target.value)}>
            <option value="" disabled>Selecciona un tipo</option>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        )}
      </Field>

      <Field id="event-client" label="Cliente o contacto" required error={errors.client}
        hint="Quién te contrató o con quién coordinas, ej. “Ana Pérez – 300 123 4567”.">
        {(p) => (
          <input {...p} name="client" type="text" maxLength={120} autoComplete="off"
            placeholder="Ej. Ana Pérez – 300 123 4567" value={values.client}
            onChange={(e) => update('client', e.target.value)} />
        )}
      </Field>

      <div className="form__row">
        <Field id="event-date" label="Fecha y hora del evento" required error={errors.date}>
          {(p) => (
            <input {...p} name="date" type="datetime-local" min={nowDateTimeLocal()} value={values.date}
              onChange={(e) => update('date', e.target.value)} />
          )}
        </Field>

        <Field id="event-location" label="Lugar" required error={errors.location}>
          {(p) => (
            <input {...p} name="location" type="text" maxLength={160} autoComplete="off"
              placeholder="Ej. Salón Los Robles, Cali" value={values.location}
              onChange={(e) => update('location', e.target.value)} />
          )}
        </Field>
      </div>

      <p className="form__note"><span aria-hidden="true">*</span> Campos obligatorios</p>

      <div className="form__actions">
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : formError ? 'Reintentar' : submitLabel}
        </button>
      </div>
    </form>
  )
}
