import { useState } from 'react'
import Icon from './Icon'
import './LiveTicker.css'

/**
 * Horizontal ticker of simulated platform events. Moves on its own, so it carries a pause button
 * (WCAG 2.2.2); it also stops on hover/focus and under reduced motion. The track is duplicated
 * for a seamless loop and the copy is hidden from assistive tech.
 */
export default function LiveTicker({ label, items, pauseLabel, playLabel }) {
  const [paused, setPaused] = useState(false)

  const row = (hidden) => (
    <ul className="ticker__row" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item}>
          <span className="ticker__dot" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  )

  return (
    <section className={`ticker ${paused ? 'is-paused' : ''}`} aria-label={label}>
      <p className="ticker__label">
        <span className="ticker__live" aria-hidden="true" />
        {label}
      </p>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {row(false)}
          {row(true)}
        </div>
      </div>
      <button
        type="button"
        className="ticker__toggle"
        aria-label={paused ? playLabel : pauseLabel}
        onClick={() => setPaused((p) => !p)}
      >
        {paused ? <Icon name="chevron-right" size={16} /> : <span className="ticker__pause" aria-hidden="true" />}
      </button>
    </section>
  )
}
