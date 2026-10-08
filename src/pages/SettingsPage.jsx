import { useCallback, useEffect, useState } from 'react'
import DailyLimitForm from '../components/DailyLimitForm'
import { getDailyLimit, updateDailyLimit } from '../api/events'
import { formatHours } from '../lib/format'
import { useToast } from '../lib/toast'

// Configuración (US-12): el límite diario de horas de gestión del organizador.
// Si nunca lo guardó se muestran las 6 h por defecto.
export default function SettingsPage() {
  const { toast } = useToast()
  const [limit, setLimit] = useState(null) // { hours, isDefault }
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    setLimit(null)
    try {
      setLimit(await getDailyLimit())
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load()
  }, [load])

  async function save(hours) {
    setLimit(await updateDailyLimit(hours))
    toast({ message: 'Límite actualizado.' })
  }

  return (
    <div className="page page--narrow">
      <header className="page__header">
        <div>
          <h1 className="page__title">Configuración</h1>
          <p className="muted">Ajusta la app a tu disponibilidad.</p>
        </div>
      </header>

      {error ? (
        <div className="alert alert--error alert--block" role="alert">
          <p>No pudimos cargar tu configuración. Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="btn btn--ghost" onClick={load}>Reintentar</button>
        </div>
      ) : limit === null ? (
        <p className="loading" role="status">Cargando…</p>
      ) : (
        <section className="card" aria-labelledby="limit-title">
          <header className="card__header">
            <div>
              <h2 id="limit-title" className="card__title">Límite diario de horas de gestión</h2>
              <p className="muted">
                Lo máximo que quieres dedicar a organizar en un mismo día, sumando todos tus eventos. Si al
                reprogramar una gestión un día pasa de este límite, te avisamos antes de guardar.
              </p>
            </div>
          </header>
          <p className="limit-current" aria-live="polite">
            Tu límite actual: <strong>{formatHours(limit.hours)}</strong>
            {limit.isDefault && <span className="muted"> (valor por defecto)</span>}
          </p>
          <DailyLimitForm idPrefix="settings" limit={limit.hours} onSave={save} />
        </section>
      )}
    </div>
  )
}
