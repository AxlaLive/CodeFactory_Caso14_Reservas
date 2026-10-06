const STORAGE_KEYS = {
  appointments: 'dentia-appointments-v3',
  professionals: 'dentia-professionals-v2',
  spaces: 'dentia-spaces-v1',
  blocks: 'dentia-blocks-v1',
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
  { id: 'prof-001', name: 'Daniel Rojas', roleType: 'professional', role: 'Odontólogo general', identification: '1020304050', email: 'daniel.rojas@dentia.co', username: 'daniel.rojas', password: 'dentia123', active: true },
  { id: 'prof-002', name: 'Laura Martinez', roleType: 'professional', role: 'Ortodoncista', identification: '1020304051', email: 'laura.martinez@dentia.co', username: 'laura.martinez', password: 'dentia123', active: true },
  { id: 'prof-003', name: 'Sofía Herrera', roleType: 'receptionist', role: 'Recepcionista', identification: '1020304052', email: 'sofia.herrera@dentia.co', username: 'sofia.herrera', password: 'dentia123', active: true },
]

const DEMO_CREDENTIALS = { username: 'admin', password: 'dentia123', role: 'receptionist' }

// Tipos de desempeño del profesional. Cada uno habilita su propio catálogo de
// tipos de cita, y cada tipo de cita define la duración y el buffer (en minutos).
export const SPECIALTY_TYPES = [
  'Odontólogo general',
  'Endodoncista',
  'Periodoncista',
  'Ortodoncista',
  'Cirujano oral',
  'Odontopediatra',
]

// Catálogo de tipos de cita por tipo de profesional (duración + buffer).
export const APPOINTMENT_TYPES = {
  'Odontólogo general': [
    { id: 'prof-general-profilaxis', name: 'Profilaxis', duration: 30, buffer: 10 },
    { id: 'prof-general-revision', name: 'Revisión general', duration: 15, buffer: 5 },
    { id: 'prof-general-restauracion', name: 'Restauración de empastes o calzas', duration: 30, buffer: 10 },
    { id: 'prof-general-exodoncia', name: 'Exodoncia', duration: 60, buffer: 15 },
    { id: 'prof-general-control', name: 'Control', duration: 15, buffer: 5 },
  ],
  Endodoncista: [
    { id: 'endo-endodoncia', name: 'Endodoncia', duration: 120, buffer: 15 },
  ],
  Periodoncista: [
    { id: 'perio-raspado', name: 'Raspado y alisado radicular', duration: 60, buffer: 15 },
  ],
  Ortodoncista: [
    { id: 'orto-instalacion', name: 'Instalación de aparatología', duration: 60, buffer: 10 },
    { id: 'orto-control', name: 'Control periódico por extracción', duration: 15, buffer: 5 },
  ],
  'Cirujano oral': [
    { id: 'cirugia-maxilofacial', name: 'Cirugía maxilofacial', duration: 120, buffer: 20 },
    { id: 'cirugia-exodoncia', name: 'Exodoncia', duration: 60, buffer: 15 },
    { id: 'cirugia-control', name: 'Control cirugía', duration: 15, buffer: 10 },
  ],
  Odontopediatra: [
    { id: 'pediatra-revision', name: 'Revisión y evaluación', duration: 45, buffer: 10 },
    { id: 'pediatra-control', name: 'Control', duration: 30, buffer: 10 },
  ],
}

// Tipos de bloqueo que el profesional puede reservar en su agenda personal.
export const BLOCK_TYPES = [
  { id: 'break', name: 'Descanso' },
  { id: 'admin', name: 'Tarea administrativa' },
]

export function appointmentTypesFor(specialty) {
  return APPOINTMENT_TYPES[specialty] || []
}

export function findAppointmentType(specialty, typeId) {
  return appointmentTypesFor(specialty).find((item) => item.id === typeId) || null
}

// Compatibilidad con el formulario de registro de trabajadores.
export const SPECIALTIES = SPECIALTY_TYPES

const initialSpaces = [
  { id: 'space-001', name: 'Consultorio general 1', type: 'Consultorio general' },
  { id: 'space-002', name: 'Sala especializada', type: 'Sala especializada' },
]

