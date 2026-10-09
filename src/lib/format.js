const dateTimeFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' })
const dateFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export const formatDateTime = (iso) => dateTimeFmt.format(new Date(iso))

// Las fechas de plazo son "YYYY-MM-DD"; se interpretan en hora local.
export const formatDate = (ymd) => dateFmt.format(new Date(`${ymd.slice(0, 10)}T00:00:00`))

// "YYYY-MM-DD" -> "lunes, 13 de octubre" (para los textos de conflicto).
const dayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
export const formatDay = (ymd) => dayFmt.format(new Date(`${ymd.slice(0, 10)}T00:00:00`))

// Horas estimadas: el backend las guarda en horas con dos decimales (2.75) y la
// app las muestra y las pide en horas y minutos de reloj (2:45). Con dos
// decimales cada minuto tiene un valor único (2:20 = 2.33), así que la
// conversión de ida y vuelta no pierde minutos.
export const toMinutes = (hours) => Math.round(Number(hours) * 60)
export const toHours = (minutes) => Math.round((minutes / 60) * 100) / 100

// 165 -> "2:45 h"; 120 -> "2 h"
export function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}:${String(m).padStart(2, '0')} h` : `${h} h`
}

export const formatHours = (hours) => formatMinutes(toMinutes(hours))

// Texto del campo de duración (DurationInput), "horas:minutos".
// 165 -> "2:45"
export const formatDurationText = (minutes) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`

// 2.75 -> "2:45"; sin valor -> ""
export const toDurationText = (hours) => (hours == null || hours === '' ? '' : formatDurationText(toMinutes(hours)))

// "2:45" -> 165; "2" -> 120; "2:5" -> 125. Devuelve null si el texto no es
// una duración válida (ej. "2:75" o "2.5").
export function parseDuration(text) {
  const match = /^(\d{1,3})(?::(\d{1,2}))?$/.exec(String(text ?? '').trim())
  if (!match) return null
  const minutes = Number(match[2] ?? 0)
  return minutes > 59 ? null : Number(match[1]) * 60 + minutes
}

// ISO -> valor para <input type="datetime-local">
export function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Fecha y hora actual en formato de <input type="datetime-local"> (hora local)
export const nowDateTimeLocal = () => toDateTimeLocal(new Date())

// Fecha actual "YYYY-MM-DD" en hora local
export const todayYmd = () => nowDateTimeLocal().slice(0, 10)

// Valor de <input type="datetime-local"> -> ISO (UTC)
export const fromDateTimeLocal = (value) => value || ''