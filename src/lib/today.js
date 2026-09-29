// Regla de la vista "Hoy" (US-04). Agrupa las gestiones por su plazo respecto
// a hoy y las ordena dentro de cada grupo.

// Ventana de la sección "Próximas", en días a partir de mañana.
export const UPCOMING_DAYS = 7

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

// Devuelve { overdue, today, upcoming, later }. `later` son las gestiones más
// allá de la ventana de próximas (no se muestran en la vista, solo se cuentan).
export function groupSubtasks(subtasks, todayYmd, upcomingDays = UPCOMING_DAYS) {
  const groups = { overdue: [], today: [], upcoming: [], later: [] }

  for (const s of subtasks) {
    const deadline = s.deadline.slice(0, 10)
    const diff = daysBetween(todayYmd, deadline)
    const item = { ...s, deadline, daysLeft: diff }
    if (diff < 0) groups.overdue.push(item)
    else if (diff === 0) groups.today.push(item)
    else if (diff <= upcomingDays) groups.upcoming.push(item)
    else groups.later.push(item)
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
