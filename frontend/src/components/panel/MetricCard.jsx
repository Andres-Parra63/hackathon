import Icon from '../Icon'
import './MetricCard.css'

/** Tarjeta/Métrica (Figma 4:246): icon, Numeral/Medium value, Caption label. */
export default function MetricCard({ icon, value, label }) {
  return (
    <div className="metric">
      <Icon name={icon} size={20} />
      <p className="t-numeral-md c-strong">{value}</p>
      <p className="t-caption c-muted">{label}</p>
    </div>
  )
}
