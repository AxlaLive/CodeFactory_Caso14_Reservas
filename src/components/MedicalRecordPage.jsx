import { useEffect, useMemo, useState } from 'react'
import { authService } from '../api/clinicService'
import { medicalRecordService } from '../api/medicalRecordService'
import PrescriptionPanel from './PrescriptionPanel'
import ReferralPanel from './ReferralPanel'
import TreatmentPlanPanel from './TreatmentPlanPanel'

const TABS = [
  ['summary', 'Resumen'],
  ['history', 'Historia clínica'],
  ['notes', 'Notas clínicas'],
  ['images', 'Imágenes asociadas'],
  ['prescriptions', 'Receta electrónica'],
  ['referrals', 'Derivaciones'],
]

const TOOTH_NUMBERS = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28', '48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38']
const STATUS_LABELS = {
  caries: 'Caries',
  restoration: 'Empaste / restauración',
  absent: 'Diente ausente',
  crown: 'Corona realizada',
  crownNeeded: 'Corona requerida',
  endodontics: 'Endodoncia realizada',
  endodonticsNeeded: 'Endodoncia requerida',
  sealant: 'Sellante',
  implant: 'Implante',
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}

function latestByTooth(entries) {
  return entries.reduce((result, entry) => {
    if (!result[entry.tooth]) result[entry.tooth] = entry
    return result
  }, {})
}

