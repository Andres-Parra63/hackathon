// Fictional demo data for the prototype. Never real personal data (Ley 1581 de 2012).

export const SKILLS = [
  'Salud',
  'Cocina',
  'Obra',
  'Idiomas',
  'Conducción',
  'Psicosocial',
  'Cuidado',
  'Logística',
]

// Status tone -> Badge tone.
export const RESPONSE_TONE = {
  'En camino': 'success',
  Confirmó: 'success',
  'No puede': 'neutral',
  'Sin respuesta': 'warning',
}

export const RESPONSES = [
  { id: 'A12', skill: 'Logística', distance: '1,2 km', status: 'En camino', time: '10:31', detail: 'Llega en ~10 min' },
  { id: 'B07', skill: 'Logística', distance: '2,1 km', status: 'Confirmó', time: '10:31', detail: 'Irá antes de las 12:00' },
  { id: 'C33', skill: 'Logística', distance: '3,4 km', status: 'Confirmó', time: '10:35', detail: 'Irá en la tarde' },
  { id: 'D19', skill: 'Logística', distance: '2,8 km', status: 'No puede', time: '10:29', detail: 'Respondió «No puedo ahora»' },
  { id: 'E05', skill: 'Logística', distance: '4,6 km', status: 'Sin respuesta', time: '10:24', detail: 'Avisado por push y correo' },
]

// Statuses that count as a confirmed slot.
export const CONFIRMED_STATUSES = ['En camino', 'Confirmó']

export const HISTORY = [
  { title: 'Salud · 2 cupos', text: '6 voluntarios convocados · cubierta en 48 min', date: 'Ayer', icon: 'droplet', status: 'Cubierta', tone: 'success' },
  { title: 'Simulacro distrital · 6 cupos', text: '14 voluntarios convocados · cubierta en 26 min', date: '22 oct', icon: 'alert-triangle', status: 'Cubierta', tone: 'success' },
  { title: 'Psicosocial · 1 cupo', text: '3 voluntarios convocados', date: '20 oct', icon: 'heart', status: 'Cerrada', tone: 'neutral' },
  { title: 'Cocina · 3 cupos', text: '8 voluntarios convocados · cubierta en 1 h 10 min', date: '17 oct', icon: 'glass-water', status: 'Cubierta', tone: 'success' },
]

// Volunteers called per day this week (Mon 19 – Sun 25 Oct); null = the day hasn't happened yet.
export const WEEK_CALLS = [
  { day: 'Lun', label: 'Lunes 19', normal: 6, emergency: 0 },
  { day: 'Mar', label: 'Martes 20', normal: 9, emergency: 0 },
  { day: 'Mié', label: 'Miércoles 21', normal: 4, emergency: 0 },
  { day: 'Jue', label: 'Jueves 22 (simulacro)', normal: 3, emergency: 6 },
  { day: 'Vie', label: 'Viernes 23', normal: 5, emergency: 0 },
  { day: 'Sáb', label: 'Sábado 24', normal: 2, emergency: 5, today: true },
  { day: 'Dom', label: 'Domingo 25', normal: null, emergency: null },
]

// Live log of the active call, newest first.
export const CALL_ACTIVITY = [
  { time: '10:35', icon: 'check', tone: 'success', title: 'Voluntario #C33 confirmó', text: 'Irá en la tarde' },
  { time: '10:31', icon: 'navigation', tone: 'success', title: 'Voluntario #A12 va en camino', text: 'Llega en ~10 min' },
  { time: '10:31', icon: 'check', tone: 'success', title: 'Voluntario #B07 confirmó', text: 'Irá antes de las 12:00' },
  { time: '10:29', icon: 'x', tone: 'neutral', title: 'Voluntario #D19 no puede', text: 'Respondió «No puedo ahora»' },
  { time: '10:24', icon: 'send', tone: 'info', title: 'Convocatoria enviada', text: '5 voluntarios por push y correo' },
]
