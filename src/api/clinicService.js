const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
).replace(/\/+$/, '')
const AUTH_STORAGE_KEY = 'dentia-auth'

async function apiRequest(path, options = {}) {
  const session = readSession()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const responseText = await response.text()
  let body = null
  if (responseText) {
    try {
      body = JSON.parse(responseText)
    } catch {
      body = responseText
    }
  }

  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message
    throw new Error(message || `La solicitud al servidor falló (${response.status}).`)
  }
  return body
}

function readSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null')
    return session?.token ? session : null
  } catch {
    return null
  }
}

function idString(id) {
  return id == null ? '' : String(id)
}

function mapProfessional(item) {
  return {
    id: idString(item.id),
    name: [item.nombre, item.apellido].filter(Boolean).join(' '),
    roleType: 'professional',
    role: item.especialidad,
    identification: item.documento,
    email: item.correo,
    active: item.activo,
  }
}

function mapSpace(item) {
  return { id: idString(item.id), name: item.nombre, type: item.tipo, active: item.activo }
}

function mapAppointment(item) {
  const patient = item.paciente || {}
  const professional = item.profesional || {}
  const space = item.espacioFisico || {}
  const service = item.servicio || {}
  return {
    id: idString(item.id),
    patientKind: 'unregistered',
    patientId: patient.documento || '',
    patientName: patient.nombre || '',
    patientPhone: patient.telefono || '',
    patientEmail: patient.correo || '',
    professionalId: idString(professional.id),
    professionalName: [professional.nombre, professional.apellido].filter(Boolean).join(' '),
    specialty: professional.especialidad || '',
    typeId: idString(service.id),
    typeName: service.nombre || '',
    spaceId: idString(space.id),
    spaceName: space.nombre || '',
    date: item.fecha,
    startTime: item.horaInicio?.slice(0, 5) || '',
    endTime: item.horaFin?.slice(0, 5) || '',
    bufferEndTime: item.horaFin?.slice(0, 5) || '',
    duration: service.duracionMinutos || 30,
    status: item.estado === 'CANCELADA' ? 'cancelled' : 'scheduled',
    notes: item.motivo || '',
  }
}

function mapBlock(item) {
  return {
    id: idString(item.id),
    professionalId: idString(item.profesionalId),
    date: item.fecha,
    startTime: item.horaInicio?.slice(0, 5) || '',
    endTime: item.horaFin?.slice(0, 5) || '',
    type: item.tipo === 'BREAK'
      ? 'break'
      : item.tipo === 'AVAILABLE'
        ? 'available'
        : item.tipo === 'UNAVAILABLE'
          ? 'unavailable'
        : item.tipo === 'OTHER'
          ? 'other'
          : 'admin',
    label: item.motivo || '',
  }
}

function availabilityRequest(block) {
  return {
    profesionalId: Number(block.professionalId),
    fecha: block.date,
    horaInicio: block.startTime,
    horaFin: block.endTime,
    tipo: block.type === 'break'
      ? 'BREAK'
      : block.type === 'available'
        ? 'AVAILABLE'
        : block.type === 'other'
          ? 'OTHER'
          : 'UNAVAILABLE',
    motivo: block.label || null,
  }
}

function appointmentRequest(appointment, patientId, serviceId) {
  return {
    fecha: appointment.date,
    horaInicio: appointment.startTime,
    profesionalId: Number(appointment.professionalId),
    espacioId: Number(appointment.spaceId),
    pacienteId: patientId,
    servicioId: serviceId,
    motivo: appointment.notes?.trim() || appointment.typeName || 'Cita',
  }
}

async function getOrCreatePatient(appointment) {
  const patients = await apiRequest('/pacientes')
  const document = appointment.patientId.trim()
  const existing = patients.find((item) => item.documento === document)
  if (existing) return existing.id
  const created = await apiRequest('/pacientes', {
    method: 'POST',
    body: JSON.stringify({
      nombre: appointment.patientName.trim(),
      documento: document,
      telefono: appointment.patientPhone.trim(),
      correo: appointment.patientEmail.trim() || null,
      activo: true,
    }),
  })
  return created.id
}

async function getOrCreateService(appointment) {
  const services = await apiRequest('/servicios')
  const existing = services.find((item) =>
    item.nombre === appointment.typeName
      && item.duracionMinutos === Number(appointment.duration),
  )
  if (existing) return existing.id

  const created = await apiRequest('/servicios', {
    method: 'POST',
    body: JSON.stringify({
      nombre: appointment.typeName,
      duracionMinutos: Number(appointment.duration) || 30,
    }),
  })
  return created.id
}