export default function MedicalRecordPage({ appointment, session, activeView, onChangeView, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('summary')
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [viewer, setViewer] = useState(null)
  const [viewerError, setViewerError] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState('16')
  const [selectedRegion, setSelectedRegion] = useState('O')
  const [sharedFromReferral, setSharedFromReferral] = useState(false)
  const [readingSharedRecord, setReadingSharedRecord] = useState(false)

  const openSharedPatient = async (patientId) => {
    setReadingSharedRecord(true)
    try {
      const result = await medicalRecordService.loadReferralPatient(patientId, session)
      setProfile(result.profile)
      setRecords(result.records)
      setErrors(result.errors)
      setSharedFromReferral(true)
      setLoading(false)
      setActiveTab('summary')
    } catch (error) {
      setErrors((current) => ({ ...current, sharedRecord: error.message }))
    } finally {
      setReadingSharedRecord(false)
    }
  }

  const closeSharedRecord = () => {
    setSharedFromReferral(false)
    setProfile(null)
    setRecords({})
    setLoading(true)
    setErrors((current) => ({ ...current, sharedRecord: undefined }))
    setActiveTab('summary')
  }

  useEffect(() => {
    let active = true
    medicalRecordService.load(appointment, session).then((result) => {
      if (!active) return
      setProfile(result.profile)
      setRecords(result.records)
      setErrors(result.errors)
      setLoading(false)
    }).catch((error) => {
      if (!active) return
      if (!sharedFromReferral) setErrors({ access: error.message || 'No fue posible abrir el expediente.' })
      setLoading(false)
    })
    return () => { active = false }
  }, [appointment, session])

  useEffect(() => {
    let loggedOut = false
    const checkExpiry = () => {
      try {
        if (!loggedOut && authService.isTokenExpired()) {
          loggedOut = true
          setProfile(null)
          setRecords({})
          onLogout()
        }
      } catch (error) {
        loggedOut = true
        setProfile(null)
        setRecords({})
        setErrors((current) => ({ ...current, session: error.message }))
        onLogout()
      }
    }
    checkExpiry()
    const timer = window.setInterval(checkExpiry, 1000)
    return () => window.clearInterval(timer)
  }, [onLogout])

  const patientId = appointment.patientId
  const odontogram = useMemo(
    () => latestByTooth(records.odontogram || []),
    [records.odontogram],
  )

  const saveRecord = async (section, value) => {
    try {
      const saved = section === 'images' && value.file
        ? await medicalRecordService.addImage(patientId, value.file, value.description)
        : await medicalRecordService.save(patientId, section, value, session)
      setRecords((current) => ({
        ...current,
        [section]: [saved, ...(current[section] || []).filter((item) => item.id !== saved.id)]
          .sort((a, b) => b.date.localeCompare(a.date)),
      }))
      setErrors((current) => ({ ...current, [section]: undefined }))
      setEditing(null)
      setNotice('Información clínica guardada.')
      window.setTimeout(() => setNotice(''), 3000)
    } catch (error) {
      setErrors((current) => ({ ...current, [section]: error.message }))
      throw error
    }
  }

  const removeRecord = async (section, item) => {
    if (!window.confirm('¿Eliminar este registro del expediente?')) return
    try {
      await medicalRecordService.remove(patientId, section, item.id)
      setRecords((current) => ({
        ...current,
        [section]: (current[section] || []).filter((entry) => entry.id !== item.id),
      }))
    } catch (error) {
      setErrors((current) => ({ ...current, [section]: error.message }))
    }
  }

  return (
    <section className="medical-record">
      <button type="button" className="medical-back" onClick={onBack}>← Atrás a mi agenda</button>
      <header className="medical-patient-header">
        <div className="medical-avatar">{(appointment.patientName || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
        <div className="medical-patient-info">
          <span className="eyebrow">Expediente clínico · {appointment.typeName || 'Cita'}</span>
          <h2>{appointment.patientName}</h2>
          <div className="medical-demographics">
            <span>Documento {profile?.identification || appointment.patientId || '—'}</span>
            <span>{profile?.age ? `${profile.age} años` : 'Edad no registrada'}</span>
            <span>{profile?.phone || 'Teléfono no registrado'}</span>
            <span>{profile?.email || 'Correo no registrado'}</span>
          </div>
        </div>
        <div className="medical-appointment-chip">
          <span>Atención asignada</span>
          <strong>{appointment.date} · {appointment.startTime}</strong>
          <small>{session.specialty || 'Profesional'}</small>
        </div>
      </header>

      {profile?.allergies?.length > 0 && (
        <aside className="medical-allergy-alert" role="alert">
          <span className="allergy-icon">!</span>
          <div><strong>Alerta clínica: alergias registradas</strong><p>{profile.allergies.join(' · ')}{profile.allergyReaction ? ` · Reacción: ${profile.allergyReaction}` : ''}</p></div>
          <span className="medical-alert-priority">ATENCIÓN</span>
        </aside>
      )}
      {errors.profile && <div className="medical-error" role="alert">{errors.profile}</div>}
      {errors.access && <div className="medical-error" role="alert">{errors.access} <button onClick={onBack}>Volver a la agenda</button></div>}
      {errors.session && <div className="medical-error" role="alert">{errors.session}</div>}

      {errors.sharedRecord && <div className="medical-error" role="alert">{errors.sharedRecord}</div>}
      {sharedFromReferral && <aside className="referral-access-banner"><strong>Acceso compartido por derivación aceptada</strong><span>Consulta del expediente clínico completo autorizada por esta derivación.</span><button type="button" onClick={closeSharedRecord}>Cerrar expediente compartido</button></aside>}
      {readingSharedRecord && <p className="medical-loading"><span className="medical-spinner" /> Cargando expediente compartido…</p>}
      {!errors.access && activeView === 'record' && <>
        <nav className="medical-tabs" aria-label="Secciones del expediente">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
              {label}{id === 'images' && records.images?.length > 0 && <span>{records.images.length}</span>}
            </button>
          ))}
        </nav>
        <div className="medical-section-scroll">
          {loading ? <div className="medical-loading"><span className="medical-spinner" /> Cargando expediente clínico…</div> : (
            <>
              {errors[activeTab] && <div className="medical-error" role="alert">{errors[activeTab]}</div>}
              {activeTab === 'summary' && <SummaryPanel profile={profile} records={records} onChangeView={onChangeView} onChangeTab={setActiveTab} />}
              {activeTab === 'history' && <ClinicalHistoryPanel records={records} onAddTreatment={() => setEditing({ section: 'treatments' })} onOpenPrescriptions={() => setActiveTab('prescriptions')} />}
              {activeTab === 'notes' && <ListPanel title="Notas clínicas" subtitle="Observaciones relevantes para la atención." items={records.notes || []} empty="Este paciente aún no tiene notas clínicas." onAdd={() => setEditing({ section: 'notes' })} onEdit={(item) => setEditing({ section: 'notes', item })} onDelete={(item) => removeRecord('notes', item)} renderItem={(item) => <p>{item.text}</p>} />}
              {activeTab === 'images' && <ImagePanel items={records.images || []} onAdd={(file, description) => saveRecord('images', { file, description })} onEdit={(item) => setEditing({ section: 'images', item })} onView={(item) => { setViewerError(false); setViewer(item) }} onDelete={(item) => removeRecord('images', item)} />}
              {activeTab === 'prescriptions' && <PrescriptionPanel patientId={patientId} profile={profile} records={records} session={session} onSaved={(section, saved) => setRecords((current) => ({ ...current, [section]: [saved, ...(current[section] || [])].sort((a, b) => b.date.localeCompare(a.date)) }))} />}
              {activeTab === 'referrals' && <ReferralPanel patientId={patientId} patientName={appointment.patientName} records={records} session={session} onOpenPatient={openSharedPatient} onSaved={(saved) => setRecords((current) => ({ ...current, referrals: [saved, ...(current.referrals || [])] }))} />}
              {activeTab !== 'summary' && <p className="medical-retention">Historial completo, ordenado del más reciente al más antiguo.</p>}
            </>
          )}
        </div>
      </>}
      {!errors.access && activeView === 'odontogram' && (
        <div className="medical-section-scroll">
          {loading ? <div className="medical-loading"><span className="medical-spinner" /> Cargando expediente clínico…</div> : <OdontogramPanel entries={records.odontogram || []} teeth={odontogram} selectedTooth={selectedTooth} selectedRegion={selectedRegion} onSelectTooth={setSelectedTooth} onSelectRegion={setSelectedRegion} onSave={(value) => saveRecord('odontogram', value)} onDelete={(item) => removeRecord('odontogram', item)} />}
        </div>
      )}
      {!errors.access && activeView === 'plan' && (
        <div className="medical-section-scroll">
          {loading ? <div className="medical-loading"><span className="medical-spinner" /> Cargando expediente clínico…</div> : <TreatmentPlanPanel patientId={patientId} plans={records.plans || []} onSaved={(saved) => setRecords((current) => ({ ...current, plans: [saved, ...(current.plans || [])] }))} />}
          {errors.plans && <div className="medical-error" role="alert">{errors.plans}</div>}
        </div>
      )}

      {editing && <RecordEditor section={editing.section} item={editing.item} selectedTooth={selectedTooth} selectedRegion={selectedRegion} onClose={() => setEditing(null)} onSave={(value) => saveRecord(editing.section, value)} onDelete={editing.item ? () => removeRecord(editing.section, editing.item) : null} />}
      {viewer && <div className="medical-image-viewer" role="dialog" aria-modal="true" aria-label={`Imagen ${viewer.name}`} onMouseDown={() => setViewer(null)}>
        <section onMouseDown={(event) => event.stopPropagation()}><header><div><strong>{viewer.name}</strong><span>{viewer.description || 'Sin descripción'} · {formatDate(viewer.date)}</span></div><button onClick={() => setViewer(null)} aria-label="Cerrar visor">×</button></header>{viewerError && <p className="medical-error" role="alert">No se pudo cargar la imagen seleccionada.</p>}<img src={viewer.dataUrl} alt={viewer.description || viewer.name} onError={() => setViewerError(true)} /></section>
      </div>}
      {notice && <div className="notice">✓ {notice}</div>}
    </section>
  )
}

