import { request, USE_MOCK } from './client'
import { mockRequest } from './mock'

const send = USE_MOCK ? mockRequest : request

// Eventos
export const listEvents = () => send('/events')
export const getEvent = (id) => send(`/events/${id}`)
export const createEvent = (data) => send('/events', { method: 'POST', body: data })
export const updateEvent = (id, data) => send(`/events/${id}`, { method: 'PATCH', body: data })
export const deleteEvent = (id) => send(`/events/${id}`, { method: 'DELETE' })

// Subtareas logísticas (gestiones)
export const listSubtasks = (eventId) => send(`/events/${eventId}/subtasks`)
export const createSubtask = (eventId, data) =>
  send(`/events/${eventId}/subtasks`, { method: 'POST', body: data })
export const updateSubtask = (eventId, subtaskId, data) =>
  send(`/events/${eventId}/subtasks/${subtaskId}`, { method: 'PATCH', body: data })
export const deleteSubtask = (eventId, subtaskId) =>
  send(`/events/${eventId}/subtasks/${subtaskId}`, { method: 'DELETE' })
