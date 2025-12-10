import { useState, useEffect } from 'react'
import { Calendar } from './Calendar'
import { TimeSlots } from './TimeSlots'
import { BookingForm } from './BookingForm'
import { supabase } from '../lib/supabase'

export function BookingApp({ eventTypeSlug }) {
  const [eventType, setEventType] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [availabilityRules, setAvailabilityRules] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [step, setStep] = useState('calendar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEventType()
  }, [eventTypeSlug])

  async function loadEventType() {
    try {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .eq('slug', eventTypeSlug)
        .eq('active', true)
        .maybeSingle()

      if (error) throw error
      setEventType(data)
    } catch (err) {
      console.error('Error loading event type:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectDate = (date, rules) => {
    setSelectedDate(date)
    setAvailabilityRules(rules)
    setStep('timeslots')
  }

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot)
    setStep('form')
  }

  const handleBookingSuccess = () => {
    setStep('success')
  }

  if (loading) {
    return (
      <div className="booking-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (!eventType) {
    return (
      <div className="booking-container">
        <div className="error">Event type not found</div>
      </div>
    )
  }

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1>{eventType.name}</h1>
        <p className="duration">{eventType.duration} min</p>
        {eventType.description && (
          <p className="description">{eventType.description}</p>
        )}
      </div>

      <div className="booking-content">
        {step === 'success' ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>You are scheduled!</h2>
            <p>A confirmation email has been sent to you.</p>
          </div>
        ) : (
          <>
            <div className="calendar-section">
              <Calendar
                eventTypeSlug={eventTypeSlug}
                onSelectDate={handleSelectDate}
              />
            </div>

            {step !== 'calendar' && (
              <div className="details-section">
                {step === 'timeslots' && (
                  <TimeSlots
                    selectedDate={selectedDate}
                    availabilityRules={availabilityRules}
                    eventTypeSlug={eventTypeSlug}
                    onSelectSlot={handleSelectSlot}
                  />
                )}

                {step === 'form' && (
                  <BookingForm
                    selectedSlot={selectedSlot}
                    eventTypeSlug={eventTypeSlug}
                    onSuccess={handleBookingSuccess}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
