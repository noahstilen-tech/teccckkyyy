# Calendly API Reverse Engineering

## Identificerede Endpoints (fra Network tab):

### Hent Event Type Info
```
GET https://calendly.com/api/booking/event_types/{slug}
```

### Hent Tilgængelige Tider
```
POST https://calendly.com/api/booking/event_types/{uuid}/calendar_events
Body: {
  "start_date": "2024-12-11",
  "end_date": "2024-12-18"
}
```

### Opret Booking
```
POST https://calendly.com/api/bookings
Body: {
  "event_type_uuid": "...",
  "scheduled_time": "2024-12-11T14:00:00Z",
  "invitee": {
    "name": "...",
    "email": "..."
  }
}
```

## Næste Skridt

1. **Intercept requests**: Brug browser DevTools til at se faktiske API kald
2. **Dokumenter responses**: Gem JSON strukturer
3. **Identificer auth**: Tjek om der er API keys/tokens i headers
4. **Test endpoints**: Brug Postman/curl til at replicate requests

## VIGTIG ADVARSEL

Dette er sandsynligvis imod Calendly's Terms of Service!

Alternativer:
- Brug deres officielle API: https://developer.calendly.com/
- Brug open source alternativer som Cal.com
