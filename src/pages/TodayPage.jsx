import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllSubtasks } from '../api/events'
import { groupSubtasks, relativeDeadline, UPCOMING_DAYS } from '../lib/today'
import { formatDate, formatHours, todayYmd } from '../lib/format'

const GROUPS = [
  {
    key: 'overdue',
    title: 'Gestiones vencidas',
    hint: 'Su plazo ya pasó. Atiéndelas primero.',
  },
  {
    key: 'today',
    title: 'Para hoy',
    hint: 'Urgentes del día: vencen hoy.',
  },
  {
    key: 'upcoming',
    title: `Próximas (${UPCOMING_DAYS} días)`,
    hint: `Vencen entre mañana y los próximos ${UPCOMING_DAYS} días.`,
  },
]

export default function TodayPage() {
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    setGroups(null)
    try {
      const subtasks = await listAllSubtasks()
      setGroups(groupSubtasks(subtasks, todayYmd()))
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load()
  }, [load])

  const visibleCount = groups ? GROUPS.reduce((n, g) => n + groups[g.key].length, 0) : 0

  return (
    <div className="page page--narrow">
      <header className="page__header">
        <div>
          <h1 className="page__title">Hoy</h1>
          <p className="muted">Lo que requiere tu atención primero, en todos tus eventos.</p>
        </div>
      </header>

      <aside className="rule" aria-labelledby="rule-title">
        <h2 id="rule-title" className="rule__title">¿Cómo se ordena esto?</h2>
        <p>
          Primero las <strong>vencidas</strong> (la más antigua arriba), luego las <strong>de hoy</strong> y
          después las <strong>próximas {UPCOMING_DAYS} días</strong> (la más cercana arriba).
        </p>
        <p>Si dos gestiones tienen el mismo plazo, va primero la de menos horas estimadas.</p>
      </aside>

      {error ? (
        <div className="alert alert--error alert--block" role="alert">
          <p>No pudimos cargar tus gestiones. Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="btn btn--ghost" onClick={load}>Reintentar</button>
        </div>
      ) : groups === null ? (
        <p className="loading" role="status">Cargando gestiones…</p>
      ) : visibleCount === 0 ? (
        <div className="empty card">
          <p className="empty__title">No tienes gestiones pendientes</p>
          <p className="muted">
            {groups.later.length > 0
              ? `Tienes ${groups.later.length} ${groups.later.length === 1 ? 'gestión' : 'gestiones'} con plazo después de los próximos ${UPCOMING_DAYS} días. ¿Deseas organizar un nuevo evento?`
              : '¿Deseas organizar un nuevo evento?'}
          </p>
          <Link to="/eventos/nuevo" className="btn btn--primary">Crear evento</Link>
        </div>
      ) : (
        GROUPS.map((g) => (
          <section key={g.key} className={`card today-group today-group--${g.key}`} aria-labelledby={`group-${g.key}`}>
            <header className="card__header">
              <div>
                <h2 id={`group-${g.key}`} className="card__title">
                  {g.title} <span className="today-group__count">{groups[g.key].length}</span>
                </h2>
                <p className="muted">{g.hint}</p>
              </div>
            </header>
            {groups[g.key].length === 0 ? (
              <p className="muted today-group__empty">Nada por aquí.</p>
            ) : (
              <ol className="subtasks">
                {groups[g.key].map((s) => (
                  <li key={s.id} className="subtasks__item">
                    <div className="subtasks__main">
                      <p className="subtasks__name">{s.name}</p>
                      <p className="muted subtasks__meta">
                        <span className="today-group__when">{relativeDeadline(s.daysLeft)}</span>
                        <span>{formatDate(s.deadline)}</span>
                        <span>{formatHours(s.estimatedHours)}</span>
                      </p>
                    </div>
                    <Link to={`/evento/${s.eventId}`} className="btn btn--small btn--ghost">
                      {s.eventName}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))
      )}
    </div>
  )
}
