import { request as send } from './client'

// Convierte los datos del Frontend al formato que espera Django
function eventToBackend(data) {
  const date = data.date ? data.date.slice(0, 10) : ''
  const time = data.date ? data.date.slice(11, 19) : ''

  return {
    titulo: data.name,
    tipo: data.type,
    cliente: data.client,
    fecha: date,
    hora: time,
    lugar: data.location,
  }
}

// Convierte la respuesta de Django al formato que usa el Frontend
function eventToFrontend(data) {
  return {
    id: data.id,
    name: data.titulo,
    type: data.tipo,
    client: data.cliente,
    date: data.fecha && data.hora
      ? `${data.fecha}T${data.hora}`
      : '',
    location: data.lugar,
  }
}

// Convierte los datos de una subtarea al formato que espera Django
function subtaskToBackend(data) {
  return {
    nombre: data.name,
    plazo: data.deadline,
    horas_estimadas: data.estimatedHours,
  }
}

// Convierte la respuesta de Django al formato que usa el Frontend
function subtaskToFrontend(data) {
  return {
    id: data.id,
    name: data.nombre,
    deadline: data.plazo,
    estimatedHours: data.horas_estimadas,
    // Pendiente al crearla; Hecha o Pospuesta una vez registrada (US-09).
    status: data.estado ?? 'Pendiente',
    statusNote: data.nota_estado ?? '',
  }
}


// Eventos
export const listEvents = async () => {
  const data = await send('/eventos/')
  return data.map(eventToFrontend)
}

export const getEvent = async (id) => {
  const data = await send(`/eventos/${id}/`)
  return eventToFrontend(data)
}

export const createEvent = async (data) => {
  const response = await send('/eventos/', {
    method: 'POST',
    body: eventToBackend(data),
  })
  return eventToFrontend(response)
}

export const updateEvent = async (id, data) => {
  const response = await send(`/eventos/${id}/`, {
    method: 'PATCH',
    body: eventToBackend(data),
  })
  return eventToFrontend(response)
}

export const deleteEvent = (id) =>
  send(`/eventos/${id}/`, { method: 'DELETE' })

// Subtareas logísticas
export const listSubtasks = async (eventId) => {
  const data = await send(`/eventos/${eventId}/subtareas/`)
  return data.map(subtaskToFrontend)
}

// Los eventos y todas sus gestiones, cada una con los datos de su evento
// { eventId, eventName, eventType, eventDate }.
// Si el backend expone un endpoint agregado (ej. /subtareas/), basta con
// cambiar esta función.
export const listEventsWithSubtasks = async () => {
  const events = await listEvents()
  const perEvent = await Promise.all(
    events.map(async (ev) => {
      const subtasks = await listSubtasks(ev.id)
      return subtasks.map((s) => ({ ...s, eventId: ev.id, eventName: ev.name, eventType: ev.type, eventDate: ev.date }))
    }),
  )
  return { events, subtasks: perEvent.flat() }
}

// Crear o editar: si ese día pasa del límite diario no se guarda y el error
// trae `conflict`, con las mismas opciones para resolverlo que al reprogramar.
export const createSubtask = async (eventId, data) => {
  const response = await withConflict(send(`/eventos/${eventId}/subtareas/`, {
    method: 'POST',
    body: subtaskToBackend(data),
  }))
  return subtaskToFrontend(response)
}

export const updateSubtask = async (eventId, subtaskId, data) => {
  const response = await withConflict(send(`/subtareas/${subtaskId}/`, {
    method: 'PATCH',
    body: subtaskToBackend(data),
  }))
  return subtaskToFrontend(response)
}

export const deleteSubtask = (eventId, subtaskId) =>
  send(`/subtareas/${subtaskId}/`, { method: 'DELETE' })


export const updateSubtaskStatus = async (subtaskId, { status, statusNote = '' }) => {
  const response = await send(`/subtareas/${subtaskId}/estado/`, {
    method: 'PATCH',
    body: {
      estado: status,
      nota_estado: statusNote,
    },
  })

  return subtaskToFrontend(response)
}

export const getEventProgress = async (eventId) => {
  const data = await send(`/eventos/${eventId}/progreso/`)

  return {
    eventId: data.evento_id,
    totalSubtasks: data.total_gestiones,
    completedSubtasks: data.gestiones_hechas,
    percentage: data.porcentaje,
  }
}

// Conflicto por sobrecarga diaria (US-07 y US-08) que devuelve el backend al
// reprogramar (409) o al crear o editar una gestión (400).
function conflictToFrontend(data, message) {
  return {
    message: data.mensaje ?? message,
    date: data.fecha,
    limit: Number(data.limite),
    planned: Number(data.planificadas),
    hours: Number(data.horas_gestion),
    total: Number(data.total),
    availableHours: Number(data.horas_disponibles),
    nextFreeDate: data.siguiente_dia_disponible,
    subtasks: data.gestiones_del_dia.map((s) => ({ ...subtaskToFrontend(s), eventName: s.evento_titulo })),
  }
}

async function withConflict(request) {
  try {
    return await request
  } catch (err) {
    if (err.body?.conflicto) err.conflict = conflictToFrontend(err.body.conflicto, err.message)
    throw err
  }
}

// Reprogramar (US-06): cambia la fecha objetivo y, si se indican, las horas
// estimadas. Si ese día supera el límite diario no se guarda: el error trae
// `conflict` con lo necesario para resolverlo (US-07).
export const rescheduleSubtask = async (subtaskId, { deadline, estimatedHours }) => {
  const body = { plazo: deadline }
  if (estimatedHours != null) body.horas_estimadas = estimatedHours
  const response = await withConflict(send(`/subtareas/${subtaskId}/reprogramar/`, { method: 'PATCH', body }))
  return subtaskToFrontend(response)
}

// Límite diario de horas de gestión del organizador (US-12). `isDefault`: nunca
// lo guardó y vale 6 h.
function dailyLimitToFrontend(data) {
  return { hours: Number(data.limite_horas_diarias), isDefault: Boolean(data.por_defecto) }
}

// El nuevo límite deja días por encima de lo planificado: esos días con sus
// gestiones y el límite más bajo que sí cabe (`minLimit`, null si ninguno).
function limitConflictToFrontend(data) {
  return {
    message: data.mensaje,
    limit: Number(data.limite),
    minLimit: data.limite_minimo == null ? null : Number(data.limite_minimo),
    days: data.dias.map((d) => ({
      date: d.fecha,
      planned: Number(d.planificadas),
      excess: Number(d.exceso),
      subtasks: d.gestiones.map((s) => ({
        ...subtaskToFrontend(s),
        eventId: s.evento,
        eventName: s.evento_titulo,
      })),
    })),
  }
}

export const getDailyLimit = async () => dailyLimitToFrontend(await send('/configuracion/'))

// Si el límite queda por debajo de algún día, el error trae `limitConflict`.
export const updateDailyLimit = async (hours) => {
  try {
    return dailyLimitToFrontend(
      await send('/configuracion/', {
        method: 'PATCH',
        body: { limite_horas_diarias: hours },
      }),
    )
  } catch (err) {
    if (err.body?.conflicto) err.limitConflict = limitConflictToFrontend(err.body.conflicto)
    throw err
  }
}