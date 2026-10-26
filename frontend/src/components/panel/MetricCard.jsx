import Icon from '../Icon'
import './MetricCard.css'

/**
 * Tarjeta/Métrica: label, round icon, large value and an optional note.
 * `tone="accent"` fills the card in brand blue (the reference's highlighted first card).
 */
export default function MetricCard({ icon, value, label, note, tone = 'default' }) {
  return (
    <div className={`metric metric--${tone}`} data-hover="lift">
      <div className="metric__head">
        <p className="metric__label">{label}</p>
        <span className="metric__icon">
          <Icon name={icon} size={18} />
        </span>
      </div>
      <p className="metric__value" data-count>
        {value}
      </p>
      {note && <p className="metric__note">{note}</p>}
    </div>
  )
}
