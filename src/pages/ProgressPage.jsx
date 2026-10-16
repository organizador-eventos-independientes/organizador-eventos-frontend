import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getEventProgress,
  listEvents,
  listSubtasks,
} from '../api/events'

function ProgressPage() {
  const [events, setEvents] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProgress() {
      try {
        setLoading(true)
        setError('')

        const eventList = await listEvents()

        const progressList = await Promise.all(
          eventList.map(async (event) => {
            const [result, subtasks] = await Promise.all([
              getEventProgress(event.id),
              listSubtasks(event.id),
            ])

            return {
              ...event,
              ...result,
              subtasks,
            }
          }),
        )

        if (active) {
          setEvents(eventList)
          setProgress(progressList)
        }
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              'No fue posible cargar el progreso de los eventos.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProgress()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <h1 className="page__title">
              Progreso de los eventos
            </h1>
            <p className="muted">
              Revisa cuánto has avanzado en la organización.
            </p>
          </div>
        </header>

        <div className="card progress-loading">
          <span className="loading">
            Cargando el progreso...
          </span>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <h1 className="page__title">
              Progreso de los eventos
            </h1>
            <p className="muted">
              Revisa cuánto has avanzado en la organización.
            </p>
          </div>
        </header>

        <div className="card">
          <div className="alert alert--error" role="alert">
            {error}
          </div>

          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Intentar nuevamente
          </button>
        </div>
      </section>
    )
  }

  // Resumen general de eventos y gestiones.
  const totalEvents = progress.length

  const completedEvents = progress.filter(
    (event) =>
      event.totalSubtasks > 0 &&
      event.completedSubtasks === event.totalSubtasks,
  ).length

  const totalTasks = progress.reduce(
    (total, event) => total + (event.totalSubtasks ?? 0),
    0,
  )

  const completedTasks = progress.reduce(
    (total, event) => total + (event.completedSubtasks ?? 0),
    0,
  )

  const overallPercentage =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

  // Reunir todas las gestiones de todos los eventos.
  const allSubtasks = progress.flatMap(
    (event) => event.subtasks ?? [],
  )

  // Obtener la fecha actual en formato YYYY-MM-DD.
  const now = new Date()

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')


  // Normalizar el estado para comparar sin problemas de mayúsculas.
  const getTaskStatus = (task) =>
    String(task.status ?? 'Pendiente')
      .trim()
      .toLowerCase()

  // Gestiones completadas.
  const completedStatusTasks = allSubtasks.filter(
    (task) => getTaskStatus(task) === 'hecha',
  ).length

  // Gestiones pendientes.
  const pendingTasks = allSubtasks.filter(
    (task) => getTaskStatus(task) === 'pendiente',
  ).length

  // Gestiones pospuestas.
  const postponedTasks = allSubtasks.filter(
    (task) => getTaskStatus(task) === 'pospuesta',
  ).length

  // Gestiones vencidas: tienen una fecha anterior a hoy
  // y todavía no están completadas.
  const overdueTasks = allSubtasks.filter(
    (task) =>
      getTaskStatus(task) !== 'hecha' &&
      task.deadline &&
      task.deadline < today,
  ).length

  return (
    <section className="page progress-page">
      <header className="page__header">
        <div>
          <h1 className="page__title">
            Progreso de los eventos
          </h1>
        </div>
      </header>

      {events.length === 0 ? (
        <div className="card empty progress-empty">
          <span
            className="progress-empty__icon"
            aria-hidden="true"
          >
          </span>

          <h2 className="empty__title">
            Tu próxima aventura comienza aquí
          </h2>

          <p className="muted">
            Cuando crees tu primer evento, podrás seguir aquí
            el avance de todas sus gestiones.
          </p>

          <Link
            className="btn btn--primary"
            to="/eventos/nuevo"
          >
            <span className="btn__plus">+</span> Crear evento
          </Link>
        </div>
      ) : (
        <>
          <div className="progress-overview">
            <article className="progress-overview__main">
              <div className="progress-overview__top">
                <div>
                  <span className="progress-overview__label">
                    AVANCE GENERAL
                  </span>

                  <h2>
                    {overallPercentage === 0
                      ? '¡Todo comienza aquí!'
                      : overallPercentage === 100
                        ? '¡Lo lograste!'
                        : '¡Vas por buen camino!'}
                  </h2>

                  {overallPercentage !== 0 && (
                    <p className="muted">
                        {overallPercentage === 100
                            ? '¡Excelente trabajo! Has completado todas las gestiones.'
                            : 'Sigue avanzando en la organización de tus eventos.'}
                    </p>
                  )}
                </div>

                <div
                  className="progress-overview__percentage"
                  aria-label={`Avance general: ${overallPercentage}%`}
                >
                  {overallPercentage}%
                </div>
              </div>

              <div
                className="progress-overview__track"
                role="progressbar"
                aria-label="Avance general de las gestiones"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overallPercentage}
              >
                <span
                  className="progress-overview__fill"
                  style={{
                    width: `${overallPercentage}%`,
                  }}
                />
              </div>

              <div className="progress-overview__bottom">
                <div className="progress-overview__badges">
                  <span className="progress-overview__badge progress-overview__badge--success">
                    <span aria-hidden="true">✓</span>
                    Completadas:{' '}
                    <strong>{completedStatusTasks}</strong>
                  </span>

                  <span className="progress-overview__badge progress-overview__badge--pending">
                    <span aria-hidden="true">○</span>
                    Pendientes:{' '}
                    <strong>{pendingTasks}</strong>
                  </span>

                  <span className="progress-overview__badge progress-overview__badge--postponed">
                    <span aria-hidden="true">↻</span>
                    Pospuestas:{' '}
                    <strong>{postponedTasks}</strong>
                  </span>

                  <span className="progress-overview__badge progress-overview__badge--overdue">
                    <span aria-hidden="true">!</span>
                    Vencidas:{' '}
                    <strong>{overdueTasks}</strong>
                  </span>
                </div>
              </div>
            </article>
          </div>

          <div className="progress-list">
            {progress.map((event) => {
              const percentage = Math.min(
                100,
                Math.max(0, event.percentage ?? 0),
              )

              const isCompleted =
                event.totalSubtasks > 0 &&
                event.completedSubtasks === event.totalSubtasks

              const hasTasks = event.totalSubtasks > 0

              const normalizedType = (event.type || 'evento')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')

              return (
                <article
                  className="progress-card"
                  key={event.id}
                >
                  <div className="progress-card__top">
                    <div className="progress-card__identity">
                      <span
                        className="progress-card__symbol"
                        aria-hidden="true"
                      >
                      </span>

                      <div className="progress-card__name">
                        <h3>{event.name}</h3>

                        <span
                          className={`badge badge--${normalizedType}`}
                        >
                          {event.type || 'Evento'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`progress-status ${
                        isCompleted
                          ? 'progress-status--completed'
                          : 'progress-status--pending'
                      }`}
                    >
                      {isCompleted
                        ? 'Completado'
                        : hasTasks
                          ? 'En progreso'
                          : 'Sin gestiones'}
                    </span>
                  </div>

                  <div className="progress-card__numbers">
                    <span>Progreso de las gestiones</span>
                    <strong>{percentage}%</strong>
                  </div>

                  <div
                    className="progress-card__bar"
                    role="progressbar"
                    aria-label={`Progreso de ${event.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <span
                      className="progress-card__fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="progress-card__footer">
                    <span>
                      <strong>
                        {event.completedSubtasks ?? 0}
                      </strong>{' '}
                      de{' '}
                      <strong>
                        {event.totalSubtasks ?? 0}
                      </strong>{' '}
                      gestiones completadas
                    </span>

                    <Link
                      className="progress-card__link"
                      to={`/evento/${event.id}`}
                    >
                      Ver evento{' '}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}

export default ProgressPage