function SectionHeading({ title, subtitle, onAdd, addLabel = 'Añadir registro' }) {
  return <header className="medical-section-heading"><div><span className="eyebrow">Información clínica</span><h2>{title}</h2><p>{subtitle}</p></div>{onAdd && <button type="button" className="primary-button" onClick={onAdd}>＋ {addLabel}</button>}</header>
}

function OdontogramPanel({ entries, teeth, selectedTooth, selectedRegion, onSelectTooth, onSelectRegion, onSave, onDelete }) {
  const regions = ['M', 'D', 'V', 'L', 'O']
  const selectedEntry = entries.find((item) => item.tooth === selectedTooth && item.face === selectedRegion)
  const [status, setStatus] = useState(selectedEntry?.status || 'caries')
  const [note, setNote] = useState(selectedEntry?.note || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setStatus(selectedEntry?.status || 'caries')
    setNote(selectedEntry?.note || '')
    setError('')
  }, [selectedTooth, selectedRegion, selectedEntry?.id, selectedEntry?.status, selectedEntry?.note])

  const saveFinding = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        id: selectedEntry?.id,
        date: selectedEntry?.date || new Date().toISOString().slice(0, 10),
        tooth: selectedTooth,
        face: selectedRegion,
        status,
        note: note.trim(),
      })
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSaving(false)
    }
  }
  return <div className="medical-panel odontogram-panel">
    <SectionHeading title="Odontograma digital" subtitle="Selecciona una pieza para revisar o registrar su condición clínica." />
    <div className="odontogram-layout">
      <section className="odontogram-board">
        <div className="odontogram-board-heading"><div><span className="eyebrow">DENTICIÓN PERMANENTE</span><h3>Mapa dental</h3></div><span className="odontogram-patient-label">Paciente · {selectedTooth ? `pieza ${selectedTooth}` : 'selecciona una pieza'}</span></div>
        <div className="odontogram-legend">{Object.entries(STATUS_LABELS).map(([key, label]) => <span key={key}><i className={`tooth-mark mark-${key}`} />{label}</span>)}</div>
        <div className="odontogram-scroll">
          <div className="odontogram-arch">
            <span className="arch-label">ARCADA SUPERIOR</span>
            <div className="teeth-row">{TOOTH_NUMBERS.slice(0, 16).map((number) => <Tooth key={number} number={number} entry={teeth[number]} selected={selectedTooth === number} onClick={() => onSelectTooth(number)} />)}</div>
            <div className="arch-divider"><span>Derecha</span><b>Línea media</b><span>Izquierda</span></div>
            <div className="teeth-row lower">{TOOTH_NUMBERS.slice(16).map((number) => <Tooth key={number} number={number} entry={teeth[number]} selected={selectedTooth === number} onClick={() => onSelectTooth(number)} />)}</div>
            <span className="arch-label">ARCADA INFERIOR</span>
          </div>
        </div>
        <div className="odontogram-board-note">Los hallazgos se guardan en la historia clínica del paciente.</div>
      </section>
      <form className="odontogram-editor" onSubmit={saveFinding}>
        <div className="odontogram-editor-heading"><span className="odontogram-tooth-number">{selectedTooth}</span><div><span className="eyebrow">PIEZA SELECCIONADA</span><h3>Diente {selectedTooth}</h3><p>{teeth[selectedTooth] ? STATUS_LABELS[teeth[selectedTooth].status] : 'Sin hallazgos registrados'}</p></div></div>
        <label className="odontogram-field-label">Superficie dental</label>
        <div className="odontogram-region-picker" aria-label="Seleccionar cara dental">{regions.map((region) => <button type="button" key={region} className={selectedRegion === region ? 'active' : ''} onClick={() => onSelectRegion(region)} title={`Cara ${region}`}>{region}</button>)}</div>
        <label className="odontogram-field-label" htmlFor="odontogram-status">Condición clínica</label>
        <select id="odontogram-status" value={status} onChange={(event) => setStatus(event.target.value)}>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <label className="odontogram-field-label" htmlFor="odontogram-note">Observaciones</label>
        <textarea id="odontogram-note" value={note} onChange={(event) => setNote(event.target.value)} rows="5" placeholder="Añade detalles clínicos del hallazgo…" />
        {error && <p className="medical-error" role="alert">{error}</p>}
        <button type="submit" className="primary-button odontogram-save-button" disabled={saving}>{saving ? 'Guardando…' : selectedEntry ? 'Guardar cambios' : '＋ Registrar hallazgo'}</button>
      </form>
    </div>
    <section className="medical-record-list odontogram-history"><h3>Hallazgos recientes</h3>{entries.length === 0 ? <EmptyState text="Este paciente aún no tiene hallazgos en el odontograma." /> : entries.map((item) => <article className="medical-record-item" key={item.id}><span className="record-date">{formatDate(item.date)}</span><div><strong>Pieza {item.tooth} · {STATUS_LABELS[item.status]} · Cara {item.face}</strong><p>{item.note || 'Sin observaciones.'}</p></div><div className="record-actions"><button type="button" onClick={() => { onSelectTooth(item.tooth); onSelectRegion(item.face) }}>Ver en odontograma</button><button type="button" onClick={() => onDelete(item)}>Eliminar</button></div></article>)}</section>
  </div>
}

