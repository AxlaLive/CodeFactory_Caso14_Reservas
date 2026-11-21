import { useState } from "react";

function emptyForm(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

export default function ResourceManager({
  title,
  description,
  items,
  onCreate,
  onUpdate,
  onDelete,
  fields,
  readOnly = false,
}) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyForm(fields));
  const [error, setError] = useState("");

  const openCreate = () => {
    setEditing(false);
    setForm(emptyForm(fields));
    setError("");
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm(Object.fromEntries(fields.map((field) => [field.name, item[field.name] || ""])));
    setError("");
  };

  const closeForm = () => {
    setEditing(null);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (fields.some((field) => !String(form[field.name]).trim())) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    try {
      if (editing) {
        await onUpdate(editing.id, { ...editing, ...form });
      } else {
        await onCreate(form);
      }
      closeForm();
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`¿Eliminar «${item.name}»? Si tiene citas asociadas, se conservará como inactivo.`)) {
      return;
    }
    try {
      await onDelete(item);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await onUpdate(item.id, { ...item, active: item.active === false });
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  return (
    <section className="resource-page">
      <div className="resource-heading">
        <div>
          <span className="eyebrow">Administración</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {!readOnly && (
          <button className="primary-button" type="button" onClick={openCreate}>
            ＋ Registrar
          </button>
        )}
      </div>
      {error && !editing && <div className="form-error" role="alert">{error}</div>}
      <div className="resource-list">
        {items.map((item) => (
          <article className="resource-item" key={item.id}>
            <div className={item.active === false ? "resource-icon inactive" : "resource-icon"}>
              {title.toLowerCase().includes("profesional") ? "DR" : "⌂"}
            </div>
            <div>
              <strong>{item.name}</strong>
              <span>{item.role || item.type}</span>
            </div>
            <i className={item.active === false ? "inactive" : ""}>
              {item.active === false ? "Inactivo" : "Activo"}
            </i>
            {!readOnly && (
              <div className="resource-actions">
                <button type="button" onClick={() => openEdit(item)}>Editar</button>
                {item.active === false ? (
                  <button type="button" onClick={() => toggleActive(item)}>
                    Reactivar
                  </button>
                ) : (
                  <button type="button" className="danger-link" onClick={() => remove(item)}>
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
        {items.length === 0 && <p className="empty-hint">Aún no hay espacios registrados.</p>}
      </div>
      {editing !== null && (
        <div className="modal-layer" onMouseDown={closeForm}>
          <form
            className="appointment-form resource-form"
            onSubmit={submit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="form-header">
              <div>
                <span className="eyebrow">{editing ? "Editar registro" : "Nuevo registro"}</span>
                <h2>{title}</h2>
              </div>
              <button type="button" onClick={closeForm} aria-label="Cerrar">×</button>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            {fields.map((field) => (
              <label className="form-field" key={field.name}>
                <span>{field.label}</span>
                <input
                  required
                  value={form[field.name]}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    [field.name]: event.target.value,
                  }))}
                  placeholder={field.placeholder}
                />
              </label>
            ))}
            <footer className="modal-footer">
              <button type="button" className="secondary-button" onClick={closeForm}>Cancelar</button>
              <button className="primary-button" type="submit">
                {editing ? "Guardar cambios" : "Guardar registro"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
