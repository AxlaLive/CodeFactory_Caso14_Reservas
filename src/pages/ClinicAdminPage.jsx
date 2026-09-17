import { useEffect, useMemo, useState } from 'react'
import AgendaWeekly from '../components/AgendaWeekly'
import AppointmentForm from '../components/AppointmentForm'
import ResourceManager from '../components/ResourceManager'
import { appointmentService, authService, professionalService, spaceService } from '../api/clinicService'
import { getWeekDays, toDateKey } from '../utils/agenda'
import LoginPage from './LoginPage'

function App() {
  const [session, setSession] = useState(() => authService.session())
  const [view, setView] = useState('agenda')
  const [weekDate, setWeekDate] = useState(new Date(2026, 8, 16))
  const [appointments, setAppointments] = useState([])
  const [professionals, setProfessionals] = useState([])
  const [spaces, setSpaces] = useState([])
  const [appointmentForm, setAppointmentForm] = useState(null)
  const [notice, setNotice] = useState('')
  const weekDays = useMemo(() => getWeekDays(weekDate), [weekDate])

  useEffect(() => {
    Promise.all([appointmentService.list(), professionalService.list(), spaceService.list()]).then(([nextAppointments, nextProfessionals, nextSpaces]) => {
      setAppointments(nextAppointments)
      setProfessionals(nextProfessionals)
      setSpaces(nextSpaces)
    })
  }, [])

  const notify = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }
  const login = async (credentials) => setSession(await authService.login(credentials))
  const logout = () => { authService.logout(); setSession(null) }
  const saveAppointment = async (data) => {
    const saved = await appointmentService.save({ ...data, id: data.id || `apt-${Date.now()}` })
    setAppointments((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved])
    setAppointmentForm(null)
    notify(data.id ? 'Cita actualizada correctamente.' : 'Cita creada correctamente.')
  }
  const cancelAppointment = async (appointment) => {
    if (!window.confirm(`¿Cancelar la cita de ${appointment.patientName}?`)) return
    await appointmentService.cancel(appointment.id)
    setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, status: 'cancelled' } : item))
    notify('Cita cancelada. La franja quedó disponible.')
  }
  const openCreate = ({ date, time }) => setAppointmentForm({ mode: 'create', value: { date, startTime: time, duration: 30, status: 'scheduled' } })
  const openEdit = (appointment) => setAppointmentForm({ mode: 'edit', value: appointment })
  const openReschedule = (appointment) => setAppointmentForm({ mode: 'reschedule', value: appointment })

  if (!session) return <LoginPage onLogin={login} />
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><span>✦</span><strong>Dentia</strong><small>ADMINISTRACION CLINICA</small></div><div className="admin-user"><b>AD</b><div><strong>Administrador</strong><span>{session.username}</span></div></div><nav><span className="nav-title">Panel administrativo</span><button className={view === 'agenda' ? 'active' : ''} onClick={() => setView('agenda')}>▦ <span>Agenda semanal</span></button><button className={view === 'professionals' ? 'active' : ''} onClick={() => setView('professionals')}>♧ <span>Profesionales</span></button><button className={view === 'spaces' ? 'active' : ''} onClick={() => setView('spaces')}>⌂ <span>Espacios fisicos</span></button></nav><button className="logout" onClick={logout}>↪ Cerrar sesion</button></aside><main className="admin-main"><header className="admin-header"><div><span className="eyebrow">Clinica Sonrisa · Panel administrativo</span><h1>{view === 'agenda' ? 'Agenda semanal' : view === 'professionals' ? 'Profesionales' : 'Espacios fisicos'}</h1></div><div className="header-status"><span /> Sistema operativo <b>AD</b></div></header><div className="admin-content">{view === 'agenda' && <><section className="agenda-intro"><div><p>Gestiona la disponibilidad y las citas de la clinica.</p><div className="legend"><span><i className="legend-available" />Disponible</span><span><i className="legend-scheduled" />Programada</span><span><i className="legend-cancelled" />Cancelada</span></div></div><button className="primary-button" onClick={() => openCreate({ date: toDateKey(new Date()), time: '08:00' })}>＋ Nueva cita</button></section><AgendaWeekly weekDays={weekDays} appointments={appointments} onPreviousWeek={() => setWeekDate(new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() - 7))} onNextWeek={() => setWeekDate(new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() + 7))} onToday={() => setWeekDate(new Date())} onSelectSlot={openCreate} onEdit={openEdit} onCancel={cancelAppointment} /><section className="appointment-history"><span className="eyebrow">Gestion de citas</span><h2>Citas de la semana</h2><div className="history-list">{appointments.filter((item) => weekDays.some((day) => toDateKey(day) === item.date)).map((appointment) => <article key={appointment.id} className={appointment.status === 'cancelled' ? 'history-item cancelled' : 'history-item'}><div><strong>{appointment.patientName}</strong><span>{appointment.date} · {appointment.startTime} - {appointment.endTime} · {appointment.professionalName} · {appointment.spaceName}</span></div><b>{appointment.status === 'cancelled' ? 'Cancelada' : appointment.status === 'pending' ? 'Pendiente' : 'Programada'}</b>{appointment.status !== 'cancelled' && <div className="history-actions"><button onClick={() => openEdit(appointment)}>Editar</button><button onClick={() => openReschedule(appointment)}>Reprogramar</button><button onClick={() => cancelAppointment(appointment)}>Cancelar</button></div>}</article>)}</div></section></>}{view === 'professionals' && <ResourceManager title="Profesionales" description="Registra los profesionales que estarán disponibles como recursos de agenda." items={professionals} fields={[{ name: 'name', label: 'Nombre completo', placeholder: 'Ej. Daniel Rojas' }, { name: 'role', label: 'Especialidad o rol', placeholder: 'Ej. Odontologia general' }]} onCreate={async (data) => { const item = await professionalService.create(data); setProfessionals((current) => [...current, item]); notify('Profesional registrado correctamente.') }} />}{view === 'spaces' && <ResourceManager title="Espacios fisicos" description="Administra los consultorios y salas disponibles para las citas." items={spaces} fields={[{ name: 'name', label: 'Nombre del espacio', placeholder: 'Ej. Consultorio general 2' }, { name: 'type', label: 'Tipo de espacio', placeholder: 'Ej. Sala de cirugia oral' }]} onCreate={async (data) => { const item = await spaceService.create(data); setSpaces((current) => [...current, item]); notify('Espacio registrado correctamente.') }} />}</div></main>{appointmentForm && <AppointmentForm value={appointmentForm.value} mode={appointmentForm.mode} professionals={professionals} spaces={spaces} appointments={appointments} onClose={() => setAppointmentForm(null)} onSave={saveAppointment} />}{notice && <div className="notice">✓ {notice}</div>}</div>
}

export default App
