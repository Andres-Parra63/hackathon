// Approximate centers of Bogotá localities (~1 km). Used to place a volunteer's zone, an emergency
// or an operation point without asking for an exact address on a map.
export const PLACES = [
  { name: 'Chapinero', lat: 4.6486, lon: -74.0634 },
  { name: 'Usaquén', lat: 4.7030, lon: -74.0300 },
  { name: 'Teusaquillo', lat: 4.6400, lon: -74.0800 },
  { name: 'Santa Fe', lat: 4.6100, lon: -74.0700 },
  { name: 'La Candelaria', lat: 4.5970, lon: -74.0730 },
  { name: 'Barrios Unidos', lat: 4.6670, lon: -74.0750 },
  { name: 'Engativá', lat: 4.7010, lon: -74.1140 },
  { name: 'Suba', lat: 4.7400, lon: -74.0830 },
  { name: 'Fontibón', lat: 4.6730, lon: -74.1420 },
  { name: 'Kennedy', lat: 4.6285, lon: -74.1469 },
  { name: 'Bosa', lat: 4.6140, lon: -74.1850 },
  { name: 'Puente Aranda', lat: 4.6150, lon: -74.1100 },
  { name: 'Los Mártires', lat: 4.6050, lon: -74.0870 },
  { name: 'Antonio Nariño', lat: 4.5900, lon: -74.1000 },
  { name: 'Rafael Uribe Uribe', lat: 4.5700, lon: -74.1150 },
  { name: 'San Cristóbal', lat: 4.5550, lon: -74.0850 },
  { name: 'Tunjuelito', lat: 4.5750, lon: -74.1300 },
  { name: 'Ciudad Bolívar', lat: 4.5400, lon: -74.1500 },
  { name: 'Usme', lat: 4.4800, lon: -74.1200 },
]

export const MUNICIPALITY = 'Bogotá, D.C.'
export const PLACE_NAMES = PLACES.map((p) => p.name)
export const placeByName = (name) => PLACES.find((p) => p.name === name)

/** Nearest locality to a point (to show a volunteer's saved zone by name). */
export const nearestPlace = (lat, lon) =>
  PLACES.reduce((best, p) =>
    (p.lat - lat) ** 2 + (p.lon - lon) ** 2 < (best.lat - lat) ** 2 + (best.lon - lon) ** 2 ? p : best,
  )
