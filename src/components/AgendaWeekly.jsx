import { buildDayColumns, capitalize, formatDay, formatMonth, PX_PER_MINUTE, toDateKey, DAY_START, DAY_END } from '../utils/agenda'

const GRID_HEIGHT = (DAY_END - DAY_START) * PX_PER_MINUTE
const HOUR_MARKS = Array.from({ length: Math.floor((DAY_END - DAY_START) / 60) + 1 }, (_, index) => DAY_START + index * 60)

export default function AgendaWeekly({ weekDays, appointments, blocks = [], onPreviousWeek, onNextWeek, onToday, onCreateForDay, onSelectAppointment, readOnly = false }) {
  const columns = buildDayColumns(appointments, blocks, weekDays)
  const todayKey = toDateKey(new Date())
  return <section className="weekly-card"><header className="weekly-header"><div><span className="eyebrow">Agenda semanal</span><h2>{capitalize(formatMonth(weekDays[0]))}</h2></div><div className="week-actions"><button onClick={onPreviousWeek} aria-label="Semana anterior">‹</button><button onClick={onToday}>Semana actual</button><button onClick={onNextWeek} aria-label="Semana siguiente">›</button></div></header><div className="weekly-scroll"><div className="week-board"><div className="board-header"><div className="board-corner" />{columns.map((column) => <button type="button" key={column.date} className={readOnly ? 'day-heading read-only' : 'day-heading'} disabled={readOnly} onClick={() => !readOnly && onCreateForDay(column.date)} title={readOnly ? 'Solo lectura' : `Nueva cita el ${formatDay(column.day)}`}><span className="day-name">{capitalize(formatDay(column.day))}</span><span className="day-cta">＋ Nueva cita</span>{column.date === todayKey && <b>Hoy</b>}</button>)}</div><div className="board-body"><div className="chart-lanes" style={{ height: GRID_HEIGHT }}>{HOUR_MARKS.map((minute) => <div className="chart-lane" key={minute} style={{ top: (minute - DAY_START) * PX_PER_MINUTE }} />)}</div><div className="time-column">{HOUR_MARKS.map((minute) => <span className="chart-hour" key={minute}>{formatTimeLabel(minute)}</span>)}</div>{columns.map((column) => <div className="day-column" key={column.date}>{column.entries.map((entry) => entry.kind === 'appointment' ? <AppointmentBlock key={entry.data.id} entry={entry} readOnly={readOnly} onSelect={onSelectAppointment} /> : <BlockBlock key={entry.data.id} entry={entry} />)}</div>)}</div></div></div></section>
}

function formatTimeLabel(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function AppointmentBlock({ entry, readOnly, onSelect }) {
  const { data, top, height, bufferTop, bufferHeight } = entry
  return <div className="slot-group" style={{ top, height: height + bufferHeight }}><button className={readOnly ? 'slot-appointment read-only' : 'slot-appointment'} style={{ height }} onClick={() => onSelect(data)} title={`${data.patientName} · ${data.typeName}`}><strong>{data.patientName}</strong><span>{data.startTime} - {data.endTime}</span><small>{data.professionalName} · {data.spaceName}</small></button><div className="slot-buffer" style={{ top: bufferTop - top, height: bufferHeight }}><span>Buffer</span></div></div>
}

function BlockBlock({ entry }) {
  const { data, top, height } = entry
  return <div className={data.type === 'break' ? 'slot-block break' : 'slot-block admin'} style={{ top, height }}><strong>{data.type === 'break' ? '⏸' : '🗒'} {data.label || (data.type === 'break' ? 'Descanso' : 'Tarea administrativa')}</strong><span>{data.startTime} - {data.endTime}</span></div>
}
