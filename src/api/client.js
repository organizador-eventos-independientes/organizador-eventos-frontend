import { expireSession, getSession } from '../lib/session'

// Cliente HTTP para el backend. La URL base se define con VITE_API_URL
// (ej. http://localhost:8000/api); por defecto apunta al servidor local de Django.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

// `body` es la respuesta del backend tal cual (p. ej. los datos de un conflicto 409).
export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, body = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.body = body
  }
}

// Campos del backend (Django) -> campos de los formularios del frontend.
const FIELD_NAMES = {
  titulo: 'name',
  tipo: 'type',
  cliente: 'client',
  fecha: 'date',
  hora: 'date',
  lugar: 'location',
  nombre: 'name',
  plazo: 'deadline',
  horas_estimadas: 'estimatedHours',
  limite_horas_diarias: 'dailyLimit',
}

const firstMessage = (v) => (Array.isArray(v) ? String(v[0]) : String(v))

// Normaliza los errores por campo que envíe el backend. Acepta:
//   { titulo: ['msg'] }                           (Django REST Framework)
//   { errors: { name: 'msg' } }
//   { errors: [{ field: 'name', message: 'msg' }] }
function parseFieldErrors(body) {
  if (!body || typeof body !== 'object') return {}
  const errors = body.errors ?? body.error?.details ?? body
  if (!errors) return {}
  if (Array.isArray(errors)) {
    return Object.fromEntries(
      errors
        .filter((e) => e?.field)
        .map((e) => [FIELD_NAMES[e.field] ?? e.field, e.message ?? e.msg ?? 'Valor no válido']),
    )
  }
  const result = {}
  for (const [key, value] of Object.entries(errors)) {
    if (['message', 'error', 'detail', 'non_field_errors'].includes(key)) continue
    const field = FIELD_NAMES[key] ?? key
    result[field] ??= firstMessage(value)
  }
  return result
}

// Mensaje general del error: DRF usa `detail` o `non_field_errors`.
function parseMessage(body, status) {
  const candidates = [body?.message, body?.error, body?.detail, body?.non_field_errors]
  const found = candidates.find((c) => c && (typeof c === 'string' || Array.isArray(c)))
  if (found) return firstMessage(found)
  if (status === 400) return 'Revisa los campos marcados.'
  if (status === 404) return 'No encontramos el elemento solicitado.'
  return 'Ocurrió un error inesperado.'
}

export async function request(path, { method = 'GET', body } = {}) {
  const token = getSession()?.token
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Token ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  if (res.status === 204) return null

  const json = await res.json().catch(() => null)

  if (res.status === 401 && token) {
    // El servidor ya no acepta el token (p. ej. se cerró la sesión en otro
    // navegador): se cierra aquí también y las rutas privadas llevan al login.
    expireSession(token)
    throw new ApiError('Tu sesión expiró. Inicia sesión de nuevo.', { status: 401 })
  }

  if (!res.ok) {
    throw new ApiError(parseMessage(json, res.status), {
      status: res.status,
      fieldErrors: res.status === 400 ? parseFieldErrors(json) : {},
      body: json,
    })
  }

  // Respuesta consistente (TS-03): { data, message } o el recurso directo.
  return json && typeof json === 'object' && 'data' in json ? json.data : json
}
