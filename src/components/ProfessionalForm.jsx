import { useState } from "react";
import { SPECIALTIES } from "../api/clinicService";

const empty = { name: "", role: "", identification: "", email: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfessionalForm({ onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Ingresa el nombre del profesional.";
    if (!form.role) next.role = "Selecciona la especialidad.";
    if (!/^[0-9]{5,15}$/.test(form.identification.trim()))
      next.identification = "La identificación debe contener entre 5 y 15 dígitos.";
    if (!EMAIL_PATTERN.test(form.email.trim()))
      next.email = "Ingresa un correo electrónico válido.";
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await onSave({
        name: form.name.trim(),
        role: form.role,
        identification: form.identification.trim(),
        email: form.email.trim(),
      });
      setForm(empty);
      onClose();
    } catch (saveError) {
      setErrors((current) => ({ ...current, form: saveError.message }));
    }
  };

  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <form
        className="appointment-form"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">Nuevo registro</span>
            <h2>Registrar profesional</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>
        <p className="field-hint">
          Esta ficha se usa para organizar la agenda. Para permitir el inicio de sesión, crea también una cuenta en «Usuarios y accesos».
        </p>
        {errors.form && <div className="form-error">{errors.form}</div>}
        <div className="form-grid">
          <Field label="Nombre completo" error={errors.name}>
            <input value={form.name} onChange={(event) => update("name", event.target.value)} />
          </Field>
          <Field label="Especialidad" error={errors.role}>
            <select value={form.role} onChange={(event) => update("role", event.target.value)}>
              <option value="">Selecciona una especialidad</option>
              {SPECIALTIES.map((specialty) => (
                <option value={specialty} key={specialty}>{specialty}</option>
              ))}
            </select>
          </Field>
          <Field label="Identificación" error={errors.identification}>
            <input value={form.identification} onChange={(event) => update("identification", event.target.value)} />
          </Field>
          <Field label="Correo electrónico" error={errors.email}>
            <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
          </Field>
        </div>
        <footer className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" type="submit">Guardar profesional</button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}
