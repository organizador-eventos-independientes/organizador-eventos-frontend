import { useEffect, useRef, useState } from 'react'
import SubtaskForm from './SubtaskForm'
import SubtaskItem from './SubtaskItem'
import ConfirmDialog from './ConfirmDialog'
import { createSubtask, deleteSubtask, rescheduleSubtask, updateSubtask, updateSubtaskStatus } from '../api/events'
import { formatMinutes, toMinutes } from '../lib/format'
import { rescheduleMessage, statusMessage } from '../lib/today'
import { useToast } from '../lib/toast'

const byDeadline = (a, b) => a.deadline.localeCompare(b.deadline)

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Bloque de gestiones logísticas dentro del detalle del evento. Cada gestión se
// ve igual que en Hoy (SubtaskItem), con sus mismos botones "Reprogramar",
// "Hecha" y "Posponer", y además "Editar" y "Eliminar". Todo ocurre aquí mismo,
// sin navegar a otra ruta.
export default function SubtaskSection({ eventId, eventDate, subtasks, onChange }) {
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  // Formulario abierto en una gestión: { id, mode: 'edit' | 'reschedule' | 'postpone' }.
  const [openForm, setOpenForm] = useState(null)
  const [movedId, setMovedId] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  // Id del botón que recibe el foco tras el próximo render.
  const focusAfterRender = useRef(null)

  // Se suma en minutos para que, p. ej., tres gestiones de 0:20 den 1 h exacta.
  const totalMinutes = subtasks.reduce((sum, s) => sum + toMinutes(s.estimatedHours || 0), 0)

  // Al cerrar "Reprogramar" o "Posponer" el foco vuelve al botón que lo abrió; si
  // la gestión cambió de lugar en la lista, la página se desplaza hasta ella.
  useEffect(() => {
    const id = focusAfterRender.current
    if (!id) return
    focusAfterRender.current = null
    const button = document.getElementById(id)
    if (!button) return
    button.focus({ preventScroll: true })
    button.closest('li')?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  })

  function openFormFor(subtask, mode) {
    setOpenForm({ id: subtask.id, mode })
    setAdding(false)
    setMovedId(null)
  }

  function closeForm(subtask, mode) {
    focusAfterRender.current = `${mode === 'postpone' ? 'posponer' : 'reprogramar'}-gestion-${subtask.id}`
    setOpenForm(null)
  }

  async function handleCreate(data) {
    const created = await createSubtask(eventId, data)
    onChange([...subtasks, created].sort(byDeadline))
    toast({ message: `Gestión “${created.name}” agregada.` })
  }

  async function handleUpdate(id, data) {
    const updated = await updateSubtask(eventId, id, data)
    onChange(subtasks.map((s) => (s.id === id ? updated : s)).sort(byDeadline))
    setOpenForm(null)
    toast({ message: 'Cambios guardados.' })
  }

  // Si falla o hay conflicto de sobrecarga (US-07), el error llega al
  // formulario, que conserva la fecha y las horas elegidas.
  async function handleReschedule(subtask, changes) {
    const updated = await rescheduleSubtask(subtask.id, changes)
    onChange(subtasks.map((s) => (s.id === subtask.id ? { ...s, ...updated } : s)).sort(byDeadline))
    closeForm(subtask, 'reschedule')
    setMovedId(subtask.id)
    toast({ message: rescheduleMessage(subtask, updated) })
  }

  // "Hecha" y "Pendiente" guardan al instante; "Posponer" llega desde su
  // formulario, que se cierra. Si falla, el error se muestra en la fila o en
  // el formulario.
  async function handleStatusChange(subtask, changes) {
    const updated = await updateSubtaskStatus(subtask.id, changes)
    onChange(subtasks.map((s) => (s.id === subtask.id ? { ...s, ...updated } : s)))
    if (changes.status === 'Pospuesta') closeForm(subtask, 'postpone')
    toast({ message: statusMessage(updated.status) })
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
              {subtasks.length} {subtasks.length === 1 ? 'gestión' : 'gestiones'} · {formatMinutes(totalMinutes)} estimadas
            </p>
          )}
        </div>
        {subtasks.length > 0 && !adding && (
          <button type="button" className="btn btn--primary" onClick={() => { setAdding(true); setOpenForm(null) }}>
            + Agregar gestión
          </button>
        )}
      </header>

      {adding && (
        <div className="subtask-new">
          <h3 className="subtask-new__title">Nueva gestión</h3>
          <SubtaskForm
            idPrefix="new-subtask"
            eventDate={eventDate}
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
        // `eventDate` en cada gestión: Reprogramar limita la nueva fecha a la del evento.
        <ul className="subtasks">
          {subtasks.map((s) => {
            const mode = openForm?.id === s.id ? openForm.mode : null
            return mode === 'edit' ? (
              <li key={s.id} className="subtasks__item subtasks__item--editing">
                <SubtaskForm
                  idPrefix={`edit-${s.id}`}
                  initialSubtask={s}
                  eventDate={eventDate}
                  submitLabel="Guardar cambios"
                  onSubmit={(data) => handleUpdate(s.id, data)}
                  onCancel={() => setOpenForm(null)}
                />
              </li>
            ) : (
              <SubtaskItem
                key={s.id}
                itemKey={`gestion-${s.id}`}
                subtask={{ ...s, eventDate }}
                openForm={mode}
                moved={movedId === s.id}
                onOpenForm={(m) => openFormFor(s, m)}
                onCloseForm={(m) => closeForm(s, m)}
                onReschedule={(changes) => handleReschedule(s, changes)}
                onSaveStatus={(changes) => handleStatusChange(s, changes)}
                onMovedEnd={() => setMovedId(null)}
                actionsAfter={
                  <>
                    <button type="button" className="btn btn--small btn--ghost"
                      onClick={() => openFormFor(s, 'edit')} aria-label={`Editar gestión ${s.name}`}>
                      Editar
                    </button>
                    <button type="button" className="btn btn--small btn--ghost-danger"
                      onClick={() => setToDelete(s)} aria-label={`Eliminar gestión ${s.name}`}>
                      Eliminar
                    </button>
                  </>
                }
              />
            )
          })}
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
