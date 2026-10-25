import { useId } from 'react'
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

/** Progress bar: sunken track + filled bar. `value` from 0 to 1. */
export function ProgressBar({ value, height = 8, tone = 'brand', label }) {
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
      <span style={{ width: `${value * 100}%`, borderRadius: height / 2 }} />
    </div>
  )
}
