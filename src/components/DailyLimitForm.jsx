import { useState } from 'react'
import Field from './Field'
import { validateDailyLimit } from '../lib/validation'

// Límite diario de horas de gestión (US-12). Si falla al guardar se conserva
// el valor escrito y se muestra el error.
export default function DailyLimitForm({ limit, onSave }) {
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
          : 'No se pudo guardar el límite. Revisa tu conexión e inténtalo de nuevo.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="limit-form" onSubmit={handleSubmit} noValidate>
      <p className="muted">
        Sumamos las horas de las gestiones de todos tus eventos. Si al reprogramar una gestión un día pasa de este
        límite, te avisamos antes de guardar.
      </p>
      {formError && (
        <p className="alert alert--error" role="alert">
          {formError}
        </p>
      )}
      <Field id="daily-limit" label="Horas de gestión por día" required error={error}>
        {(p) => (
          <input {...p} name="dailyLimit" type="number" inputMode="decimal" min="0.5" max="24" step="0.5"
            placeholder="Ej. 6" value={value} onChange={(e) => update(e.target.value)} />
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
