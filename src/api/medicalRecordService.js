import { appointmentService } from './clinicService'

const STORAGE_PREFIX = 'dentia-medical-record-v1'
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const seed = {
  '1098765432': {
    profile: {
      allergies: ['Penicilina'],
      conditions: [],
      bloodType: '',
    },
    odontogram: [
      { id: 'od-001', date: '2026-08-12', tooth: '16', status: 'restoration', face: 'O', note: 'Restauración existente.' },
      { id: 'od-002', date: '2026-07-21', tooth: '24', status: 'caries', face: 'D', note: 'Lesión en cara distal.' },
      { id: 'od-003', date: '2026-05-04', tooth: '36', status: 'sealant', face: 'O', note: 'Sellante preventivo.' },
    ],
    treatments: [
      { id: 'tr-001', date: '2026-08-12', title: 'Restauración dental', description: 'Restauración de resina en pieza 16.' },
      { id: 'tr-002', date: '2026-05-04', title: 'Sellante preventivo', description: 'Aplicación en pieza 36.' },
    ],
    notes: [
      { id: 'no-001', date: '2026-08-12', text: 'Paciente tolera bien el procedimiento. Recomendar control en seis meses.' },
    ],
    images: [],
  },
}

function storageKey(patientId, section) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(patientId)}:${section}`
}

function readSection(patientId, section) {
  const key = storageKey(patientId, section)
  const stored = window.localStorage.getItem(key)
  if (stored === null) {
    const initial = seed[patientId]?.[section] ?? (section === 'profile' ? {} : [])
    window.localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }

  try {
    return JSON.parse(stored)
  } catch {
    throw new Error(`No se pudo leer ${section} del expediente local.`)
  }
}

function assertImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('El archivo debe ser una imagen JPEG, PNG, WEBP o GIF.')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('La imagen supera el límite provisional de 2 MB.')
  }
}

function readImage(file) {
  assertImage(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No fue posible leer la imagen seleccionada.'))
    reader.readAsDataURL(file)
  })
}

export const medicalRecordContract = {
  version: 1,
  sections: ['odontogram', 'treatments', 'notes', 'images', 'prescriptions', 'plans', 'healthForm'],
  authorization: 'Bearer token + appointmentId asignada al profesional autenticado',
  retention: 'Se conserva el historial completo, ordenado por fecha descendente',
}

export const medicalRecordService = {
  async loadPatientHealthForm(patientId) {
    const records = readSection(patientId, 'healthForm')
    return records[0] || null
  },

  async load(appointment, session) {
    if (session?.role !== 'professional' || !session.id) {
      throw new Error('Solo un profesional puede consultar el expediente clínico.')
    }

    const assignedAppointments = await appointmentService.list()
    const assignedAppointment = assignedAppointments.find(
      (item) => item.id === appointment?.id &&
        item.professionalId === session.id &&
        item.patientId === appointment.patientId,
    )
    if (!assignedAppointment) {
      throw new Error('No tienes una cita asignada con este paciente.')
    }

    let clients = []
    let profileError
    try {
      clients = JSON.parse(window.localStorage.getItem('dentia-clients-v1') || '[]')
    } catch {
      profileError = 'No se pudieron cargar algunos datos personales del paciente.'
    }
    const client = clients.find(
      (item) => item.id === appointment.patientId ||
        item.identification === appointment.patientId,
    )
    let medicalProfile = { allergies: [], conditions: [], bloodType: '' }
    try {
      medicalProfile = readSection(appointment.patientId, 'profile')
    } catch {
      profileError = 'No se pudieron cargar las alertas clínicas del paciente.'
    }
    const profile = {
      id: appointment.patientId,
      name: appointment.patientName,
      identification: appointment.patientId,
      age: appointment.patientAge || '',
      phone: appointment.patientPhone || client?.phone || '',
      email: appointment.patientEmail || client?.email || '',
      allergies: [],
      conditions: [],
      bloodType: '',
      ...client,
      ...medicalProfile,
    }

    const sections = ['odontogram', 'treatments', 'notes', 'images', 'prescriptions', 'plans', 'healthForm']
    const results = await Promise.allSettled(
      sections.map(async (section) => {
        await new Promise((resolve) => window.setTimeout(resolve, 180))
        return [section, readSection(appointment.patientId, section).sort((a, b) => b.date.localeCompare(a.date))]
      }),
    )

    const records = {}
    const errors = profileError ? { profile: profileError } : {}
    results.forEach((result, index) => {
      const section = sections[index]
      if (result.status === 'fulfilled') {
        records[result.value[0]] = result.value[1]
      } else {
        errors[section] = result.reason instanceof Error
          ? result.reason.message
          : 'No fue posible cargar esta sección.'
      }
    })

    return { profile, records, errors }
  },

  async save(patientId, section, record) {
    const current = readSection(patientId, section)
    const saved = {
      ...record,
      id: record.id || `${section}-${crypto.randomUUID()}`,
      date: record.date || new Date().toISOString().slice(0, 10),
    }
    const next = current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current]
    window.localStorage.setItem(storageKey(patientId, section), JSON.stringify(next))
    return saved
  },

  async savePatientHealthForm(patientId, form) {
    const saved = await this.save(patientId, 'healthForm', form)
    const profile = readSection(patientId, 'profile')
    window.localStorage.setItem(storageKey(patientId, 'profile'), JSON.stringify({
      ...profile,
      allergies: form.allergies || [],
      conditions: form.conditions || [],
      medications: form.medications || [],
      consent: form.consent,
      healthFormUpdatedAt: saved.date,
    }))
    return saved
  },

  async addImage(patientId, file, description) {
    const dataUrl = await readImage(file)
    return this.save(patientId, 'images', {
      date: new Date().toISOString().slice(0, 10),
      name: file.name,
      description,
      mimeType: file.type,
      dataUrl,
    })
  },

  async remove(patientId, section, id) {
    const current = readSection(patientId, section)
    const next = current.filter((item) => item.id !== id)
    window.localStorage.setItem(storageKey(patientId, section), JSON.stringify(next))
  },
}
