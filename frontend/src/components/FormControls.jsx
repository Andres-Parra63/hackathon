import { useId, useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../motion/gsap'
import Icon from './Icon'
import './FormControls.css'

/**
 * Campo de formulario (Figma 4:85). Label 14/18 SemiBold + 52 px control with a 20 px icon.
 * Normal: 1.5 px border/strong. Focus: 2 px brand/primary and the icon turns brand.
 */
export function TextField({ label, icon, className = '', ...inputProps }) {
  const id = useId()
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        {icon && <Icon name={icon} size={20} className="field__icon" />}
        <input id={id} className="field__input" {...inputProps} />
      </div>
    </div>
  )
}

export function TextArea({ label, className = '', ...props }) {
  const id = useId()
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="field__textarea" {...props} />
    </div>
  )
}

/** Casilla (Figma "Formulario/Casilla"): 24 px, 7 px radius. */
export function Checkbox({ checked, onChange, children, className = '' }) {
  return (
    <label className={`checkbox ${className}`}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox__box" aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
      <span className="checkbox__text">{children}</span>
    </label>
  )
}

/** Interruptor (Figma "Formulario/Interruptor"): 48 × 28 track, 22 px knob. */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!checked)}
    >
      <span className="switch__knob" />
    </button>
  )
}

/** Nota: tinted box with a 20 px icon and Body/Small text. Tones: info, sunken, success. */
export function Note({ icon, tone = 'info', className = '', children }) {
  return (
    <div className={`note note--${tone} ${className}`}>
      <Icon name={icon} size={20} />
      <p>{children}</p>
    </div>
  )
}

/**
 * Progress bar: sunken track + filled bar. `value` from 0 to 1.
 * Fills from zero when it scrolls into view and glides to new values.
 */
export function ProgressBar({ value, height = 8, tone = 'brand', label }) {
  const fill = useRef(null)
  const mounted = useRef(false)
  // The fill is full width and slides in from the left inside the clipped track (GPU transform,
  // no layout work, and the rounded end keeps its shape).
  const offset = (value - 1) * 100

  useGSAP(
    () => {
      const first = !mounted.current
      mounted.current = true
      if (prefersReducedMotion()) {
        gsap.set(fill.current, { xPercent: offset })
      } else if (first) {
        gsap.fromTo(
          fill.current,
          { xPercent: -100 },
          {
            xPercent: offset,
            duration: 1.8,
            delay: 0.25,
            ease: 'expo.out',
            scrollTrigger: { trigger: fill.current, start: 'top 90%', once: true },
          },
        )
      } else {
        gsap.to(fill.current, { xPercent: offset, duration: 1.2, ease: 'expo.out' })
      }
      // Only runs on unmount (revertOnUpdate: false); a remount fills from zero again.
      return () => {
        mounted.current = false
      }
    },
    { dependencies: [offset], revertOnUpdate: false },
  )

  return (
    <div
      className={`progress progress--${tone}`}
      style={{ height, borderRadius: height / 2 }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label={label}
    >
      <span ref={fill} style={{ borderRadius: height / 2 }} />
    </div>
  )
}
