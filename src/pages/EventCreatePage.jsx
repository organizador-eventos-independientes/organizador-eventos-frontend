import { Link, useNavigate } from 'react-router-dom'
import EventForm from '../components/EventForm'
import { createEvent } from '../api/events'
import { useToast } from '../lib/toast'

export default function EventCreatePage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  async function handleSubmit(data) {
    const event = await createEvent(data)
    toast({ message: `¡Listo! El evento “${event.name}” se creó correctamente.` })
    navigate(`/evento/${event.id}`)
  }

  return (
    <div className="page page--narrow">
      <Link to="/eventos" className="back-link">← Volver a mis eventos</Link>
      <header className="page__header">
        <div>
          <h1 className="page__title">Crear evento</h1>
          <p className="muted">
            Un evento es la celebración o reunión que vas a organizar. Registra sus datos básicos y luego podrás
            dividirlo en gestiones logísticas.
          </p>
        </div>
      </header>

      <section className="card">
        <EventForm submitLabel="Guardar" errorPrefix="No se pudo crear el evento." onSubmit={handleSubmit} onCancel={() => navigate('/eventos')} />
      </section>
    </div>
  )
}
