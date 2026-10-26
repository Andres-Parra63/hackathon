import { distanceKm } from '../lib/format'
import { slotOf } from './matching'

// Marker kinds, from most to least relevant for the call (the dominant kind colors a cluster).
export const KINDS = ['match', 'unavailable', 'other', 'outside']

/**
 * Kind of each volunteer for one call: outside the radius, without the skill, with the skill but
 * not available in the call's slot, or a full match (skill + radius + slot). Same rules as the API funnel.
 */
export const classify = (volunteer, call) => {
  const km = distanceKm(volunteer.lat_aprox, volunteer.lon_aprox, call.lat, call.lon)
  if (km > Number(call.radio_km)) return 'outside'
  const required = new Set(call.habilidades.map((h) => h.id))
  if (!volunteer.habilidades.some((h) => required.has(h.id))) return 'other'
  const slot = slotOf(call.inicio)
  const available = volunteer.disponibilidades.some((d) => d.dia_semana === slot.dia_semana && d.franja === slot.franja)
  return available ? 'match' : 'unavailable'
}

/**
 * Groups volunteers by their approximate cell (coordinates are stored rounded to ~1 km), so the
 * map never shows individual people: only how many there are per neighbourhood and of which kind.
 */
export function clusterVolunteers(volunteers, call) {
  const cells = new Map()
  const totals = Object.fromEntries(KINDS.map((kind) => [kind, 0]))
  volunteers.forEach((volunteer) => {
    const kind = classify(volunteer, call)
    totals[kind] += 1
    const key = `${volunteer.lat_aprox},${volunteer.lon_aprox}`
    if (!cells.has(key)) {
      cells.set(key, {
        key,
        lat: Number(volunteer.lat_aprox),
        lon: Number(volunteer.lon_aprox),
        place: volunteer.barrio,
        counts: Object.fromEntries(KINDS.map((k) => [k, 0])),
        total: 0,
      })
    }
    const cell = cells.get(key)
    cell.counts[kind] += 1
    cell.total += 1
  })
  const clusters = [...cells.values()].map((cell) => ({ ...cell, kind: KINDS.find((k) => cell.counts[k] > 0) }))
  return { clusters, totals, inRadius: totals.match + totals.unavailable + totals.other }
}
