// Fictional public operation points as GeoJSON (RFC 7946: coordinates are [longitude, latitude]).
// Only safe points appear here (acopio, albergue, banco de sangre, comedor): never rescue tasks.
export const PUBLIC_POINTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.1469, 4.6285] },
      properties: { id: 'pt-1', name: 'Centro de acopio Kennedy', kind: 'Centro de acopio', address: 'Cra. 78 K # 38 A Sur, Kennedy', hours: '8:00 – 18:00' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.1850, 4.6140] },
      properties: { id: 'pt-2', name: 'Albergue Colegio San José', kind: 'Albergue', address: 'Calle 38 Sur # 72 – 15, Kennedy', hours: '24 horas' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.0695, 4.6486] },
      properties: { id: 'pt-3', name: 'Banco de sangre comunitario', kind: 'Banco de sangre', address: 'Cra. 13 # 52 – 10, Chapinero', hours: '9:00 – 16:00' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-74.1142, 4.7010] },
      properties: { id: 'pt-4', name: 'Comedor comunitario Engativá', kind: 'Comedor', address: 'Cl. 72 # 90 – 20, Engativá', hours: '11:00 – 15:00' },
    },
  ],
}
