import { appointmentService } from './clinicService'
import { sharedReferralAccessService } from './sharedReferralAccessService'

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
  sections: ['odontogram', 'treatments', 'notes', 'images', 'prescriptions', 'prescriptionDecisions', 'referrals', 'plans', 'healthForm'],
  authorization: 'Bearer token + acceso autorizado al expediente clínico del paciente',
  referralFields: ['specialistId', 'specialistName', 'specialty', 'reason', 'clinicalNotes', 'imageIds', 'status', 'createdAt', 'acceptedAt', 'acceptedBy'],
  referralStatuses: ['pending', 'accepted', 'declined'],
  referralAccess: 'Al aceptar, el especialista obtiene acceso al expediente compartido del paciente según permisos del backend',
  prescriptionFields: ['medication', 'dosage', 'frequency', 'duration', 'quantity', 'route'],
  prescriptionAlerts: 'Alertas de apoyo basadas en alergias registradas e interacciones conocidas; requieren evaluación profesional',
  prescriptionAudit: 'Las decisiones de confirmar o cancelar alertas se conservan en la historia clínica',
  retention: 'Se conserva el historial completo, ordenado por fecha descendente',
}

export const medicalRecordService = {
  async loadPatientHealthForm(patientId) {
    const records = readSection(patientId, 'healthForm')
    return records[0] || null
  },

  hasReferralAccess(patientId, session) {
    if (session?.role !== 'professional' || !session.id) return false
    return sharedReferralAccessService.hasReferralAccess(patientId, session)
  },

  listReferralAccessFor(session) {
    if (session?.role !== 'professional' || !session.id) return []
    return sharedReferralAccessService.listReferralAccessFor(session)
  },

  listPatientReferrals(patientId) {
    return sharedReferralAccessService.listPatientReferrals(patientId)
  },

  hasReferral(patientId, session) {
    return this.listPatientReferrals(patientId).some((item) => item.specialistId === session?.id && item.status === 'accepted')
  },

  async allowReferralAccess(referral) {
    return sharedReferralAccessService.allowReferralAccess(referral)
  },

  hasAcceptedReferral(referralId, patientId, session) {
    if (session?.role !== 'professional' || !session.id) return false
    const acceptedInAccessRegistry = sharedReferralAccessService.hasAcceptedReferral(referralId, patientId, session)
    const acceptedInReferralStore = this.listPatientReferrals(patientId).some((item) =>
      item.id === referralId && item.patientId === patientId &&
      item.specialistId === session.id && item.status === 'accepted',
    )
    return acceptedInAccessRegistry || acceptedInReferralStore
  },

  async loadReferralPatient(patientId, session) {
    if (!this.hasReferralAccess(patientId, session)) {
      throw new Error('No tienes acceso a este expediente clínico.')
    }
    const assignedAppointments = await appointmentService.list()
    const appointment = assignedAppointments.find((item) => item.patientId === patientId && item.referralAccess)
      || assignedAppointments.find((item) => item.patientId === patientId)
    if (!appointment) throw new Error('No se encontró información de la cita del paciente derivado.')
    return this.load(appointment, session)
  },

  async load(appointment, session) {
    if (session?.role !== 'professional' || !session.id) {
      throw new Error('Solo un profesional puede consultar el expediente clínico.')
    }
    const referralSharedAccess = this.hasAcceptedReferral(appointment?.referralId, appointment?.patientId, session)
    if (appointment?.referralAccess && !referralSharedAccess) {
      throw new Error('No tienes una derivación aceptada que habilite este expediente.')
    }

    const assignedAppointments = await appointmentService.list()
    const sharedAccess = referralSharedAccess || this.hasReferralAccess(appointment.patientId, session)
    const assignedAppointment = assignedAppointments.find(
      (item) => item.id === appointment?.id &&
        item.professionalId === session.id &&
        item.patientId === appointment.patientId,
    )
    if (!assignedAppointment && !sharedAccess) {
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

    const sections = ['odontogram', 'treatments', 'notes', 'images', 'prescriptions', 'prescriptionDecisions', 'referrals', 'plans', 'healthForm']
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

  async save(patientId, section, record, session) {
    if (section === 'referrals' && (session?.role !== 'professional' || !session.id)) {
      throw new Error('Solo un profesional autenticado puede derivar un caso.')
    }
    if (section === 'referrals' && (!record.specialistId || !record.specialty || !record.reason?.trim())) {
      throw new Error('Selecciona un especialista e indica el motivo de la derivación.')
    }
    if (['prescriptions', 'prescriptionDecisions'].includes(section)) {
      if (session?.role !== 'professional' || !session.id) {
        throw new Error('Solo un profesional autenticado puede registrar recetas o decisiones clínicas.')
      }
      if (section === 'prescriptions' && ['medication', 'dosage', 'frequency', 'duration', 'quantity', 'route'].some((field) => !String(record[field] ?? '').trim())) {
        throw new Error('Completa medicamento, dosis, frecuencia, duración, cantidad y vía de administración.')
      }
    }
    const current = readSection(patientId, section)
    if (['prescriptions', 'prescriptionDecisions'].includes(section)) {
      if (record.id && !current.some((item) => item.id === record.id)) {
        throw new Error('No tienes permiso para modificar este registro clínico.')
      }
    }
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
