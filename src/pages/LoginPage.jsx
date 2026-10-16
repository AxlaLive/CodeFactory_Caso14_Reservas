import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await onLogin({ username, password })
    } catch (formError) {
      setError(formError.message)
    }
  }

  return (
    <div className="login-page login-entry-page">
      <div className="login-visual">
        <div className="login-logo">✦ Dentia</div>
        <div>
          <span>Tu salud oral, en buenas manos.</span>
          <strong>Una sonrisa más saludable empieza aquí.</strong>
          <p>Inicia sesión para administrar la agenda de la clínica.</p>
        </div>
      </div>
      <form className="login-panel" onSubmit={submit}>
        <span className="eyebrow">Bienvenido a Dentia</span>
        <h1>Iniciar sesión</h1>
        <p>Ingresa con la cuenta de administrador configurada en el backend.</p>
        <div className="login-fields-grid sign-in-fields">
          <label>
            Usuario
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Usuario"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              required
            />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button login-button" type="submit">
          Ingresar <span>→</span>
        </button>
        <small>El registro de pacientes y las cuentas de profesionales se habilitarán en otra etapa.</small>
      </form>
    </div>
  )
}
