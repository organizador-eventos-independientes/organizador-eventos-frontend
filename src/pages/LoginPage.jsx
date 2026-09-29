import { useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Field from '../components/Field'
import { login } from '../api/auth'
import { setSession, useSession } from '../lib/session'

function loginErrorMessage(err) {
  // Usuario o contraseña incorrectos: no se indica cuál de los dos falló.
  if (err?.status === 400 || err?.status === 401) return 'Credenciales inválidas. Revisa tu usuario y contraseña.'
  if (!err?.status) return err?.message || 'No se pudo conectar con el servidor. Revisa tu conexión.'
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

// US-11. Al iniciar sesión se vuelve a la ruta privada que se había pedido o,
// si se entró directo al login, a la vista Hoy.
export default function LoginPage() {
  const session = useSession()
  const location = useLocation()
  const [values, setValues] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef(null)

  if (session) {
    const from = location.state?.from
    return <Navigate to={from ? `${from.pathname}${from.search}${from.hash}` : '/hoy'} replace />
  }

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  function focusField(name) {
    formRef.current?.querySelector(`[name="${name}"]`)?.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    const errs = {}
    if (!values.username.trim()) errs.username = 'Escribe tu usuario.'
    if (!values.password) errs.password = 'Escribe tu contraseña.'
    setErrors(errs)
    if (errs.username || errs.password) {
      focusField(errs.username ? 'username' : 'password')
      return
    }

    setBusy(true)
    try {
      // Al guardar la sesión este componente se vuelve a renderizar y redirige.
      setSession(await login(values.username.trim(), values.password))
    } catch (err) {
      setFormError(loginErrorMessage(err))
      setValues((v) => ({ ...v, password: '' }))
      setBusy(false)
      focusField('password')
    }
  }

  return (
    <div className="page auth-page">
      <section className="card" aria-labelledby="login-title">
        <header>
          <h1 id="login-title" className="page__title">Iniciar sesión</h1>
          <p className="muted">Entra para ver tus eventos, clientes y planes.</p>
        </header>

        <form ref={formRef} className="form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="alert alert--error" role="alert">
              {formError}
            </p>
          )}

          <Field id="login-username" label="Usuario" error={errors.username}>
            {(p) => (
              <input {...p} name="username" type="text" autoComplete="username" autoCapitalize="none"
                spellCheck={false} value={values.username} autoFocus
                onChange={(e) => update('username', e.target.value)} />
            )}
          </Field>

          <Field id="login-password" label="Contraseña" error={errors.password}>
            {(p) => (
              <input {...p} name="password" type="password" autoComplete="current-password"
                value={values.password} onChange={(e) => update('password', e.target.value)} />
            )}
          </Field>

          <button type="submit" className="btn btn--primary auth-page__submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="muted auth-page__note">¿No tienes cuenta? Pídela al administrador del sistema.</p>
      </section>
    </div>
  )
}
