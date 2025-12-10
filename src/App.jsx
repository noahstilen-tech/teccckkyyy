import { BookingApp } from './components/BookingApp'

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  const eventTypeSlug = urlParams.get('event') || '30min'

  return <BookingApp eventTypeSlug={eventTypeSlug} />
}

export default App
