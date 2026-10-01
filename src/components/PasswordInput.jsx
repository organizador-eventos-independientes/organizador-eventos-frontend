import { useState } from 'react'

// Campo de contraseña con un botón de ojo para mostrarla u ocultarla. El ojo
// refleja el estado actual: cerrado si está oculta, abierto si se ve.
// Recibe las mismas props que un <input> (las que entrega <Field>, name, value…).
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña'

  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button type="button" className="password-input__toggle" onClick={() => setVisible((v) => !v)}
        aria-label={label} title={label}>
        {visible ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  )
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  )
}
