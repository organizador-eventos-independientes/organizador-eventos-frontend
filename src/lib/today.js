// Regla de la vista "Hoy" (US-04). Agrupa los eventos y sus gestiones por su
// fecha respecto a hoy y los ordena dentro de cada grupo. Los eventos entran
// con horas estimadas 0: el mismo día aparecen antes que sus gestiones.

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
    const deadline = s.deadline.slice(0, 10)
    const diff = daysBetween(todayYmd, deadline)
    const item = { ...s, deadline, daysLeft: diff }
    if (diff < 0) groups.overdue.push(item)
    else if (diff === 0) groups.today.push(item)
    else groups.upcoming.push(item)
  }

  for (const list of Object.values(groups)) list.sort(byDeadlineThenEffort)
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

// Igual que relativeDeadline, pero para la fecha de un evento.
export function relativeEventDate(daysLeft) {
  if (daysLeft < -1) return `Fue hace ${-daysLeft} días`
  if (daysLeft === -1) return 'Fue ayer'
  if (daysLeft === 0) return 'Es hoy'
  if (daysLeft === 1) return 'Es mañana'
  return `En ${daysLeft} días`
}
