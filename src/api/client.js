// Cliente HTTP para el backend. La URL base se define con VITE_API_URL
// (ej. http://localhost:3000/api). Si no se define, la app usa el
// adaptador simulado (localStorage) para poder trabajar sin backend.
export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
export const USE_MOCK = !API_URL

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {} } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Normaliza los errores por campo que envíe el backend. Acepta:
//   { errors: { name: 'msg' } }
//   { errors: [{ field: 'name', message: 'msg' }] }
function parseFieldErrors(body) {
  const errors = body?.errors ?? body?.error?.details
  if (!errors) return {}
  if (Array.isArray(errors)) {
    return Object.fromEntries(
      errors
        .filter((e) => e?.field)
        .map((e) => [e.field, e.message ?? e.msg ?? 'Valor no válido']),
    )
  }
  if (typeof errors === 'object') {
    return Object.fromEntries(
      Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]),
    )
  }
  return {}
}

export async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  if (res.status === 204) return null

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      (typeof json?.message === 'string' && json.message) ||
      (typeof json?.error === 'string' && json.error) ||
      (res.status === 404 ? 'No encontramos el elemento solicitado.' : 'Ocurrió un error inesperado.')
    throw new ApiError(message, { status: res.status, fieldErrors: parseFieldErrors(json) })
  }

  // Respuesta consistente (TS-03): { data, message } o el recurso directo.
  return json && typeof json === 'object' && 'data' in json ? json.data : json
}
