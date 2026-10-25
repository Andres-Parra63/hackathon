import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../motion/gsap'
import Badge from './Badge'
import './LiveTicker.css'

const SPEED = 46 // px per second
const SEED = 12 // events on screen at once (wider than any viewport)
const REDUCED_EVERY = 4000 // ms between new events when motion is reduced
// How often each kind of event shows up in the simulated feed.
const WEIGHTS = { call: 3, accepted: 3, checkin: 2, profile: 2, activity: 1.2, full: 1, emergency: 0.6 }

const pick = (list) => list[Math.floor(Math.random() * list.length)]
let sequence = 0

function makeEvent(copy, at = new Date()) {
  const kinds = Object.keys(WEIGHTS)
  let roll = Math.random() * kinds.reduce((sum, k) => sum + WEIGHTS[k], 0)
  const kind = kinds.find((k) => (roll -= WEIGHTS[k]) <= 0) ?? kinds[0]
  const type = copy.types[kind]
  const n = 3 + Math.floor(Math.random() * 10)
  const text = type.text
    .replace('{barrio}', pick(copy.barrios))
    .replace('{skill}', pick(copy.skills))
    .replace('{point}', pick(copy.points))
    .replace('{n}', n)
    .replace('{m}', 1 + Math.floor(Math.random() * n))
    .replace('{id}', `${pick('ABCDEFGHJK')}${10 + Math.floor(Math.random() * 89)}`)
  sequence += 1
  return { id: sequence, kind, tag: type.tag, tone: type.tone, text, at }
}

const clock = (date) =>
  date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Bogota' })

/**
 * Simulated live activity feed. With motion it scrolls continuously (GSAP ticker): each event that
 * leaves on the left is replaced by a freshly generated one on the right, and the counter ticks up.
 * The button pauses both movement and new events (WCAG 2.2.2); hovering the feed eases it to a stop.
 * With reduced motion it does not scroll: new events fade in at the front every few seconds.
 */
export default function LiveTicker({ copy }) {
  const [items, setItems] = useState(() => {
    const now = Date.now()
    return Array.from({ length: SEED }, (_, i) => makeEvent(copy, new Date(now - (SEED - i) * 7000)))
  })
  const [count, setCount] = useState(128)
  const [paused, setPaused] = useState(false)
  const [reduced] = useState(prefersReducedMotion)
  const track = useRef(null)
  const x = useRef(0)
  const speed = useRef({ v: SPEED })
  const shift = useRef(0)
  const hover = useRef(false)

  // Continuous scroll. When the first event has fully left the viewport it is swapped for a new one.
  useEffect(() => {
    if (reduced) return undefined
    const tick = (_time, delta) => {
      const el = track.current
      if (!el) return
      x.current -= (speed.current.v * delta) / 1000
      const first = el.firstElementChild
      if (first && !shift.current && -x.current > first.offsetWidth) {
        shift.current = first.offsetWidth
        setItems((list) => [...list.slice(1), makeEvent(copy)])
        setCount((c) => c + 1)
      }
      el.style.transform = `translate3d(${x.current}px, 0, 0)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [copy, reduced])

  // After React has removed the first event, move the track back by its width so nothing jumps.
  useLayoutEffect(() => {
    if (!shift.current || !track.current) return
    x.current += shift.current
    shift.current = 0
    track.current.style.transform = `translate3d(${x.current}px, 0, 0)`
  }, [items])

  // Reduced motion: no scrolling, the newest event fades in at the front.
  useEffect(() => {
    if (!reduced || paused) return undefined
    const id = setInterval(() => {
      setItems((list) => [makeEvent(copy), ...list.slice(0, -1)])
      setCount((c) => c + 1)
    }, REDUCED_EVERY)
    return () => clearInterval(id)
  }, [copy, reduced, paused])

  const ease = (stop) =>
    gsap.to(speed.current, { v: stop ? 0 : SPEED, duration: stop ? 0.6 : 1.1, ease: 'power2.out', overwrite: true })

  const toggle = () => {
    const next = !paused
    setPaused(next)
    ease(next || hover.current)
  }

  return (
    <section className={`ticker ${paused ? 'is-paused' : ''} ${reduced ? 'is-static' : ''}`} aria-label={copy.label}>
      <p className="ticker__label">
        <span className="ticker__live" aria-hidden="true" />
        <span>{copy.label}</span>
        <span className="ticker__count" key={count}>
          {paused ? copy.paused : copy.count(count)}
        </span>
      </p>
      <div
        className="ticker__viewport"
        onPointerEnter={() => {
          hover.current = true
          ease(true)
        }}
        onPointerLeave={() => {
          hover.current = false
          ease(paused)
        }}
      >
        <ul ref={track} className="ticker__track">
          {items.map((item) => (
            <li key={item.id} className={`ticker__item ticker__item--${item.kind}`}>
              <time className="ticker__time" dateTime={item.at.toISOString()}>
                {clock(item.at)}
              </time>
              <Badge tone={item.tone}>{item.tag}</Badge>
              <span className="ticker__text">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="ticker__toggle" aria-label={paused ? copy.play : copy.pause} onClick={toggle}>
        <span className={paused ? 'ticker__play' : 'ticker__pause'} aria-hidden="true" />
      </button>
    </section>
  )
}
