const STORAGE_KEYS = {
  appointments: 'dentia-appointments-v2',
  professionals: 'dentia-professionals-v1',
  spaces: 'dentia-spaces-v1',
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const AUTH_STORAGE_KEY = 'dentia-auth'

async function authRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || (response.status === 401 ? 'Usuario o contraseña incorrectos.' : 'No fue posible iniciar sesión.'))
  }

  return response.json()
}

const initialProfessionals = [
  { id: 'prof-001', name: 'Daniel Rojas', role: 'Odontologia general', identification: '1020304050', email: 'daniel.rojas@dentia.co', username: 'daniel.rojas', password: 'dentia123', active: true },
  { id: 'prof-002', name: 'Laura Martinez', role: 'Ortodoncia', identification: '1020304051', email: 'laura.martinez@dentia.co', username: 'laura.martinez', password: 'dentia123', active: true },
]

const DEMO_CREDENTIALS = { username: 'admin', password: 'dentia123', role: 'admin' }

const SPECIALTIES = ['Odontólogo general', 'Ortodoncista', 'Endodoncista', 'Orto pediatra']

export { SPECIALTIES }

const initialSpaces = [
  { id: 'space-001', name: 'Consultorio general 1', type: 'Consultorio general' },
  { id: 'space-002', name: 'Sala especializada', type: 'Sala especializada' },
]

const initialAppointments = [
  { id: 'apt-001', patientId: 'patient-001', patientName: 'Mariana Torres', professionalId: 'prof-001', professionalName: 'Daniel Rojas', specialty: 'Odontologia general', spaceId: 'space-001', spaceName: 'Consultorio general 1', date: '2026-09-16', startTime: '08:30', endTime: '09:15', status: 'scheduled', notes: 'Primera consulta' },
  { id: 'apt-002', patientId: 'patient-002', patientName: 'Carlos Ramirez', professionalId: 'prof-002', professionalName: 'Laura Martinez', specialty: 'Ortodoncia', spaceId: 'space-002', spaceName: 'Sala especializada', date: '2026-09-17', startTime: '10:00', endTime: '11:00', status: 'scheduled', notes: 'Control mensual' },
  { id: 'apt-003', patientId: 'patient-003', patientName: 'Valentina Gomez', professionalId: 'prof-001', professionalName: 'Daniel Rojas', specialty: 'Odontologia general', spaceId: 'space-001', spaceName: 'Consultorio general 1', date: '2026-09-18', startTime: '14:00', endTime: '15:00', status: 'scheduled', notes: '' },
]

function read(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function wait(value) {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), 120))
}

export const appointmentService = {
  list: async () => wait(read(STORAGE_KEYS.appointments, initialAppointments)),
  save: async (appointment) => {
    const current = read(STORAGE_KEYS.appointments, initialAppointments)
    const next = current.some((item) => item.id === appointment.id) ? current.map((item) => item.id === appointment.id ? appointment : item) : [...current, appointment]
    write(STORAGE_KEYS.appointments, next)
    return wait(appointment)
  },
  cancel: async (id) => {
    const current = read(STORAGE_KEYS.appointments, initialAppointments)
    const cancelled = current.map((item) => item.id === id ? { ...item, status: 'cancelled' } : item)
    write(STORAGE_KEYS.appointments, cancelled)
    return wait(cancelled.find((item) => item.id === id))
  },
}

export const professionalService = {
  list: async () => wait(read(STORAGE_KEYS.professionals, initialProfessionals)),
  create: async (data) => {
    const current = read(STORAGE_KEYS.professionals, initialProfessionals)
    const name = (data.name || '').trim().toLowerCase()
    const identification = (data.identification || '').trim()
    const username = (data.username || '').trim().toLowerCase()
    if (current.some((item) => item.name.trim().toLowerCase() === name)) throw new Error('Ya existe un miembro del equipo con ese nombre.')
    if (current.some((item) => (item.identification || '') === identification)) throw new Error('Ya existe un miembro del equipo con esa identificación.')
    if (current.some((item) => (item.username || '').toLowerCase() === username)) throw new Error('El nombre de usuario ya está en uso.')
    const item = { ...data, name: (data.name || '').trim(), username: (data.username || '').trim(), active: true, id: `prof-${Date.now()}` }
    write(STORAGE_KEYS.professionals, [...current, item])
    return wait(item)
  },
  update: async (id, changes) => {
    const current = read(STORAGE_KEYS.professionals, initialProfessionals)
    let updated = null
    const next = current.map((item) => {
      if (item.id !== id) return item
      updated = { ...item, ...changes }
      return updated
    })
    write(STORAGE_KEYS.professionals, next)
    return wait(updated)
  },
  remove: async (id) => {
    const current = read(STORAGE_KEYS.professionals, initialProfessionals)
    write(STORAGE_KEYS.professionals, current.filter((item) => item.id !== id))
    return wait(id)
  },
}

export const spaceService = {
  list: async () => wait(read(STORAGE_KEYS.spaces, initialSpaces)),
  create: async (data) => {
    const current = read(STORAGE_KEYS.spaces, initialSpaces)
    if (current.some((item) => item.name.trim().toLowerCase() === data.name.trim().toLowerCase())) throw new Error('Ya existe un espacio con ese nombre.')
    const item = { ...data, id: `space-${Date.now()}` }
    write(STORAGE_KEYS.spaces, [...current, item])
    return wait(item)
  },
}

export const authService = {
  login: async ({ username, password }) => {
    const normalizedUser = username.trim()
    const normalizedPass = password.trim()

    if (normalizedUser === DEMO_CREDENTIALS.username && normalizedPass === DEMO_CREDENTIALS.password) {
      const session = { username: DEMO_CREDENTIALS.username, name: 'Administrador', role: 'admin' }
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      return session
    }

    const professionals = read(STORAGE_KEYS.professionals, initialProfessionals)
    const professional = professionals.find(
      (item) => (item.username || '').toLowerCase() === normalizedUser.toLowerCase() && item.password === normalizedPass,
    )

    if (professional) {
      if (professional.active === false) throw new Error('Tu usuario está inactivo. Contacta al administrador.')
      const session = { username: professional.username, name: professional.name, role: professional.roleType || 'professional', specialty: professional.role, id: professional.id }
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      return session
    }

    const response = await authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: normalizedUser, password: normalizedPass }),
    })
    const session = { token: response.token, username: response.username, name: response.username, role: response.role }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    return session
  },
  session: () => read(AUTH_STORAGE_KEY, null),
  logout: () => window.localStorage.removeItem(AUTH_STORAGE_KEY),
}

