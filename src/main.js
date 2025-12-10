import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const state = {
  currentMonth: new Date(),
  selectedDate: null,
  selectedTime: null,
  availability: [],
  bookings: []
}

const DAYS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']
const MONTHS = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December'
]

async function loadAvailability() {
  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')

  if (error) {
    console.error('Error loading availability:', error)
    return
  }

  state.availability = data || []
}

async function loadBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('booking_date, booking_time, duration_minutes')
    .eq('status', 'confirmed')

  if (error) {
    console.error('Error loading bookings:', error)
    return
  }

  state.bookings = data || []
}

function getDaysInMonth(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  return { daysInMonth, startingDayOfWeek, year, month }
}

function isDateAvailable(date) {
  const dayOfWeek = date.getDay()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (date < today) return false

  return state.availability.some(slot => slot.day_of_week === dayOfWeek)
}

function generateTimeSlots(date) {
  const dayOfWeek = date.getDay()
  const availability = state.availability.filter(slot => slot.day_of_week === dayOfWeek)

  if (availability.length === 0) return []

  const slots = []
  const dateStr = date.toISOString().split('T')[0]

  availability.forEach(avail => {
    const [startHour, startMinute] = avail.start_time.split(':').map(Number)
    const [endHour, endMinute] = avail.end_time.split(':').map(Number)

    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`

      const isBooked = state.bookings.some(booking =>
        booking.booking_date === dateStr && booking.booking_time === timeStr
      )

      slots.push({
        time: timeStr,
        display: `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
        available: !isBooked
      })

      currentMinute += avail.duration_minutes
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    }
  })

  return slots
}

function renderCalendar() {
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(state.currentMonth)

  let html = `
    <h1>Vælg en dato</h1>
    <p class="subtitle">Book et 30 minutters møde med Vanter Works</p>

    <div class="month-navigation">
      <button onclick="previousMonth()">← Forrige</button>
      <div class="month-title">${MONTHS[month]} ${year}</div>
      <button onclick="nextMonth()">Næste →</button>
    </div>

    <div class="calendar">
      ${DAYS.map(day => `<div class="calendar-header">${day}</div>`).join('')}
      ${Array(startingDayOfWeek).fill('<div></div>').join('')}
      ${Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const date = new Date(year, month, day)
        const isAvailable = isDateAvailable(date)
        const isSelected = state.selectedDate &&
          state.selectedDate.getDate() === day &&
          state.selectedDate.getMonth() === month &&
          state.selectedDate.getFullYear() === year

        return `<div
          class="calendar-day ${isAvailable ? '' : 'disabled'} ${isSelected ? 'selected' : ''}"
          onclick="selectDate(${year}, ${month}, ${day})"
        >${day}</div>`
      }).join('')}
    </div>
  `

  document.getElementById('app').innerHTML = html
}

function renderTimeSlots() {
  const slots = generateTimeSlots(state.selectedDate)
  const dateStr = state.selectedDate.toLocaleDateString('da-DK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let html = `
    <button class="back-button" onclick="backToCalendar()">← Tilbage til kalender</button>
    <h1>Vælg tidspunkt</h1>
    <p class="subtitle">${dateStr}</p>

    <div class="time-slots">
      ${slots.map(slot => `
        <div
          class="time-slot ${slot.available ? '' : 'disabled'} ${state.selectedTime === slot.time ? 'selected' : ''}"
          onclick="selectTime('${slot.time}')"
        >${slot.display}</div>
      `).join('')}
    </div>

    <button onclick="proceedToForm()" ${!state.selectedTime ? 'disabled' : ''}>
      Fortsæt
    </button>
  `

  document.getElementById('app').innerHTML = html
}

function renderBookingForm() {
  const dateStr = state.selectedDate.toLocaleDateString('da-DK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = state.selectedTime.substring(0, 5)

  let html = `
    <button class="back-button" onclick="backToTimeSlots()">← Tilbage til tidspunkter</button>
    <h1>Indtast dine oplysninger</h1>
    <p class="subtitle">${dateStr} kl. ${timeStr}</p>

    <form id="bookingForm" onsubmit="submitBooking(event)">
      <div class="form-group">
        <label for="name">Navn *</label>
        <input type="text" id="name" name="name" required>
      </div>

      <div class="form-group">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required>
      </div>

      <div class="form-group">
        <label for="phone">Telefon</label>
        <input type="tel" id="phone" name="phone">
      </div>

      <div class="form-group">
        <label for="notes">Eventuelle noter</label>
        <textarea id="notes" name="notes"></textarea>
      </div>

      <button type="submit">Book møde</button>
    </form>
  `

  document.getElementById('app').innerHTML = html
}

function renderSuccess() {
  const dateStr = state.selectedDate.toLocaleDateString('da-DK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = state.selectedTime.substring(0, 5)

  document.getElementById('app').innerHTML = `
    <div class="success-message">
      <h1 style="color: white; margin-bottom: 16px;">✓ Booking bekræftet!</h1>
      <p>Dit møde er booket til:</p>
      <p style="font-size: 18px; font-weight: 700; margin-top: 8px;">
        ${dateStr} kl. ${timeStr}
      </p>
      <p style="margin-top: 16px;">Du vil modtage en bekræftelse på email.</p>
      <button onclick="location.reload()" style="margin-top: 24px; background: white; color: #48bb78;">
        Book et nyt møde
      </button>
    </div>
  `
}

window.previousMonth = () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1)
  renderCalendar()
}

window.nextMonth = () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1)
  renderCalendar()
}

window.selectDate = (year, month, day) => {
  const date = new Date(year, month, day)
  if (!isDateAvailable(date)) return

  state.selectedDate = date
  state.selectedTime = null
  renderTimeSlots()
}

window.selectTime = (time) => {
  const slots = generateTimeSlots(state.selectedDate)
  const slot = slots.find(s => s.time === time)
  if (!slot || !slot.available) return

  state.selectedTime = time
  renderTimeSlots()
}

window.backToCalendar = () => {
  state.selectedDate = null
  state.selectedTime = null
  renderCalendar()
}

window.backToTimeSlots = () => {
  state.selectedTime = null
  renderTimeSlots()
}

window.proceedToForm = () => {
  if (!state.selectedTime) return
  renderBookingForm()
}

window.submitBooking = async (event) => {
  event.preventDefault()

  const form = event.target
  const formData = new FormData(form)

  const booking = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || null,
    notes: formData.get('notes') || null,
    booking_date: state.selectedDate.toISOString().split('T')[0],
    booking_time: state.selectedTime,
    duration_minutes: 30,
    status: 'confirmed'
  }

  const { error } = await supabase
    .from('bookings')
    .insert([booking])

  if (error) {
    alert('Der opstod en fejl. Prøv venligst igen.')
    console.error('Error creating booking:', error)
    return
  }

  renderSuccess()
}

async function init() {
  await loadAvailability()
  await loadBookings()
  renderCalendar()
}

init()
