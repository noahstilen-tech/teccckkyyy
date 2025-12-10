import { useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'

export function BookingForm({ selectedSlot, eventTypeSlug, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: eventType } = await supabase
        .from('event_types')
        .select('id')
        .eq('slug', eventTypeSlug)
        .single()

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          event_type_id: eventType.id,
          name: formData.name,
          email: formData.email,
          notes: formData.notes,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString()
        })

      if (bookingError) throw bookingError

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedSlot) {
    return null
  }

  return (
    <div className="booking-form-container">
      <h3>Enter your details</h3>
      <p className="booking-time">
        {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')} at {format(selectedSlot.start, 'h:mm a')}
      </p>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Please share anything that will help prepare for our meeting"
            rows="4"
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Scheduling...' : 'Schedule Event'}
        </button>
      </form>
    </div>
  )
}