function Tooth({ number, entry, selected, onClick }) {
  const status = entry?.status
  return <button type="button" className={`tooth ${selected ? 'selected' : ''} ${status ? `tooth-${status} face-${entry.face}` : ''}`} onClick={onClick} aria-label={`Pieza ${number}${status ? `, ${STATUS_LABELS[status]}` : ''}`} title={status ? STATUS_LABELS[status] : `Pieza ${number}`}>
    <svg viewBox="0 0 42 54" aria-hidden="true"><path className="tooth-shape" d="M8 8 Q11 2 21 5 Q31 2 34 8 L32 29 Q30 43 24 49 L21 37 L18 49 Q12 43 10 29 Z" /><path className="tooth-face" d="M12 13 Q21 9 30 13 L28 24 Q21 28 14 24 Z" /></svg>
    {status === 'absent' && <i className="tooth-x">×</i>}
    {status === 'crown' && <i className="tooth-crown" />}
    {status === 'crownNeeded' && <i className="tooth-crown needed" />}
    {status?.startsWith('endodontics') && <i className={`tooth-root ${status === 'endodonticsNeeded' ? 'needed' : ''}`} />}
    {status === 'sealant' && <i className="tooth-sealant">S</i>}
    {status === 'implant' && <i className="tooth-implant">⌁</i>}
    <span>{number}</span>
  </button>
}

