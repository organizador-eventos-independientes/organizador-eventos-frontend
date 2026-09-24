import { useState } from 'react'
import SubtaskForm from './SubtaskForm'
import ConfirmDialog from './ConfirmDialog'
import { createSubtask, deleteSubtask, updateSubtask } from '../api/events'
import { formatDate, formatHours } from '../lib/format'
import { useToast } from '../lib/toast'

const byDeadline = (a, b) => a.deadline.localeCompare(b.deadline)

// Bloque de gestiones logísticas dentro del detalle del evento. Crear, editar
// y eliminar ocurren aquí mismo, sin navegar a otra ruta.
export default function SubtaskSection({ eventId, subtasks, onChange }) {
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const totalHours = subtasks.reduce((sum, s) => sum + Number(s.estimatedHours || 0), 0)

  async function handleCreate(data) {
    const created = await createSubtask(eventId, data)
    onChange([...subtasks, created].sort(byDeadline))
    toast({ message: `Gestión “${created.name}” agregada.` })
  }

  async function handleUpdate(id, data) {
    const updated = await updateSubtask(eventId, id, data)
    onChange(subtasks.map((s) => (s.id === id ? updated : s)).sort(byDeadline))
    setEditingId(null)
    toast({ message: 'Cambios guardados.' })
  }

  async function handleDelete() {
    await deleteSubtask(eventId, toDelete.id)
    onChange(subtasks.filter((s) => s.id !== toDelete.id))
    toast({ message: 'Gestión eliminada.' })
    setToDelete(null)
  }

  return (
    <section className="card" aria-labelledby="subtasks-title">
      <header className="card__header">
        <div>
          <h2 id="subtasks-title" className="card__title">Gestiones logísticas</h2>
          {subtasks.length > 0 && (
            <p className="muted">
              {subtasks.length} {subtasks.length === 1 ? 'gestión' : 'gestiones'} · {formatHours(totalHours)} estimadas
            </p>
          )}
        </div>
        {subtasks.length > 0 && !adding && (
          <button type="button" className="btn btn--primary" onClick={() => { setAdding(true); setEditingId(null) }}>
            + Agregar gestión
          </button>
        )}
      </header>

      {adding && (
        <div className="subtask-new">
          <h3 className="subtask-new__title">Nueva gestión</h3>
          <SubtaskForm
            idPrefix="new-subtask"
            submitLabel="Agregar gestión"
            resetOnSuccess
            onSubmit={handleCreate}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {subtasks.length === 0 && !adding ? (
        <div className="empty empty--compact">
          <p className="empty__title">Aún no tienes gestiones logísticas</p>
          <p className="muted">
            Divide el evento en tareas concretas, como “Reservar salón” o “Confirmar catering”, con su plazo y
            horas estimadas.
          </p>
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            Agregar gestión
          </button>
        </div>
      ) : (
        <ul className="subtasks">
          {subtasks.map((s) =>
            editingId === s.id ? (
              <li key={s.id} className="subtasks__item subtasks__item--editing">
                <SubtaskForm
                  idPrefix={`edit-${s.id}`}
                  initialSubtask={s}
                  submitLabel="Guardar cambios"
                  onSubmit={(data) => handleUpdate(s.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={s.id} className="subtasks__item">
                <div className="subtasks__main">
                  <p className="subtasks__name">{s.name}</p>
                  <p className="muted subtasks__meta">
                    <span>Plazo: {formatDate(s.deadline)}</span>
                    <span>{formatHours(s.estimatedHours)}</span>
                  </p>
                </div>
                <div className="subtasks__actions">
                  <button type="button" className="btn btn--small btn--ghost"
                    onClick={() => { setEditingId(s.id); setAdding(false) }}
                    aria-label={`Editar gestión ${s.name}`}>
                    Editar
                  </button>
                  <button type="button" className="btn btn--small btn--ghost-danger"
                    onClick={() => setToDelete(s)} aria-label={`Eliminar gestión ${s.name}`}>
                    Eliminar
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="¿Eliminar esta gestión?"
        confirmLabel="Eliminar gestión"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      >
        <p>
          Vas a eliminar <strong>{toDelete?.name}</strong> del plan del evento.
        </p>
      </ConfirmDialog>
    </section>
  )
}
