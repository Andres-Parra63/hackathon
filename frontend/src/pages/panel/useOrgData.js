import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import { placeByName } from '../../data/places'
import { clusterVolunteers } from '../../data/volunteerMap'

// Calls still taking volunteers.
export const isLive = (call) => call.estado === 'publicada'

/** Calls and emergencies of the signed-in organization, plus the active emergency (if any). */
export function useOrgData() {
  const { user } = useAuth()
  const orgId = user.organizacion_id
  const result = useApi(async () => {
    const [calls, emergencies] = await Promise.all([
      api.calls({ organizacion_id: orgId, limite: 200 }),
      api.emergencies(false),
    ])
    const mine = emergencies.filter((e) => e.solicitada_por === orgId)
    return {
      calls,
      emergencies: mine,
      active: mine.find((e) => e.estado === 'activa') ?? null,
      pending: mine.find((e) => e.estado === 'por_confirmar') ?? null,
    }
  }, [orgId])
  return { ...result, orgId, user }
}

/**
 * Map data for one call: volunteers grouped by ~1 km cell and classified against the call, plus the
 * other operation points of its emergency. Resolves to null when there is no call.
 */
export function useCallMap(call) {
  return useApi(async () => {
    if (!call) return null
    const [volunteers, points] = await Promise.all([
      api.volunteers({ limite: 1000 }),
      call.emergencia_id ? api.points({ emergencia_id: call.emergencia_id, solo_publicos: false }) : [],
    ])
    return { ...clusterVolunteers(volunteers, call), points: points.filter((p) => p.activo) }
  }, [call?.id])
}

/** Live emergency call to follow in the panel: `preferredId` if given, else the newest live one. */
export const pickActiveCall = (calls, preferredId) =>
  calls.find((c) => c.id === preferredId) ??
  [...calls].filter((c) => c.tipo === 'desastre' && isLive(c)).sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ??
  [...calls].filter(isLive).sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ??
  null

/**
 * Creates and convokes a call from the "Nueva convocatoria" drawer.
 * Emergency calls go to the first public point of the active emergency; others start in one hour.
 */
export async function createQuickCall({ orgId, userId, type, skills, slots, notes, skillNames, emergency }) {
  const start = new Date(Date.now() + 60 * 60 * 1000)
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  let place = { lat: placeByName('Chapinero').lat, lon: placeByName('Chapinero').lon, direccion: null, punto: null }
  if (type === 'desastre') {
    if (!emergency) throw new Error('No hay una emergencia activa: solicita la activación en «Emergencia».')
    const points = await api.points({ emergencia_id: emergency.id, solo_publicos: false })
    const point = points.find((p) => p.activo)
    if (!point) throw new Error('Crea primero un punto de operación seguro en «Emergencia».')
    place = { lat: point.lat, lon: point.lon, direccion: point.direccion, punto: point }
  }
  const title = `${slots} cupo${slots === 1 ? '' : 's'} de ${skillNames.join(', ').toLowerCase()}${
    place.punto ? ` · ${place.punto.nombre}` : ''
  }`
  const call = await api.createCall(orgId, {
    creada_por: userId,
    tipo: type,
    emergencia_id: type === 'desastre' ? emergency.id : null,
    punto_operacion_id: place.punto?.id ?? null,
    titulo: title,
    indicaciones: notes || null,
    direccion: place.direccion,
    lat: place.lat,
    lon: place.lon,
    inicio: start.toISOString(),
    fin: end.toISOString(),
    cupos: slots,
    habilidad_ids: skills,
    publicar: true,
  })
  const { convocados } = await api.convoke(call.id)
  return { call, convocados }
}
