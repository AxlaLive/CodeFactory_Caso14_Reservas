import { useRef, useState } from 'react'
import { demoAccounts } from '../api/demoClinicService'
import PasswordInput from '../components/PasswordInput'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const passwordInputRef = useRef(null)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    const submittedPassword = password
    setPassword('')
    passwordInputRef.current?.hide()
    try {
      await onLogin({ username, password: submittedPassword })
    } catch {
      setError('No fue posible iniciar sesión. Revisa tus datos e inténtalo de nuevo.')
    }
  }

  const enterDemo = async (account) => {
    setError('')
    setPassword('')
    passwordInputRef.current?.hide()
    try {
      await onLogin({ username: account.username, password: account.password })
    } catch {
      setError('No fue posible iniciar sesión con este perfil de prueba.')
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
          <div className="password-form-field">
            <label htmlFor="login-password">Contraseña</label>
            <PasswordInput
              ref={passwordInputRef}
              id="login-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button login-button" type="submit">
          Ingresar <span>→</span>
        </button>
        {import.meta.env.DEV && <section className="demo-access" aria-labelledby="demo-access-title">
          <h2 id="demo-access-title">Acceso local para pruebas</h2>
          <p>Disponible aunque el servidor o la base de datos no respondan. Los cambios se guardan en este navegador.</p>
          <div className="demo-access-options">
            {demoAccounts.map((account) => (
              <button
                type="button"
                key={account.username}
                onClick={() => enterDemo(account)}
              >
                <strong>
                  {account.role === 'admin' ? 'Administrador'
                    : account.role === 'professional' ? (account.id === 'demo-professional' ? 'Profesional' : `Profesional · ${account.specialty}`)
                      : account.role === 'receptionist' ? 'Recepcionista'
                        : 'Paciente'}
                </strong>
                <span>{account.username}</span>
              </button>
            ))}
          </div>
          <small>Selecciona un perfil para ingresar con una cuenta de prueba.</small>
        </section>}
      </form>
    </main>
  )
}
