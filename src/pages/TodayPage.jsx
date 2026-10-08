import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DailyLimitForm from '../components/DailyLimitForm'
import RescheduleForm from '../components/RescheduleForm'
import { getDailyLimit, listEventsWithSubtasks, rescheduleSubtask, updateDailyLimit } from '../api/events'
import { groupSubtasks, relativeDeadline, relativeEventDate } from '../lib/today'
import { formatDate, formatDateTime, formatHours, todayYmd } from '../lib/format'
import { useToast } from '../lib/toast'
import { eventTypeLabel } from '../lib/validation'

// `status` es el valor del filtro por estado en la URL (?estado=...).
const GROUPS = [
  {
    key: 'overdue',
    status: 'vencidas',
    label: 'Vencidas',
    title: 'Vencidas',
    hint: 'Su fecha ya pasó.',
  },
  {
    key: 'today',
    status: 'hoy',
    label: 'Para hoy',
    title: 'Para hoy',
    hint: 'Urgentes del día.',
  },
  {
    key: 'upcoming',
    status: 'proximas',
    label: 'Próximas',
    title: 'Próximas',
    hint: 'Su fecha es posterior a hoy.',
  },
]

const countLabel = (n) => `${n} ${n === 1 ? 'pendiente' : 'pendientes'}`

