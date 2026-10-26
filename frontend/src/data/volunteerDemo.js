// Fictional demo data for the volunteer area. Never real personal data (Ley 1581 de 2012).

export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const SLOTS = ['Mañana', 'Tarde', 'Noche']

// Recommended activities (parts feed data/matching.js).
export const RECOMMENDED = [
  {
    id: 'act-1',
    title: 'Clasificación de mercados en banco de alimentos',
    org: 'Fundación Red Solidaria',
    when: 'Sáb 31 oct · 8:00–12:00',
    place: 'Kennedy, Bogotá',
    distance: '2,4 km',
    skills: ['Logística'],
    parts: { skills: 1, proximity: 0.76, availability: 1, history: 0.5 },
  },
  {
    id: 'act-2',
    title: 'Cocina comunitaria para 120 personas',
    org: 'Cocinas con Propósito',
    when: 'Dom 1 nov · 9:00–13:00',
    place: 'Chapinero, Bogotá',
    distance: '4,1 km',
    skills: ['Cocina'],
    parts: { skills: 0.5, proximity: 0.18, availability: 1, history: 0.5 },
  },
  {
    id: 'act-3',
    title: 'Acompañamiento escolar en refuerzo de lectura',
    org: 'Biblioteca Barrio Vivo',
    when: 'Mié 4 nov · 15:00–17:00',
    place: 'Teusaquillo, Bogotá',
    distance: '3,3 km',
    skills: ['Cuidado', 'Idiomas'],
    parts: { skills: 0.5, proximity: 0.34, availability: 0, history: 0.5 },
  },
]

// Emergency shifts offered to the volunteer (safe points only: never rescue tasks).
export const SHIFTS = [
  {
    id: 'turno-1',
    point: 'Centro de acopio Kennedy',
    kind: 'Centro de acopio',
    address: 'Cra. 78 K # 38 A Sur, Kennedy',
    day: 'Sábado 24 de octubre',
    time: '12:00 – 16:00',
    skill: 'Logística',
    seats: 2,
  },
  {
    id: 'turno-2',
    point: 'Albergue Colegio San José',
    kind: 'Albergue',
    address: 'Calle 38 Sur # 72 – 15, Kennedy',
    day: 'Sábado 24 de octubre',
    time: '14:00 – 18:00',
    skill: 'Logística',
    seats: 0,
  },
]

export const HOURS = [
  { id: 'h-1', title: 'Clasificación de mercados', org: 'Fundación Red Solidaria', date: '17 oct', hours: 4 },
  { id: 'h-2', title: 'Turno de acopio · simulacro de inundación', org: 'Fundación Red Solidaria', date: '3 oct', hours: 6 },
  { id: 'h-3', title: 'Cocina comunitaria', org: 'Cocinas con Propósito', date: '19 sep', hours: 3.5 },
  { id: 'h-4', title: 'Refuerzo de lectura', org: 'Biblioteca Barrio Vivo', date: '5 sep', hours: 2 },
]
