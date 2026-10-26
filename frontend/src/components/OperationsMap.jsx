import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import './OperationsMap.css'

const BOGOTA = [4.65, -74.1]

/**
 * Leaflet + OpenStreetMap map of GeoJSON points. `selectedId` highlights a point and pans to it.
 * Markers are divIcons (no image assets) and are keyboard-focusable; `onSelect` fires on click or Enter.
 */
export default function OperationsMap({ data, selectedId, onSelect, label }) {
  const container = useRef(null)
  const map = useRef(null)
  const markers = useRef({})

  useEffect(() => {
    const instance = L.map(container.current, { center: BOGOTA, zoom: 12, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instance)

    data.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates
      const { id, name } = feature.properties
      const marker = L.marker([lat, lng], {
        title: name,
        alt: name,
        icon: L.divIcon({ className: 'opmap__pin', html: '<span></span>', iconSize: [28, 28] }),
      }).addTo(instance)
      marker.on('click', () => onSelect?.(id))
      markers.current[id] = marker
    })

    map.current = instance
    const pins = markers.current
    return () => {
      instance.remove()
      map.current = null
      Object.keys(pins).forEach((id) => delete pins[id])
    }
    // The map is built once; later selection changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    Object.entries(markers.current).forEach(([id, marker]) => {
      marker.getElement()?.classList.toggle('is-selected', id === selectedId)
    })
    const marker = markers.current[selectedId]
    if (marker && map.current) map.current.panTo(marker.getLatLng())
  }, [selectedId])

  return <div ref={container} className="opmap" role="region" aria-label={label} />
}
