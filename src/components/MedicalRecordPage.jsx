import { useEffect, useMemo, useState } from 'react'
import { authService } from '../api/clinicService'
import { medicalRecordService } from '../api/medicalRecordService'

const TABS = [
  ['odontogram', 'Odontograma'],
  ['treatments', 'Historial de tratamientos'],
  ['notes', 'Notas clínicas'],
  ['images', 'Imágenes asociadas'],
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

export default function MedicalRecordPage({ appointment, session, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('odontogram')
  const [profile, setProfile] = useState(null)
  const [records, setRecords] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [viewer, setViewer] = useState(null)
  const [viewerError, setViewerError] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('O')

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
      setErrors({ access: error.message || 'No fue posible abrir el expediente.' })
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
        : await medicalRecordService.save(patientId, section, value)
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
          <div><strong>Alerta de alergia</strong><p>{profile.allergies.join(' · ')}</p></div>
        </aside>
      )}
      {errors.profile && <div className="medical-error" role="alert">{errors.profile}</div>}
      {errors.access && <div className="medical-error" role="alert">{errors.access} <button onClick={onBack}>Volver a la agenda</button></div>}
      {errors.session && <div className="medical-error" role="alert">{errors.session}</div>}

      {!errors.access && <>
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
              {activeTab === 'odontogram' && <OdontogramPanel entries={records.odontogram || []} teeth={odontogram} selectedTooth={selectedTooth} selectedRegion={selectedRegion} onSelectTooth={setSelectedTooth} onSelectRegion={setSelectedRegion} onAdd={() => setEditing({ section: 'odontogram' })} onEdit={(item) => setEditing({ section: 'odontogram', item })} onDelete={(item) => removeRecord('odontogram', item)} />}
              {activeTab === 'treatments' && <ListPanel title="Historial de tratamientos" subtitle="Procedimientos realizados y su evolución." items={records.treatments || []} empty="Este paciente aún no tiene tratamientos registrados." onAdd={() => setEditing({ section: 'treatments' })} onEdit={(item) => setEditing({ section: 'treatments', item })} onDelete={(item) => removeRecord('treatments', item)} renderItem={(item) => <><strong>{item.title}</strong><p>{item.description}</p></>} />}
              {activeTab === 'notes' && <ListPanel title="Notas clínicas" subtitle="Observaciones relevantes para la atención." items={records.notes || []} empty="Este paciente aún no tiene notas clínicas." onAdd={() => setEditing({ section: 'notes' })} onEdit={(item) => setEditing({ section: 'notes', item })} onDelete={(item) => removeRecord('notes', item)} renderItem={(item) => <p>{item.text}</p>} />}
              {activeTab === 'images' && <ImagePanel items={records.images || []} onAdd={(file, description) => saveRecord('images', { file, description })} onEdit={(item) => setEditing({ section: 'images', item })} onView={(item) => { setViewerError(false); setViewer(item) }} onDelete={(item) => removeRecord('images', item)} />}
              <p className="medical-retention">Mostrando registros del último año, ordenados del más reciente al más antiguo.</p>
            </>
          )}
        </div>
      </>}

      {editing && <RecordEditor section={editing.section} item={editing.item} selectedTooth={selectedTooth} selectedRegion={selectedRegion} onClose={() => setEditing(null)} onSave={(value) => saveRecord(editing.section, value)} onDelete={editing.item ? () => removeRecord(editing.section, editing.item) : null} />}
      {viewer && <div className="medical-image-viewer" role="dialog" aria-modal="true" aria-label={`Imagen ${viewer.name}`} onMouseDown={() => setViewer(null)}>
        <section onMouseDown={(event) => event.stopPropagation()}><header><div><strong>{viewer.name}</strong><span>{viewer.description || 'Sin descripción'} · {formatDate(viewer.date)}</span></div><button onClick={() => setViewer(null)} aria-label="Cerrar visor">×</button></header>{viewerError && <p className="medical-error" role="alert">No se pudo cargar la imagen seleccionada.</p>}<img src={viewer.dataUrl} alt={viewer.description || viewer.name} onError={() => setViewerError(true)} /></section>
      </div>}
      {notice && <div className="notice">✓ {notice}</div>}
    </section>
  )
}

function SectionHeading({ title, subtitle, onAdd, addLabel = 'Añadir registro' }) {
  return <header className="medical-section-heading"><div><span className="eyebrow">Información clínica</span><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className="primary-button" onClick={onAdd}>＋ {addLabel}</button></header>
}

