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
export function validateEvent(data) {
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

  if (isBlank(data.location)) errors.location = 'Indica el lugar del evento.'
  else if (data.location.trim().length > 160) errors.location = 'El lugar no puede superar 160 caracteres.'

  return errors
}

export function validateSubtask(data) {
  const errors = {}

  if (isBlank(data.name)) errors.name = 'Escribe el nombre de la gestión (ej. "Reservar salón").'
  else if (data.name.trim().length > 120) errors.name = 'El nombre no puede superar 120 caracteres.'

  if (isBlank(data.deadline)) errors.deadline = 'Selecciona la fecha objetivo.'
  else if (!isValidDate(data.deadline)) errors.deadline = 'La fecha no es válida.'

  const hours = Number(data.estimatedHours)
  if (isBlank(data.estimatedHours)) errors.estimatedHours = 'Indica las horas estimadas.'
  else if (!Number.isFinite(hours)) errors.estimatedHours = 'Las horas deben ser un número (ej. 4 o 1.5).'
  else if (hours <= 0) errors.estimatedHours = 'Las horas deben ser mayores que 0.'
  else if (hours > 1000) errors.estimatedHours = 'Las horas no pueden superar 1000.'
  else if (!/^\d+(\.\d{1,2})?$/.test(String(data.estimatedHours).trim()))
    errors.estimatedHours = 'Usa máximo 2 decimales (ej. 1.5).'

  return errors
}
