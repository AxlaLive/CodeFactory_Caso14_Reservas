import { useEffect, useMemo, useState } from 'react'
import {
  appointmentService,
  authService,
  blockService,
  professionalService,
  spaceService,
} from '../api/clinicService'
import { DAY_END, addMinutes, findBlockConflict, findConflict, formatLongDate, getSlotAvailability, getTimeOptions, toDateKey } from '../utils/agenda'
import '../styles/client.css'

const navigation = [
  { id: 'appointments', icon: '▦', label: 'Mis citas' },
  { id: 'profile', icon: '♙', label: 'Datos personales' },
  { id: 'forms', icon: '☑', label: 'Formularios' },
  { id: 'payments', icon: '$', label: 'Pagos' },
  { id: 'messages', icon: '✉', label: 'Comunicación' },
]

const GENERAL_DENTIST = 'Odontólogo general'
const VISIT_TYPE = 'Consulta de odontología general'
const VISIT_DURATION = 30
const GENERAL_APPOINTMENT_PRICE = 80000
const FORM_STORAGE_KEY = 'dentia-client-forms-v1'
const MESSAGE_STORAGE_KEY = 'dentia-client-messages-v1'

export default function ClientPage({ session, onUpdateSession, onLogout }) {
  const [view, setView] = useState('appointments')
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [spaces, setSpaces] = useState([])
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [booking, setBooking] = useState(null)
  const [profile, setProfile] = useState({ name: session.name, phone: session.phone, address: session.address, emergencyContact: session.emergencyContact })
  const [medicalForm, setMedicalForm] = useState(() => readPortalStorage(FORM_STORAGE_KEY, {})[session.id] || emptyMedicalForm())
  const [messages, setMessages] = useState(() => readPortalStorage(MESSAGE_STORAGE_KEY, {})[session.id] || [])
  const [messageText, setMessageText] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    Promise.all([
      appointmentService.list(),
      professionalService.list(),
      spaceService.list(),
      blockService.list(),
    ]).then(([nextAppointments, nextProfessionals, nextSpaces, nextBlocks]) => {
      if (!mounted) return
      setAppointments(nextAppointments)
      setProfessionals(nextProfessionals.filter((item) => item.active !== false && item.role === GENERAL_DENTIST))
      setSpaces(nextSpaces)
      setBlocks(nextBlocks)
      setLoading(false)
    }).catch((error) => {
      if (!mounted) return
      setPageError(`No fue posible cargar el portal: ${error.message}`)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const myAppointments = appointments.filter((item) =>
    item.clientId === session.id ||
    (item.patientId === session.identification && item.patientEmail === session.email),
  ).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
  const upcomingAppointments = myAppointments.filter((item) => item.status !== 'cancelled' && item.date >= toDateKey(new Date()))
  const historyAppointments = myAppointments.filter((item) => item.status === 'cancelled' || item.date < toDateKey(new Date()))
  const payableAppointments = myAppointments.filter((item) => item.status !== 'cancelled')
  const displayName = session.name || session.email
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  const notify = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const startBooking = (appointment = null) => {
    if (!professionals.length || !spaces.length) {
      setPageError(!professionals.length
        ? 'No hay odontólogos generales activos para agendar en este momento.'
        : 'No hay consultorios disponibles para agendar.')
      return
    }
    setPageError('')
    setBooking({
      id: appointment?.id || '',
      date: appointment?.date || '',
      startTime: appointment?.startTime || '',
      professionalId: appointment?.professionalId || professionals[0].id,
      spaceId: appointment?.spaceId || spaces[0].id,
      notes: appointment?.notes || '',
    })
  }

  const selectedProfessional = professionals.find((item) => item.id === booking?.professionalId)
  const selectedSpace = spaces.find((item) => item.id === booking?.spaceId)
  const availableSlots = useMemo(() => {
    if (!booking?.date || !selectedProfessional || !selectedSpace) return []
    const options = getTimeOptions(30).filter((time) => timeToMinutes(time) + VISIT_DURATION <= DAY_END)
    const slots = getSlotAvailability({
      date: booking.date,
      options,
      duration: VISIT_DURATION,
      buffer: 0,
      professionalId: selectedProfessional.id,
      spaceId: selectedSpace.id,
      excludeId: booking.id || undefined,
    }, appointments, blocks).filter((slot) => slot.available)
    if (booking.date !== toDateKey(new Date())) return slots
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    return slots.filter((slot) => timeToMinutes(slot.time) > currentTime)
  }, [booking, selectedProfessional, selectedSpace, appointments, blocks])

  const saveBooking = async (event) => {
    event.preventDefault()
    if (!booking?.date || !booking.startTime || !selectedProfessional || !selectedSpace) {
      setPageError('Selecciona un odontólogo general, una fecha y una hora disponible.')
      return
    }
    if (booking.date < toDateKey(new Date())) {
      setPageError('No puedes reservar en una fecha que ya pasó.')
      return
    }
    if (!availableSlots.some((slot) => slot.time === booking.startTime)) {
      setPageError('Ese horario ya no está disponible. Elige una de las horas mostradas.')
      return
    }
    const endTime = addMinutes(booking.startTime, VISIT_DURATION)
    const conflict = findConflict({
      date: booking.date,
      startTime: booking.startTime,
      endTime,
      professionalId: selectedProfessional.id,
      spaceId: selectedSpace.id,
      excludeId: booking.id || undefined,
    }, appointments)
    const blockConflict = findBlockConflict({
      date: booking.date,
      startTime: booking.startTime,
      endTime,
      professionalId: selectedProfessional.id,
    }, blocks)
    if (conflict || blockConflict) {
      setPageError('Ese horario ya no está disponible. Elige otra hora.')
      return
    }

    setBusy(true)
    setPageError('')
    try {
      const appointment = await appointmentService.save({
        ...(myAppointments.find((item) => item.id === booking.id) || {}),
        id: booking.id || `apt-client-${Date.now()}`,
        clientId: session.id,
        patientKind: 'registered',
        patientId: session.identification,
        patientName: session.name,
        patientPhone: session.phone,
        patientEmail: session.email,
        professionalId: selectedProfessional.id,
        professionalName: selectedProfessional.name,
        specialty: GENERAL_DENTIST,
        typeId: 'client-general-consultation',
        typeName: VISIT_TYPE,
        duration: VISIT_DURATION,
        price: GENERAL_APPOINTMENT_PRICE,
        currency: 'COP',
        spaceId: selectedSpace.id,
        spaceName: selectedSpace.name,
        date: booking.date,
        startTime: booking.startTime,
        endTime,
        bufferEndTime: endTime,
        status: 'scheduled',
        notes: booking.notes.trim(),
        receivedAt: Date.now(),
      })
      setAppointments((current) => current.some((item) => item.id === appointment.id)
        ? current.map((item) => item.id === appointment.id ? appointment : item)
        : [...current, appointment])
      setBooking(null)
      notify(booking.id ? 'Tu cita se reprogramó correctamente.' : 'Tu cita quedó reservada.')
    } catch (error) {
      setPageError(`No fue posible guardar la cita: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const cancelAppointment = async (appointment) => {
    if (!window.confirm(`¿Quieres cancelar tu cita del ${formatLongDate(appointment.date)} a las ${appointment.startTime}?`)) return
    try {
      await appointmentService.cancel(appointment.id)
      setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, status: 'cancelled' } : item))
      notify('La cita se canceló.')
    } catch (error) {
      setPageError(`No fue posible cancelar la cita: ${error.message}`)
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setBusy(true)
    setPageError('')
    try {
      const updated = await authService.updateCustomer(session.id, profile)
      onUpdateSession(updated)
      setProfile({ name: updated.name, phone: updated.phone, address: updated.address, emergencyContact: updated.emergencyContact })
      notify('Tus datos personales se actualizaron.')
    } catch (error) {
      setPageError(`No fue posible guardar tus datos: ${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const saveMedicalForm = (event) => {
    event.preventDefault()
    event.preventDefault()
    try {
      const stored = readPortalStorage(FORM_STORAGE_KEY, {})
      writePortalStorage(FORM_STORAGE_KEY, { ...stored, [session.id]: medicalForm })
      notify('Tu formulario de salud quedó guardado en este navegador.')
    } catch (error) {
      setPageError(`No fue posible guardar el formulario: ${error.message}`)
    }
  }

  const submitMessage = async (event) => {
    event.preventDefault()
    if (!messageText.trim() && !attachment) return
    try {
      const nextMessage = {
        id: `msg-${Date.now()}`,
        text: messageText.trim(),
        sentAt: new Date().toISOString(),
        attachment: attachment ? await fileAsLocalAttachment(attachment) : null,
      }
      const nextMessages = [...messages, nextMessage]
      const stored = readPortalStorage(MESSAGE_STORAGE_KEY, {})
      writePortalStorage(MESSAGE_STORAGE_KEY, { ...stored, [session.id]: nextMessages })
      setMessages(nextMessages)
      setMessageText('')
      setAttachment(null)
      notify('Tu mensaje quedó guardado en este navegador.')
    } catch (error) {
      setPageError(`No fue posible guardar el mensaje: ${error.message}`)
    }
  }

  return (
    <div className="client-portal">
      <aside className="client-sidebar">
        <div className="client-brand"><span>✦</span><strong>Dentia</strong><small>PORTAL DEL PACIENTE</small></div>
        <div className="client-user"><b>{initials}</b><div><strong>{displayName}</strong><span>Paciente</span></div></div>
        <nav aria-label="Navegación del portal">
          <span className="client-nav-label">Mi espacio</span>
          {navigation.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => { setView(item.id); setPageError('') }}><span>{item.icon}</span>{item.label}</button>)}
        </nav>
        <button className="client-logout" onClick={onLogout}>↪ Cerrar sesión</button>
      </aside>
      <main className="client-main">
        <header className="client-header">
          <div><span className="eyebrow">Clínica Sonrisa · Portal del paciente</span><h1>{navigation.find((item) => item.id === view)?.label}</h1></div>
          <div className="client-header-user"><span className="client-status-dot" /> Sesión activa <b>{initials}</b></div>
        </header>
        <div className="client-content">
          {pageError && <div className="client-alert" role="alert">{pageError}<button onClick={() => setPageError('')} aria-label="Cerrar">×</button></div>}
          {notice && <div className="client-notice" role="status">{notice}</div>}
          {loading ? <div className="client-card client-loading">Cargando tu portal…</div> : <>
            {view === 'appointments' && <AppointmentsView appointments={upcomingAppointments} history={historyAppointments} onBook={() => startBooking()} onReschedule={startBooking} onCancel={cancelAppointment} />}
            {view === 'profile' && <ProfileView session={session} profile={profile} onChange={(field, value) => setProfile((current) => ({ ...current, [field]: value }))} onSubmit={saveProfile} busy={busy} />}
            {view === 'forms' && <MedicalForm value={medicalForm} onChange={(field, value) => setMedicalForm((current) => ({ ...current, [field]: value }))} onSubmit={saveMedicalForm} />}
            {view === 'payments' && <PaymentsView appointments={payableAppointments} />}
            {view === 'messages' && <MessagesView messages={messages} text={messageText} attachment={attachment} onText={setMessageText} onAttachment={setAttachment} onSubmit={submitMessage} />}
          </>}
        </div>
      </main>
      {booking && <BookingDialog booking={booking} professionals={professionals} spaces={spaces} slots={availableSlots} busy={busy} onChange={(field, value) => setBooking((current) => ({ ...current, [field]: value, ...(field === 'date' ? { startTime: '' } : {}) }))} onSubmit={saveBooking} onClose={() => setBooking(null)} />}
    </div>
  )
}

function AppointmentsView({ appointments, history, onBook, onReschedule, onCancel }) {
  return <>
    <section className="client-welcome">
      <div><span className="eyebrow">Nos alegra verte</span><h2>Cuida tu sonrisa, a tu ritmo.</h2><p>Consulta tus citas y reserva una visita con odontología general.</p></div>
      <span className="welcome-icon">✦</span>
    </section>
    <section className="client-section-heading"><div><span className="eyebrow">Tu agenda</span><h2>Próximas citas</h2></div><button className="client-primary" onClick={onBook}>＋ Reservar una cita</button></section>
    {appointments.length ? <div className="client-appointment-list">{appointments.map((item) => <article className="client-card client-appointment" key={item.id}>
      <div className="appointment-date"><strong>{new Date(`${item.date}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit' })}</strong><span>{new Date(`${item.date}T12:00:00`).toLocaleDateString('es-CO', { month: 'short' })}</span></div>
      <div className="appointment-info"><strong>{item.typeName || VISIT_TYPE}</strong><span>{formatLongDate(item.date)} · {item.startTime}–{item.endTime}</span><small>{item.professionalName || GENERAL_DENTIST} · {item.spaceName || 'Consultorio'}</small><small>Valor: {formatMoney(item.price ?? GENERAL_APPOINTMENT_PRICE)}</small></div>
      <span className="appointment-status">Confirmada</span>
      <div className="appointment-actions"><button onClick={() => onReschedule(item)}>Reprogramar</button><button onClick={() => onCancel(item)}>Cancelar</button></div>
    </article>)}</div> : <div className="client-card client-empty"><span>☼</span><h3>Aún no tienes citas</h3><p>Reserva tu primera consulta de odontología general cuando quieras.</p><button className="client-primary" onClick={onBook}>Reservar mi primera cita</button></div>}
    <section className="client-card client-history"><h2>Historial de citas</h2>{history.length ? history.map((item) => <div className="client-history-row" key={item.id}><span>{formatLongDate(item.date)} · {item.startTime}</span><strong>{item.typeName || VISIT_TYPE}</strong><b className={item.status === 'cancelled' ? 'history-cancelled' : ''}>{item.status === 'cancelled' ? 'Cancelada' : 'Finalizada'}</b></div>) : <p>Tus citas anteriores aparecerán aquí.</p>}</section>
  </>
}

function BookingDialog({ booking, professionals, spaces, slots, busy, onChange, onSubmit, onClose }) {
  return <div className="client-dialog-backdrop" onMouseDown={onClose}><form className="client-dialog" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="eyebrow">{booking.id ? 'Gestiona tu cita' : 'Nueva reserva'}</span><h2>{booking.id ? 'Reprogramar cita' : 'Reserva tu cita'}</h2></div><button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button></header>
    <p className="booking-type"><span>✦</span><span><strong>Odontología general</strong><small>Consulta general · 30 minutos</small></span><b>{formatMoney(GENERAL_APPOINTMENT_PRICE)}</b></p>
    <label className="client-field">Odontólogo general<select value={booking.professionalId} onChange={(event) => onChange('professionalId', event.target.value)} required>{professionals.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label className="client-field">Fecha<input type="date" min={toDateKey(new Date())} value={booking.date} onChange={(event) => onChange('date', event.target.value)} required /></label>
    {booking.date && <fieldset className="client-time-picker"><legend>Horarios disponibles</legend>{slots.length ? <div>{slots.map((slot) => <button type="button" key={slot.time} className={booking.startTime === slot.time ? 'selected' : ''} onClick={() => onChange('startTime', slot.time)}>{slot.time}</button>)}</div> : <p>No hay horarios disponibles para esta fecha. Prueba con otro día.</p>}</fieldset>}
    <label className="client-field">Motivo de consulta (opcional)<textarea rows="3" value={booking.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Cuéntanos brevemente el motivo de tu visita" /></label>
    <p className="client-disclaimer">La disponibilidad se muestra con la información guardada en este navegador.</p>
    <footer><button type="button" className="client-secondary" onClick={onClose}>Volver</button><button type="submit" className="client-primary" disabled={busy || !booking.startTime}>{busy ? 'Guardando…' : booking.id ? 'Guardar cambios' : 'Confirmar cita'}</button></footer>
  </form></div>
}

function ProfileView({ session, profile, onChange, onSubmit, busy }) {
  return <section className="client-card client-panel"><div className="client-section-heading"><div><span className="eyebrow">Tu cuenta</span><h2>Información personal</h2></div><span className="profile-card-icon">♙</span></div><p className="client-description">Mantén tus datos de contacto actualizados. El correo y el documento identifican tu cuenta.</p>
    <form className="client-form-grid" onSubmit={onSubmit}>
      <label className="client-field">Nombre completo<input value={profile.name} onChange={(event) => onChange('name', event.target.value)} required /></label>
      <label className="client-field">Documento<input value={session.identification} disabled /></label>
      <label className="client-field">Correo electrónico<input type="email" value={session.email} disabled /></label>
      <label className="client-field">Teléfono<input type="tel" value={profile.phone} onChange={(event) => onChange('phone', event.target.value)} required /></label>
      <label className="client-field full">Dirección<input value={profile.address} onChange={(event) => onChange('address', event.target.value)} placeholder="Calle, número, ciudad" /></label>
      <label className="client-field full">Contacto de emergencia<input value={profile.emergencyContact} onChange={(event) => onChange('emergencyContact', event.target.value)} placeholder="Nombre y teléfono" /></label>
      <div className="client-form-footer"><button className="client-primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>
    </form>
    <p className="client-disclaimer">Estos cambios se guardan únicamente en el almacenamiento local de este navegador.</p>
  </section>
}

function MedicalForm({ value, onChange, onSubmit }) {
  return <section className="client-card client-panel"><div className="client-section-heading"><div><span className="eyebrow">Antes de tu consulta</span><h2>Formulario de salud</h2></div><span className="profile-card-icon">☑</span></div><p className="client-description">Comparte información relevante para que el equipo pueda prepararse para tu visita.</p>
    <form className="client-medical-form" onSubmit={onSubmit}>
      <label className="client-field">Antecedentes de salud<textarea rows="3" value={value.history} onChange={(event) => onChange('history', event.target.value)} placeholder="Enfermedades o antecedentes que quieras mencionar" /></label>
      <label className="client-field">Alergias<textarea rows="2" value={value.allergies} onChange={(event) => onChange('allergies', event.target.value)} placeholder="Medicamentos, alimentos u otras alergias" /></label>
      <label className="client-field">Medicamentos actuales<textarea rows="2" value={value.medications} onChange={(event) => onChange('medications', event.target.value)} placeholder="Nombre y dosis, si aplica" /></label>
      <label className="client-check"><input type="checkbox" checked={value.consent} onChange={(event) => onChange('consent', event.target.checked)} required /><span>Confirmo que la información es correcta y autorizo su uso para la preparación de mi atención odontológica.</span></label>
      <p className="client-disclaimer">Formulario de demostración: la información se almacena solo en este navegador y no se envía al equipo clínico.</p>
      <button className="client-primary" type="submit">Guardar formulario</button>
    </form>
  </section>
}

function PaymentsView({ appointments }) {
  const total = appointments.reduce((sum, appointment) => sum + (appointment.price ?? GENERAL_APPOINTMENT_PRICE), 0)
  return <><section className="payment-summary"><div><span className="eyebrow">Resumen de tus reservas</span><h2>Valor de citas registradas</h2><strong>{formatMoney(total)}</strong><p>{appointments.length ? `${appointments.length} cita${appointments.length === 1 ? '' : 's'} no cancelada${appointments.length === 1 ? '' : 's'}` : 'Aún no tienes citas registradas.'}</p></div><span className="payment-icon">$</span></section><section className="client-card client-history payment-history"><h2>Detalle de citas</h2>{appointments.length ? appointments.map((appointment) => <div className="client-history-row" key={appointment.id}><span>{formatLongDate(appointment.date)} · {appointment.startTime}</span><strong>{appointment.typeName || VISIT_TYPE}</strong><b>{formatMoney(appointment.price ?? GENERAL_APPOINTMENT_PRICE)}</b></div>) : <div className="client-empty compact"><span>▤</span><h3>Aún no tienes citas</h3><p>El valor aparecerá aquí cuando reserves una cita.</p></div>}</section><p className="client-disclaimer">Valores informativos de demostración. No se procesa ningún pago ni se registra un saldo pagado o pendiente.</p></>
}

function MessagesView({ messages, text, attachment, onText, onAttachment, onSubmit }) {
  return <section className="client-card client-panel"><div className="client-section-heading"><div><span className="eyebrow">Atención al cliente</span><h2>Comunícate con nosotros</h2></div><span className="profile-card-icon">✉</span></div><p className="client-description">Escribe un mensaje para tu equipo de atención o adjunta una imagen.</p>
    <div className="client-message-list">{messages.length ? messages.map((message) => <article className="client-message" key={message.id}><p>{message.text || 'Adjunto'}</p>{message.attachment && <a href={message.attachment.data} download={message.attachment.name}>📎 {message.attachment.name}</a>}<time>{new Date(message.sentAt).toLocaleString('es-CO')}</time></article>) : <div className="client-empty compact"><span>✉</span><h3>Tu conversación está vacía</h3><p>Los mensajes que guardes en este navegador aparecerán aquí.</p></div>}</div>
    <form className="client-message-form" onSubmit={onSubmit}><label className="client-field">Mensaje<textarea rows="3" value={text} onChange={(event) => onText(event.target.value)} placeholder="Escribe tu mensaje…" /></label><div className="message-compose-footer"><label className="client-attach">＋ Adjuntar imagen<input type="file" accept="image/*" onChange={(event) => onAttachment(event.target.files?.[0] || null)} /></label>{attachment && <span className="selected-file">{attachment.name}<button type="button" onClick={() => onAttachment(null)} aria-label="Quitar adjunto">×</button></span>}<button className="client-primary" type="submit" disabled={!text.trim() && !attachment}>Guardar mensaje</button></div><p className="client-disclaimer">Mensaje y adjuntos de demostración guardados localmente; nadie en la clínica los recibirá.</p></form>
  </section>
}

function emptyMedicalForm() {
  return { history: '', allergies: '', medications: '', consent: false }
}

function readPortalStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writePortalStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function fileAsLocalAttachment(file) {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Solo puedes adjuntar imágenes.'))
  if (file.size > 2 * 1024 * 1024) return Promise.reject(new Error('La imagen debe pesar máximo 2 MB.'))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result })
    reader.onerror = () => reject(new Error('No fue posible leer la imagen seleccionada.'))
    reader.readAsDataURL(file)
  })
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function formatMoney(value) {
  return `${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)} COP`
}
