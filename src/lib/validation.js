import { formatDate, nowDateTimeLocal, parseDuration, toDateTimeLocal, todayYmd } from './format'

export const EVENT_TYPES = [
  { value: 'boda', label: 'Boda', hint: 'Ceremonia y recepción de una pareja.' },
  { value: 'social', label: 'Social', hint: 'Reuniones, fiestas o celebraciones informales.' },
  { value: 'corporativo', label: 'Corporativo', hint: 'Conferencias, lanzamientos o eventos de empresa.' },
  { value: 'cumpleanos', label: 'Cumpleaños', hint: 'Celebración de cumpleaños de cualquier edad.' },
  { value: 'otro', label: 'Otro', hint: 'Cualquier evento que no encaje en los anteriores.' },
]

export const eventTypeLabel = (value) =>
  EVENT_TYPES.find((t) => t.value === value)?.label ?? 'Otro'

const isBlank = (v) => v == null || String(v).trim() === ''
const isValidDate = (v) => !Number.isNaN(new Date(v).getTime())

// Devuelve { campo: 'mensaje' } con los errores; objeto vacío si es válido.
// `original` es el valor guardado al editar: si la fecha no cambió no se exige
// que sea futura, para poder editar otros campos de un evento ya pasado.
export function validateEvent(data, original) {
  const errors = {}

  if (isBlank(data.name)) errors.name = 'Escribe el nombre del evento.'
  else if (data.name.trim().length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.'
  else if (data.name.trim().length > 120) errors.name = 'El nombre no puede superar 120 caracteres.'

  if (isBlank(data.type)) errors.type = 'Elige el tipo de evento.'
  else if (!EVENT_TYPES.some((t) => t.value === data.type)) errors.type = 'Elige un tipo de la lista.'

  if (isBlank(data.client)) errors.client = 'Indica el cliente o persona de contacto.'
  else if (data.client.trim().length > 120) errors.client = 'El cliente no puede superar 120 caracteres.'

  if (isBlank(data.date)) errors.date = 'Selecciona la fecha y hora del evento.'
  else if (!isValidDate(data.date)) errors.date = 'La fecha no es válida.'
  else if (
    toDateTimeLocal(data.date) < nowDateTimeLocal() &&
    toDateTimeLocal(data.date) !== toDateTimeLocal(original?.date)
  )
    errors.date = 'La fecha y hora deben ser posteriores al momento actual.'

  if (isBlank(data.location)) errors.location = 'Indica el lugar del evento.'
  else if (data.location.trim().length > 160) errors.location = 'El lugar no puede superar 160 caracteres.'

  return errors
}

// La fecha de una gestión no puede ser posterior a la del evento (el mismo día
// sí). `eventDate` es la fecha y hora del evento; si falta, no se comprueba.
const isAfterEvent = (deadline, eventDate) => Boolean(eventDate) && deadline.slice(0, 10) > eventDate.slice(0, 10)

// `eventDate`: fecha del evento al que pertenece la gestión.
export function validateSubtask(data, original, eventDate) {
  const errors = {}

  if (isBlank(data.name)) errors.name = 'Escribe el nombre de la gestión (ej. "Reservar salón").'
  else if (data.name.trim().length > 120) errors.name = 'El nombre no puede superar 120 caracteres.'

  if (isBlank(data.deadline)) errors.deadline = 'Selecciona la fecha objetivo.'
  else if (!isValidDate(data.deadline)) errors.deadline = 'La fecha no es válida.'
  else if (data.deadline.slice(0, 10) < todayYmd() && data.deadline !== original?.deadline?.slice(0, 10))
    errors.deadline = 'El plazo no puede ser una fecha anterior a hoy.'
  else if (isAfterEvent(data.deadline, eventDate))
    errors.deadline = `El plazo no puede ser posterior a la fecha del evento (${formatDate(eventDate)}).`

  const hoursError = validateDuration(data.estimatedHours)
  if (hoursError) errors.estimatedHours = hoursError

  return errors
}

// Horas estimadas de una gestión (al crearla, editarla o reprogramarla), en
// horas y minutos de reloj con el texto del campo (DurationInput): "2:45", o
// solo las horas ("2"). Devuelve el mensaje de error o '' si son válidas.
export function validateDuration(text) {
  const value = String(text ?? '').trim()
  if (!value) return 'Indica las horas estimadas.'
  const match = /^(\d{1,3})(?::(\d{1,2}))?$/.exec(value)
  if (!match) return 'Usa horas:minutos (ej. 2:45).'
  if (Number(match[2] ?? 0) > 59) return 'Los minutos van de 0 a 59 (ej. 2:45 en vez de 2:75).'
  if (parseDuration(value) <= 0) return 'Las horas estimadas deben ser mayores que 0.'
  return ''
}

// Reprogramar (US-06). Devuelve el mensaje de error o '' si la fecha es válida.
// Una gestión vencida se puede mover, pero no a otra fecha ya pasada ni a una
// posterior a la fecha del evento.
export function validateNewDeadline(deadline, eventDate) {
  if (isBlank(deadline)) return 'Selecciona la nueva fecha objetivo.'
  if (!isValidDate(deadline)) return 'La fecha no es válida.'
  if (deadline.slice(0, 10) < todayYmd()) return 'La fecha objetivo no puede ser anterior a hoy.'
  if (isAfterEvent(deadline, eventDate))
    return `La fecha objetivo no puede ser posterior a la fecha del evento (${formatDate(eventDate)}).`
  return ''
}

// Límite diario de horas de gestión (US-12): entre 1 y 16 h, ambos incluidos.
export const DAILY_LIMIT_MIN = 1
export const DAILY_LIMIT_MAX = 16
const DAILY_LIMIT_RANGE = `El límite debe estar entre ${DAILY_LIMIT_MIN} y ${DAILY_LIMIT_MAX} horas.`

// Devuelve el mensaje de error o '' si el límite es válido.
export function validateDailyLimit(value) {
  const hours = Number(value)
  if (isBlank(value)) return 'Indica tu límite diario de horas.'
  if (!Number.isFinite(hours)) return `El límite debe ser un número. ${DAILY_LIMIT_RANGE}`
  if (hours < DAILY_LIMIT_MIN || hours > DAILY_LIMIT_MAX) return DAILY_LIMIT_RANGE
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return 'Usa máximo 2 decimales (ej. 6.5).'
  return ''
}
