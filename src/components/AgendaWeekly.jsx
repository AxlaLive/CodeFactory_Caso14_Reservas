import { buildDayColumns, capitalize, formatDay, formatMonth, toDateKey } from '../utils/agenda'

export default function AgendaWeekly({ weekDays, appointments, blocks = [], showBlocks = true, onPreviousWeek, onNextWeek, onToday, onCreateForDay, onSelectAppointment, readOnly = false }) {
  const columns = buildDayColumns(appointments, showBlocks ? blocks : [], weekDays)
  const todayKey = toDateKey(new Date())
  return <section className="weekly-card"><header className="weekly-header"><div><span className="eyebrow">Agenda semanal</span><h2>{capitalize(formatMonth(weekDays[0]))}</h2></div><div className="week-actions"><button onClick={onPreviousWeek} aria-label="Semana anterior">‹</button><button onClick={onToday}>Semana actual</button><button onClick={onNextWeek} aria-label="Semana siguiente">›</button></div></header><div className="weekly-scroll"><div className="week-board"><div className="board-header">{columns.map((column) => <button type="button" key={column.date} className={readOnly ? 'day-heading read-only' : 'day-heading'} disabled={readOnly} onClick={() => !readOnly && onCreateForDay(column.date)} title={readOnly ? 'Solo lectura' : `Nueva cita el ${formatDay(column.day)}`}><span className="day-name">{capitalize(formatDay(column.day))}</span><span className="day-cta">＋ Nueva cita</span>{column.date === todayKey && <b>Hoy</b>}</button>)}</div><div className="board-body">{columns.map((column) => <div className="day-column" key={column.date}>{column.entries.length === 0 && <span className="day-empty">Sin citas</span>}{column.entries.map((entry) => entry.kind === 'appointment' ? <AppointmentBlock key={entry.data.id} entry={entry} readOnly={readOnly} onSelect={onSelectAppointment} /> : <BlockBlock key={entry.data.id} entry={entry} />)}</div>)}</div></div></div></section>
}

function AppointmentBlock({ entry, readOnly, onSelect }) {
  const { data, hasBuffer, bufferMinutes } = entry
  return <div className="slot-group"><button className={readOnly ? 'slot-appointment read-only' : 'slot-appointment'} onClick={() => onSelect(data)} title={`${data.patientName} · ${data.typeName}`}><strong>{data.patientName}</strong><span>{data.startTime} - {data.endTime}</span><small>{data.professionalName} · {data.spaceName}</small></button>{hasBuffer && <div className="slot-buffer"><span>Buffer {bufferMinutes}min</span></div>}</div>
}

function BlockBlock({ entry }) {
  const { data } = entry
  return <div className={data.type === 'break' ? 'slot-block break' : 'slot-block admin'}><strong>{data.type === 'break' ? '⏸' : '🗒'} {data.label || (data.type === 'break' ? 'Descanso' : 'Tarea administrativa')}</strong><span>{data.startTime} - {data.endTime}</span></div>
}
