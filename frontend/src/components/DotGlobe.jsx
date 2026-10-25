import { useEffect, useRef } from 'react'
import { FINE_POINTER, REDUCED } from '../motion/gsap'
import { BOGOTA, CITIES, COLOMBIA, WORLD } from './globeGeo'
import './DotGlobe.css'

const RAD = Math.PI / 180
// Colombia is drawn enlarged around its centroid so it reads at a glance without growing the sphere.
const CENTER = [4.3, -73.6]
const ENLARGE = 2.3
const LIFT = 1.045 // the enlarged country floats this far above the surface (3D relief)
const RING_DEG = 4.4 // call radius around Bogotá, in enlarged degrees (stylized, not to scale)
const FRONT_LON = CENTER[1] + 4 // view longitude that puts Colombia slightly left of center

const enlarge = ([lat, lon]) => [CENTER[0] + (lat - CENTER[0]) * ENLARGE, CENTER[1] + (lon - CENTER[1]) * ENLARGE]

function insidePolygon(lat, lon, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i]
    const [yj, xj] = poly[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Small deterministic PRNG so dots land in the same places on every render.
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Unit vector for a [lat, lon] pair (x toward lon 0, z toward the north pole).
const toVec = ([lat, lon]) => {
  const p = lat * RAD
  const l = lon * RAD
  return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]
}

const pack = (points) => {
  const arr = new Float32Array(points.length * 3)
  points.forEach((pt, i) => arr.set(toVec(pt), i * 3))
  return arr
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180

function slerp(a, b, t) {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const omega = Math.acos(dot)
  if (omega < 1e-6) return a
  const s = Math.sin(omega)
  const ka = Math.sin((1 - t) * omega) / s
  const kb = Math.sin(t * omega) / s
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb]
}

/** Builds every layer once: lattice, graticule, world land, the enlarged country, volunteers, arcs. */
function buildGeometry() {
  const colombiaBig = COLOMBIA.map(enlarge)

  const lattice = []
  const n = 1400
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n
    lattice.push([Math.asin(y) / RAD, ((i * 137.508) % 360) - 180])
  }

  const graticule = []
  for (let lat = -60; lat <= 60; lat += 30) for (let lon = -180; lon < 180; lon += 2) graticule.push([lat, lon])
  for (let lon = -180; lon < 180; lon += 30) for (let lat = -84; lat <= 84; lat += 2) graticule.push([lat, lon])

  // World land at 1.6°, leaving room for the enlarged country.
  const land = []
  for (let lat = -56; lat <= 83; lat += 1.6) {
    for (let lon = -180; lon < 180; lon += 1.6 / Math.max(0.35, Math.cos(lat * RAD))) {
      if (insidePolygon(lat, lon, colombiaBig)) continue
      if (WORLD.some((poly) => insidePolygon(lat, lon, poly))) land.push([lat, lon])
    }
  }

  const country = []
  for (let lat = -4.4; lat <= 12.6; lat += 0.42) {
    for (let lon = -79.2; lon <= -66.6; lon += 0.42) if (insidePolygon(lat, lon, COLOMBIA)) country.push(enlarge([lat, lon]))
  }

  const outline = []
  COLOMBIA.forEach((a, i) => {
    const b = COLOMBIA[(i + 1) % COLOMBIA.length]
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.22))
    for (let s = 0; s < steps; s++) outline.push(enlarge([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps]))
  })

  const bogota = enlarge(BOGOTA)
  const ring = []
  for (let a = 0; a <= 360; a += 4) {
    ring.push([bogota[0] + RING_DEG * Math.sin(a * RAD), bogota[1] + (RING_DEG * Math.cos(a * RAD)) / Math.cos(bogota[0] * RAD)])
  }

  const rand = mulberry32(17)
  const volunteers = []
  while (volunteers.length < 46) {
    const r = Math.sqrt(rand()) * RING_DEG * 1.9
    const t = rand() * Math.PI * 2
    const p = [bogota[0] + r * Math.sin(t), bogota[1] + r * Math.cos(t)]
    if (!insidePolygon(p[0], p[1], colombiaBig)) continue
    volunteers.push({ v: toVec(p), match: r < RING_DEG, angle: Math.atan2(Math.sin(t), Math.cos(t)), phase: rand() })
  }

  const from = toVec(bogota)
  const arcs = CITIES.map((city, i) => {
    const to = toVec(enlarge(city.at))
    const omega = Math.acos(Math.min(1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]))
    const height = 0.04 + omega * 0.55
    const pts = []
    for (let s = 0; s <= 28; s++) {
      const t = s / 28
      const v = slerp(from, to, t)
      const k = LIFT + height * Math.sin(Math.PI * t)
      pts.push([v[0] * k, v[1] * k, v[2] * k])
    }
    return { pts, to, phase: i / CITIES.length }
  })

  const stars = []
  for (let i = 0; i < 90; i++) stars.push({ x: rand(), y: rand(), r: 0.4 + rand() * 0.9, phase: rand() * 6.28 })

  return {
    lattice: pack(lattice),
    graticule: pack(graticule),
    land: pack(land),
    country: pack(country),
    outline: pack(outline),
    ring: ring.map(toVec),
    bogota: toVec(bogota),
    label: toVec(enlarge([12.9, -81.2])),
    volunteers,
    arcs,
    stars,
  }
}

