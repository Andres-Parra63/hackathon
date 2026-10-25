// HTTP client for the Manos en Red API (backend/main.py). JWT in Authorization: Bearer.
// Port 8010 is the development backend for this repository. Override it with
// VITE_API_URL when the API is exposed elsewhere (for example in production).
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8010').replace(/\/$/, '')

const TOKEN_KEY = 'mer.token'

// Storage can throw (private windows, blocked site data): the token then lives in memory only.
let memoryToken = null
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}
export const setToken = (token) => {
  memoryToken = token
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* in-memory only */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// FastAPI sends `detail` as a string, or as a list of validation errors (422).
const readDetail = (body) => {
  if (!body?.detail) return null
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) return body.detail.map((d) => d.msg?.replace(/^Value error, /, '')).join(' · ')
  return null
}

/** Calls the API. `query` becomes the query string; `body` is sent as JSON. */
export async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(API_URL + path)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value)
  })
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', 0)
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(readDetail(data) ?? `Error ${response.status}`, response.status)
  return data
}

const post = (path, body, query) => request(path, { method: 'POST', body, query })
const patch = (path, body) => request(path, { method: 'PATCH', body })
const del = (path) => request(path, { method: 'DELETE' })

export const api = {
  login: (correo, contrasena) => post('/auth/login', { correo, contrasena }),
  me: () => request('/auth/me'),

  skills: () => request('/habilidades'),
  createSkill: (body) => post('/habilidades', body),
  updateSkill: (id, body) => patch(`/habilidades/${id}`, body),
  deleteSkill: (id) => del(`/habilidades/${id}`),

  registerVolunteer: (body) => post('/voluntarios', body),
  volunteer: (id) => request(`/voluntarios/${id}`),
  updateVolunteer: (id, body) => patch(`/voluntarios/${id}`, body),
  deleteVolunteer: (id) => del(`/voluntarios/${id}`),
  revokeConsent: (id) => post(`/usuarios/${id}/revocar-consentimiento`),
  hours: (id) => request(`/voluntarios/${id}/horas`),
  nearbyCalls: (id) => request(`/voluntarios/${id}/convocatorias-cercanas`),
  myParticipations: (id) => request(`/voluntarios/${id}/participaciones`),
  volunteers: (query) => request('/voluntarios', { query }),

  organizations: (query) => request('/organizaciones', { query }),
  verifyOrganization: (id, administradorId, aprobar) =>
    post(`/organizaciones/${id}/verificacion`, { administrador_id: administradorId, aprobar }),

  emergencies: (soloActivas = false) => request('/emergencias', { query: { solo_activas: soloActivas } }),
  requestEmergency: (orgId, body) => post(`/organizaciones/${orgId}/emergencias`, body),
  confirmEmergency: (id, confirmadaPor) => post(`/emergencias/${id}/confirmar`, undefined, { confirmada_por: confirmadaPor }),
  closeEmergency: (id) => post(`/emergencias/${id}/cerrar`),

  audit: (limite = 20) => request('/auditoria', { query: { limite } }),

  points: (query) => request('/puntos', { query }),
  createPoint: (orgId, body) => post(`/organizaciones/${orgId}/puntos`, body),

  calls: (query) => request('/convocatorias', { query }),
  createCall: (orgId, body) => post(`/organizaciones/${orgId}/convocatorias`, body),
  setCallState: (id, estado) => post(`/convocatorias/${id}/estado/${estado}`),
  callSummary: (id) => request(`/convocatorias/${id}/resumen`),
  candidates: (id) => request(`/convocatorias/${id}/candidatos`),
  funnel: (id) => request(`/convocatorias/${id}/embudo`),
  convoke: (id) => post(`/convocatorias/${id}/convocar`),
  participations: (id) => request(`/convocatorias/${id}/participaciones`),

  apply: (callId, volunteerId) => post(`/convocatorias/${callId}/postulaciones`, undefined, { voluntario_id: volunteerId }),
  respond: (participationId, estado, detalle) => post(`/participaciones/${participationId}/respuesta`, { estado, detalle }),
  cancelParticipation: (participationId) => post(`/participaciones/${participationId}/cancelar`),
  checkIn: (participationId) => post(`/participaciones/${participationId}/entrada`),
  checkOut: (participationId) => post(`/participaciones/${participationId}/salida`),
}
