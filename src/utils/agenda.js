export const DAY_START = 7 * 60
export const DAY_END = 20 * 60
export const SNAP_MINUTES = 15
export const SNAP_OPTIONS = 15
export const PX_PER_MINUTE = 1.6

export function toDateKey(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function fromDateKey(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function getWeekStart(date) {
  const result = new Date(date)
  const day = result.getDay()
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1))
  result.setHours(0, 0, 0, 0)
  return result
}

// Lunes a sábado (6 columnas, sin domingo).
export function getWeekDays(date) {
  const monday = getWeekStart(date)
  return Array.from({ length: 6 }, (_, index) => { const day = new Date(monday); day.setDate(monday.getDate() + index); return day })
}


export function addMinutes(value, minutes) {
  return formatTime(timeToMinutes(value) + Number(minutes))
}

// La franja ocupada de una cita incluye el buffer posterior.
export function occupiedEnd(item) {
  return timeToMinutes(item.bufferEndTime || item.endTime)
}

export function isCancelled(item) {
  return item.status === 'cancelled'
}

// Regla crítica: una cita no puede chocar por hora de inicio ni por intervalo,
// comparando tanto el profesional como el consultorio asignado.
export function findConflict({ date, startTime, endTime, professionalId, spaceId, excludeId }, appointments) {
  return appointments.find((item) => {
    if (item.id === excludeId || isCancelled(item)) return false
    if (item.date !== date) return false
    const sameResource = item.professionalId === professionalId || item.spaceId === spaceId
    if (!sameResource) return false
    return overlaps(startTime, endTime, item.startTime, item.bufferEndTime || item.endTime)
  }) || null
}

// Compara contra los bloqueos administrativos del profesional (descansos/tareas).
export function findBlockConflict({ date, startTime, endTime, professionalId }, blocks = []) {
  return blocks.find((block) => block.professionalId === professionalId && block.date === date && overlaps(startTime, endTime, block.startTime, block.endTime)) || null
}

// Construye las columnas de la agenda. Cada columna (día de la semana) se
// organiza cronológica (más temprano arriba) apilando las entradas una debajo
// de otra en flujo normal: no hay cuadrícula temporal que module posición ni
// altura, por lo que todos los slots tienen el mismo tamaño y la misma
// separación. La hora de inicio solo determina el orden de apilado.
export function buildDayColumns(appointments, blocks, weekDays) {
  return weekDays.map((day) => {
    const dateKey = toDateKey(day)
    const entries = []
    appointments.filter((item) => item.date === dateKey && !isCancelled(item)).forEach((item) => {
      const startMinutes = timeToMinutes(item.startTime)
      const endMinutes = timeToMinutes(item.endTime)
      entries.push({
        kind: 'appointment', order: item.receivedAt || 0, data: item, startMinutes, endMinutes,
        hasBuffer: occupiedEnd(item) > endMinutes,
      })
    })
    ;(blocks || []).filter((block) => block.date === dateKey).forEach((block) => {
      const startMinutes = timeToMinutes(block.startTime)
      const endMinutes = timeToMinutes(block.endTime)
      entries.push({
        kind: 'block', order: 0, data: block, startMinutes, endMinutes,
      })
    })
    // Orden cronológico; ante la misma hora, primero el asignado antes.
    entries.sort((a, b) => a.startMinutes - b.startMinutes || a.order - b.order)
    return { date: dateKey, day, entries }
  })
}

// Posiciones horarias candidatas para el selector de hora.
export function getTimeOptions(step = SNAP_OPTIONS) {
  const options = []
  for (let minute = DAY_START; minute <= DAY_END; minute += step) options.push(formatTime(minute))
  return options
}

// Para cada hora candidata indica si la cita (con su duración y buffer) cabe
// libre, choca con una cita o choca con un bloqueo del profesional.
export function getSlotAvailability({ date, options, duration, buffer, professionalId, spaceId, excludeId }, appointments, blocks) {
  return options.map((time) => {
    const endTime = addMinutes(time, duration)
    const bufferEndTime = addMinutes(time, duration + (buffer || 0))
    if (timeToMinutes(time) + duration > DAY_END) return { time, endTime, bufferEndTime, available: false, reason: 'close' }
    const appointmentConflict = findConflict({ date, startTime: time, endTime, professionalId, spaceId, excludeId }, appointments)
    if (appointmentConflict) return { time, endTime, bufferEndTime, available: false, reason: 'occupied', conflict: appointmentConflict }
    const blockConflict = findBlockConflict({ date, startTime: time, endTime, professionalId }, blocks)
    if (blockConflict) return { time, endTime, bufferEndTime, available: false, reason: 'blocked', conflict: blockConflict }
    return { time, endTime, bufferEndTime, available: true }
  })
}

export function overlaps(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB)
}

export function getEndTime(startTime, duration) {
  return formatTime(timeToMinutes(startTime) + Number(duration))
}

export function formatDay(date) {
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' })
}

export function formatDayShort(date) {
  return date.toLocaleDateString('es-CO', { weekday: 'long' })
}

export function formatMonth(date) {
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

export function formatLongDate(dateKey) {
  return fromDateKey(dateKey).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}
