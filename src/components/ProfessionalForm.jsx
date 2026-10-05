import { useState } from "react";
import { SPECIALTIES } from "../api/clinicService";

const empty = {
  name: "",
  roleType: "",
  role: "",
  identification: "",
  email: "",
  username: "",
  password: "",
};

const ROLES = [
  {
    value: "professional",
    label: "Profesional",
    hint: "Odontólogo con especialidad y acceso a la agenda.",
  },
  {
    value: "receptionist",
    label: "Recepcionista",
    hint: "Personal administrativo con acceso a la agenda y recursos.",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfessionalForm({ onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const selectRole = (roleType) => {
    setForm((current) => ({
      ...current,
      roleType,
      role: roleType === "professional" ? current.role : "",
    }));
    setErrors((current) => ({ ...current, roleType: "", role: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.roleType) next.roleType = "Selecciona un rol.";
    if (!form.name.trim()) next.name = "Ingresa el nombre del profesional.";
    if (form.roleType === "professional" && !form.role)
      next.role = "Selecciona la especialidad.";
    if (!form.identification.trim())
      next.identification = "Ingresa la identificación.";
    else if (!/^[0-9]{5,15}$/.test(form.identification.trim()))
      next.identification =
        "La identificación debe contener entre 5 y 15 dígitos.";
    if (!form.email.trim()) next.email = "Ingresa el correo electrónico.";
    else if (!EMAIL_PATTERN.test(form.email.trim()))
      next.email = "Ingresa un correo electrónico válido.";
    if (!form.username.trim()) next.username = "Ingresa el nombre de usuario.";
    else if (form.username.trim().length < 4)
      next.username = "El usuario debe tener al menos 4 caracteres.";
    if (!form.password.trim()) next.password = "Ingresa la contraseña.";
    else if (form.password.trim().length < 6)
      next.password = "La contraseña debe tener al menos 6 caracteres.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      await onSave({
        name: form.name.trim(),
        roleType: form.roleType,
        role: form.roleType === "professional" ? form.role : "Recepcionista",
        identification: form.identification.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
      });
      setForm(empty);
      setErrors({});
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
            <h2>Registrar trabajador</h2>
          </div>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {errors.form && <div className="form-error">{errors.form}</div>}

        <div className="form-grid">
          <Field label="Rol del trabajador" error={errors.roleType} full>
            <div className="role-options">
              {ROLES.map((role) => (
                <button
                  type="button"
                  key={role.value}
                  className={
                    form.roleType === role.value
                      ? "role-option active"
                      : "role-option"
                  }
                  onClick={() => selectRole(role.value)}
                >
                  <strong>{role.label}</strong>
                  <span>{role.hint}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nombre del profesional" error={errors.name}>
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Nombre completo"
            />
          </Field>

          {form.roleType === "professional" && (
            <Field label="Tipo de especialidad" error={errors.role}>
              <select
                value={form.role}
                onChange={(event) => update("role", event.target.value)}
              >
                <option value="">Selecciona una especialidad</option>
                {SPECIALTIES.map((specialty) => (
                  <option value={specialty} key={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Identificación" error={errors.identification}>
            <input
              value={form.identification}
              onChange={(event) => update("identification", event.target.value)}
              placeholder="CC o documento"
            />
          </Field>

          <Field label="Correo electrónico" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="correo@dentia.co"
            />
          </Field>

          <Field label="Nombre de usuario" error={errors.username}>
            <input
              value={form.username}
              onChange={(event) => update("username", event.target.value)}
              placeholder="usuario.acceso"
            />
          </Field>

          <Field label="Contraseña" error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="••••••••"
            />
          </Field>
        </div>

        <footer className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            Registrar trabajador
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, error, children, full }) {
  return (
    <label className={full ? "form-field full-field" : "form-field"}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}
