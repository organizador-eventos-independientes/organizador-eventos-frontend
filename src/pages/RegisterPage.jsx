import { useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Field from '../components/Field'
import PasswordInput from '../components/PasswordInput'
import { register } from '../api/auth'
import { setSession, useSession } from '../lib/session'

const EMPTY = { name: '', username: '', password: '', password2: '' }
const FIELD_ORDER = ['name', 'username', 'password', 'password2']

// Mismos caracteres que acepta Django para un nombre de usuario.
const USERNAME_PATTERN = /^[\p{L}\p{N}_.@+-]+$/u

// Validación rápida en el navegador; el backend aplica además todas las reglas
// de contraseña de Django (muy común, parecida al usuario, etc.).
function validate(values) {
  const errors = {}
  const name = values.name.trim()
  const username = values.username.trim()

  if (!name) errors.name = 'Escribe tu nombre.'
  else if (name.length > 150) errors.name = 'El nombre no puede superar 150 caracteres.'

  if (!username) errors.username = 'Escribe un nombre de usuario.'
  else if (username.length > 150) errors.username = 'El usuario no puede superar 150 caracteres.'
  else if (!USERNAME_PATTERN.test(username))
    errors.username = 'El usuario solo puede tener letras, números y los signos @ . + - _ (sin espacios).'

  if (!values.password) errors.password = 'Escribe una contraseña.'
  else if (values.password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.'
  else if (/^\d+$/.test(values.password)) errors.password = 'La contraseña no puede tener solo números.'

  if (!values.password2) errors.password2 = 'Repite la contraseña.'
  else if (values.password2 !== values.password) errors.password2 = 'Las contraseñas no coinciden.'

  return errors
}

// Registro de organizador: crea la cuenta en el backend y entra directamente,
// igual que tras iniciar sesión.
export default function RegisterPage() {
  const session = useSession()
  const location = useLocation()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef(null)

  if (session) {
    const from = location.state?.from
    return <Navigate to={from ? `${from.pathname}${from.search}${from.hash}` : '/hoy'} replace />
  }

  function update(field, value) {
    const next = { ...values, [field]: value }
    setValues(next)
    // Tras el primer intento, la validación es en vivo.
    if (submitted) setErrors(validate(next))
  }

  function focusFirstError(errs) {
    const first = FIELD_ORDER.find((f) => errs[f])
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    setFormError('')

    const errs = validate(values)
    setErrors(errs)
    if (Object.keys(errs).length) {
      focusFirstError(errs)
      return
    }

    setBusy(true)
    try {
      // Al guardar la sesión este componente se vuelve a renderizar y redirige.
      setSession(await register({ name: values.name.trim(), username: values.username.trim(), password: values.password }))
    } catch (err) {
      const serverErrors = err?.fieldErrors ?? {}
      if (Object.keys(serverErrors).length) {
        setErrors(serverErrors)
        focusFirstError(serverErrors)
      }
      setFormError(
        err?.status === 400
          ? 'No se pudo crear la cuenta. Revisa los campos marcados.'
          : err?.message || 'No se pudo crear la cuenta. Inténtalo de nuevo.',
      )
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <section className="card" aria-labelledby="register-title">
        <header>
          <h1 id="register-title" className="page__title">Crear cuenta</h1>
          <p className="muted">Regístrate para organizar tus eventos, clientes y planes.</p>
        </header>

        <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}

          <Field id="register-name" label="Nombre" required error={errors.name}>
            {(p) => (
              <input {...p} name="name" type="text" autoComplete="name" maxLength={150} autoFocus
                placeholder="Ej. Carla Gómez" value={values.name} onChange={(e) => update('name', e.target.value)} />
            )}
          </Field>

          <Field id="register-username" label="Usuario" required error={errors.username}
            hint="Lo usarás para iniciar sesión. Sin espacios.">
            {(p) => (
              <input {...p} name="username" type="text" autoComplete="username" autoCapitalize="none"
                spellCheck={false} maxLength={150} value={values.username}
                onChange={(e) => update('username', e.target.value)} />
            )}
          </Field>

          <Field id="register-password" label="Contraseña" required error={errors.password}
            hint="Mínimo 8 caracteres. Evita contraseñas comunes, solo números o parecidas a tu usuario.">
            {(p) => (
              <PasswordInput {...p} name="password" autoComplete="new-password" value={values.password}
                onChange={(e) => update('password', e.target.value)} />
            )}
          </Field>

          <Field id="register-password2" label="Confirmar contraseña" required error={errors.password2}>
            {(p) => (
              <PasswordInput {...p} name="password2" autoComplete="new-password" value={values.password2}
                onChange={(e) => update('password2', e.target.value)} />
            )}
          </Field>

          <button type="submit" className="btn btn--primary auth-page__submit" disabled={busy}>
            {busy ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="muted auth-page__note">
          ¿Ya tienes cuenta? <Link to="/login" state={location.state}>Inicia sesión</Link>
        </p>
      </section>
    </div>
  )
}
