import { useEffect, useRef } from 'react'
import { formatDurationText, parseDuration } from '../lib/format'

// Minutos que suben o bajan las flechas, y el máximo que admite el backend (999:59).
const STEP = 15
const MAX = 999 * 60 + 59

// El valor que dejan las flechas: se ajusta al cuarto de hora siguiente o
// anterior (2:47 sube a 3:00 y baja a 2:45) y no baja de 0:15 (un valor
// escrito menor, como 0:10, se queda como está).
function stepped(minutes, direction) {
  const next = direction > 0
    ? Math.floor(minutes / STEP) * STEP + STEP
    : Math.ceil(minutes / STEP) * STEP - STEP
  if (next < STEP) return Math.min(minutes || STEP, STEP)
  return Math.min(next, MAX)
}

const chevron = (d) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

// Horas estimadas en un solo campo, en horas:minutos de reloj (ej. 2:45). Se
// puede escribir cualquier valor; las flechas del campo (o ↑ ↓ del teclado)
// suben y bajan de 15 en 15 minutos, y al mantenerlas pulsadas siguen. Al salir
// del campo el texto se completa ("2" -> "2:00"). Va dentro de <Field>:
// `fieldProps` son los que Field da al control (id, aria-*, required).
export default function DurationInput({ fieldProps, value, onChange }) {
  const inputRef = useRef(null)
  const repeatTimer = useRef(null)
  // El valor más reciente, para que al mantener una flecha cada paso parta del
  // anterior aunque el formulario aún no haya vuelto a pintar.
  const latest = useRef(value)

  useEffect(() => {
    latest.current = value
  }, [value])

  useEffect(() => () => clearTimeout(repeatTimer.current), [])

  function step(direction) {
    const text = formatDurationText(stepped(parseDuration(latest.current) ?? 0, direction))
    latest.current = text
    onChange(text)
  }

  // Un paso al pulsar y, si se mantiene, uno cada 70 ms tras una pausa corta.
  function startRepeat(direction, e) {
    e.preventDefault() // el foco se queda en el campo
    inputRef.current?.focus()
    step(direction)
    const loop = (delay) => {
      repeatTimer.current = setTimeout(() => {
        step(direction)
        loop(70)
      }, delay)
    }
    loop(400)
  }

  const stopRepeat = () => clearTimeout(repeatTimer.current)

  function handleKeyDown(e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    step(e.key === 'ArrowUp' ? 1 : -1)
  }

  function handleBlur() {
    const minutes = parseDuration(value)
    if (minutes != null && formatDurationText(minutes) !== value) onChange(formatDurationText(minutes))
  }

  const minutes = parseDuration(value)
  const stepButton = (direction, label, path) => (
    <button type="button" className="duration__step" tabIndex={-1} aria-label={label}
      onPointerDown={(e) => startRepeat(direction, e)} onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat} onPointerCancel={stopRepeat}
      onClick={(e) => e.detail === 0 && step(direction)}>
      {chevron(path)}
    </button>
  )

  return (
    <div className="duration">
      <input ref={inputRef} {...fieldProps} name="estimatedHours" type="text" role="spinbutton"
        autoComplete="off" placeholder="Ej. 2:45" maxLength={6} value={value}
        aria-valuenow={minutes ?? undefined} aria-valuemin={0} aria-valuemax={MAX}
        aria-valuetext={minutes != null ? `${Math.floor(minutes / 60)} horas ${minutes % 60} minutos` : undefined}
        onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} />
      <span className="duration__steps">
        {stepButton(1, 'Sumar 15 minutos', 'M6 15l6-6 6 6')}
        {stepButton(-1, 'Restar 15 minutos', 'M6 9l6 6 6-6')}
      </span>
    </div>
  )
}
