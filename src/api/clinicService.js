const STORAGE_KEYS = {
  appointments: 'dentia-appointments-v2',
  professionals: 'dentia-professionals-v1',
  spaces: 'dentia-spaces-v1',
}

const initialProfessionals = [
  { id: 'prof-001', name: 'Daniel Rojas', role: 'Odontologia general' },
  { id: 'prof-002', name: 'Laura Martinez', role: 'Ortodoncia' },
]

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
    if (current.some((item) => item.name.trim().toLowerCase() === data.name.trim().toLowerCase())) throw new Error('Ya existe un profesional con ese nombre.')
    const item = { ...data, id: `prof-${Date.now()}` }
    write(STORAGE_KEYS.professionals, [...current, item])
    return wait(item)
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
    if (username !== 'admin' || password !== 'dentia123') throw new Error('Usuario o contraseña incorrectos.')
    window.localStorage.setItem('dentia-session', JSON.stringify({ username, role: 'Administrador' }))
    return wait({ username, role: 'Administrador' })
  },
  session: () => read('dentia-session', null),
  logout: () => window.localStorage.removeItem('dentia-session'),
}

