import { useEffect, useState } from 'react'
import { getEndTime, timeToMinutes } from '../utils/agenda'

const empty = { patientId: '', patientName: '', professionalId: '', spaceId: '', date: '', startTime: '08:00', duration: 30, status: 'scheduled', notes: '' }

export default function AppointmentForm({ value, professionals, spaces, appointments, onClose, onSave, mode = 'create' }) {
  const [form, setForm] = useState({ ...empty, ...value })
  const [errors, setErrors] = useState({})
  const selectedProfessional = professionals.find((item) => item.id === form.professionalId)
  const selectedSpace = spaces.find((item) => item.id === form.spaceId)
  useEffect(() => setForm({ ...empty, ...value }), [value])
  const update = (field, next) => setForm((current) => ({ ...current, [field]: next }))
  const validate = () => {
    const nextErrors = {}
    if (!form.patientId.trim()) nextErrors.patientId = 'Ingresa la identificacion del paciente.'
    if (!form.patientName.trim()) nextErrors.patientName = 'Ingresa el nombre del paciente.'
    if (!form.professionalId) nextErrors.professionalId = 'Selecciona un profesional.'
    if (!form.spaceId) nextErrors.spaceId = 'Selecciona un espacio fisico.'
    if (!form.date) nextErrors.date = 'Selecciona una fecha.'
    const endTime = getEndTime(form.startTime, form.duration)
    const conflict = appointments.find((item) => item.id !== form.id && item.status !== 'cancelled' && item.date === form.date && (item.professionalId === form.professionalId || item.spaceId === form.spaceId) && timeToMinutes(form.startTime) < timeToMinutes(item.endTime) && timeToMinutes(endTime) > timeToMinutes(item.startTime))
    if (conflict) nextErrors.availability = 'El profesional o el espacio ya tienen una cita superpuesta. El backend debe confirmar la disponibilidad definitiva.'
    setErrors(nextErrors)
    return { ...nextErrors, endTime }
  }
  const submit = (event) => { event.preventDefault(); const result = validate(); if (Object.keys(result).some((key) => key !== 'endTime')) return; onSave({ ...form, endTime: result.endTime, professionalName: selectedProfessional?.name || '', specialty: selectedProfessional?.role || '', spaceName: selectedSpace?.name || '' }) }
  return <div className="modal-layer" onMouseDown={onClose}><form className="appointment-form" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><div className="form-header"><div><span className="eyebrow">{mode === 'reschedule' ? 'Reprogramar cita' : mode === 'edit' ? 'Editar cita' : 'Nueva cita'}</span><h2>{mode === 'reschedule' ? 'Cambiar fecha y hora' : 'Datos de la cita'}</h2></div><button type="button" onClick={onClose}>×</button></div>{errors.availability && <div className="form-error">{errors.availability}</div>}<div className="form-grid"><Field label="Identificacion del paciente" error={errors.patientId}><input value={form.patientId} onChange={(event) => update('patientId', event.target.value)} placeholder="CC o documento" /></Field><Field label="Nombre del paciente" error={errors.patientName}><input value={form.patientName} onChange={(event) => update('patientName', event.target.value)} placeholder="Nombre completo" /></Field><Field label="Profesional" error={errors.professionalId}><select value={form.professionalId} onChange={(event) => update('professionalId', event.target.value)}><option value="">Selecciona un profesional</option>{professionals.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.role}</option>)}</select></Field><Field label="Espacio fisico" error={errors.spaceId}><select value={form.spaceId} onChange={(event) => update('spaceId', event.target.value)}><option value="">Selecciona un espacio</option>{spaces.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.type}</option>)}</select></Field><Field label="Fecha" error={errors.date}><input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} /></Field><Field label="Hora"><input type="time" value={form.startTime} step="1800" onChange={(event) => update('startTime', event.target.value)} /></Field><Field label="Duracion"><select value={form.duration} onChange={(event) => update('duration', Number(event.target.value))}><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></Field><Field label="Estado"><select value={form.status} onChange={(event) => update('status', event.target.value)}><option value="scheduled">Programada</option><option value="pending">Pendiente</option></select></Field><Field label="Notas" full><textarea rows="3" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Informacion adicional" /></Field></div><footer className="modal-footer"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">{mode === 'reschedule' ? 'Reprogramar' : mode === 'edit' ? 'Guardar cambios' : 'Crear cita'}</button></footer></form></div>
}

function Field({ label, error, children, full }) { return <label className={full ? 'form-field full-field' : 'form-field'}><span>{label}</span>{children}{error && <small>{error}</small>}</label> }
