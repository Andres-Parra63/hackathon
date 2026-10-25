import { useId, useRef } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../motion/gsap'
import Icon from './Icon'
import './FormControls.css'

/**
 * Campo de formulario: visible label, optional hint, and an error shown right under the control
 * (icon + text, never color alone). `hint` and `error` are wired through aria-describedby.
 */
function FieldMessages({ id, hint, error }) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error">
          <Icon name="alert-triangle" size={16} />
          {error}
        </p>
      )}
    </>
  )
}

const describedBy = (id, hint, error) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

export function TextField({ label, icon, hint, error, className = '', inputRef, ...inputProps }) {
  const id = useId()
  return (
    <div className={`field ${error ? 'is-invalid' : ''} ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        {icon && <Icon name={icon} size={20} className="field__icon" />}
        <input
          ref={inputRef}
          id={id}
          className="field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...inputProps}
        />
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  )
}

/** Native select styled like the text field (keeps the platform picker on phones). */
export function SelectField({ label, placeholder, options, hint, error, className = '', inputRef, ...selectProps }) {
  const id = useId()
  return (
    <div className={`field ${error ? 'is-invalid' : ''} ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control field__control--select">
        <select
          ref={inputRef}
          id={id}
          className="field__input field__select"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...selectProps}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icon name="chevron-right" size={18} className="field__chevron" />
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
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

/** Casilla: 24 px box; `error` is announced through aria-describedby like the text fields. */
export function Checkbox({ checked, onChange, children, error, inputRef, className = '', ...inputProps }) {
  const id = useId()
  return (
    <div className={`checkbox-field ${error ? 'is-invalid' : ''} ${className}`}>
      <label className="checkbox">
        <input
          ref={inputRef}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        <span className="checkbox__box" aria-hidden="true">
          <Icon name="check" size={16} />
        </span>
        <span className="checkbox__text">{children}</span>
      </label>
      <FieldMessages id={id} error={error} />
    </div>
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
  // no layout work, and the rounded end keeps its shape). `x: 0` pins the pixel offset: on a
  // remount GSAP could otherwise carry a stale px translate next to xPercent and hide the fill.
  const offset = (value - 1) * 100

  useGSAP(
    () => {
      const first = !mounted.current
      mounted.current = true
      if (prefersReducedMotion()) {
        gsap.set(fill.current, { x: 0, xPercent: offset })
      } else if (first) {
        gsap.fromTo(
          fill.current,
          { x: 0, xPercent: -100 },
          {
            x: 0,
            xPercent: offset,
            duration: 1.8,
            delay: 0.25,
            ease: 'expo.out',
            scrollTrigger: { trigger: fill.current, start: 'top 90%', once: true },
          },
        )
      } else {
        gsap.to(fill.current, { x: 0, xPercent: offset, duration: 1.2, ease: 'expo.out' })
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
