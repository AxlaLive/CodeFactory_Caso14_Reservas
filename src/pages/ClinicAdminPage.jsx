import { useEffect, useMemo, useState } from 'react'
import AgendaWeekly from '../components/AgendaWeekly'
import AppointmentForm from '../components/AppointmentForm'
import ProfessionalDetail from '../components/ProfessionalDetail'
import ProfessionalForm from '../components/ProfessionalForm'
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
  const [professionalForm, setProfessionalForm] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState(null)
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
  const createProfessional = async (data) => {
    const item = await professionalService.create(data)
    setProfessionals((current) => [...current, item])
    notify('Trabajador registrado correctamente.')
  }
  const toggleProfessional = async (professional) => {
    const updated = await professionalService.update(professional.id, { active: professional.active === false })
    setProfessionals((current) => current.map((item) => item.id === updated.id ? updated : item))
    setSelectedProfessional(updated)
    notify(updated.active ? 'Trabajador marcado como activo.' : 'Trabajador marcado como inactivo.')
  }
  const deleteProfessional = async (professional) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${professional.name} del sistema?`)) return
    await professionalService.remove(professional.id)
    setProfessionals((current) => current.filter((item) => item.id !== professional.id))
    setSelectedProfessional(null)
    notify('Trabajador eliminado del sistema.')
  }
  const openCreate = ({ date, time }) => setAppointmentForm({ mode: 'create', value: { date, startTime: time, duration: 30, status: 'scheduled' } })
  const openEdit = (appointment) => setAppointmentForm({ mode: 'edit', value: appointment })
  const openReschedule = (appointment) => setAppointmentForm({ mode: 'reschedule', value: appointment })

  if (!session) return <LoginPage onLogin={login} />

  const isAdmin = session.role === 'admin'
  const displayName = session.name || session.username || 'Usuario'
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const roleLabel = isAdmin ? 'Administrador' : session.specialty || 'Profesional'
  const sectionTitle = view === 'agenda' ? 'Agenda semanal' : view === 'professionals' ? 'Equipo dentia' : 'Espacios fisicos'

  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><span>✦</span><strong>Dentia</strong><small>ADMINISTRACION CLINICA</small></div><div className="admin-user"><b>{initials}</b><div><strong>{displayName}</strong><span>{roleLabel}</span></div></div><nav><span className="nav-title">Panel administrativo</span><button className={view === 'agenda' ? 'active' : ''} onClick={() => setView('agenda')}>▦ <span>Agenda semanal</span></button><button className={view === 'professionals' ? 'active' : ''} onClick={() => setView('professionals')}>♧ <span>Equipo dentia</span></button><button className={view === 'spaces' ? 'active' : ''} onClick={() => setView('spaces')}>⌂ <span>Espacios fisicos</span></button></nav><button className="logout" onClick={logout}>↪ Cerrar sesion</button></aside><main className="admin-main"><header className="admin-header"><div><span className="eyebrow">Clinica Sonrisa · Panel administrativo</span><h1>{sectionTitle}</h1></div><div className="header-profile"><span className="header-status"><span /> Sistema operativo</span><div className="profile-chip"><span className="profile-avatar">{initials}</span><div><strong>{displayName}</strong><small>{roleLabel}</small></div></div></div></header><div className="admin-content">{view === 'agenda' && <><section className="agenda-intro"><div><p>Gestiona la disponibilidad y las citas de la clinica.</p><div className="legend"><span><i className="legend-available" />Disponible</span><span><i className="legend-scheduled" />Programada</span><span><i className="legend-cancelled" />Cancelada</span></div></div><button className="primary-button" onClick={() => openCreate({ date: toDateKey(new Date()), time: '08:00' })}>＋ Nueva cita</button></section><AgendaWeekly weekDays={weekDays} appointments={appointments} onPreviousWeek={() => setWeekDate(new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() - 7))} onNextWeek={() => setWeekDate(new Date(weekDate.getFullYear(), weekDate.getMonth(), weekDate.getDate() + 7))} onToday={() => setWeekDate(new Date())} onSelectSlot={openCreate} onEdit={openEdit} onCancel={cancelAppointment} /><section className="appointment-history"><span className="eyebrow">Gestion de citas</span><h2>Citas de la semana</h2><div className="history-list">{appointments.filter((item) => weekDays.some((day) => toDateKey(day) === item.date)).map((appointment) => <article key={appointment.id} className={appointment.status === 'cancelled' ? 'history-item cancelled' : 'history-item'}><div><strong>{appointment.patientName}</strong><span>{appointment.date} · {appointment.startTime} - {appointment.endTime} · {appointment.professionalName} · {appointment.spaceName}</span></div><b>{appointment.status === 'cancelled' ? 'Cancelada' : appointment.status === 'pending' ? 'Pendiente' : 'Programada'}</b>{appointment.status !== 'cancelled' && <div className="history-actions"><button onClick={() => openEdit(appointment)}>Editar</button><button onClick={() => openReschedule(appointment)}>Reprogramar</button><button onClick={() => cancelAppointment(appointment)}>Cancelar</button></div>}</article>)}</div></section></>}{view === 'professionals' && <section className="resource-page"><div className="resource-heading"><div><span className="eyebrow">Administracion</span><h2>Equipo dentia</h2><p>Registra a los profesionales y recepcionistas que accederán a la agenda y a los recursos del sistema.</p></div><button className="primary-button" onClick={() => setProfessionalForm(true)}>＋ Registrar trabajador</button></div><div className="resource-list">{professionals.map((item) => <button className="resource-item clickable" key={item.id} onClick={() => setSelectedProfessional(item)}><div className={item.active === false ? 'resource-icon inactive' : 'resource-icon'}>{item.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{item.name}</strong><span>{item.role}</span></div><i className={item.active === false ? 'inactive' : ''}>{item.active === false ? 'Inactivo' : 'Activo'}</i></button>)}</div></section>}{view === 'spaces' && <ResourceManager title="Espacios fisicos" description="Administra los consultorios y salas disponibles para las citas." items={spaces} fields={[{ name: 'name', label: 'Nombre del espacio', placeholder: 'Ej. Consultorio general 2' }, { name: 'type', label: 'Tipo de espacio', placeholder: 'Ej. Sala de cirugia oral' }]} onCreate={async (data) => { const item = await spaceService.create(data); setSpaces((current) => [...current, item]); notify('Espacio registrado correctamente.') }} />}</div></main>{appointmentForm && <AppointmentForm value={appointmentForm.value} mode={appointmentForm.mode} professionals={professionals} spaces={spaces} appointments={appointments} onClose={() => setAppointmentForm(null)} onSave={saveAppointment} />}{professionalForm && <ProfessionalForm onClose={() => setProfessionalForm(false)} onSave={createProfessional} />}{selectedProfessional && <ProfessionalDetail professional={selectedProfessional} onClose={() => setSelectedProfessional(null)} onToggleActive={toggleProfessional} onDelete={deleteProfessional} />}{notice && <div className="notice">✓ {notice}</div>}</div>
}

export default App