function OdontogramPanel({ entries, teeth, selectedTooth, selectedRegion, onSelectTooth, onSelectRegion, onAdd, onEdit, onDelete }) {
  const regions = ['M', 'D', 'V', 'L', 'O']
  return <div className="medical-panel">
    <SectionHeading title="Odontograma" subtitle="Selecciona una pieza para consultar o actualizar su estado." onAdd={onAdd} addLabel="Registrar hallazgo" />
    <div className="odontogram-legend">{Object.entries(STATUS_LABELS).map(([key, label]) => <span key={key}><i className={`tooth-mark mark-${key}`} />{label}</span>)}</div>
    <div className="odontogram-scroll">
      <div className="odontogram-arch"><span className="arch-label">MAXILAR · SUPERIOR</span><div className="teeth-row">{TOOTH_NUMBERS.slice(0, 16).map((number) => <Tooth key={number} number={number} entry={teeth[number]} selected={selectedTooth === number} onClick={() => onSelectTooth(number)} />)}</div><div className="arch-divider"><span>Derecha</span><b>Línea media</b><span>Izquierda</span></div><div className="teeth-row lower">{TOOTH_NUMBERS.slice(16).map((number) => <Tooth key={number} number={number} entry={teeth[number]} selected={selectedTooth === number} onClick={() => onSelectTooth(number)} />)}</div><span className="arch-label">MANDÍBULA · INFERIOR</span></div>
    </div>
    {selectedTooth && <div className="tooth-detail"><div><strong>Pieza {selectedTooth}</strong><span>{teeth[selectedTooth] ? STATUS_LABELS[teeth[selectedTooth].status] : 'Sin hallazgos registrados'}</span></div><div className="region-buttons" aria-label="Seleccionar cara dental">{regions.map((region) => <button type="button" key={region} className={selectedRegion === region ? 'active' : ''} onClick={() => onSelectRegion(region)} title={`Cara ${region}`}>{region}</button>)}</div>{teeth[selectedTooth] && <button type="button" className="medical-text-button" onClick={() => onEdit(teeth[selectedTooth])}>Editar estado</button>}</div>}
    <div className="medical-record-list"><h3>Hallazgos recientes</h3>{entries.length === 0 ? <EmptyState text="Este paciente aún no tiene hallazgos en el odontograma." /> : entries.map((item) => <article className="medical-record-item" key={item.id}><span className="record-date">{formatDate(item.date)}</span><div><strong>Pieza {item.tooth} · {STATUS_LABELS[item.status]} · Cara {item.face}</strong><p>{item.note || 'Sin observaciones.'}</p></div><div className="record-actions"><button onClick={() => { onSelectTooth(item.tooth); onEdit(item) }}>Editar</button><button onClick={() => onDelete(item)}>Eliminar</button></div></article>)}</div>
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

function RecordEditor({ section, item, selectedTooth, selectedRegion, onClose, onSave }) {
  const [title, setTitle] = useState(item?.title || '')
  const [description, setDescription] = useState(item?.description || item?.text || '')
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
    const value = section === 'odontogram'
      ? { id: item?.id, date, tooth, face, status, note: description }
      : section === 'treatments'
        ? { id: item?.id, date, title: title.trim(), description }
        : section === 'notes'
          ? { id: item?.id, date, text: description.trim() }
          : { ...item, id: item?.id, date, name: imageName.trim(), description: description.trim() }
    try { await onSave(value) } catch (caught) { setError(caught.message) }
  }
  return <div className="medical-editor-layer" role="dialog" aria-modal="true" aria-labelledby="medical-editor-title" onMouseDown={onClose}><form className="medical-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">Expediente clínico</span><h2 id="medical-editor-title">{item ? 'Editar registro' : 'Añadir registro'}</h2></div><button type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
    {section === 'odontogram' && <><label>Pieza dental<select value={tooth} onChange={(event) => setTooth(event.target.value)}><option value="">Seleccionar pieza</option>{TOOTH_NUMBERS.map((number) => <option key={number} value={number}>{number}</option>)}</select></label><label>Estado<select value={status} onChange={(event) => setStatus(event.target.value)}>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Cara dental<select value={face} onChange={(event) => setFace(event.target.value)}>{['M', 'D', 'V', 'L', 'O'].map((region) => <option key={region} value={region}>{region} · {({ M: 'Mesial', D: 'Distal', V: 'Vestibular', L: 'Lingual', O: 'Oclusal' })[region]}</option>)}</select></label></>}
    {section === 'treatments' && <label>Tratamiento<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>}
    {section === 'images' && <label>Nombre de la imagen<input value={imageName} onChange={(event) => setImageName(event.target.value)} required /></label>}
    {section !== 'odontogram' && <label>{section === 'treatments' ? 'Detalle' : section === 'notes' ? 'Nota clínica' : 'Descripción'}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="4" /></label>}
    {section === 'odontogram' && <label>Observaciones<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="3" /></label>}
    <label>Fecha<input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required /></label>
    {error && <p className="medical-error" role="alert">{error}</p>}<footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Guardar</button></footer></form></div>
}
