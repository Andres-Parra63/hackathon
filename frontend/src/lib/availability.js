// Weekly availability: grid keys like 'Sáb-Mañana' <-> API rows { dia_semana: 1–7, franja }.
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const SLOTS = ['Mañana', 'Tarde', 'Noche']
const SLOT_API = { Mañana: 'manana', Tarde: 'tarde', Noche: 'noche' }
const SLOT_UI = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }

export const toGrid = (rows = []) =>
  Object.fromEntries(rows.map((r) => [`${DAYS[r.dia_semana - 1]}-${SLOT_UI[r.franja]}`, true]))

export const fromGrid = (grid) =>
  Object.entries(grid)
    .filter(([, on]) => on)
    .map(([key]) => {
      const [day, slot] = key.split('-')
      return { dia_semana: DAYS.indexOf(day) + 1, franja: SLOT_API[slot] }
    })
