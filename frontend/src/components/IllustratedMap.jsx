import baseMap from '../assets/map/base-web.svg'
import heroRadius from '../assets/map/hero/radius-5km.svg'
import heroOther from '../assets/map/hero/dot-other.svg'
import heroUnavailable from '../assets/map/hero/dot-unavailable.svg'
import heroMatch from '../assets/map/hero/dot-match.svg'
import heroPulse from '../assets/map/hero/pulse.svg'
import panelRadius from '../assets/map/panel/radius-5km.svg'
import panelOther from '../assets/map/panel/dot-other.svg'
import panelUnavailable from '../assets/map/panel/dot-unavailable.svg'
import panelMatch from '../assets/map/panel/dot-match.svg'
import panelPulse from '../assets/map/panel/pulse.svg'
import liveRadius from '../assets/map/live/radius-5km.svg'
import liveOutside from '../assets/map/live/dot-outside.svg'
import liveOther from '../assets/map/live/dot-other.svg'
import liveUnavailable from '../assets/map/live/dot-unavailable.svg'
import liveMatch from '../assets/map/live/dot-match.svg'
import livePulse from '../assets/map/live/pulse.svg'
import { MAP_LABELS, MAP_SCENES } from '../data/mapScenes'
import Icon from './Icon'
import './IllustratedMap.css'

// Marker artwork per scene: each Figma frame exports its own sizes and stroke widths.
const ART = {
  hero: { radius: heroRadius, pulse: heroPulse, other: heroOther, unavailable: heroUnavailable, match: heroMatch },
  panel: { radius: panelRadius, pulse: panelPulse, other: panelOther, unavailable: panelUnavailable, match: panelMatch },
  live: {
    radius: liveRadius,
    pulse: livePulse,
    outside: liveOutside,
    other: liveOther,
    unavailable: liveUnavailable,
    match: liveMatch,
  },
}

// Draw order: farthest/least relevant first so the matching volunteers sit on top.
const LAYERS = ['outside', 'other', 'unavailable', 'match']

// Places an SVG by the center of its Figma box, keeping the SVG's own width/height.
const centered = (left, top, box) => ({ left: left + box / 2, top: top + box / 2 })

/**
 * Mapa ilustrativo (Figma "Mapa/Base web"): not real cartography, approximate points only.
 * `highlight` dims the marker kinds that do not match the active filter.
 */
export default function IllustratedMap({
  scene,
  alt,
  chipLabel,
  highlight = LAYERS,
  zoom = 1,
  className = '',
  children,
}) {
  const data = MAP_SCENES[scene]
  const art = ART[scene]
  const { center } = data
  const origin = `${center.left + center.size / 2}px ${center.top + center.size / 2}px`

  return (
    <div className={`imap imap--${scene} ${className}`} role="img" aria-label={alt}>
      <div className="imap__layer" style={{ transform: `scale(${zoom})`, transformOrigin: origin }}>
        {data.base.map((tile) => (
          <div key={tile.top} className="imap__tile" style={{ left: tile.left, top: tile.top }}>
            <img src={baseMap} width="1000" height="760" alt="" />
            {tile.labels &&
              MAP_LABELS.map((label) => (
                <span
                  key={label.text}
                  className={`imap__label ${label.river ? 'imap__label--river' : ''}`}
                  style={{ left: label.left, top: label.top }}
                  aria-hidden="true"
                >
                  {label.text}
                </span>
              ))}
          </div>
        ))}
        <img
          className="imap__abs"
          src={art.radius}
          alt=""
          style={centered(data.radius.left, data.radius.top, data.radius.size)}
        />
        {LAYERS.filter((kind) => data.markers[kind]).map((kind) => {
          const { box, points } = data.markers[kind]
          const dim = !highlight.includes(kind)
          return points.map(([left, top]) => (
            <img
              key={`${kind}-${left}-${top}`}
              className={`imap__abs imap__dot ${dim ? 'is-dim' : ''}`}
              src={art[kind]}
              alt=""
              style={centered(left, top, box)}
            />
          ))
        })}
        <img className="imap__abs imap__pulse" src={art.pulse} alt="" style={centered(data.pulse.left, data.pulse.top, data.pulse.size)} />
        <span
          className={`imap__center ${center.raised ? 'is-raised' : ''}`}
          style={{ left: center.left, top: center.top, width: center.size, height: center.size, borderWidth: center.border }}
        >
          <Icon name="building" size={center.icon} />
        </span>
        {data.chip && chipLabel && (
          <span className="imap__chip" style={{ left: data.chip.left, top: data.chip.top }}>
            {chipLabel}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