function ListPanel({ title, subtitle, items, empty, onAdd, onEdit, onDelete, renderItem }) {
  return <div className="medical-panel"><SectionHeading title={title} subtitle={subtitle} onAdd={onAdd} /><div className="medical-record-list">{items.length === 0 ? <EmptyState text={empty} /> : items.map((item) => <article className="medical-record-item" key={item.id}><span className="record-date">{formatDate(item.date)}</span><div className="record-description">{renderItem(item)}</div><div className="record-actions"><button onClick={() => onEdit(item)}>Editar</button><button onClick={() => onDelete(item)}>Eliminar</button></div></article>)}</div></div>
}

function ImagePanel({ items, onAdd, onEdit, onView, onDelete }) {
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (!file) { setError('Selecciona una imagen antes de guardarla.'); return }
    try {
      await onAdd(file, description)
      setFile(null)
      setDescription('')
      event.target.reset()
      setError('')
    } catch (caught) {
      setError(caught.message)
    }
  }
  return <div className="medical-panel"><SectionHeading title="Imágenes asociadas" subtitle="Fotografías clínicas vinculadas al expediente." onAdd={() => document.getElementById('medical-image-file')?.focus()} addLabel="Añadir imagen" /><form className="medical-image-form" onSubmit={submit}><label>Imagen (JPEG, PNG, WEBP o GIF, máximo 2 MB)<input id="medical-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><label>Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej. Fotografía inicial de pieza 16" /></label><button className="primary-button" type="submit">Guardar imagen</button>{error && <p className="medical-error" role="alert">{error}</p>}</form>
    {items.length === 0 ? <EmptyState text="Este paciente aún no tiene imágenes asociadas." /> : <div className="medical-image-grid">{items.map((item) => <ImageCard key={item.id} item={item} onView={onView} onEdit={onEdit} onDelete={onDelete} />)}</div>}
  </div>
}

