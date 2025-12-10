import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'

export function getCalendarDays(currentMonth) {
  const start = startOfWeek(startOfMonth(currentMonth))
  const end = endOfWeek(endOfMonth(currentMonth))
  return eachDayOfInterval({ start, end })
}

export function formatDate(date, formatStr = 'yyyy-MM-dd') {
  return format(date, formatStr)
}

export function isToday(date) {
  return isSameDay(date, new Date())
}

export function getNextMonth(date) {
  return addMonths(date, 1)
}

export function getPreviousMonth(date) {
  return subMonths(date, 1)
}

export function generateTimeSlots(date, availabilityRules, duration = 30) {
  const dayOfWeek = date.getDay()
  const rule = availabilityRules.find(r => r.day_of_week === dayOfWeek)

  if (!rule) return []

  const slots = []
  const [startHour, startMinute] = rule.start_time.split(':').map(Number)
  const [endHour, endMinute] = rule.end_time.split(':').map(Number)

  let currentTime = new Date(date)
  currentTime.setHours(startHour, startMinute, 0, 0)

  const endTime = new Date(date)
  endTime.setHours(endHour, endMinute, 0, 0)

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime)
    slotEnd.setMinutes(slotEnd.getMinutes() + duration)

    if (slotEnd <= endTime) {
      slots.push({
        start: new Date(currentTime),
        end: slotEnd
      })
    }

    currentTime.setMinutes(currentTime.getMinutes() + duration)
  }

  return slots
}
