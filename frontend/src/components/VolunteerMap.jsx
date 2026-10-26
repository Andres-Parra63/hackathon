import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { KINDS } from '../data/volunteerMap'
import es from '../i18n/es'
import Icon from './Icon'
import './VolunteerMap.css'

const t = es.volunteerMap
const BOGOTA = [4.65, -74.1]

// Marker diameter grows with the people in the cell; `compact` maps (dashboard card) use smaller dots.
const clusterSize = (total, compact) =>
  compact ? Math.round(Math.min(26, 12 + Math.sqrt(total) * 5)) : Math.round(Math.min(46, 20 + Math.sqrt(total) * 8))

/**
 * Real map (Leaflet + OpenStreetMap) of a call: its operation point, the convocation radius and the
 * volunteers grouped by ~1 km cell. Never shows individual volunteers or exact addresses.
 * `highlight` lists the kinds kept at full opacity; `children` are overlays (filters, legend).
 */
export default function VolunteerMap({ call, clusters, points = [], highlight = KINDS, emergency = false, controls = false, compact = false, label, className = '', children }) {
  const container = useRef(null)
  const map = useRef(null)
  const layers = useRef(null)
  const markers = useRef([])
  const bounds = useRef(null)

  // The map is created once; data changes only redraw the layers.
  useEffect(() => {
    const instance = L.map(container.current, {
      center: BOGOTA,
      zoom: 12,
      zoomControl: false,
      zoomSnap: 0.25, // fit the radius tightly in small cards
      scrollWheelZoom: false,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(instance)
    layers.current = L.layerGroup().addTo(instance)
    map.current = instance
    // Cards resize while the page reveals: keep the tiles in sync with the container.
    const observer = new ResizeObserver(() => instance.invalidateSize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    const group = layers.current
    group.clearLayers()
    markers.current = []
    if (!call) return

    const center = [Number(call.lat), Number(call.lon)]
    const circle = L.circle(center, {
      radius: Number(call.radio_km) * 1000,
      className: `vmap__radius ${emergency ? 'is-emergency' : ''}`,
      interactive: false,
    }).addTo(group)
    bounds.current = circle.getBounds()
    instance.fitBounds(bounds.current, { padding: [16, 16] })

    clusters.forEach((cell) => {
      const size = clusterSize(cell.total, compact)
      const text = t.cluster(cell.place, cell.total, cell.counts.match)
      const marker = L.marker([cell.lat, cell.lon], {
        title: text,
        keyboard: true,
        icon: L.divIcon({
          className: `vmap__cluster vmap__cluster--${cell.kind}`,
          html: `<span style="--size:${size}px">${cell.total > 1 && !compact ? cell.total : ''}</span>`,
          iconSize: [size, size],
        }),
      })
        .bindTooltip(text, { direction: 'top', offset: [0, -size / 2], className: 'vmap__tip' })
        .addTo(group)
      marker.getElement()?.setAttribute('aria-label', text)
      markers.current.push({ marker, kind: cell.kind })
    })

    points
      .filter((point) => point.id !== call.punto_operacion_id)
      .forEach((point) => {
        const text = t.point(es.enums.pointType[point.tipo] ?? point.tipo, point.nombre)
        L.marker([Number(point.lat), Number(point.lon)], {
          title: text,
          icon: L.divIcon({ className: 'vmap__site vmap__site--secondary', html: '<span></span>', iconSize: [18, 18] }),
        })
          .bindTooltip(text, { direction: 'top', offset: [0, -10], className: 'vmap__tip' })
          .addTo(group)
      })

    const mainText = t.mainPoint(call.direccion || t.noAddress, emergency)
    L.marker(center, {
      title: mainText,
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: `vmap__site ${emergency ? 'is-emergency' : ''}`,
        html: '<i aria-hidden="true"></i><span></span>',
        iconSize: [26, 26],
      }),
    })
      .bindTooltip(mainText, { direction: 'top', offset: [0, -14], className: 'vmap__tip' })
      .addTo(group)
  }, [call, clusters, points, emergency, compact])

  useEffect(() => {
    markers.current.forEach(({ marker, kind }) =>
      marker.getElement()?.classList.toggle('is-dimmed', !highlight.includes(kind)),
    )
  }, [highlight, clusters])

  const zoomBy = (delta) => map.current?.setZoom(map.current.getZoom() + delta)
  const recenter = () => bounds.current && map.current?.fitBounds(bounds.current, { padding: [16, 16] })

  return (
    <div className={`vmap ${compact ? 'vmap--compact' : ''} ${className}`}>
      <div ref={container} className="vmap__canvas" role="region" aria-label={label} />
      {controls && (
        <div className="vmap__controls">
          <button type="button" aria-label={t.zoomIn} onClick={() => zoomBy(1)}>
            <Icon name="plus" size={18} />
          </button>
          <button type="button" aria-label={t.zoomOut} onClick={() => zoomBy(-1)}>
            <Icon name="minus" size={18} />
          </button>
          <button type="button" aria-label={t.locate} onClick={recenter}>
            <Icon name="locate" size={18} />
          </button>
        </div>
      )}
      {children}
    </div>
  )
}
