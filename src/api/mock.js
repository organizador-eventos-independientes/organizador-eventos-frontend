// Backend simulado sobre localStorage. Replica las rutas y validaciones del
// backend real (400 con errores por campo, 404, borrado en cascada) para
// que el frontend pueda probarse sin servidor.
import { ApiError } from './client'
import { validateEvent, validateSubtask } from '../lib/validation'

const KEY = 'organizador-eventos:db'
const LATENCY_MS = 300

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? { events: [], subtasks: [] }
  } catch {
    return { events: [], subtasks: [] }
  }
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

const wait = () => new Promise((r) => setTimeout(r, LATENCY_MS))
const newId = () => crypto.randomUUID()
const now = () => new Date().toISOString()

function badRequest(errors) {
  return new ApiError('Revisa los campos marcados.', { status: 400, fieldErrors: errors })
}

function notFound(what) {
  return new ApiError(`No encontramos ${what}.`, { status: 404 })
}

function pickEvent(src) {
  const { name, type, client, date, location } = src
  return { name, type, client, date, location }
}

function pickSubtask(src) {
  const { name, deadline, estimatedHours } = src
  return { name, deadline, estimatedHours: Number(estimatedHours) }
}

function findEvent(db, id) {
  const event = db.events.find((e) => e.id === id)
  if (!event) throw notFound('el evento')
  return event
}

export async function mockRequest(path, { method = 'GET', body } = {}) {
  await wait()
  const db = load()
  const parts = path.split('/').filter(Boolean) // ['events', id?, 'subtasks'?, subId?]
  if (parts[0] !== 'events') throw notFound('la ruta')
  const [, eventId, sub, subtaskId] = parts

  // /events
  if (!eventId) {
    if (method === 'GET') {
      return [...db.events].sort((a, b) => a.date.localeCompare(b.date))
    }
    if (method === 'POST') {
      const data = pickEvent(body ?? {})
      const errors = validateEvent(data)
      if (Object.keys(errors).length) throw badRequest(errors)
      const event = { id: newId(), ...data, createdAt: now(), updatedAt: now() }
      db.events.push(event)
      save(db)
      return event
    }
  }

  // /events/:id
  if (eventId && !sub) {
    const event = findEvent(db, eventId)
    if (method === 'GET') return event
    if (method === 'PATCH') {
      const data = { ...pickEvent(event), ...pickEvent({ ...event, ...body }) }
      const errors = validateEvent(data)
      if (Object.keys(errors).length) throw badRequest(errors)
      Object.assign(event, data, { updatedAt: now() })
      save(db)
      return event
    }
    if (method === 'DELETE') {
      db.events = db.events.filter((e) => e.id !== eventId)
      db.subtasks = db.subtasks.filter((s) => s.eventId !== eventId) // cascada
      save(db)
      return null
    }
  }

  // /events/:id/subtasks[/:subtaskId]
  if (eventId && sub === 'subtasks') {
    findEvent(db, eventId)
    if (!subtaskId) {
      if (method === 'GET') {
        return db.subtasks
          .filter((s) => s.eventId === eventId)
          .sort((a, b) => a.deadline.localeCompare(b.deadline))
      }
      if (method === 'POST') {
        const data = pickSubtask(body ?? {})
        const errors = validateSubtask(data)
        if (Object.keys(errors).length) throw badRequest(errors)
        const subtask = { id: newId(), eventId, ...data, createdAt: now(), updatedAt: now() }
        db.subtasks.push(subtask)
        save(db)
        return subtask
      }
    } else {
      const subtask = db.subtasks.find((s) => s.id === subtaskId && s.eventId === eventId)
      if (!subtask) throw notFound('la gestión')
      if (method === 'PATCH') {
        const data = pickSubtask({ ...subtask, ...body })
        const errors = validateSubtask(data)
        if (Object.keys(errors).length) throw badRequest(errors)
        Object.assign(subtask, data, { updatedAt: now() })
        save(db)
        return subtask
      }
      if (method === 'DELETE') {
        db.subtasks = db.subtasks.filter((s) => s.id !== subtaskId)
        save(db)
        return null
      }
    }
  }

  throw new ApiError('Operación no soportada.', { status: 405 })
}
