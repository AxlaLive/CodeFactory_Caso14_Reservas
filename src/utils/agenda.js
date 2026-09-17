export const SLOT_MINUTES = 30
export const DAY_START = 8 * 60
export const DAY_END = 18 * 60

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

export function getWeekDays(date) {
  const monday = getWeekStart(date)
  return Array.from({ length: 7 }, (_, index) => { const day = new Date(monday); day.setDate(monday.getDate() + index); return day })
}

export function getSlots() {
  return Array.from({ length: (DAY_END - DAY_START) / SLOT_MINUTES }, (_, index) => formatTime(DAY_START + index * SLOT_MINUTES))
}

export function overlaps(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB)
}

export function getEndTime(startTime, duration) {
  return formatTime(timeToMinutes(startTime) + Number(duration))
}

export function formatDay(date) {
  return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
}

export function formatMonth(date) {
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}
