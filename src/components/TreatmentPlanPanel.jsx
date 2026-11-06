import { useEffect, useMemo, useState } from 'react'
import { medicalRecordService } from '../api/medicalRecordService'

export default function TreatmentPlanPanel({ patientId, plans, onSaved }) {
  const [title, setTitle] = useState('')
  const [phases, setPhases] = useState([])
  const [procedurePhase, setProcedurePhase] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [phaseErrors, setPhaseErrors] = useState({})
  const [confirmingSave, setConfirmingSave] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const draftKey = `dentia-treatment-plan-draft:${encodeURIComponent(patientId)}`

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(draftKey)
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        setTitle(draft.title || '')
        setPhases(Array.isArray(draft.phases) ? draft.phases : [])
      } else {
        setTitle(plans[0]?.title || '')
        setPhases(plans[0]?.phases || [])
      }
      setHydrated(true)
    } catch (caught) {
      setError(`No fue posible recuperar el borrador del plan: ${caught.message}`)
      setHydrated(true)
    }
  }, [draftKey, patientId])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ title, phases }))
    } catch (caught) {
      setError(`No fue posible guardar el borrador del plan: ${caught.message}`)
    }
  }, [draftKey, hydrated, title, phases])

  const procedures = useMemo(() => phases.flatMap((phase) => phase.procedures || []), [phases])
  const total = procedures.reduce((sum, item) => sum + Number(item.price || 0), 0)
  const duration = procedures.reduce((sum, item) => sum + Number(item.duration || 0), 0)
  const completed = procedures.filter((item) => item.completed).length

  const addPhase = () => setPhases((current) => [
    ...current,
    { id: crypto.randomUUID(), title: `Fase ${current.length + 1}`, procedures: [] },
  ])

  const addProcedure = (phaseId, procedure) => {
    setPhases((current) => current.map((phase) => phase.id === phaseId
      ? { ...phase, procedures: [...phase.procedures, { ...procedure, id: crypto.randomUUID() }] }
      : phase))
    setProcedurePhase(null)
    setError('')
    setPhaseErrors((current) => ({ ...current, [phaseId]: '' }))
  }

  const requestSave = () => {
    const errors = {}
    setPhaseErrors({})
    if (!phases.length) {
      setError('Añade al menos una fase con un procedimiento antes de guardar el plan.')
      return
    }
    phases.forEach((phase, index) => {
      if (!phase.title?.trim()) {
        errors[phase.id] = `Escribe el nombre de la fase ${index + 1}.`
      } else if (!phase.procedures?.length) {
        errors[phase.id] = `Añade al menos un procedimiento a la fase ${index + 1}.`
      } else if (phase.procedures.some((procedure) =>
        !procedure.name?.trim() ||
        !Number.isFinite(Number(procedure.duration)) ||
        Number(procedure.duration) <= 0 ||
        procedure.price === '' ||
        procedure.price === null ||
        procedure.price === undefined ||
        !Number.isFinite(Number(procedure.price)) ||
        Number(procedure.price) < 0,
      )) {
        errors[phase.id] = `Completa el nombre, la duración y el precio de cada procedimiento de la fase ${index + 1}.`
      }
    })
    setPhaseErrors(errors)
    if (Object.keys(errors).length) {
      setError('Completa las fases y sus procedimientos antes de guardar el plan.')
      return
    }
    setError('')
    setConfirmingSave(true)
  }

  const savePlan = async () => {
    setConfirmingSave(false)
    setSaving(true)
    setError('')
    try {
      const saved = await medicalRecordService.save(patientId, 'plans', {
        title: title.trim() || 'Plan de tratamiento',
        phases,
        status: 'draft',
      })
      window.localStorage.removeItem(draftKey)
      onSaved(saved)
      setNotice('Plan guardado en la historia clínica.')
      window.setTimeout(() => setNotice(''), 3000)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="clinical-plan-layout">
    <div className="clinical-phases">
      <header className="clinical-plan-heading">
        <div><span className="eyebrow">ATENCIÓN CLÍNICA</span><h2>Plan de tratamiento</h2><p>Organiza procedimientos por fases. Cada fase admite hasta 10 procedimientos.</p></div>
      </header>
      <label className="clinical-plan-name">Nombre del plan<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Rehabilitación posterior" /></label>
      {phases.map((phase, index) => <section className="medical-panel clinical-phase-card" key={phase.id}>
        <header className="clinical-phase-heading">
          <span>{index + 1}</span>
          <label>Fase {index + 1}<input value={phase.title} onChange={(event) => setPhases((current) => current.map((item) => item.id === phase.id ? { ...item, title: event.target.value } : item))} /></label>
          <button type="button" className="medical-text-button" onClick={() => setPhases((current) => current.filter((item) => item.id !== phase.id))}>Eliminar fase</button>
        </header>
        {phase.procedures?.length
          ? <div className="clinical-procedure-list">{phase.procedures.map((item, procedureIndex) => <article key={item.id}>
            <label className="clinical-procedure-check"><input type="checkbox" checked={Boolean(item.completed)} onChange={(event) => setPhases((current) => current.map((entry) => entry.id === phase.id ? { ...entry, procedures: entry.procedures.map((procedure) => procedure.id === item.id ? { ...procedure, completed: event.target.checked } : procedure) } : entry))} aria-label={`Marcar ${item.name} completado`} /><span>✓</span></label>
            <div><span>{index + 1}.{procedureIndex + 1}</span><strong>{item.name}</strong></div>
            <span>{item.duration} min</span><strong>{formatCurrency(item.price)}</strong>
            <button type="button" onClick={() => setPhases((current) => current.map((entry) => entry.id === phase.id ? { ...entry, procedures: entry.procedures.filter((procedure) => procedure.id !== item.id) } : entry))} aria-label={`Eliminar ${item.name}`}>×</button>
          </article>)}</div>
          : <p className="clinical-empty-phase">Añade los procedimientos previstos para esta fase.</p>}
        {phaseErrors[phase.id] && <p className="medical-error clinical-phase-error" role="alert">{phaseErrors[phase.id]}</p>}
        <button type="button" className="clinical-add-procedure" onClick={() => setProcedurePhase(phase.id)} disabled={(phase.procedures || []).length >= 10}>{(phase.procedures || []).length >= 10 ? 'Límite de 10 procedimientos alcanzado' : '＋ Añadir procedimiento'}</button>
      </section>)}
      <button type="button" className="clinical-add-phase" onClick={addPhase}>＋ Añadir nueva fase</button>
      {notice && <p className="clinical-save-notice" role="status">{notice}</p>}
      {error && <p className="medical-error" role="alert">{error}</p>}
      <button type="button" className="clinical-save-plan-button" onClick={requestSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar plan'}</button>
    </div>
    <aside className="medical-panel clinical-plan-summary">
      <span className="eyebrow">RESUMEN DEL PLAN</span><h2>Estimación general</h2>
      <div><span>Fases</span><strong>{phases.length}</strong></div>
      <div><span>Procedimientos</span><strong>{procedures.length}</strong></div>
      <div><span>Completados</span><strong>{completed} de {procedures.length}</strong></div>
      <div><span>Duración total</span><strong>{duration ? `${duration} min` : '—'}</strong></div>
      <section><span>Valor total estimado</span><strong>{formatCurrency(total)}</strong><small>COP · Estimación sujeta a evolución clínica</small></section>
    </aside>
    {procedurePhase && <ProcedureEditor onClose={() => setProcedurePhase(null)} onSave={(procedure) => addProcedure(procedurePhase, procedure)} />}
    {confirmingSave && <div className="medical-editor-layer" role="dialog" aria-modal="true" aria-labelledby="confirm-plan-title" onMouseDown={() => setConfirmingSave(false)}><section className="medical-editor clinical-save-confirm" onMouseDown={(event) => event.stopPropagation()}><header><div><span className="eyebrow">Confirmación</span><h2 id="confirm-plan-title">¿Guardar este plan de tratamiento?</h2></div><button type="button" onClick={() => setConfirmingSave(false)} aria-label="Cerrar">×</button></header><p>El plan y sus {procedures.length} procedimiento{procedures.length === 1 ? '' : 's'} se agregarán a la historia clínica del paciente.</p><footer><button type="button" className="secondary-button" onClick={() => setConfirmingSave(false)}>Seguir editando</button><button type="button" className="primary-button" onClick={savePlan} disabled={saving}>Confirmar y guardar</button></footer></section></div>}
  </div>
}

function ProcedureEditor({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!name.trim() || Number(duration) <= 0 || price === '' || Number(price) < 0) {
      setError('Ingresa el nombre, una duración mayor a cero y un precio válido.')
      return
    }
    onSave({ name: name.trim(), duration: Number(duration), price: Number(price), completed: false })
  }

  return <div className="medical-editor-layer" role="dialog" aria-modal="true" onMouseDown={onClose}>
    <form className="medical-editor clinical-procedure-editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><span className="eyebrow">Plan de tratamiento</span><h2>Añadir procedimiento</h2></div><button type="button" onClick={onClose} aria-label="Cerrar">×</button></header>
      <label>Nombre del procedimiento<input value={name} onChange={(event) => setName(event.target.value)} autoFocus /></label>
      <div className="clinical-procedure-fields">
        <label>Duración (minutos)<input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
        <label>Precio estimado (COP)<input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
      </div>
      {error && <p className="medical-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit">Guardar procedimiento</button></footer>
    </form>
  </div>
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0)
}