const initialAppointments = [
  { id: 'apt-001', receivedAt: 1, patientKind: 'unregistered', patientId: '1098765432', patientName: 'Mariana Torres', patientAge: 28, patientPhone: '3105558899', patientEmail: 'mariana@correo.co', professionalId: 'prof-001', professionalName: 'Daniel Rojas', specialty: 'Odontólogo general', typeId: 'prof-general-profilaxis', typeName: 'Profilaxis', spaceId: 'space-001', spaceName: 'Consultorio general 1', date: '2026-09-16', startTime: '08:30', endTime: '09:00', bufferEndTime: '09:10', status: 'scheduled', notes: 'Primera consulta' },
  { id: 'apt-002', receivedAt: 2, patientKind: 'unregistered', patientId: '1087654321', patientName: 'Carlos Ramirez', patientAge: 34, patientPhone: '3114447766', patientEmail: 'carlos@correo.co', professionalId: 'prof-002', professionalName: 'Laura Martinez', specialty: 'Ortodoncista', typeId: 'orto-instalacion', typeName: 'Instalación de aparatología', spaceId: 'space-002', spaceName: 'Sala especializada', date: '2026-09-17', startTime: '10:00', endTime: '11:00', bufferEndTime: '11:10', status: 'scheduled', notes: 'Control mensual' },
  { id: 'apt-003', receivedAt: 3, patientKind: 'unregistered', patientId: '1076543210', patientName: 'Valentina Gomez', patientAge: 21, patientPhone: '3123336644', patientEmail: 'valentina@correo.co', professionalId: 'prof-001', professionalName: 'Daniel Rojas', specialty: 'Odontólogo general', typeId: 'prof-general-restauracion', typeName: 'Restauración de empastes o calzas', spaceId: 'space-001', spaceName: 'Consultorio general 1', date: '2026-09-18', startTime: '14:00', endTime: '14:30', bufferEndTime: '14:40', status: 'scheduled', notes: '' },
  { id: 'apt-004', receivedAt: 4, patientKind: 'unregistered', patientId: '1065432109', patientName: 'Andrés Beltrán', patientAge: 45, patientPhone: '3132225533', patientEmail: 'andres@correo.co', professionalId: 'prof-001', professionalName: 'Daniel Rojas', specialty: 'Odontólogo general', typeId: 'prof-general-exodoncia', typeName: 'Exodoncia', spaceId: 'space-002', spaceName: 'Sala especializada', date: '2026-09-16', startTime: '08:30', endTime: '09:30', bufferEndTime: '09:45', status: 'scheduled', notes: 'Cita simultánea en otro consultorio' },
]

// Espacios de agenda bloqueados por el propio profesional (descansos / tareas).
const initialBlocks = [
  { id: 'blk-001', professionalId: 'prof-001', date: '2026-09-16', startTime: '12:00', endTime: '13:00', type: 'break', label: 'Almuerzo' },
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

export const blockService = {
  list: async () => wait(read(STORAGE_KEYS.blocks, initialBlocks)),
  save: async (block) => {
    const current = read(STORAGE_KEYS.blocks, initialBlocks)
    const item = { ...block, id: block.id || `blk-${Date.now()}` }
    const next = current.some((entry) => entry.id === item.id) ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item]
    write(STORAGE_KEYS.blocks, next)
    return wait(item)
  },
  remove: async (id) => {
    const current = read(STORAGE_KEYS.blocks, initialBlocks)
    write(STORAGE_KEYS.blocks, current.filter((entry) => entry.id !== id))
    return wait(id)
  },
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
      const session = { username: DEMO_CREDENTIALS.username, name: 'Recepción Dentia', role: 'receptionist' }
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      return session
    }

    const professionals = read(STORAGE_KEYS.professionals, initialProfessionals)
    const professional = professionals.find(
      (item) => (item.username || '').toLowerCase() === normalizedUser.toLowerCase() && item.password === normalizedPass,
    )

    if (professional) {
      if (professional.active === false) throw new Error('Tu usuario está inactivo. Contacta al administrador.')
      const role = professional.roleType === 'receptionist' ? 'receptionist' : 'professional'
      const session = { username: professional.username, name: professional.name, role, specialty: professional.role, id: professional.id }
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

