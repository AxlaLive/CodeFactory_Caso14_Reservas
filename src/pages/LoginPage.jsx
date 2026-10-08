import { useState } from 'react'

export default function LoginPage({ onLogin, onRegisterCustomer }) {
  const [mode, setMode] = useState('client-login')
  const [name, setName] = useState('')
  const [identification, setIdentification] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [customerUsername, setCustomerUsername] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const updateMode = (nextMode) => {
    setMode(nextMode)
    setError('')
  }

  const registeringCustomer = mode === 'register-client'
  const registering = registeringCustomer

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (registering) {
        if (!name.trim() || !identification.trim() || !phone.trim() || !username.trim() || !customerUsername.trim() || !password || !confirmPassword) {
          setError('Completa todos los campos obligatorios.')
          return
        }
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden.')
          return
        }
        await onRegisterCustomer({ name, identification, username: customerUsername, email: username, phone, password })
        return
      }

      if (!username.trim() || !password.trim()) {
        setError('El correo/usuario y la contraseña son obligatorios.')
        return
      }
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
          <p>Agenda y administra tus citas de odontología general desde tu portal personal.</p>
        </div>
      </div>
      <form className="login-panel" onSubmit={submit}>
        <span className="eyebrow">{registering ? 'Únete a Dentia' : 'Bienvenido a Dentia'}</span>
        <h1>{registering ? 'Registro de cliente' : 'Iniciar sesión'}</h1>
        <p>{registering ? 'Crea tu cuenta para gestionar tus citas y datos personales.' : 'Ingresa con tu usuario o correo y contraseña para continuar.'}</p>
        <div className={`login-fields-grid${registering ? ' registration-fields' : ' sign-in-fields'}`}>
          {registering && <>
            <label>Nombre completo<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label>Documento de identidad<input autoComplete="off" value={identification} onChange={(event) => setIdentification(event.target.value)} required /></label>
            {registeringCustomer && <>
              <label>Nombre de usuario<input autoComplete="username" value={customerUsername} onChange={(event) => setCustomerUsername(event.target.value)} placeholder="Ej. sonrisa123" minLength={4} maxLength={30} required /><small className="username-hint">De 4 a 30 caracteres: letras, números, punto, guion o guion bajo.</small></label>
              <label>Teléfono<input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
            </>}
          </>}
          <label>
            {registeringCustomer ? 'Correo electrónico' : 'Usuario o correo electrónico'}
            <input type={registeringCustomer ? 'email' : 'text'} autoComplete={registeringCustomer ? 'email' : 'username'} value={username} onChange={(event) => setUsername(event.target.value)} placeholder={registeringCustomer ? 'tu@correo.com' : 'Usuario o correo electrónico'} required />
          </label>
          <label>
            Contraseña
            <input type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registering ? 'Mínimo 8 caracteres' : 'Contraseña'} required />
          </label>
          {registering && <label>Confirma tu contraseña<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>}
        </div>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button login-button" type="submit">{registering ? 'Crear cuenta y entrar' : 'Ingresar'} <span>→</span></button>
        {registering && <small className="registration-disclaimer">Registro de demostración frontend: la cuenta se guarda únicamente en este navegador.</small>}
        {registering
          ? <>
            <p className="login-switch">¿Ya tienes una cuenta?<button type="button" onClick={() => updateMode('client-login')}>Ir al inicio de sesión</button></p>
            <div className="registration-options"><button type="button" onClick={() => updateMode('client-login')}>← Volver al acceso</button></div>
          </>
          : <p className="login-switch">¿Aún no tienes una cuenta?<button type="button" onClick={() => updateMode('register-client')}>Registrarse</button></p>}
        {!registering && <small>Acceso de demostración del equipo: admin / dentia123.</small>}
      </form>
    </div>
  )
}