const cssVar = (el, name, fallback) => getComputedStyle(el).getPropertyValue(name).trim() || fallback

/**
 * Rotating dot-matrix globe. Colombia floats enlarged above the surface with Bogotá's call radius,
 * a radar sweep, volunteers that ping as it passes, and call arcs to other cities. Spins and slows
 * down while Colombia faces the viewer; drag to spin it (inertia). `control.current.focus` (0–1,
 * driven by scroll) turns it to face Colombia. Static with reduced motion; paused off screen.
 */
export default function DotGlobe({ label, hud, control, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const geo = buildGeometry()
    const colors = {
      dot: cssVar(canvas, '--text-strong', '#ebf1ff'),
      muted: cssVar(canvas, '--text-muted', '#8f94a0'),
      brand: cssVar(canvas, '--brand-primary-strong', '#5c9dff'),
      fill: cssVar(canvas, '--brand-primary', '#0a63e6'),
      mono: cssVar(canvas, '--font-mono', 'monospace'),
    }
    const reduced = window.matchMedia(REDUCED).matches
    const finePointer = window.matchMedia(FINE_POINTER).matches

    let size = 0
    let dpr = 1
    let frame = 0
    let visible = true
    let last = 0
    const view = { lon: FRONT_LON - 70, lat: 12, tilt: 0, vel: 0 }
    const pointer = { x: 0, y: 0 }
    const drag = { active: false, x: 0, t: 0 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = rect.width
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
    }

    const draw = (time) => {
      const R = size * 0.4
      const cx = size / 2
      const cy = size / 2
      const u = Math.max(0.7, size / 640)
      const lon0 = view.lon * RAD
      const lat0 = (view.lat + view.tilt) * RAD
      const cL = Math.cos(lon0)
      const sL = Math.sin(lon0)
      const cP = Math.cos(lat0)
      const sP = Math.sin(lat0)
      const t = reduced ? 0 : time

      // World vector -> screen. Z > 0 faces the viewer.
      const P = { x: 0, y: 0, z: 0 }
      const project = (x, y, z, k = 1) => {
        const x1 = x * cL + y * sL
        const y1 = -x * sL + y * cL
        P.x = cx + R * k * y1
        P.y = cy - R * k * (cP * z - sP * x1)
        P.z = sP * z + cP * x1
        return P
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      // Stars outside the sphere
      ctx.fillStyle = colors.dot
      for (const s of geo.stars) {
        const sx = s.x * size
        const sy = s.y * size
        if (Math.hypot(sx - cx, sy - cy) < R * 1.25) continue
        ctx.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t / 900 + s.phase))
        ctx.fillRect(sx, sy, s.r * u, s.r * u)
      }

      // Atmosphere and sheen
      ctx.globalAlpha = 1
      // Glow ring outside the rim only (even-odd keeps the sphere itself dark)
      const atmo = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.22)
      atmo.addColorStop(0, 'rgba(10, 99, 230, 0.3)')
      atmo.addColorStop(1, 'rgba(10, 99, 230, 0)')
      ctx.fillStyle = atmo
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2)
      ctx.arc(cx, cy, R, 0, Math.PI * 2, true)
      ctx.fill('evenodd')
      const sheen = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx, cy, R)
      sheen.addColorStop(0, 'rgba(92, 157, 255, 0.12)')
      sheen.addColorStop(0.55, 'rgba(10, 30, 70, 0.14)')
      sheen.addColorStop(1, 'rgba(10, 99, 230, 0.12)')
      ctx.fillStyle = sheen
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()

      // Dot layers. `back` > 0 keeps a faint see-through hemisphere (holographic look).
      const dots = (arr, color, px, front, depth, back = 0, k = 1) => {
        ctx.fillStyle = color
        const half = (px * u) / 2
        for (let i = 0; i < arr.length; i += 3) {
          const p = project(arr[i], arr[i + 1], arr[i + 2], k)
          const a = p.z > 0 ? front + depth * p.z : back * (1 + p.z)
          if (a <= 0.01) continue
          ctx.globalAlpha = a
          ctx.fillRect(p.x - half, p.y - half, half * 2, half * 2)
        }
      }

      dots(geo.lattice, colors.dot, 1.3, 0.05, 0.16, 0.035)
      dots(geo.graticule, colors.brand, 1, 0.04, 0.14, 0.03)
      dots(geo.land, colors.dot, 1.9, 0.1, 0.32, 0.05)

      // Enlarged Colombia: shadow on the surface, short "walls", then the raised top layer.
      dots(geo.country, colors.fill, 2.2, 0.12, 0.25)
      ctx.strokeStyle = colors.brand
      ctx.lineWidth = 1 * u
      for (let i = 0; i < geo.outline.length; i += 6) {
        const a = project(geo.outline[i], geo.outline[i + 1], geo.outline[i + 2], 1)
        if (a.z <= 0) continue
        const ax = a.x
        const ay = a.y
        const z = a.z
        const b = project(geo.outline[i], geo.outline[i + 1], geo.outline[i + 2], LIFT)
        ctx.globalAlpha = 0.25 * z
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
      dots(geo.country, colors.dot, 2.3, 0.3, 0.6, 0, LIFT)
      dots(geo.outline, colors.brand, 2.2, 0.45, 0.55, 0, LIFT)

      const bog = project(...geo.bogota, LIFT)
      const bx = bog.x
      const by = bog.y
      const facing = bog.z

      if (facing > 0) {
        // Call radius + radar sweep
        const sweep = (t / 1300) % (Math.PI * 2)
        const ringPts = geo.ring.map((v) => {
          const p = project(v[0], v[1], v[2], LIFT)
          return [p.x, p.y]
        })
        ctx.globalAlpha = 0.9 * facing
        ctx.strokeStyle = colors.brand
        ctx.lineWidth = 1.2 * u
        ctx.setLineDash([3 * u, 4 * u])
        ctx.lineDashOffset = -t / 60
        ctx.beginPath()
        ringPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 0.07 * facing
        ctx.fillStyle = colors.brand
        ctx.fill()
        if (!reduced) {
          // Wedge trailing the sweep line, fading in steps.
          const total = ringPts.length - 1
          const head = Math.round((sweep / (Math.PI * 2)) * total)
          for (let step = 0; step < 14; step++) {
            const i0 = (head - step - 1 + total) % total
            const i1 = (head - step + total) % total
            ctx.globalAlpha = 0.22 * (1 - step / 14) * facing
            ctx.beginPath()
            ctx.moveTo(bx, by)
            ctx.lineTo(...ringPts[i0])
            ctx.lineTo(...ringPts[i1])
            ctx.closePath()
            ctx.fill()
          }
        }

        // Volunteers: inside the radius in blue (they ping as the sweep passes), outside in grey.
        for (const v of geo.volunteers) {
          const p = project(v.v[0], v.v[1], v.v[2], LIFT)
          if (p.z <= 0) continue
          let ping = 0
          if (v.match && !reduced) {
            // Ring points and volunteers share the same angle parameter: ping right after the sweep passes.
            const behind = ((((sweep - v.angle) / RAD) % 360) + 360) % 360
            ping = Math.max(0, 1 - behind / 50)
          }
          ctx.globalAlpha = (v.match ? 0.85 : 0.5) * p.z
          ctx.fillStyle = v.match ? colors.brand : colors.muted
          ctx.beginPath()
          ctx.arc(p.x, p.y, (v.match ? 2.6 + ping * 2.2 : 1.9) * u, 0, Math.PI * 2)
          ctx.fill()
          if (ping > 0.05) {
            ctx.globalAlpha = 0.5 * ping * p.z
            ctx.strokeStyle = colors.brand
            ctx.lineWidth = 1 * u
            ctx.beginPath()
            ctx.arc(p.x, p.y, (4 + (1 - ping) * 9) * u, 0, Math.PI * 2)
            ctx.stroke()
          }
        }
      }

      // Call arcs from Bogotá with a travelling pulse.
      for (const arc of geo.arcs) {
        const pts = arc.pts.map((q) => {
          const p = project(q[0], q[1], q[2], 1)
          return [p.x, p.y, p.z]
        })
        ctx.lineWidth = 1.4 * u
        ctx.strokeStyle = colors.brand
        for (let i = 1; i < pts.length; i++) {
          const z = Math.min(pts[i - 1][2], pts[i][2])
          if (z <= -0.05) continue
          ctx.globalAlpha = 0.55 * Math.max(0, z + 0.05)
          ctx.beginPath()
          ctx.moveTo(pts[i - 1][0], pts[i - 1][1])
          ctx.lineTo(pts[i][0], pts[i][1])
          ctx.stroke()
        }
        if (!reduced) {
          const k = ((t / 2400 + arc.phase) % 1.35) / 1
          if (k <= 1) {
            const idx = k * (pts.length - 1)
            const i = Math.floor(idx)
            const f = idx - i
            const a = pts[i]
            const b = pts[Math.min(i + 1, pts.length - 1)]
            const z = a[2] + (b[2] - a[2]) * f
            if (z > 0) {
              const x = a[0] + (b[0] - a[0]) * f
              const y = a[1] + (b[1] - a[1]) * f
              const glow = ctx.createRadialGradient(x, y, 0, x, y, 9 * u)
              glow.addColorStop(0, 'rgba(235, 241, 255, 0.95)')
              glow.addColorStop(0.35, 'rgba(92, 157, 255, 0.6)')
              glow.addColorStop(1, 'rgba(92, 157, 255, 0)')
              ctx.globalAlpha = z
              ctx.fillStyle = glow
              ctx.beginPath()
              ctx.arc(x, y, 9 * u, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
        // City node
        const end = project(arc.to[0] * LIFT, arc.to[1] * LIFT, arc.to[2] * LIFT, 1)
        if (end.z > 0) {
          ctx.globalAlpha = 0.9 * end.z
          ctx.fillStyle = colors.dot
          ctx.fillRect(end.x - 1.6 * u, end.y - 1.6 * u, 3.2 * u, 3.2 * u)
        }
      }

      // Operation point in Bogotá with an expanding pulse.
      if (facing > 0) {
        if (!reduced) {
          const k = (t / 2000) % 1
          ctx.globalAlpha = 0.6 * (1 - k) * facing
          ctx.strokeStyle = colors.dot
          ctx.lineWidth = 1.5 * u
          ctx.beginPath()
          ctx.arc(bx, by, (5 + 24 * k) * u, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.globalAlpha = facing
        ctx.fillStyle = colors.dot
        ctx.beginPath()
        ctx.arc(bx, by, 4.5 * u, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = colors.brand
        ctx.lineWidth = 2 * u
        ctx.stroke()
      }

      // Rim
      ctx.globalAlpha = 0.22
      ctx.strokeStyle = colors.brand
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      // HUD ring: rotating dashes and tick marks.
      const spin = reduced ? 0 : t / 30000
      ctx.globalAlpha = 0.28
      ctx.strokeStyle = colors.dot
      ctx.setLineDash([2 * u, 10 * u])
      ctx.lineDashOffset = -t / 40
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      for (let deg = 0; deg < 360; deg += 5) {
        const a = deg * RAD + spin
        const long = deg % 45 === 0
        const r0 = R * 1.15
        const r1 = r0 + (long ? 10 : 4) * u
        ctx.globalAlpha = long ? 0.5 : 0.18
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
        ctx.stroke()
      }

      // Labels: coordinates readout and the Bogotá / Colombia callouts.
      ctx.font = `400 ${Math.round(10.5 * u)}px ${colors.mono}`
      ctx.textBaseline = 'middle'
      const lonText = `${hud.lon} ${Math.abs(wrap180(view.lon)).toFixed(1).replace('.', ',')}°${wrap180(view.lon) < 0 ? hud.west : hud.east}`
      const latText = `${hud.lat} ${Math.abs(view.lat + view.tilt).toFixed(1).replace('.', ',')}°${view.lat + view.tilt < 0 ? hud.south : hud.north}`
      ctx.globalAlpha = 0.6
      ctx.fillStyle = colors.muted
      ctx.textAlign = 'center'
      ctx.fillText(`${lonText}  ·  ${latText}`, cx, cy - R * 1.28)

      if (facing > 0.25) {
        const a = smoothstep(0.25, 0.65, facing)
        const cityFont = `500 ${Math.round(11.5 * u)}px ${colors.mono}`
        const coordFont = `400 ${Math.round(10 * u)}px ${colors.mono}`
        const widthOf = (city, coords) => {
          ctx.font = cityFont
          const w = ctx.measureText(city).width
          ctx.font = coordFont
          return Math.max(w, ctx.measureText(coords).width) + 8 * u
        }
        // Callout to the right of Bogotá; on narrow globes the short form is used so it always fits.
        const long = bx + 52 * u + widthOf(hud.city, hud.coords) < size - 4
        const city = long ? hud.city : hud.cityShort
        const coords = long ? hud.coords : hud.coordsShort
        const textW = widthOf(city, coords)
        const dir = bx + 52 * u + textW < size - 4 ? 1 : -1
        const lx = bx + dir * 52 * u
        const ly = by - 62 * u
        ctx.globalAlpha = 0.85 * a
        ctx.strokeStyle = colors.dot
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(bx + dir * 5 * u, by - 5 * u)
        ctx.lineTo(lx, ly)
        ctx.lineTo(lx + dir * textW, ly)
        ctx.stroke()
        ctx.textAlign = dir > 0 ? 'left' : 'right'
        const tx = lx + dir * 4 * u
        ctx.fillStyle = colors.dot
        ctx.font = cityFont
        ctx.fillText(city, tx, ly - 10 * u)
        ctx.globalAlpha = 0.7 * a
        ctx.fillStyle = colors.muted
        ctx.font = coordFont
        ctx.fillText(coords, tx, ly + 11 * u)

        const c = project(...geo.label, LIFT)
        if (c.z > 0) {
          ctx.globalAlpha = 0.9 * a
          ctx.fillStyle = colors.brand
          ctx.textAlign = 'right'
          ctx.font = `500 ${Math.round(12 * u)}px ${colors.mono}`
          ctx.fillText(hud.country, c.x, c.y)
          ctx.globalAlpha = 0.6 * a
          ctx.fillStyle = colors.muted
          ctx.font = `400 ${Math.round(9.5 * u)}px ${colors.mono}`
          ctx.fillText(hud.enlarged, c.x, c.y + 14 * u)
        }
      }
      ctx.globalAlpha = 1
    }

    const tick = (time) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (time - (last || time)) / 1000)
      last = time
      if (!visible) return
      const focus = control?.current?.focus ?? 0
      const toFront = wrap180(FRONT_LON - view.lon)
      // Spin eastward, easing to a crawl while Colombia faces the viewer, then picking up again.
      const auto = 10 * (0.1 + 0.9 * smoothstep(10, 80, Math.abs(toFront))) * (1 - focus)
      if (!drag.active) {
        view.vel *= Math.pow(0.04, dt) // inertia after a drag
        view.lon += (auto + view.vel) * dt
        view.lon += toFront * Math.min(1, dt * 3) * focus
      }
      view.tilt += (-pointer.y * 8 - view.tilt) * Math.min(1, dt * 3)
      draw(time)
    }

    const onPointerMove = (e) => {
      pointer.x = e.clientX / window.innerWidth - 0.5
      pointer.y = e.clientY / window.innerHeight - 0.5
    }

    // Drag to spin (mouse, pen or touch); vertical page scroll keeps working on touch (touch-action: pan-y).
    const onDown = (e) => {
      drag.active = true
      drag.x = e.clientX
      drag.t = performance.now()
      canvas.setPointerCapture(e.pointerId)
      canvas.classList.add('is-dragging')
    }
    const onDrag = (e) => {
      if (!drag.active) return
      const now = performance.now()
      const dx = e.clientX - drag.x
      const delta = (-dx / size) * 180
      view.lon += delta
      view.vel = (delta / Math.max(1, now - drag.t)) * 1000 * 0.6
      drag.x = e.clientX
      drag.t = now
      if (reduced) draw(0)
    }
    const onUp = () => {
      drag.active = false
      canvas.classList.remove('is-dragging')
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (reduced) draw(0)
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onDrag)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)

    if (reduced) {
      view.lon = FRONT_LON
      document.fonts.ready.then(() => draw(0))
    } else {
      frame = requestAnimationFrame(tick)
      if (finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onDrag)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [control, hud])

  return (
    <div className={`globe ${className}`}>
      <canvas ref={canvasRef} className="globe__canvas" role="img" aria-label={label} />
    </div>
  )
}
