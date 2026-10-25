// Fictional demo data for the organization's activities. Volunteers are anonymized: code only.

export const ACTIVITIES = [
  {
    id: 'a-1',
    title: 'Clasificación de mercados en banco de alimentos',
    place: 'Kennedy, Bogotá',
    when: 'Sáb 31 oct · 8:00–12:00',
    slots: 4,
    skills: ['Logística'],
    candidates: [
      { id: 'A12', distance: '1,2 km', parts: { skills: 1, proximity: 0.76, availability: 1, history: 0.8 } },
      { id: 'B07', distance: '2,1 km', parts: { skills: 1, proximity: 0.58, availability: 1, history: 0.5 } },
      { id: 'C33', distance: '3,4 km', parts: { skills: 0.5, proximity: 0.32, availability: 1, history: 0.2 } },
    ],
  },
  {
    id: 'a-2',
    title: 'Jornada de apoyo psicosocial en albergue',
    place: 'Bosa, Bogotá',
    when: 'Dom 1 nov · 9:00–13:00',
    slots: 2,
    skills: ['Psicosocial', 'Cuidado'],
    candidates: [],
  },
]