// Eventos y gestiones en una sola lista para agruparlos con la misma regla.
function toItems(events, subtasks) {
  const eventItems = events.map((ev) => ({
    key: `evento-${ev.id}`,
    kind: 'evento',
    name: ev.name,
    type: ev.type,
    deadline: ev.date.slice(0, 10),
    estimatedHours: 0,
    date: ev.date,
    location: ev.location,
    eventId: ev.id,
    eventName: ev.name,
  }))
  const subtaskItems = subtasks.map((s) => ({ ...s, key: `gestion-${s.id}`, kind: 'gestion' }))
  return [...eventItems, ...subtaskItems]
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function TodayPage() {
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  // Panel desplegado de la barra de filtros: 'filters', 'rule', 'limit' o ninguno.
  const [openPanel, setOpenPanel] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  // Reprogramar (US-06): gestión con el formulario abierto y la última movida.
  const [reschedulingKey, setReschedulingKey] = useState(null)
  const [movedKey, setMovedKey] = useState(null)
  // Gestión cuyo botón "Reprogramar" recibe el foco tras el próximo render.
  const focusAfterRender = useRef(null)

  const load = useCallback(async () => {
    setError(false)
    setData(null)
    try {
      // Si el límite diario no carga, la vista funciona igual: el backend lo
      // sigue aplicando al reprogramar.
      const [{ events, subtasks }, dailyLimit] = await Promise.all([
        listEventsWithSubtasks(),
        getDailyLimit().then((limit) => limit.hours).catch(() => null),
      ])
      setData({ events, items: toItems(events, subtasks), dailyLimit })
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load()
  }, [load])

  // Al cerrar el formulario el foco vuelve a "Reprogramar". Si la gestión cambió
  // de grupo, además se desplaza la página hasta ella para ver a dónde fue.
  useEffect(() => {
    const key = focusAfterRender.current
    if (!key) return
    focusAfterRender.current = null
    const button = document.getElementById(`reprogramar-${key}`)
    if (!button) return
    button.focus({ preventScroll: true })
    button.closest('li')?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  })

  function startRescheduling(item) {
    setReschedulingKey(item.key)
    setMovedKey(null)
  }

  function cancelRescheduling(item) {
    setReschedulingKey(null)
    focusAfterRender.current = item.key
  }

  // Si falla o hay conflicto de sobrecarga (US-07), el error llega al
  // formulario, que conserva la fecha elegida.
  async function reschedule(item, changes) {
    const updated = await rescheduleSubtask(item.id, changes)
    setData((d) => ({
      ...d,
      items: d.items.map((it) =>
        it.key === item.key ? { ...it, deadline: updated.deadline, estimatedHours: updated.estimatedHours } : it,
      ),
    }))
    setReschedulingKey(null)
    setMovedKey(item.key)
    focusAfterRender.current = item.key
    toast({
      message:
        changes.estimatedHours != null
          ? `Fecha actualizada y horas reducidas a ${formatHours(updated.estimatedHours)}.`
          : 'Fecha actualizada.',
    })
  }

  async function saveDailyLimit(hours) {
    const { hours: dailyLimit } = await updateDailyLimit(hours)
    setData((d) => ({ ...d, dailyLimit }))
    toast({ message: 'Límite actualizado.' })
  }

  // Filtros (US-05). Viven en la URL para conservarse al recargar la página; un
  // valor que no corresponde a ningún evento o estado se ignora.
  const events = data ? [...data.events].sort((a, b) => a.name.localeCompare(b.name, 'es')) : []
  const eventFilter = events.find((ev) => String(ev.id) === searchParams.get('evento'))?.id ?? null
  const statusFilter = GROUPS.find((g) => g.status === searchParams.get('estado'))?.status ?? null
  const filtering = eventFilter !== null || statusFilter !== null
  const activeFilters = (eventFilter !== null) + (statusFilter !== null)

  function setFilter(name, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => setSearchParams({}, { replace: true })

  // Acordeón: abrir uno cierra el otro; volver a pulsarlo lo cierra.
  const togglePanel = (name) => setOpenPanel((open) => (open === name ? null : name))

  // Se agrupa en cada render: una gestión reprogramada pasa sola a su nuevo grupo.
  const groups = data ? groupSubtasks(data.items, todayYmd()) : null

  // Filtrar no reordena: cada grupo conserva la regla de prioridad.
  const ofEvent = (list) => (eventFilter === null ? list : list.filter((s) => s.eventId === eventFilter))
  const totalCount = groups ? GROUPS.reduce((n, g) => n + groups[g.key].length, 0) : 0
  const shownGroups = groups
    ? GROUPS.filter((g) => !statusFilter || g.status === statusFilter).map((g) => ({
        ...g,
        items: ofEvent(groups[g.key]),
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
        {data?.events.length > 0 && (
          <Link to="/eventos/nuevo" className="btn btn--primary">+ Crear evento</Link>
        )}
      </header>

      {error ? (
        <div className="alert alert--error alert--block" role="alert">
          <p>No pudimos cargar tus eventos y gestiones. Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="btn btn--ghost" onClick={load}>Reintentar</button>
        </div>
      ) : data === null ? (
        <p className="loading" role="status">Cargando…</p>
      ) : totalCount === 0 ? (
        <div className="empty card">
          <p className="empty__title">Aún no tienes eventos</p>
          <p className="muted">Cuando crees un evento aparecerá aquí junto con sus gestiones, ordenado por fecha.</p>
          <Link to="/eventos/nuevo" className="btn btn--primary">Crear evento</Link>
        </div>
      ) : (
        <>
          {/* Todo plegado por defecto para no abrumar. "Filtros" y "¿Cómo se ordena
              esto?" son un acordeón: al abrir uno se cierra el otro. La barra siempre
              muestra cuántos filtros hay activos y el resumen. */}
          <section className="card filters" aria-label="Filtros, orden y límite diario">
            <div className="filters__bar">
              <button type="button" className="filters__toggle" aria-expanded={openPanel === 'filters'}
                aria-controls="filters-panel" onClick={() => togglePanel('filters')}>
                <svg className="filters__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 5h18l-7 8v6l-4 2v-8z" />
                </svg>
                Filtros
                {filtering && (
                  <span className="filters__badge" aria-label={`${activeFilters} activos`}>{activeFilters}</span>
                )}
                <span className="filters__caret" aria-hidden="true">▾</span>
              </button>
              <button type="button" className="filters__toggle" id="rule-toggle" aria-expanded={openPanel === 'rule'}
                aria-controls="rule-panel" onClick={() => togglePanel('rule')}>
                <svg className="filters__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                ¿Cómo se ordena esto?
                <span className="filters__caret" aria-hidden="true">▾</span>
              </button>
              <button type="button" className="filters__toggle" id="limit-toggle" aria-expanded={openPanel === 'limit'}
                aria-controls="limit-panel" onClick={() => togglePanel('limit')}>
                <svg className="filters__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                Límite diario
                {data.dailyLimit != null && <span className="filters__value">{formatHours(data.dailyLimit)}</span>}
                <span className="filters__caret" aria-hidden="true">▾</span>
              </button>
              <p className="filters__summary" aria-live="polite">
                {filtering ? (
                  <>Mostrando <strong>{shownCount}</strong> de {countLabel(totalCount)}.</>
                ) : (
                  `Mostrando todo (${countLabel(totalCount)}).`
                )}
              </p>
              {filtering && (
                <button type="button" className="btn btn--small btn--ghost" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              )}
            </div>

            <div id="rule-panel" className={`filters__panel${openPanel === 'rule' ? ' filters__panel--open' : ''}`}
              role="region" aria-labelledby="rule-toggle" inert={openPanel !== 'rule'}>
              <div className="filters__panel-inner">
                <div className="rule">
                  <p>
                    Primero lo <strong>vencido</strong> (lo más antiguo arriba), luego lo <strong>de hoy</strong> y
                    después lo <strong>próximo</strong> (lo más cercano arriba).
                  </p>
                  <p>Si dos tienen la misma fecha, va primero el evento y luego sus gestiones de menos horas estimadas.</p>
                </div>
              </div>
            </div>

            <div id="limit-panel" className={`filters__panel${openPanel === 'limit' ? ' filters__panel--open' : ''}`}
              role="region" aria-labelledby="limit-toggle" inert={openPanel !== 'limit'}>
              <div className="filters__panel-inner">
                <DailyLimitForm idPrefix="today" limit={data.dailyLimit} onSave={saveDailyLimit}
                  description="Sumamos las horas de las gestiones de todos tus eventos. Si al reprogramar una gestión un día pasa de este límite, te avisamos antes de guardar." />
              </div>
            </div>

            <div id="filters-panel" className={`filters__panel${openPanel === 'filters' ? ' filters__panel--open' : ''}`}
              inert={openPanel !== 'filters'}>
              <div className="filters__panel-inner">
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
                        <span className="cap-text">Todas</span>
                      </button>
                      {GROUPS.map((g) => (
                        <button key={g.key} type="button" className="chip" aria-pressed={statusFilter === g.status}
                          onClick={() => setFilter('estado', statusFilter === g.status ? null : g.status)}>
                          <span className="cap-text">{g.label}</span> <span className="chip__count">{ofEvent(groups[g.key]).length}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {shownCount === 0 ? (
            <div className="empty card">
              <p className="empty__title">No hay gestiones para estos filtros</p>
              <p className="muted">Prueba con otro evento o estado, o limpia los filtros para ver todo.</p>
              <button type="button" className="btn btn--primary" onClick={clearFilters}>Limpiar filtros</button>
            </div>
          ) : (
            shownGroups.map((g) => (
              <section key={g.key} className={`card today-group today-group--${g.key}`} aria-labelledby={`group-${g.key}`}>
                <header className="card__header">
                  <div>
                    <h2 id={`group-${g.key}`} className="card__title cap-row">
                      <span className="cap-text">{g.title}</span> <span className="today-group__count">{g.items.length}</span>
                    </h2>
                    <p className="muted">{g.hint}</p>
                  </div>
                </header>
                {g.items.length === 0 ? (
                  <p className="muted today-group__empty">Nada por aquí.</p>
                ) : (
                  <ol className="subtasks">
                    {g.items.map((s) =>
                      s.kind === 'evento' ? (
                        <li key={s.key} className="subtasks__item today-item">
                          <span className={`badge badge--${s.type} today-item__type`}>
                            <span className="cap-text">{eventTypeLabel(s.type)}</span>
                          </span>
                          <p className="subtasks__name today-item__name">{s.name}</p>
                          <p className="muted subtasks__meta today-item__meta">
                            <span className="today-group__when">{relativeEventDate(s.daysLeft)}</span>
                            <span>{formatDateTime(s.date)}</span>
                            <span>{s.location}</span>
                          </p>
                          <div className="today-item__actions">
                            <Link to={`/evento/${s.eventId}`} className="btn btn--small btn--ghost">Ver evento</Link>
                          </div>
                        </li>
                      ) : (
                        <li key={s.key}
                          className={`subtasks__item today-item${reschedulingKey === s.key ? ' today-item--rescheduling' : ''}${movedKey === s.key ? ' today-item--moved' : ''}`}
                          onAnimationEnd={(e) => e.animationName === 'moved-flash' && setMovedKey(null)}>
                          <span className="badge badge--gestion today-item__type">
                            <span className="cap-text">Gestión</span>
                          </span>
                          <p className="subtasks__name today-item__name">{s.name}</p>
                          <p className="muted subtasks__meta today-item__meta">
                            <span className="today-group__when">{relativeDeadline(s.daysLeft)}</span>
                            <span>{formatDate(s.deadline)}</span>
                            <span>{formatHours(s.estimatedHours)}</span>
                          </p>
                          {reschedulingKey === s.key ? (
                            <RescheduleForm
                              idPrefix={s.key}
                              subtask={s}
                              onSubmit={(deadline) => reschedule(s, deadline)}
                              onCancel={() => cancelRescheduling(s)}
                            />
                          ) : (
                            <div className="today-item__actions">
                              <Link to={`/evento/${s.eventId}`} className="btn btn--small btn--ghost" title={s.eventName}>
                                {s.eventName}
                              </Link>
                              <button type="button" id={`reprogramar-${s.key}`} className="btn btn--small btn--ghost"
                                onClick={() => startRescheduling(s)} aria-label={`Reprogramar gestión ${s.name}`}>
                                Reprogramar
                              </button>
                            </div>
                          )}
                        </li>
                      ),
                    )}
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
