// Dates are stored in UTC and shown in the user's zone (America/Bogota by default).
const ZONE = 'America/Bogota'

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('es-CO', {
        timeZone: ZONE,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

export const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', { timeZone: ZONE, hour: '2-digit', minute: '2-digit' }) : ''

export const formatRange = (start, end) => `${formatDateTime(start)} – ${formatTime(end)}`

export const formatKm = (km) => (km === null || km === undefined ? '' : `${Number(km).toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`)

export const formatHours = (h) => `${Number(h ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })} h`

/** `datetime-local` value (local wall time) -> ISO 8601 with the Bogotá offset. */
export const localToIso = (value) => (value ? `${value}:00-05:00` : null)

/** Great-circle distance in km (straight line: does not reflect blocked roads). */
export const distanceKm = (lat1, lon1, lat2, lon2) => {
  const rad = (d) => (Number(d) * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}
