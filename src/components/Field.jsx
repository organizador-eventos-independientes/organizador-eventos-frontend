// Envoltorio de un campo de formulario con label, ayuda y mensaje de error
// asociados por aria-describedby.
export default function Field({ id, label, hint, error, required, children }) {
  const hintId = hint && !error ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, required })}
      {hintId && <p id={hintId} className="field__hint">{hint}</p>}
      {error && <p id={errorId} className="field__error">{error}</p>}
    </div>
  )
}
