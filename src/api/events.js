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