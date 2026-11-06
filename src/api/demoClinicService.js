const STORAGE_KEYS = {
  appointments: 'dentia-appointments-v3',
  professionals: 'dentia-professionals-v2',
  spaces: 'dentia-spaces-v1',
  blocks: 'dentia-blocks-v1',
  clients: 'dentia-clients-v1',
  users: 'dentia-demo-users-v1',
  histories: 'dentia-demo-clinical-histories-v1',
}

const DEMO_PASSWORD = 'Dentia2026!'

export const demoAccounts = [
  { username: 'demo.admin', password: DEMO_PASSWORD, name: 'Administración Dentia', role: 'admin', id: 'demo-admin' },
  { username: 'demo.profesional', password: DEMO_PASSWORD, name: 'Daniel Rojas', role: 'professional', specialty: 'Odontólogo general', id: 'demo-professional' },
  { username: 'demo.recepcion', password: DEMO_PASSWORD, name: 'Sofía Herrera', role: 'receptionist', id: 'demo-receptionist' },
  {
    username: 'demo.paciente',
    password: DEMO_PASSWORD,
    name: 'Mariana Torres',
    role: 'client',
    id: 'demo-patient',
    identification: '1098765432',
    email: 'mariana@dentia.local',
    phone: '3105558899',
    address: 'Bogotá',
    emergencyContact: '',
  },
]

