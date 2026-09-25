const dateTimeFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' })
const dateFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

export const formatDateTime = (iso) => dateTimeFmt.format(new Date(iso))

// Las fechas de plazo son "YYYY-MM-DD"; se interpretan en hora local.
export const formatDate = (ymd) => dateFmt.format(new Date(`${ymd.slice(0, 10)}T00:00:00`))

export const formatHours = (h) => `${Number(h).toLocaleString('es-CO')} h`

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