import { cloneElement, useEffect, useId, useMemo, useState } from "react";
import { appointmentTypesFor, findAppointmentType } from "../api/clinicService";
import {
  addMinutes,
  findConflict,
  formatLongDate,
  getSlotAvailability,
  getTimeOptions,
} from "../utils/agenda";

const empty = {
  patientId: "",
  patientName: "",
  patientAge: "",
  patientPhone: "",
  patientEmail: "",
  professionalId: "",
  typeId: "",
  spaceId: "",
  date: "",
  startTime: "08:00",
  duration: 30,
  buffer: 0,
  status: "scheduled",
  notes: "",
};

export default function AppointmentForm({
  value,
  professionals,
  spaces,
  appointments,
  blocks = [],
  onClose,
  onSave,
  mode = "create",
}) {
  const [form, setForm] = useState({ ...empty, ...value });
  const [errors, setErrors] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedProfessional = professionals.find(
    (item) => item.id === form.professionalId,
  );
  const selectedSpace = spaces.find((item) => item.id === form.spaceId);
  const typeOptions = selectedProfessional
    ? appointmentTypesFor(selectedProfessional.role)
    : [];
  const selectedType = selectedProfessional
    ? findAppointmentType(selectedProfessional.role, form.typeId)
    : null;

  useEffect(() => setForm({ ...empty, ...value }), [value]);

  const update = (field, next) => {
    setForm((current) => ({ ...current, [field]: next }));
    setErrors((current) => ({ ...current, [field]: "", availability: "" }));
  };

  const selectProfessional = (professionalId) => {
    const professional = professionals.find((item) => item.id === professionalId);
    const firstType = professional ? appointmentTypesFor(professional.role)[0] : null;
    setForm((current) => ({
      ...current,
      professionalId,
      typeId: firstType ? firstType.id : "",
      duration: firstType ? firstType.duration : current.duration,
      buffer: firstType ? firstType.buffer : current.buffer,
    }));
    setErrors((current) => ({
      ...current,
      professionalId: "",
      typeId: "",
      availability: "",
    }));
  };

  const selectType = (typeId) => {
    const type = selectedProfessional
      ? findAppointmentType(selectedProfessional.role, typeId)
      : null;
    setForm((current) => ({
      ...current,
      typeId,
      duration: type ? type.duration : current.duration,
      buffer: type ? type.buffer : current.buffer,
    }));
    setErrors((current) => ({ ...current, typeId: "", availability: "" }));
  };

  const endTime = addMinutes(form.startTime, form.duration);
  const bufferEndTime = addMinutes(
    form.startTime,
    form.duration + (form.buffer || 0),
  );
  const slotOptions = useMemo(() => getTimeOptions(), []);
  const availability = useMemo(() => {
    if (!form.date || !form.professionalId || !form.spaceId || !selectedType) {
      return [];
    }
    return getSlotAvailability(
      {
        date: form.date,
        options: slotOptions,
        duration: form.duration,
        buffer: form.buffer,
        professionalId: form.professionalId,
        spaceId: form.spaceId,
        excludeId: form.id,
      },
      appointments,
      blocks,
    );
  }, [
    form.date,
    form.professionalId,
    form.spaceId,
    form.duration,
    form.buffer,
    form.id,
    selectedType,
    appointments,
    blocks,
    slotOptions,
  ]);

  const validate = () => {
    const nextErrors = {};
    if (!form.patientName.trim()) {
      nextErrors.patientName = "Ingresa el nombre del paciente.";
    }
    if (!form.patientId.trim()) {
      nextErrors.patientId = "Ingresa el documento del paciente.";
    }
    if (!form.patientPhone.trim()) {
      nextErrors.patientPhone = "Ingresa el número de teléfono.";
    }
    if (
      form.patientEmail.trim()
      && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patientEmail.trim())
    ) {
      nextErrors.patientEmail = "Ingresa un correo válido.";
    }
    if (!form.professionalId) {
      nextErrors.professionalId = "Selecciona un profesional.";
    }
    if (!form.typeId) nextErrors.typeId = "Selecciona el tipo de cita.";
    if (!form.spaceId) nextErrors.spaceId = "Selecciona un consultorio.";
    if (!form.date) nextErrors.date = "Selecciona una fecha.";
    if (!form.startTime) {
      nextErrors.startTime = "Selecciona una hora disponible.";
    }

    const conflict = findConflict(
      {
        date: form.date,
        startTime: form.startTime,
        endTime,
        professionalId: form.professionalId,
        spaceId: form.spaceId,
        excludeId: form.id,
      },
      appointments,
    );
    if (conflict) {
      nextErrors.availability = `El profesional o el consultorio ya tienen una cita de ${conflict.startTime} a ${conflict.endTime}. Elige otra franja.`;
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (Object.keys(validate()).length) return;

    try {
      await onSave({
        ...form,
        id: form.id || `apt-${Date.now()}`,
        receivedAt: form.receivedAt || Date.now(),
        endTime,
        bufferEndTime,
        professionalName: selectedProfessional?.name || "",
        specialty: selectedProfessional?.role || "",
        typeName: selectedType?.name || "",
        spaceName: selectedSpace?.name || "",
      });
    } catch (saveError) {
      setErrors((current) => ({
        ...current,
        availability: saveError.message,
      }));
    }
  };

  const openPicker = () => {
    if (!form.professionalId) {
      setErrors((current) => ({
        ...current,
        professionalId: "Selecciona un profesional antes de elegir la hora.",
      }));
      return;
    }
    if (!form.spaceId) {
      setErrors((current) => ({
        ...current,
        spaceId: "Selecciona un consultorio antes de elegir la hora.",
      }));
      return;
    }
    setPickerOpen(true);
  };

  const title = mode === "reschedule"
    ? "Reprogramar cita"
    : mode === "edit"
      ? "Editar cita"
      : "Nueva cita";

  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <form
        className="appointment-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-form-title"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">{title}</span>
            <h2 id="appointment-form-title">Datos de la cita</h2>
          </div>
          <button type="button" aria-label="Cerrar formulario" onClick={onClose}>×</button>
        </div>
        {errors.availability && (
          <div className="form-error" role="alert">{errors.availability}</div>
        )}

        <section className="form-section" aria-labelledby="appointment-patient-heading">
          <h3 id="appointment-patient-heading">1. Datos del paciente</h3>
          <p className="field-hint">
            Si el documento ya está registrado, se reutiliza su ficha. Si no,
            la ficha se crea al guardar la cita.
          </p>
          <div className="form-grid">
            <Field label="Nombre completo" error={errors.patientName}>
              <input
                value={form.patientName}
                onChange={(event) => update("patientName", event.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Documento" error={errors.patientId}>
              <input
                value={form.patientId}
                onChange={(event) => update("patientId", event.target.value)}
                autoComplete="off"
                required
              />
            </Field>
            <Field label="Edad">
              <input
                type="number"
                min="0"
                value={form.patientAge}
                onChange={(event) => update("patientAge", event.target.value)}
              />
            </Field>
            <Field label="Teléfono" error={errors.patientPhone}>
              <input
                type="tel"
                value={form.patientPhone}
                onChange={(event) => update("patientPhone", event.target.value)}
                autoComplete="tel"
                required
              />
            </Field>
            <Field label="Correo electrónico" error={errors.patientEmail} full>
              <input
                type="email"
                value={form.patientEmail}
                onChange={(event) => update("patientEmail", event.target.value)}
                autoComplete="email"
              />
            </Field>
          </div>
        </section>

        <section className="form-section" aria-labelledby="appointment-details-heading">
          <h3 id="appointment-details-heading">2. Profesional y tipo de cita</h3>
          <div className="form-grid">
            <Field label="Profesional" error={errors.professionalId}>
              <select
                value={form.professionalId}
                onChange={(event) => selectProfessional(event.target.value)}
                required
              >
                <option value="">Selecciona un profesional</option>
                {professionals.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha" error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                required
              />
            </Field>
            <Field label="Tipo de cita" error={errors.typeId} full>
              <div className="type-options">
                {typeOptions.length ? typeOptions.map((type) => (
                  <button
                    type="button"
                    key={type.id}
                    className={form.typeId === type.id ? "type-option active" : "type-option"}
                    aria-pressed={form.typeId === type.id}
                    onClick={() => selectType(type.id)}
                  >
                    <strong>{type.name}</strong>
                    <span>{type.duration} min · buffer {type.buffer} min</span>
                  </button>
                )) : (
                  <p className="field-hint">
                    Selecciona un profesional para ver los tipos de cita disponibles.
                  </p>
                )}
              </div>
            </Field>
          </div>
        </section>

        <section className="form-section" aria-labelledby="appointment-space-heading">
          <h3 id="appointment-space-heading">3. Consultorio</h3>
          <div className="form-grid">
            <Field label="Consultorio" error={errors.spaceId}>
              <select
                value={form.spaceId}
                onChange={(event) => update("spaceId", event.target.value)}
                required
              >
                <option value="">Selecciona un consultorio</option>
                {spaces.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.type}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="form-section" aria-labelledby="appointment-time-heading">
          <h3 id="appointment-time-heading">4. Hora de la cita</h3>
          <div className="time-summary">
            <div><span>Inicio</span><strong>{form.startTime || "—"}</strong></div>
            <div><span>Fin</span><strong>{form.startTime ? endTime : "—"}</strong></div>
            <div><span>Tiempo de preparación</span><strong>{form.buffer} min</strong></div>
            <div>
              <span>Horario ocupado</span>
              <strong>{form.startTime ? `${form.startTime} - ${bufferEndTime}` : "—"}</strong>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button picker-open"
            onClick={openPicker}
          >
            Seleccionar hora disponible
          </button>
          {errors.startTime && <p className="field-error" role="alert">{errors.startTime}</p>}
        </section>

        <section className="form-section" aria-labelledby="appointment-notes-heading">
          <h3 id="appointment-notes-heading">5. Observaciones</h3>
          <Field label="Motivo de consulta o procedimiento">
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </Field>
        </section>

        <footer className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            {mode === "edit" ? "Guardar cambios" : "Agendar cita"}
          </button>
        </footer>
        {pickerOpen && (
          <SlotPicker
            date={form.date}
            professional={selectedProfessional}
            space={selectedSpace}
            availability={availability}
            current={form.startTime}
            onClose={() => setPickerOpen(false)}
            onPick={(time) => {
              update("startTime", time);
              setPickerOpen(false);
            }}
          />
        )}
      </form>
    </div>
  );
}

function SlotPicker({ date, professional, space, availability, current, onClose, onPick }) {
  const titleId = useId();
  return (
    <div className="picker-layer" onMouseDown={onClose}>
      <section
        className="slot-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">Disponibilidad del profesional</span>
            <h2 id={titleId}>
              {date ? capitalize(formatLongDate(date)) : "Selecciona una fecha"}
            </h2>
            <p className="picker-subtitle">{professional?.name} · {space?.name}</p>
          </div>
          <button type="button" aria-label="Cerrar selección de hora" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="legend picker-legend" aria-label="Estados de las franjas">
          <span><i className="legend-available" />Disponible</span>
          <span><i className="legend-scheduled" />Ocupado</span>
          <span><i className="legend-buffer" />Bloqueado</span>
        </div>
        <div className="slot-picker-grid">
          {availability.map((slot) => (
            <button
              type="button"
              key={slot.time}
              disabled={!slot.available}
              className={`slot-cell${slot.available ? "" : " occupied"}${slot.time === current ? " selected" : ""}`}
              onClick={() => onPick(slot.time)}
              aria-label={`${slot.time} a ${slot.endTime}: ${slot.available ? "disponible" : slot.reason === "occupied" ? `ocupado, cita de ${slot.conflict.patientName}` : slot.reason === "blocked" ? "bloqueado" : "fuera del horario de atención"}`}
            >
              <strong>{slot.time}</strong>
              <small>{slot.endTime}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function Field({ label, error, children, full }) {
  const id = useId();
  const errorId = `${id}-error`;
  const isFormControl = ["input", "select", "textarea"].includes(children.type);
  const control = cloneElement(children, {
    id,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? errorId : undefined,
  });
  if (!isFormControl) {
    return (
      <div className={full ? "form-field full-field" : "form-field"}>
        <span>{label}</span>
        {control}
        {error && <small id={errorId} className="field-error" role="alert">{error}</small>}
      </div>
    );
  }
  return (
    <label className={full ? "form-field full-field" : "form-field"}>
      <span>{label}</span>
      {control}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </label>
  );
}
