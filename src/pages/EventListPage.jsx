import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEvents } from '../api/events'
import { eventTypeLabel } from '../lib/validation'
import { formatDateTime } from '../lib/format'

export default function EventListPage() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setEvents(null)
    try {
      setEvents(await listEvents())
    } catch (err) {
      setError(err.message || 'No se pudieron cargar tus eventos.')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load()
  }, [load])

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Mis eventos</h1>
          <p className="muted">Planifica la logística de cada evento que organizas.</p>
        </div>
        {events?.length > 0 && (
          <Link to="/eventos/nuevo" className="btn btn--primary">+ Crear evento</Link>
        )}
      </header>

      {error ? (
        <div className="alert alert--error alert--block" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn--ghost" onClick={load}>Reintentar</button>
        </div>
      ) : events === null ? (
        <p className="loading" role="status">Cargando eventos…</p>
      ) : events.length === 0 ? (
        <div className="empty card">
          <p className="empty__title">Aún no tienes eventos</p>
          <p className="muted">
            Crea tu primer evento para empezar a planificar sus gestiones logísticas: reservas, invitaciones,
            proveedores y más.
          </p>
          <Link to="/eventos/nuevo" className="btn btn--primary">Crear evento</Link>
        </div>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev.id}>
              <Link to={`/evento/${ev.id}`} className="event-card">
                <span className={`badge badge--${ev.type}`}>{eventTypeLabel(ev.type)}</span>
                <span className="event-card__name">{ev.name}</span>
                <span className="muted event-card__meta">{formatDateTime(ev.date)}</span>
                <span className="muted event-card__meta">{ev.location} · {ev.client}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
