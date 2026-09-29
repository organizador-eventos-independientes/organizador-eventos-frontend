import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listEventsWithSubtasks } from '../api/events'
import { groupSubtasks, relativeDeadline, UPCOMING_DAYS } from '../lib/today'
import { formatDate, formatHours, todayYmd } from '../lib/format'

// `status` es el valor del filtro por estado en la URL (?estado=...).
const GROUPS = [
  {
    key: 'overdue',
    status: 'vencidas',
    label: 'Vencidas',
    title: 'Gestiones vencidas',
    hint: 'Su plazo ya pasó. Atiéndelas primero.',
  },
  {
    key: 'today',
    status: 'hoy',
    label: 'Para hoy',
    title: 'Para hoy',
    hint: 'Urgentes del día: vencen hoy.',
  },
  {
    key: 'upcoming',
    status: 'proximas',
    label: 'Próximas',
    title: `Próximas (${UPCOMING_DAYS} días)`,
    hint: `Vencen entre mañana y los próximos ${UPCOMING_DAYS} días.`,
  },
]

const countLabel = (n) => `${n} ${n === 1 ? 'gestión' : 'gestiones'}`

export default function TodayPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const load = useCallback(async () => {
    setError(false)
    setData(null)
    try {
      const { events, subtasks } = await listEventsWithSubtasks()
      setData({ events, groups: groupSubtasks(subtasks, todayYmd()) })
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load()
  }, [load])

  // Filtros (US-05). Viven en la URL para conservarse al recargar la página; un
  // valor que no corresponde a ningún evento o estado se ignora.
  const events = data ? [...data.events].sort((a, b) => a.name.localeCompare(b.name, 'es')) : []
  const eventFilter = events.find((ev) => String(ev.id) === searchParams.get('evento'))?.id ?? null
  const statusFilter = GROUPS.find((g) => g.status === searchParams.get('estado'))?.status ?? null
  const filtering = eventFilter !== null || statusFilter !== null

  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => setSearchParams({}, { replace: true })

  // Filtrar no reordena: cada grupo conserva la regla de prioridad.
  const ofEvent = (list) => (eventFilter === null ? list : list.filter((s) => s.eventId === eventFilter))
  const totalCount = data ? GROUPS.reduce((n, g) => n + data.groups[g.key].length, 0) : 0
  const shownGroups = data
    ? GROUPS.filter((g) => !statusFilter || g.status === statusFilter).map((g) => ({
        ...g,
        items: ofEvent(data.groups[g.key]),
      }))
    : []
  const shownCount = shownGroups.reduce((n, g) => n + g.items.length, 0)

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
      ) : data === null ? (
        <p className="loading" role="status">Cargando gestiones…</p>
      ) : totalCount === 0 ? (
        <div className="empty card">
          <p className="empty__title">No tienes gestiones pendientes</p>
          <p className="muted">
            {data.groups.later.length > 0
              ? `Tienes ${countLabel(data.groups.later.length)} con plazo después de los próximos ${UPCOMING_DAYS} días. ¿Deseas organizar un nuevo evento?`
              : '¿Deseas organizar un nuevo evento?'}
          </p>
          <Link to="/eventos/nuevo" className="btn btn--primary">Crear evento</Link>
        </div>
      ) : (
        <>
          <section className="card filters" aria-label="Filtros">
            <div className="filters__row">
              <div className="field filters__event">
                <label htmlFor="filter-event" className="field__label">Evento</label>
                <select
                  id="filter-event"
                  className={eventFilter !== null ? 'filters__select--active' : undefined}
                  value={eventFilter ?? ''}
                  onChange={(e) => setFilter('evento', e.target.value)}
                >
                  <option value="">Todos los eventos</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span id="filter-status" className="field__label">Estado</span>
                <div className="chips" role="group" aria-labelledby="filter-status">
                  <button type="button" className="chip" aria-pressed={statusFilter === null}
                    onClick={() => setFilter('estado', null)}>
                    Todas
                  </button>
                  {GROUPS.map((g) => (
                    <button key={g.key} type="button" className="chip" aria-pressed={statusFilter === g.status}
                      onClick={() => setFilter('estado', statusFilter === g.status ? null : g.status)}>
                      {g.label} <span className="chip__count">{ofEvent(data.groups[g.key]).length}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filters__summary">
              <p aria-live="polite">
                {filtering ? (
                  <>Mostrando <strong>{shownCount}</strong> de {countLabel(totalCount)}.</>
                ) : (
                  `Mostrando todas tus gestiones (${totalCount}).`
                )}
              </p>
              {filtering && (
                <button type="button" className="btn btn--small btn--ghost" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </section>

          {shownCount === 0 ? (
            <div className="empty card">
              <p className="empty__title">No hay gestiones para estos filtros</p>
              <p className="muted">Prueba con otro evento o estado, o limpia los filtros para ver todas tus gestiones.</p>
              <button type="button" className="btn btn--primary" onClick={clearFilters}>Limpiar filtros</button>
            </div>
          ) : (
            shownGroups.map((g) => (
              <section key={g.key} className={`card today-group today-group--${g.key}`} aria-labelledby={`group-${g.key}`}>
                <header className="card__header">
                  <div>
                    <h2 id={`group-${g.key}`} className="card__title">
                      {g.title} <span className="today-group__count">{g.items.length}</span>
                    </h2>
                    <p className="muted">{g.hint}</p>
                  </div>
                </header>
                {g.items.length === 0 ? (
                  <p className="muted today-group__empty">Nada por aquí.</p>
                ) : (
                  <ol className="subtasks">
                    {g.items.map((s) => (
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
        </>
      )}
    </div>
  )
}