function ImageCard({ item, onView, onEdit, onDelete }) {
  const [failed, setFailed] = useState(false)
  return <article><button className="medical-image-thumb" onClick={() => onView(item)} aria-label={`Ver ${item.name}`}>{failed ? <span className="medical-image-error">No se pudo cargar esta imagen.</span> : <img src={item.dataUrl} alt="" onError={() => setFailed(true)} />}</button><div><strong>{item.name}</strong><span>{formatDate(item.date)}</span><small>{item.description || 'Sin descripción'}</small><div className="record-actions"><button onClick={() => onEdit(item)}>Editar</button><button onClick={() => onDelete(item)}>Eliminar</button></div></div></article>
}

function EmptyState({ text }) {
  return <div className="medical-empty"><span>○</span><p>{text}</p></div>
}

function SummaryPanel({ profile, records, onChangeView, onChangeTab }) {
  const findings = records.odontogram || []
  const plan = records.plans?.[0]
  const latestNote = records.notes?.[0]
  const procedures = plan?.phases?.flatMap((phase) => phase.procedures || []) || []
  const completedProcedures = procedures.filter((item) => item.completed).length
  const planProgress = procedures.length ? Math.round(completedProcedures / procedures.length * 100) : 0
  return <div className="clinical-summary-grid">
    <section className="medical-panel clinical-summary-oral">
      <header className="clinical-card-heading"><div><span className="eyebrow">SALUD ORAL</span><h2>Resumen odontológico</h2></div><button className="medical-text-button" onClick={() => onChangeView('odontogram')}>Abrir odontograma →</button></header>
      <div className="clinical-tooth-strip">{TOOTH_NUMBERS.slice(0, 8).map((number) => <span key={number} className={findings.some((item) => item.tooth === number) ? 'has-finding' : ''}>{number}</span>)}</div>
      <div className="clinical-summary-stats"><div><strong>{findings.length}</strong><span>Hallazgos registrados</span></div><div><strong>{procedures.length}</strong><span>Procedimientos planeados</span></div><div><strong>{records.treatments?.length || 0}</strong><span>Tratamientos registrados</span></div></div>
    </section>
    <section className="medical-panel">
      <header className="clinical-card-heading"><div><span className="eyebrow">ANTECEDENTES</span><h2>Información médica</h2></div></header>
      <dl className="clinical-facts"><div><dt>Alergias</dt><dd className={profile?.allergies?.length ? 'clinical-danger' : ''}>{profile?.allergies?.join(', ') || 'No registradas'}</dd></div><div><dt>Condiciones</dt><dd>{profile?.conditions?.join(', ') || 'No registradas'}</dd></div><div><dt>Medicamentos</dt><dd>{profile?.medications?.map((item) => item.name).filter(Boolean).join(', ') || 'No registrados'}</dd></div></dl>
    </section>
    <section className="medical-panel">
      <header className="clinical-card-heading"><div><span className="eyebrow">ÚLTIMA NOTA</span><h2>{latestNote?.title || 'Nota clínica'}</h2></div>{latestNote && <span className="clinical-date-chip">{formatDate(latestNote.date)}</span>}</header>
      <p className="clinical-note-copy">{latestNote?.text || 'Aún no hay notas clínicas registradas.'}</p>
    </section>
    <section className="medical-panel">
      <header className="clinical-card-heading"><div><span className="eyebrow">TRATAMIENTO</span><h2>Plan activo</h2></div><span className="clinical-status">{plan ? 'REGISTRADO' : 'SIN PLAN'}</span></header>
      <strong className="clinical-plan-title">{plan?.title || 'No hay un plan de tratamiento'}</strong>
      <div className="clinical-progress" role="progressbar" aria-label="Progreso del plan de tratamiento" aria-valuemin="0" aria-valuemax="100" aria-valuenow={planProgress}><span style={{ width: `${planProgress}%` }} /></div>
      <p className="clinical-note-copy">{completedProcedures} de {procedures.length} procedimientos completados · {planProgress}%</p>
      <button className="medical-text-button" onClick={() => onChangeView('plan')}>Abrir plan de tratamiento →</button>
    </section>
    <section className="medical-panel clinical-summary-images">
      <header className="clinical-card-heading"><div><span className="eyebrow">ARCHIVO CLÍNICO</span><h2>Imágenes recientes</h2></div><button className="medical-text-button" onClick={() => onChangeTab('images')}>Ver todas →</button></header>
      {records.images?.length ? <div className="clinical-image-row">{records.images.slice(0, 3).map((item) => <div key={item.id} className="clinical-image-preview">{item.dataUrl ? <img src={item.dataUrl} alt={item.description || item.name} /> : <span>▧</span>}<small>{item.description || item.name}</small></div>)}</div> : <p className="clinical-note-copy">No hay imágenes asociadas recientes.</p>}
    </section>
  </div>
}

