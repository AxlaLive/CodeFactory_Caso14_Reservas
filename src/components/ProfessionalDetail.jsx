export default function ProfessionalDetail({
  professional,
  onClose,
  onToggleActive,
  onDelete,
  onEdit,
  canManage = true,
}) {
  const active = professional.active !== false;
  const initials = professional.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <section
        className="appointment-form detail-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">Ficha del trabajador</span>
            <h2>Datos del trabajador</h2>
          </div>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="detail-profile">
          <b className={active ? "resource-icon" : "resource-icon inactive"}>
            {initials}
          </b>
          <div>
            <strong>{professional.name}</strong>
            <span>{professional.role}</span>
          </div>
          <i className={active ? "status-pill" : "status-pill inactive"}>
            {active ? "Activo" : "Inactivo"}
          </i>
        </div>

        <dl className="detail-list">
          <div>
            <dt>Rol</dt>
            <dd>{professional.roleType === "receptionist" ? "Recepcionista" : "Profesional"}</dd>
          </div>
          <div>
            <dt>Especialidad</dt>
            <dd>{professional.role}</dd>
          </div>
          <div>
            <dt>Identificación</dt>
            <dd>{professional.identification}</dd>
          </div>
          <div>
            <dt>Correo electrónico</dt>
            <dd>{professional.email}</dd>
          </div>
        </dl>

        {canManage && (
          <footer className="modal-footer detail-actions">
            {professional.roleType !== "receptionist" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onEdit(professional)}
              >
                Editar ficha
              </button>
            )}
            <button
              type="button"
              className="secondary-button danger-button"
              onClick={() => onDelete(professional)}
            >
              Eliminar o desactivar
            </button>
            <button
              type="button"
              className={active ? "secondary-button" : "primary-button"}
              onClick={() => onToggleActive(professional)}
            >
              {active ? "Marcar como inactivo" : "Marcar como activo"}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