async function saveAppointment(appointment) {
  const [patientId, serviceId] = await Promise.all([
    getOrCreatePatient(appointment),
    getOrCreateService(appointment),
  ])
  const existingId = /^\d+$/.test(String(appointment.id || '')) ? appointment.id : null
  const saved = await apiRequest(existingId ? `/citas/${existingId}` : '/citas', {
    method: existingId ? 'PUT' : 'POST',
    body: JSON.stringify(appointmentRequest(appointment, patientId, serviceId)),
  })
  return mapAppointment(saved)
}

export const SPECIALTY_TYPES = [
  'Odontólogo general',
  'Endodoncista',
  'Periodoncista',
  'Ortodoncista',
  'Cirujano oral',
  'Odontopediatra',
]

export const APPOINTMENT_TYPES = {
  'Odontólogo general': [
    { id: 'prof-general-profilaxis', name: 'Profilaxis', duration: 30, buffer: 10 },
    { id: 'prof-general-revision', name: 'Revisión general', duration: 15, buffer: 5 },
    { id: 'prof-general-restauracion', name: 'Restauración de empastes o calzas', duration: 30, buffer: 10 },
    { id: 'prof-general-exodoncia', name: 'Exodoncia', duration: 60, buffer: 15 },
    { id: 'prof-general-control', name: 'Control', duration: 15, buffer: 5 },
  ],
  Endodoncista: [{ id: 'endo-endodoncia', name: 'Endodoncia', duration: 120, buffer: 15 }],
  Periodoncista: [{ id: 'perio-raspado', name: 'Raspado y alisado radicular', duration: 60, buffer: 15 }],
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

export const BLOCK_TYPES = [
  { id: 'available', name: 'Horario de atención' },
  { id: 'unavailable', name: 'No disponible' },
  { id: 'break', name: 'Descanso' },
  { id: 'other', name: 'Otro motivo' },
]

export function appointmentTypesFor(specialty) {
  return APPOINTMENT_TYPES[specialty] || []
}

export function findAppointmentType(specialty, typeId) {
  return appointmentTypesFor(specialty).find((item) => item.id === typeId) || null
}

export const SPECIALTIES = SPECIALTY_TYPES

export const blockService = {
  list: async () => (await apiRequest('/disponibilidades')).map(mapBlock),
  save: async (block) => {
    const existingId = /^\d+$/.test(String(block.id || '')) ? block.id : null
    const saved = await apiRequest(existingId ? `/disponibilidades/${existingId}` : '/disponibilidades', {
      method: existingId ? 'PUT' : 'POST',
      body: JSON.stringify(availabilityRequest(block)),
    })
    return mapBlock(saved)
  },
  remove: async (id) => apiRequest(`/disponibilidades/${id}`, { method: 'DELETE' }),
}

export const appointmentService = {
  list: async () => {
    const params = new URLSearchParams({ inicio: '1900-01-01', fin: '9999-12-31' })
    return (await apiRequest(`/citas/rango?${params}`)).map(mapAppointment)
  },
  save: saveAppointment,
  cancel: async (id) => mapAppointment(await apiRequest(`/citas/${id}/cancelar`, { method: 'PATCH' })),
}

export const professionalService = {
  list: async () => (await apiRequest('/v1/profesionales')).map(mapProfessional),
  create: async (data) => {
    const [nombre, ...apellidos] = data.name.trim().split(/\s+/)
    const created = await apiRequest('/v1/profesionales', {
      method: 'POST',
      body: JSON.stringify({
        nombre,
        apellido: apellidos.join(' ') || 'No especificado',
        documento: data.identification,
        especialidad: data.role,
        correo: data.email,
        activo: true,
      }),
    })
    return mapProfessional(created)
  },
  update: async (id, changes) => {
    const current = await apiRequest(`/v1/profesionales/${id}`)
    const updated = await apiRequest(`/v1/profesionales/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...current, activo: changes.active }),
    })
    return mapProfessional(updated)
  },
  remove: async (id) => apiRequest(`/v1/profesionales/${id}`, { method: 'DELETE' }),
}

export const spaceService = {
  list: async () => (await apiRequest('/espacios')).map(mapSpace),
  create: async (data) => mapSpace(await apiRequest('/espacios', {
    method: 'POST',
    body: JSON.stringify({ nombre: data.name, tipo: data.type, activo: true }),
  })),
}

export const authService = {
  login: async ({ username, password }) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password }),
    })
    const session = {
      token: response.token,
      username: response.username,
      name: response.username,
      role: response.role === 'ROLE_ADMIN' ? 'admin' : response.role,
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
    return session
  },
  session: readSession,
  logout: () => window.localStorage.removeItem(AUTH_STORAGE_KEY),
}