function dateAfter(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  if (date.getDay() === 0) date.setDate(date.getDate() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initialProfessionals = [
  { id: 'demo-professional', name: 'Daniel Rojas', roleType: 'professional', role: 'Odontólogo general', specialty: 'Odontólogo general', identification: '1020304050', email: 'daniel.rojas@dentia.local', username: 'demo.profesional', active: true },
  { id: 'demo-receptionist', name: 'Sofía Herrera', roleType: 'receptionist', role: 'Recepcionista', identification: '1020304052', email: 'sofia.herrera@dentia.local', username: 'demo.recepcion', active: true },
]

const initialAppointments = () => [{
  id: 'demo-appointment-001',
  clientId: 'demo-patient',
  patientKind: 'registered',
  patientId: '1098765432',
  patientName: 'Mariana Torres',
  patientAge: 28,
  patientPhone: '3105558899',
  patientEmail: 'mariana@dentia.local',
  professionalId: 'demo-professional',
  professionalName: 'Daniel Rojas',
  specialty: 'Odontólogo general',
  typeId: 'prof-general-revision',
  typeName: 'Revisión general',
  duration: 30,
  price: 80000,
  currency: 'COP',
  spaceId: 'demo-space-001',
  spaceName: 'Consultorio general 1',
  date: dateAfter(1),
  startTime: '09:00',
  endTime: '09:30',
  bufferEndTime: '09:30',
  status: 'scheduled',
  notes: 'Cita de demostración',
  receivedAt: 1,
}]

const initialSpaces = [
  { id: 'demo-space-001', name: 'Consultorio general 1', type: 'Consultorio general', active: true },
  { id: 'demo-space-002', name: 'Sala especializada', type: 'Sala especializada', active: true },
]

const initialClients = [{
  id: 'demo-patient',
  name: 'Mariana Torres',
  identification: '1098765432',
  username: 'demo.paciente',
  email: 'mariana@dentia.local',
  phone: '3105558899',
  address: 'Bogotá',
  emergencyContact: '',
  active: true,
}]

function readList(key, initial) {
  const stored = window.localStorage.getItem(key)
  if (stored === null) {
    const value = typeof initial === 'function' ? initial() : initial
    window.localStorage.setItem(key, JSON.stringify(value))
    return value
  }

  try {
    const value = JSON.parse(stored)
    if (!Array.isArray(value)) throw new Error('El formato guardado no es una lista.')
    return value
  } catch (error) {
    throw new Error(`No se pudieron leer los datos locales de prueba (${key}): ${error.message}`)
  }
}

function writeList(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function saveListItem(key, initial, item, prefix) {
  const current = readList(key, initial)
  const saved = { ...item, id: item.id || nextId(prefix) }
  writeList(key, current.some((entry) => entry.id === saved.id)
    ? current.map((entry) => entry.id === saved.id ? saved : entry)
    : [...current, saved])
  return saved
}

function addMissingSeedItems(key, initial) {
  const current = readList(key, initial)
  const seeded = typeof initial === 'function' ? initial() : initial
  const additions = seeded.filter((item) => !current.some((entry) => entry.id === item.id))
  if (additions.length) writeList(key, [...current, ...additions])
}

function ensureDemoData() {
  addMissingSeedItems(STORAGE_KEYS.appointments, initialAppointments)
  addMissingSeedItems(STORAGE_KEYS.professionals, initialProfessionals)
  addMissingSeedItems(STORAGE_KEYS.spaces, initialSpaces)
  addMissingSeedItems(STORAGE_KEYS.clients, initialClients)
  addMissingSeedItems(STORAGE_KEYS.users, initialProfessionals)
}

export function demoSessionForCredentials(username, password) {
  const account = demoAccounts.find((item) => item.username.toLowerCase() === username.trim().toLowerCase())
  if (!account) return null
  if (account.password !== password) throw new Error('La contraseña del perfil de prueba no es correcta.')

  ensureDemoData()
  const { password: _password, ...session } = account
  return { ...session, demoMode: true }
}

export function isDemoSession() {
  try {
    return JSON.parse(window.localStorage.getItem('dentia-auth') || 'null')?.demoMode === true
  } catch {
    return false
  }
}

export const demoClinicService = {
  appointments: {
    list: async () => readList(STORAGE_KEYS.appointments, initialAppointments),
    save: async (appointment) => saveListItem(STORAGE_KEYS.appointments, initialAppointments, appointment, 'demo-appointment'),
    cancel: async (id) => {
      const current = readList(STORAGE_KEYS.appointments, initialAppointments)
      const cancelled = current.map((item) => item.id === id ? { ...item, status: 'cancelled' } : item)
      writeList(STORAGE_KEYS.appointments, cancelled)
      return cancelled.find((item) => item.id === id)
    },
  },
  blocks: {
    list: async () => readList(STORAGE_KEYS.blocks, []),
    save: async (block) => saveListItem(STORAGE_KEYS.blocks, [], block, 'demo-block'),
    remove: async (id) => {
      writeList(STORAGE_KEYS.blocks, readList(STORAGE_KEYS.blocks, []).filter((item) => item.id !== id))
      return id
    },
  },
  professionals: {
    list: async () => readList(STORAGE_KEYS.professionals, initialProfessionals),
    create: async (data) => saveListItem(STORAGE_KEYS.professionals, initialProfessionals, {
      ...data,
      roleType: data.roleType || 'professional',
      active: data.active !== false,
    }, 'demo-professional'),
    update: async (id, changes) => {
      const current = readList(STORAGE_KEYS.professionals, initialProfessionals)
      const updated = current.map((item) => item.id === id ? { ...item, ...changes, id } : item)
      writeList(STORAGE_KEYS.professionals, updated)
      return updated.find((item) => item.id === id) || null
    },
    remove: async (id) => {
      const current = readList(STORAGE_KEYS.professionals, initialProfessionals)
      const retained = current.filter((item) => item.id !== id)
      writeList(STORAGE_KEYS.professionals, retained)
      return retained.length === current.length ? null : { id }
    },
  },
  users: {
    list: async () => readList(STORAGE_KEYS.users, initialProfessionals),
    create: async (data) => {
      const user = saveListItem(STORAGE_KEYS.users, initialProfessionals, {
        ...data,
        active: true,
      }, 'demo-user')
      if (data.roleType === 'professional') {
        saveListItem(STORAGE_KEYS.professionals, initialProfessionals, user, 'demo-professional')
      }
      return user
    },
  },
  spaces: {
    list: async () => readList(STORAGE_KEYS.spaces, initialSpaces),
    create: async (data) => saveListItem(STORAGE_KEYS.spaces, initialSpaces, {
      ...data,
      active: true,
    }, 'demo-space'),
    update: async (id, changes) => {
      const current = readList(STORAGE_KEYS.spaces, initialSpaces)
      const updated = current.map((item) => item.id === id ? { ...item, ...changes, id } : item)
      writeList(STORAGE_KEYS.spaces, updated)
      return updated.find((item) => item.id === id) || null
    },
    remove: async (id) => {
      const current = readList(STORAGE_KEYS.spaces, initialSpaces)
      const retained = current.filter((item) => item.id !== id)
      writeList(STORAGE_KEYS.spaces, retained)
      return retained.length === current.length ? null : { id }
    },
  },
  patients: {
    list: async () => readList(STORAGE_KEYS.clients, initialClients),
    create: async (data) => saveListItem(STORAGE_KEYS.clients, [], {
      ...data,
      id: data.identification,
      active: true,
    }, 'demo-patient'),
  },
  histories: {
    list: async (patientId) => readList(STORAGE_KEYS.histories, []).filter((item) => String(item.patientId) === String(patientId)),
    create: async (patientId, data) => saveListItem(STORAGE_KEYS.histories, [], {
      ...data,
      patientId,
    }, 'demo-history'),
  },
  updateCustomer: async (id, changes) => {
    const accounts = readList(STORAGE_KEYS.clients, initialClients)
    const updated = accounts.map((client) => client.id === id ? { ...client, ...changes, id } : client)
    writeList(STORAGE_KEYS.clients, updated)
    const client = updated.find((item) => item.id === id)
    if (!client) throw new Error('No se encontró el perfil de prueba del paciente.')
    const { password: _password, demoMode: _demoMode, ...session } = demoAccounts.find((item) => item.id === id) || {}
    return { ...session, ...client, role: 'client', demoMode: true }
  },
}
