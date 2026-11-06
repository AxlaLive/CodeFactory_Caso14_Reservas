import { useState } from 'react'
import { demoAccounts } from '../api/demoClinicService'

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

  const enterDemo = async (account) => {
    setError('')
    try {
      await onLogin({ username: account.username, password: account.password })
    } catch (loginError) {
      setError(loginError.message)
    }
  }

  return (
    <main className="login-page login-entry-page">
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
        <p>Ingresa con tu cuenta del consultorio. Si aún no tienes acceso, solicítalo al administrador.</p>
        <div className="login-fields-grid sign-in-fields">
          <label>
            Usuario
            <input
              id="login-username"
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button login-button" type="submit">
          Ingresar <span>→</span>
        </button>
        <section className="demo-access" aria-labelledby="demo-access-title">
          <h2 id="demo-access-title">Acceso local para pruebas</h2>
          <p>Disponible aunque el servidor o la base de datos no respondan. Los cambios se guardan en este navegador.</p>
          <div className="demo-access-options">
            {demoAccounts.map((account) => (
              <button
                type="button"
                key={account.role}
                onClick={() => enterDemo(account)}
              >
                <strong>
                  {account.role === 'admin' ? 'Administrador'
                    : account.role === 'professional' ? 'Profesional'
                      : account.role === 'receptionist' ? 'Recepcionista'
                        : 'Paciente'}
                </strong>
                <span>{account.username}</span>
              </button>
            ))}
          </div>
          <small>Contraseña para los cuatro perfiles: {demoAccounts[0].password}</small>
        </section>
      </form>
    </main>
  )
}
