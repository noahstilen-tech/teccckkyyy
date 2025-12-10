import { useState, useEffect } from 'react'
import { format, isSameMonth, isSameDay } from 'date-fns'
import { getCalendarDays, isToday, getNextMonth, getPreviousMonth } from '../utils/dateUtils'
import { supabase } from '../lib/supabase'

export function Calendar({ eventTypeSlug, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableDays, setAvailableDays] = useState(new Set())
  const [availabilityRules, setAvailabilityRules] = useState([])

  useEffect(() => {
    loadAvailability()
  }, [eventTypeSlug])

  async function loadAvailability() {
    const { data: eventType } = await supabase
      .from('event_types')
      .select('*, availability_rules(*)')
      .eq('slug', eventTypeSlug)
      .single()

    if (eventType) {
      setAvailabilityRules(eventType.availability_rules)
      const available = new Set()
      eventType.availability_rules.forEach(rule => {
        available.add(rule.day_of_week)
      })
      setAvailableDays(available)
    }
  }

  const handleDateClick = (date) => {
    if (!isSameMonth(date, currentMonth)) return
    if (!availableDays.has(date.getDay())) return

    setSelectedDate(date)
    onSelectDate(date, availabilityRules)
  }

  const calendarDays = getCalendarDays(currentMonth)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <button
          onClick={() => setCurrentMonth(getPreviousMonth(currentMonth))}
          className="nav-button"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
        <button
          onClick={() => setCurrentMonth(getNextMonth(currentMonth))}
          className="nav-button"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="days">
          {calendarDays.map((date, index) => {
            const inCurrentMonth = isSameMonth(date, currentMonth)
            const dayOfWeek = date.getDay()
            const isAvailable = availableDays.has(dayOfWeek) && inCurrentMonth
            const selected = selectedDate && isSameDay(date, selectedDate)
            const today = isToday(date)

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                disabled={!isAvailable}
                className={`
                  day-button
                  ${selected ? 'selected' : ''}
                  ${!inCurrentMonth ? 'other-month' : ''}
                  ${isAvailable ? 'available' : ''}
                  ${today ? 'today' : ''}
                `}
                aria-label={format(date, 'MMMM d, yyyy')}
              >
                <span className="day-number">{format(date, 'd')}</span>
                {today && <div className="today-indicator"></div>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
