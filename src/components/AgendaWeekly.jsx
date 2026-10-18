import {
  buildDayColumns,
  capitalize,
  formatDay,
  formatMonth,
  toDateKey,
} from "../utils/agenda";

export default function AgendaWeekly({
  weekDays,
  appointments,
  blocks = [],
  showBlocks = true,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onCreateForDay,
  onSelectAppointment,
  readOnly = false,
}) {
  const columns = buildDayColumns(appointments, showBlocks ? blocks : [], weekDays);
  const todayKey = toDateKey(new Date());

  return (
    <section className="weekly-card" aria-label="Agenda semanal">
      <header className="weekly-header">
        <div>
          <span className="eyebrow">Agenda semanal</span>
          <h2>{capitalize(formatMonth(weekDays[0]))}</h2>
        </div>
        <div className="week-actions" aria-label="Navegación entre semanas">
          <button type="button" onClick={onPreviousWeek} aria-label="Semana anterior">
            Semana anterior
          </button>
          <button type="button" onClick={onToday}>Semana actual</button>
          <button type="button" onClick={onNextWeek} aria-label="Semana siguiente">
            Semana siguiente
          </button>
        </div>
      </header>
      <div className="weekly-scroll" tabIndex="0" aria-label="Desplázate horizontalmente para ver todos los días">
        <div className="week-board">
          <div className="board-header">
            {columns.map((column) => {
              const dateLabel = formatDay(column.day);
              return (
                <button
                  type="button"
                  key={column.date}
                  className={readOnly ? "day-heading read-only" : "day-heading"}
                  disabled={readOnly}
                  onClick={() => !readOnly && onCreateForDay?.(column.date)}
                  aria-label={`${capitalize(dateLabel)}${column.date === todayKey ? ", hoy" : ""}${readOnly ? ", solo lectura" : ", crear cita"}`}
                  title={readOnly ? "Solo lectura" : `Nueva cita el ${dateLabel}`}
                >
                  <span className="day-name">{capitalize(dateLabel)}</span>
                  {!readOnly && <span className="day-cta">＋ Nueva cita</span>}
                  {column.date === todayKey && <b>Hoy</b>}
                </button>
              );
            })}
          </div>
          <div className="board-body">
            {columns.map((column) => (
              <div
                className="day-column"
                key={column.date}
                aria-label={`Agenda del ${formatDay(column.day)}`}
              >
                {column.entries.length === 0 && (
                  <span className="day-empty">Sin citas</span>
                )}
                {column.entries.map((entry) => (
                  entry.kind === "appointment"
                    ? (
                      <AppointmentBlock
                        key={entry.data.id}
                        entry={entry}
                        readOnly={readOnly}
                        onSelect={onSelectAppointment}
                      />
                    )
                    : <BlockBlock key={entry.data.id} entry={entry} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AppointmentBlock({ entry, readOnly, onSelect }) {
  const { data, hasBuffer, bufferMinutes } = entry;
  const appointmentLabel = [
    data.patientName,
    data.typeName,
    `${data.startTime} a ${data.endTime}`,
    data.professionalName,
    data.spaceName,
  ].filter(Boolean).join(", ");

  return (
    <div className="slot-group">
      <button
        type="button"
        className={readOnly ? "slot-appointment read-only" : "slot-appointment"}
        onClick={() => onSelect?.(data)}
        title={appointmentLabel}
        aria-label={`Cita: ${appointmentLabel}`}
      >
        <strong>{data.patientName}</strong>
        <span>{data.startTime} - {data.endTime}</span>
        <small>{data.professionalName} · {data.spaceName}</small>
      </button>
      {hasBuffer && (
        <div className="slot-buffer">
          <span>Tiempo de preparación: {bufferMinutes} min</span>
        </div>
      )}
    </div>
  );
}

function BlockBlock({ entry }) {
  const { data } = entry;
  const label = data.label || ({
    available: "Horario disponible",
    unavailable: "No disponible",
    break: "Descanso",
    admin: "No disponible",
    other: "Otro motivo",
  }[data.type] || "Disponibilidad");
  const className = data.type === "break"
    ? "break"
    : data.type === "available"
      ? "available"
      : "admin";

  return (
    <div className={`slot-block ${className}`}>
      <strong>{label}</strong>
      <span>{data.startTime} - {data.endTime}</span>
    </div>
  );
}
