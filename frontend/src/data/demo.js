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

export const HISTORY = [
  { title: 'Salud · 2 cupos', text: 'Ayer · 6 voluntarios convocados · cubierta en 48 min', status: 'Cubierta', tone: 'success' },
  { title: 'Psicosocial · 1 cupo', text: '20 oct · 3 voluntarios convocados', status: 'Cerrada', tone: 'neutral' },
]
