import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('El usuario y la contraseña son obligatorios.')
      return
    }

    try {
      await onLogin({ username, password })
    } catch (loginError) {
      setError(loginError.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-logo">✦ Dentia</div>
        <div>
          <span>Gestiona cada cita.</span>
          <strong>Cuida cada sonrisa.</strong>
          <p>El espacio administrativo de tu consultorio odontologico.</p>
        </div>
      </div>
      <form className="login-panel" onSubmit={submit}>
        <span className="eyebrow">Acceso administrativo</span>
        <h1>Iniciar sesion</h1>
        <p>Ingresa con tus credenciales para continuar.</p>
        <label>
          Nombre de usuario
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="admin" />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button login-button" type="submit">
          Ingresar al panel <span>→</span>
        </button>
        <small>Demo temporal: admin / dentia123</small>
      </form>
    </div>
  )
}
