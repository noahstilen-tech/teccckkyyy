import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { generateTimeSlots } from '../utils/dateUtils'
import { supabase } from '../lib/supabase'

export function TimeSlots({ selectedDate, availabilityRules, eventTypeSlug, onSelectSlot }) {
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookedSlots, setBookedSlots] = useState(new Set())

  useEffect(() => {
    if (selectedDate && availabilityRules.length > 0) {
      loadSlots()
    }
  }, [selectedDate, availabilityRules])

  async function loadSlots() {
    const { data: eventType } = await supabase
      .from('event_types')
      .select('duration')
      .eq('slug', eventTypeSlug)
      .single()

    const duration = eventType?.duration || 30

    const generatedSlots = generateTimeSlots(selectedDate, availabilityRules, duration)
    setSlots(generatedSlots)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time')
      .gte('start_time', format(selectedDate, 'yyyy-MM-dd 00:00:00'))
      .lte('start_time', format(selectedDate, 'yyyy-MM-dd 23:59:59'))

    if (bookings) {
      const booked = new Set(bookings.map(b => new Date(b.start_time).toISOString()))
      setBookedSlots(booked)
    }
  }

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot)
    onSelectSlot(slot)
  }

  if (!selectedDate || slots.length === 0) {
    return (
      <div className="time-slots-empty">
        <p>Select a date to view available times</p>
      </div>
    )
  }

  return (
    <div className="time-slots">
      <h3>{format(selectedDate, 'EEEE, MMMM d')}</h3>
      <div className="slots-grid">
        {slots.map((slot, index) => {
          const isBooked = bookedSlots.has(slot.start.toISOString())
          const isSelected = selectedSlot && slot.start.getTime() === selectedSlot.start.getTime()

          return (
            <button
              key={index}
              onClick={() => handleSlotClick(slot)}
              disabled={isBooked}
              className={`
                time-slot-button
                ${isSelected ? 'selected' : ''}
                ${isBooked ? 'booked' : ''}
              `}
            >
              {format(slot.start, 'h:mm a')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
