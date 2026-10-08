import { useState } from 'react'
import Field from './Field'
import { DAILY_LIMIT_MAX, DAILY_LIMIT_MIN, validateDailyLimit } from '../lib/validation'

// Límite diario de horas de gestión (US-12). Si no es válido o falla al
// guardar, no se guarda: se conserva el valor escrito y se muestra el error.
export default function DailyLimitForm({ idPrefix, limit, onSave, description }) {
  const [value, setValue] = useState(limit != null ? String(limit) : '')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  function update(next) {
    setValue(next)
    if (submitted) setError(validateDailyLimit(next))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setFormError('')

    const err = validateDailyLimit(value)
    setError(err)
    if (err) return

    setBusy(true)
    try {
      await onSave(Number(value))
      setSubmitted(false)
    } catch (apiError) {
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
      <div>
        <button type="submit" className="btn btn--small btn--primary" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar límite'}
        </button>
      </div>
    </form>
  )
}
