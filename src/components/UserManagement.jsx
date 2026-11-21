import { useEffect, useState } from "react";
import { SPECIALTIES, userService } from "../api/clinicService";

const emptyForm = {
  name: "",
  roleType: "professional",
  specialty: "",
  identification: "",
  email: "",
  username: "",
  password: "",
  passwordConfirmation: "",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    userService.list()
      .then(setUsers)
      .catch((loadError) => setError(`No fue posible cargar los usuarios: ${loadError.message}`))
      .finally(() => setLoading(false));
  }, []);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const openForm = () => {
    setForm(emptyForm);
    setError("");
    setNotice("");
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const username = form.username.trim();
    const identification = form.identification.trim();
    const email = form.email.trim();
    if (!name) {
      setError("Ingresa el nombre completo.");
      return;
    }
    if (name.length > 201) {
      setError("El nombre no puede superar 201 caracteres.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (!/^[0-9]{5,15}$/.test(identification)) {
      setError("La identificación debe tener entre 5 y 15 dígitos.");
      return;
    }
    if (!/^[A-Za-z0-9._-]{4,30}$/.test(username)) {
      setError("El usuario debe tener entre 4 y 30 letras, números, puntos, guiones o guiones bajos.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (new TextEncoder().encode(form.password).length > 72) {
      setError("La contraseña no puede superar 72 bytes UTF-8.");
      return;
    }
    if (form.password !== form.passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.roleType === "professional" && !form.specialty) {
      setError("Selecciona la especialidad del profesional.");
      return;
    }
    if (!["professional", "receptionist"].includes(form.roleType)) {
      setError("Selecciona un tipo de cuenta válido.");
      return;
    }

    setSaving(true);
    try {
      const created = await userService.create({
        name,
        roleType: form.roleType,
        specialty: form.roleType === "professional" ? form.specialty : "",
        identification,
        email,
        username,
        password: form.password,
      });
      setUsers((current) => [...current, created].sort((left, right) =>
        left.name.localeCompare(right.name, "es"),
      ));
      setForm(emptyForm);
      setFormOpen(false);
      setNotice(`La cuenta de ${created.name} quedó creada.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="user-management" aria-labelledby="users-heading">
      <div className="user-management-heading">
        <div>
          <span className="eyebrow">Administración de cuentas</span>
          <h2 id="users-heading">Usuarios y accesos</h2>
          <p>
            Crea cuentas de acceso para profesionales y personal de recepción.
            Esta opción solo está disponible para administradores.
          </p>
        </div>
        {!formOpen && (
          <button className="primary-button" type="button" onClick={openForm}>
            Crear cuenta de usuario
          </button>
        )}
      </div>

      {notice && <p className="user-notice" role="status">{notice}</p>}
      {error && !formOpen && <p className="form-error" role="alert">{error}</p>}

      {formOpen && (
        <form className="user-form" onSubmit={submit} noValidate>
          <div className="user-form-heading">
            <div>
              <h3>Crear una cuenta nueva</h3>
              <p>La persona podrá iniciar sesión con el usuario y la contraseña que asignes.</p>
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="user-form-grid">
            <Field id="new-user-name" label="Nombre completo">
              <input
                id="new-user-name"
                name="name"
                autoComplete="name"
                maxLength={201}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                required
              />
            </Field>
            <Field id="new-user-role" label="Tipo de cuenta">
              <select
                id="new-user-role"
                name="roleType"
                value={form.roleType}
                onChange={(event) => update("roleType", event.target.value)}
              >
                <option value="professional">Profesional</option>
                <option value="receptionist">Recepcionista</option>
              </select>
            </Field>
            {form.roleType === "professional" && (
              <Field id="new-user-specialty" label="Especialidad">
                <select
                  id="new-user-specialty"
                  name="specialty"
                  value={form.specialty}
                  onChange={(event) => update("specialty", event.target.value)}
                  required
                >
                  <option value="">Selecciona una especialidad</option>
                  {SPECIALTIES.map((specialty) => (
                    <option value={specialty} key={specialty}>{specialty}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field id="new-user-identification" label="Identificación">
              <input
                id="new-user-identification"
                name="identification"
                inputMode="numeric"
                autoComplete="off"
                minLength={5}
                maxLength={15}
                value={form.identification}
                onChange={(event) => update("identification", event.target.value)}
                required
              />
            </Field>
            <Field id="new-user-email" label="Correo electrónico">
              <input
                id="new-user-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={100}
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                required
              />
            </Field>
            <Field id="new-user-username" label="Nombre de usuario">
              <input
                id="new-user-username"
                name="username"
                autoComplete="username"
                minLength={4}
                maxLength={30}
                value={form.username}
                onChange={(event) => update("username", event.target.value)}
                required
              />
            </Field>
            <Field id="new-user-password" label="Contraseña inicial">
              <input
                id="new-user-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                required
              />
            </Field>
            <Field id="new-user-password-confirmation" label="Confirmar contraseña">
              <input
                id="new-user-password-confirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                value={form.passwordConfirmation}
                onChange={(event) => update("passwordConfirmation", event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="user-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setFormOpen(false);
                setError("");
              }}
              disabled={saving}
            >
              Cancelar
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </div>
        </form>
      )}

      <div className="user-list-heading">
        <h3>Cuentas del equipo</h3>
        <p>Los datos de acceso no se muestran en esta lista.</p>
      </div>
      {loading ? (
        <p role="status">Cargando usuarios…</p>
      ) : users.length === 0 ? (
        <p className="user-empty">Todavía no hay cuentas de equipo registradas.</p>
      ) : (
        <div className="user-table-scroll">
          <table className="user-table">
            <caption className="visually-hidden">Cuentas de acceso del equipo</caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Tipo de cuenta</th>
                <th scope="col">Usuario</th>
                <th scope="col">Correo</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <th scope="row">{user.name}</th>
                  <td>{user.roleType === "receptionist" ? "Recepcionista" : "Profesional"}</td>
                  <td>{user.username || "Sin cuenta de acceso"}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.active ? "user-state active" : "user-state inactive"}>
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Field({ id, label, children }) {
  return (
    <div className="user-field">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}
