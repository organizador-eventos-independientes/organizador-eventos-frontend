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

export const createSubtask = async (eventId, data) => {
  const response = await send(`/eventos/${eventId}/subtareas/`, {
    method: 'POST',
    body: subtaskToBackend(data),
  })
  return subtaskToFrontend(response)
}

export const updateSubtask = async (eventId, subtaskId, data) => {
  const response = await send(`/subtareas/${subtaskId}/`, {
    method: 'PATCH',
    body: subtaskToBackend(data),
  })
  return subtaskToFrontend(response)
}

export const deleteSubtask = (eventId, subtaskId) =>
  send(`/subtareas/${subtaskId}/`, { method: 'DELETE' })

// Conflicto por sobrecarga diaria (US-07) que devuelve el backend con un 409.
function conflictToFrontend(data, message) {
  return {
    message,
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

// Reprogramar (US-06): cambia la fecha objetivo y, si se indican, las horas
// estimadas. Si ese día supera el límite diario no se guarda: el error trae
// `conflict` con lo necesario para resolverlo (US-07).
export const rescheduleSubtask = async (subtaskId, { deadline, estimatedHours }) => {
  const body = { plazo: deadline }
  if (estimatedHours != null) body.horas_estimadas = estimatedHours
  try {
    const response = await send(`/subtareas/${subtaskId}/reprogramar/`, { method: 'PATCH', body })
    return subtaskToFrontend(response)
  } catch (err) {
    if (err.status === 409 && err.body?.conflicto) err.conflict = conflictToFrontend(err.body.conflicto, err.message)
    throw err
  }
}

// Límite diario de horas de gestión del organizador (US-12). `isDefault`: nunca
// lo guardó y vale 6 h.
function dailyLimitToFrontend(data) {
  return { hours: Number(data.limite_horas_diarias), isDefault: Boolean(data.por_defecto) }
}

export const getDailyLimit = async () => dailyLimitToFrontend(await send('/configuracion/'))

export const updateDailyLimit = async (hours) =>
  dailyLimitToFrontend(
    await send('/configuracion/', {
      method: 'PATCH',
      body: { limite_horas_diarias: hours },
    }),
  )