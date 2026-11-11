import { useEffect, useState } from 'react'
import { professionalService, referralService } from '../api/clinicService'

function formatDate(value) {
  if (!value) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function ReferralsInbox({ session, onOpenPatient }) {
  const [referrals, setReferrals] = useState([])
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      const [items, notices] = await Promise.all([
        referralService.listForProfessional(session.id),
        referralService.notifications(session.id),
      ])
      setReferrals(items)
      setNotifications(notices)
    } catch (caught) {
      setError(caught.message || 'No fue posible cargar la bandeja de derivaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [session.id])

  const resolve = async (referral, action) => {
    setBusyId(referral.id)
    setError('')
    try {
      const updated = action === 'accept'
        ? await referralService.accept(referral.id, session.id)
        : await referralService.decline(referral.id, session.id)
      if (action === 'accept') await referralService.approveInformationAccess(updated)
      await refresh()
      setReferrals((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (caught) {
      setError(caught.message || 'No fue posible actualizar la derivación.')
    } finally {
      setBusyId('')
    }
  }

  const openCase = async (referral) => {
    try {
      await referralService.approveInformationAccess(referral)
      const appointments = await professionalService.assignedPatients(session.id)
      const appointment = appointments.find((item) => item.patientId === referral.patientId)
      if (!appointment) throw new Error('No se encontró la información del paciente derivado.')
      onOpenPatient({ ...appointment, id: `referral-${referral.id}`, professionalId: session.id, referralAccess: true })
    } catch (caught) {
      setError(caught.message || 'No fue posible abrir el expediente compartido.')
    }
  }

  return <section className="referrals-inbox">
    <header className="referrals-inbox-heading"><div><span className="eyebrow">ATENCIÓN ESPECIALIZADA</span><h2>Bandeja de derivaciones</h2><p>Revisa los casos remitidos, responde las solicitudes y consulta los expedientes aceptados.</p></div><button type="button" className="secondary-button" onClick={refresh} disabled={loading}>↻ Actualizar</button></header>
    <div className="referrals-access-explainer"><strong>Continuidad clínica</strong><span>Al aceptar un caso, se habilita el expediente completo del paciente y aparecerá en tu agenda de trabajo.</span>{notifications.filter((item) => !item.read).length > 0 && <b>{notifications.filter((item) => !item.read).length} notificación(es) nueva(s)</b>}</div>
    {error && <p className="medical-error" role="alert">{error}</p>}
    {loading ? <div className="medical-loading"><span className="medical-spinner" /> Cargando derivaciones…</div> : referrals.length === 0 ? <div className="medical-panel referrals-empty"><div className="medical-empty"><span>↙</span><p>No tienes derivaciones asignadas por ahora.</p></div></div> : <div className="referrals-list">{[...referrals].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((referral) => <article className="medical-panel referral-inbox-card" key={referral.id}><header><div className="referral-card-patient"><span className="medical-avatar">{(referral.patientName || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><span className="eyebrow">PACIENTE DERIVADO</span><h3>{referral.patientName || 'Paciente'}</h3><small>{referral.patientId}</small></div></div><span className={`referral-status referral-status-${referral.status}`}>{referral.status === 'pending' ? 'Pendiente' : referral.status === 'accepted' ? 'Aceptada' : 'No aceptada'}</span></header><div className="referral-inbox-meta"><span><b>Especialidad:</b> {referral.specialty}</span><span><b>Remitió:</b> {referral.referringProfessionalName}</span><span><b>Recibida:</b> {formatDate(referral.createdAt)}</span></div><section className="referral-inbox-detail"><strong>Motivo</strong><p>{referral.reason}</p>{referral.clinicalNotes && <><strong>Resumen clínico</strong><p>{referral.clinicalNotes}</p></>}{referral.imageIds?.length > 0 && <span className="referral-attachment-count">▧ {referral.imageIds.length} imagen(es) adjunta(s), disponibles en el expediente</span>}</section>{referral.status === 'pending' ? <footer><button type="button" className="secondary-button" onClick={() => resolve(referral, 'decline')} disabled={busyId === referral.id}>{busyId === referral.id ? 'Procesando…' : 'No aceptar'}</button><button type="button" className="primary-button" onClick={() => resolve(referral, 'accept')} disabled={busyId === referral.id}>{busyId === referral.id ? 'Procesando…' : 'Aceptar y abrir acceso clínico'}</button></footer> : referral.status === 'accepted' ? <div className="referral-accepted-footer"><span>✓ Aceptada por {referral.acceptedByName || session.name || session.username} · {formatDate(referral.acceptedAt)}. El expediente está disponible.</span><button type="button" className="primary-button" onClick={() => openCase(referral)}>Abrir expediente del paciente</button></div> : <footer className="referral-declined-footer">Solicitud no aceptada · {formatDate(referral.declinedAt)}</footer>}</article>)}</div>}
  </section>
}
