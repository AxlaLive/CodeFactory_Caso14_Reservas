import { formatLongDate } from "../utils/agenda";

export default function AppointmentDetail({
  appointment,
  readOnly = false,
  onClose,
  onEdit,
  onReschedule,
  onCancel,
}) {
  return (
    <div className="modal-layer" onMouseDown={onClose}>
      <section
        className="appointment-form detail-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-header">
          <div>
            <span className="eyebrow">
              {readOnly ? "Detalle de la cita" : "Gestion de la cita"}
            </span>
            <h2>{appointment.patientName}</h2>
          </div>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="detail-profile">
          <b className="resource-icon">
            {(appointment.patientName || "?")
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </b>
          <div>
            <strong>{appointment.typeName || "Cita"}</strong>
            <span>
              {appointment.specialty} · {appointment.professionalName}
            </span>
          </div>
          <i className="status-pill">
            {appointment.status === "pending" ? "Pendiente" : "Programada"}
          </i>
        </div>

        <dl className="detail-list">
          <div>
            <dt>Fecha</dt>
            <dd>{formatLongDate(appointment.date)}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>
              {appointment.startTime} - {appointment.endTime}
            </dd>
          </div>
          <div>
            <dt>Buffer</dt>
            <dd>Hasta {appointment.bufferEndTime || appointment.endTime}</dd>
          </div>
          <div>
            <dt>Consultorio</dt>
            <dd>{appointment.spaceName}</dd>
          </div>
          <div>
            <dt>Documento</dt>
            <dd>{appointment.patientId || "—"}</dd>
          </div>
          <div>
            <dt>Edad</dt>
            <dd>{appointment.patientAge || "—"}</dd>
          </div>
          <div>
            <dt>Telefono</dt>
            <dd>{appointment.patientPhone || "—"}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{appointment.patientEmail || "—"}</dd>
          </div>
          <div className="detail-full">
            <dt>Observaciones</dt>
            <dd>{appointment.notes || "Sin observaciones."}</dd>
          </div>
        </dl>

        {readOnly ? (
          <p className="field-hint">
            Vista de solo lectura. La gestion de la agenda general corresponde
            al recepcionista.
          </p>
        ) : (
          <footer className="modal-footer detail-actions">
            <button
              type="button"
              className="secondary-button danger-button"
              onClick={() => onCancel(appointment)}
            >
              Cancelar cita
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onReschedule(appointment)}
            >
              Reprogramar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => onEdit(appointment)}
            >
              Editar
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
