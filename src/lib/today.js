// Regla de la vista "Hoy" (US-04). Agrupa las gestiones por su fecha respecto
// a hoy y las ordena dentro de cada grupo.

import { formatHours } from './format'

const DAY_MS = 24 * 60 * 60 * 1000

// Días entre dos fechas "YYYY-MM-DD" (b - a). Se usa UTC para evitar
// desfases por cambio de horario.
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS)
}

// Plazo más cercano primero; empate: menor esfuerzo estimado primero.
// El nombre solo garantiza un orden estable si todo lo demás coincide.
function byDeadlineThenEffort(a, b) {
  return (
    a.deadline.localeCompare(b.deadline) ||
    Number(a.estimatedHours) - Number(b.estimatedHours) ||
    a.name.localeCompare(b.name, 'es')
  )
}

// Devuelve { overdue, today, upcoming }: fecha anterior a hoy, igual a hoy y
// posterior a hoy (US-04, escenario 1).

export function groupSubtasks(subtasks, todayYmd) {
  const groups = { overdue: [], today: [], upcoming: [] }

  for (const s of subtasks) {
    // Las gestiones completadas ya no se invluyen en la agenda
    if (s.status === 'Hecha') continue

    const deadline = s.deadline.slice(0, 10)
    const diff = daysBetween(todayYmd, deadline)
    const item = { ...s, deadline, daysLeft: diff }

    if (diff < 0) groups.overdue.push(item)
    else if (diff === 0) groups.today.push(item)
    else groups.upcoming.push(item)
  }

  for (const list of Object.values(groups)) {
    list.sort(byDeadlineThenEffort)
  }

  return groups
}

// Texto corto de la fecha relativa a hoy.
export function relativeDeadline(daysLeft) {
  if (daysLeft < -1) return `Venció hace ${-daysLeft} días`
  if (daysLeft === -1) return 'Venció ayer'
  if (daysLeft === 0) return 'Vence hoy'
  if (daysLeft === 1) return 'Vence mañana'
  return `Vence en ${daysLeft} días`
}

// Aviso tras reprogramar (US-06): qué cambió, la fecha, las horas o ambas.
export function rescheduleMessage(before, after) {
  const hours = formatHours(after.estimatedHours)
  if (Number(after.estimatedHours) === Number(before.estimatedHours)) return 'Fecha actualizada.'
  if (after.deadline !== before.deadline) return `Fecha actualizada. Horas estimadas: ${hours}.`
  return `Horas estimadas actualizadas: ${hours}.`
}

// Aviso tras cambiar el estado de una gestión (US-09).
export function statusMessage(status) {
  if (status === 'Hecha') return 'Gestión marcada como hecha.'
  if (status === 'Pospuesta') return 'Gestión pospuesta.'
  return 'La gestión volvió a pendiente.'
}

// Por qué no se pudo cambiar el estado. 400: lo explica el backend (p. ej.
// reabrir una hecha en un día que ya no tiene espacio).
export function statusFailureMessage(err) {
  if (err?.status === 400 && err.message && !Object.keys(err.fieldErrors ?? {}).length) return err.message
  if (err?.status === 400) return 'No se pudo cambiar el estado.'
  if (err?.status === 404) return 'No se pudo cambiar el estado. Esta gestión ya no existe; recarga la página.'
  if (err?.status) return 'No se pudo cambiar el estado porque el servidor tuvo un problema. Inténtalo de nuevo en unos minutos.'
  return 'No se pudo cambiar el estado. Revisa tu conexión e inténtalo de nuevo.'
}