function ClinicalHistoryPanel({ records, onAddTreatment, onOpenPrescriptions }) {
  const entries = [
    ...(records.odontogram || []).map((item) => ({ ...item, kind: 'Hallazgo odontológico', description: `Pieza ${item.tooth} · ${STATUS_LABELS[item.status] || item.status}${item.note ? ` · ${item.note}` : ''}` })),
    ...(records.treatments || []).map((item) => ({ ...item, kind: 'Tratamiento', description: [item.title, item.description].filter(Boolean).join(' · ') })),
    ...(records.notes || []).map((item) => ({ ...item, kind: 'Nota clínica', description: item.text })),
    ...(records.images || []).map((item) => ({ ...item, kind: 'Imagen asociada', description: item.description || item.name || 'Imagen añadida al expediente' })),
    ...(records.prescriptions || []).map((item) => ({ ...item, kind: 'Receta electrónica', description: `${item.medication || item.title}${item.dosage ? ` · ${item.dosage}` : ''}${item.frequency ? ` · ${item.frequency}` : ''}${item.instructions ? ` · ${item.instructions}` : ''}` })),
    ...(records.prescriptionDecisions || []).map((item) => ({ ...item, kind: 'Decisión de alerta farmacológica', description: `${item.decision === 'confirmed' ? 'Prescripción confirmada con alerta' : 'Prescripción cancelada por alerta'}: ${item.medication}. ${item.alerts?.join(' · ') || ''}` })),
    ...(records.referrals || []).map((item) => ({ ...item, kind: 'Derivación a especialista', description: `${item.specialty} · ${item.specialistName} · ${item.status === 'accepted' ? 'Aceptada' : item.status === 'declined' ? 'No aceptada' : 'Pendiente'} · ${item.reason}` })),
    ...(records.plans || []).map((item) => {
      const procedures = item.phases?.flatMap((phase) => phase.procedures || []) || []
      const completed = procedures.filter((procedure) => procedure.completed).length
      return { ...item, kind: 'Plan de tratamiento', description: `${item.title || 'Plan actualizado'} · ${completed} de ${procedures.length} procedimientos completados` }
    }),
    ...(records.healthForm || []).map((item) => ({ ...item, kind: 'Antecedentes actualizados', description: 'El paciente actualizó su formulario de salud.' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return <div className="medical-panel">
    <SectionHeading title="Historia clínica" subtitle="Registro cronológico esencial de hallazgos, atenciones, recetas e imágenes." />
    <div className="clinical-history-actions"><button type="button" className="secondary-button" onClick={onAddTreatment}>＋ Registrar tratamiento</button><button type="button" className="primary-button" onClick={onOpenPrescriptions}>＋ Crear receta electrónica</button></div>
    {entries.length ? <div className="clinical-timeline">{entries.map((item) => <article className="clinical-timeline-item" key={`${item.kind}-${item.id}`}><span className="clinical-timeline-dot" /><time>{item.date ? formatDate(item.date) : 'Fecha no disponible'}</time><div><span>{item.kind}</span><p>{item.description || 'Sin detalle adicional.'}</p></div></article>)}</div> : <EmptyState text="La historia clínica aparecerá aquí a medida que se registren atenciones." />}
  </div>
}

function RecordEditor({ section, item, selectedTooth, selectedRegion, onClose, onSave }) {
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || item?.text || '')
  const [medication, setMedication] = useState(item?.medication || '')
  const [dosage, setDosage] = useState(item?.dosage || '')
  const [instructions, setInstructions] = useState(item?.instructions || '')
  const [imageName, setImageName] = useState(item?.name || '')
  const [tooth, setTooth] = useState(item?.tooth || selectedTooth || '')
  const [face, setFace] = useState(item?.face || selectedRegion)
  const [status, setStatus] = useState(item?.status || 'caries')
  const [date, setDate] = useState(item?.date || new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (section === 'odontogram' && (!tooth || !status)) { setError('Selecciona una pieza y un estado.'); return }
    if (section === 'treatments' && !title.trim()) { setError('Escribe el nombre del tratamiento.'); return }
    if (section === 'notes' && !description.trim()) { setError('Escribe la nota clínica.'); return }
    if (section === 'prescriptions' && !medication.trim()) { setError('Escribe el medicamento recetado.'); return }
    const value = section === 'odontogram'
      ? { id: item?.id, date, tooth, face, status, note: description }
      : section === 'treatments'
        ? { id: item?.id, date, title: title.trim(), description }
        : section === 'prescriptions'
          ? { id: item?.id, date, medication: medication.trim(), dosage: dosage.trim(), instructions: instructions.trim() }
        : section === 'notes'
          ? { id: item?.id, date, text: description.trim() }
          : { ...item, id: item?.id, date, name: imageName.trim(), description: description.trim() }
    try { await onSave(value) } catch (caught) { setError(caught.message) }
  }
  return <div className="medical-editor-layer" role="dialog" aria-modal="true" aria-labelledby="medical-editor-title" onMouseDown={onClose}><form className="medical-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">Expediente clínico</span><h2 id="medical-editor-title">{item ? 'Editar registro' : 'Añadir registro'}</h2></div><button type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
    {section === 'odontogram' && <><label>Pieza dental<select value={tooth} onChange={(event) => setTooth(event.target.value)}><option value="">Seleccionar pieza</option>{TOOTH_NUMBERS.map((number) => <option key={number} value={number}>{number}</option>)}</select></label><label>Estado<select value={status} onChange={(event) => setStatus(event.target.value)}>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Cara dental<select value={face} onChange={(event) => setFace(event.target.value)}>{['M', 'D', 'V', 'L', 'O'].map((region) => <option key={region} value={region}>{region} · {({ M: 'Mesial', D: 'Distal', V: 'Vestibular', L: 'Lingual', O: 'Oclusal' })[region]}</option>)}</select></label></>}
    {section === 'treatments' && <label>Tratamiento<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>}
    {section === 'prescriptions' && <><label>Medicamento<input value={medication} onChange={(event) => setMedication(event.target.value)} required /></label><label>Dosis<input value={dosage} onChange={(event) => setDosage(event.target.value)} placeholder="Ej. 500 mg cada 8 horas" /></label><label>Indicaciones<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows="3" /></label></>}
    {section === 'images' && <label>Nombre de la imagen<input value={imageName} onChange={(event) => setImageName(event.target.value)} required /></label>}
    {section !== 'odontogram' && section !== 'prescriptions' && <label>{section === 'treatments' ? 'Detalle' : section === 'notes' ? 'Nota clínica' : 'Descripción'}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="4" /></label>}
    {section === 'odontogram' && <label>Observaciones<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="3" /></label>}
    <label>Fecha<input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required /></label>
    {error && <p className="medical-error" role="alert">{error}</p>}<footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Guardar</button></footer></form></div>
}
