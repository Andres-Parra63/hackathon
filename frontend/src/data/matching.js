import { distanceKm } from '../lib/format'

// Matching score (CLAUDE.md): weights live here only, so they can be tuned after the pilot.
export const WEIGHTS = { skills: 0.4, proximity: 0.3, availability: 0.2, history: 0.1 }

/** Weighted score in [0, 1] from parts in [0, 1]. Explainable: the parts are shown to the user. */
export const score = (parts) =>
  Object.keys(WEIGHTS).reduce((sum, key) => sum + WEIGHTS[key] * parts[key], 0)

// Shifts that count as a full attendance history (the history part saturates at 1).
const HISTORY_FULL = 5

/** Weekday 1–7 (Monday = 1) and slot of an ISO date, in Bogotá time. */
export const slotOf = (iso) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.find((p) => p.type === 'weekday').value) + 1
  const hour = Number(parts.find((p) => p.type === 'hour').value)
  return { dia_semana: weekday, franja: hour < 12 ? 'manana' : hour < 18 ? 'tarde' : 'noche' }
}

/**
 * Parts of the score for one volunteer and one call, from the volunteer's own profile:
 * skills that match, straight-line closeness within their radius, availability in the call's slot, history.
 */
export const volunteerParts = (volunteer, call, shiftsDone = 0) => {
  const mine = new Set(volunteer.habilidades.map((h) => h.id))
  const required = call.habilidades.length || 1
  const matched = call.habilidades.filter((h) => mine.has(h.id)).length
  const km = distanceKm(volunteer.lat_aprox, volunteer.lon_aprox, call.lat, call.lon)
  const slot = slotOf(call.inicio)
  const available = volunteer.disponibilidades.some((d) => d.dia_semana === slot.dia_semana && d.franja === slot.franja)
  return {
    km,
    parts: {
      skills: matched / required,
      proximity: Math.max(0, 1 - km / Number(volunteer.radio_km)),
      availability: available ? 1 : 0,
      history: Math.min(1, shiftsDone / HISTORY_FULL),
    },
  }
}
