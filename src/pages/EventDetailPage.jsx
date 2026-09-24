import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EventForm from '../components/EventForm'
import ConfirmDialog from '../components/ConfirmDialog'
import SubtaskSection from '../components/SubtaskSection'
import { deleteEvent, getEvent, listSubtasks, updateEvent } from '../api/events'
import { eventTypeLabel } from '../lib/validation'
import { formatDateTime } from '../lib/format'
import { useToast } from '../lib/toast'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [event, setEvent] = useState(null)
  const [subtasks, setSubtasks] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setLoadError(null)
    setEvent(null)
    try {
      const [ev, subs] = await Promise.all([getEvent(id), listSubtasks(id)])
      setEvent(ev)
      setSubtasks(subs ?? [])
    } catch (err) {
      setLoadError(err)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de datos
    load()
  }, [load])

  async function handleUpdate(data) {
    const updated = await updateEvent(id, data)
    setEvent(updated)
    setEditing(false)
    toast({ message: 'Cambios guardados.' })
  }

  async function handleDelete() {
    await deleteEvent(id)
    toast({ message: `Evento “${event.name}” eliminado.` })
    navigate('/eventos', { replace: true })
  }

  if (loadError) {
    const notFound = loadError.status === 404
    return (
      <div className="page page--narrow">
        <Link to="/eventos" className="back-link">← Volver a mis eventos</Link>
        <div className="alert alert--error alert--block" role="alert">
          <p>{notFound ? 'Este evento no existe o fue eliminado.' : loadError.message || 'No se pudo cargar el evento.'}</p>
          {!notFound && <button type="button" className="btn btn--ghost" onClick={load}>Reintentar</button>}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="page page--narrow">
        <p className="loading" role="status">Cargando evento…</p>
      </div>
    )
  }

  return (
    <div className="page page--narrow">
      <Link to="/eventos" className="back-link">← Volver a mis eventos</Link>

      <section className="card" aria-labelledby="event-title">
        {editing ? (
          <>
            <h1 id="event-title" className="card__title">Editar evento</h1>
            <EventForm
              initialEvent={event}
              submitLabel="Guardar cambios"
              errorPrefix="No se pudo actualizar el evento."
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </>
        ) : (
          <>
            <header className="card__header">
              <div>
                <span className={`badge badge--${event.type}`}>{eventTypeLabel(event.type)}</span>
                <h1 id="event-title" className="page__title">{event.name}</h1>
              </div>
              <div className="card__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setEditing(true)}>Editar</button>
                <button type="button" className="btn btn--ghost-danger" onClick={() => setConfirmDelete(true)}>
                  Eliminar
                </button>
              </div>
            </header>
            <dl className="details">
              <div><dt>Fecha y hora</dt><dd>{formatDateTime(event.date)}</dd></div>
              <div><dt>Lugar</dt><dd>{event.location}</dd></div>
              <div><dt>Cliente / contacto</dt><dd>{event.client}</dd></div>
            </dl>
          </>
        )}
      </section>

      <SubtaskSection eventId={id} subtasks={subtasks} onChange={setSubtasks} />

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este evento?"
        confirmLabel="Eliminar evento"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        <p>
          Vas a eliminar <strong>{event.name}</strong>
          {subtasks.length > 0 &&
            (subtasks.length === 1 ? ' y su gestión logística' : ` y sus ${subtasks.length} gestiones logísticas`)}
          .
        </p>
      </ConfirmDialog>
    </div>
  )
}
