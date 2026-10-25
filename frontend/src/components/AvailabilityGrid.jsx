import es from '../i18n/es'
import { DAYS, SLOTS } from '../lib/availability'
import Icon from './Icon'
import './AvailabilityGrid.css'

const t = es.volunteer.grid

/**
 * Weekly availability: day x slot toggles. `value` is an object like { 'Sáb-Mañana': true }.
 * Each cell is a toggle button with a text label for screen readers; state also shows a check icon.
 */
export default function AvailabilityGrid({ value, onChange }) {
  const toggle = (key) => onChange({ ...value, [key]: !value[key] })

  return (
    <div className="avail" role="group" aria-label={t.legend}>
      <span aria-hidden="true" />
      {DAYS.map((day) => (
        <span key={day} className="avail__day t-label-sm c-muted" aria-hidden="true">
          {day}
        </span>
      ))}
      {SLOTS.map((slot) => (
        <div key={slot} className="avail__row">
          <span className="avail__slot t-label-sm c-muted">{slot}</span>
          {DAYS.map((day) => {
            const key = `${day}-${slot}`
            const on = Boolean(value[key])
            return (
              <button
                key={key}
                type="button"
                className={`avail__cell ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                aria-label={`${day} ${slot}: ${on ? t.on : t.off}`}
                onClick={() => toggle(key)}
              >
                {on && <Icon name="check" size={16} />}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
