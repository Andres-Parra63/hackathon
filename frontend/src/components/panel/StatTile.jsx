import Icon from '../Icon'
import './StatTile.css'

/**
 * Stat tile: label, value (counts up on entry), optional delta and a note. `delta.good` says
 * whether the direction is good news (it sets the color; the arrow and sign carry it too).
 * `accent` paints the Modo Emergencia fill; its label always names the mode, never color alone.
 */
export default function StatTile({ icon, label, value, note, delta, accent = false }) {
  return (
    <div className={`stat ${accent ? 'stat--accent' : ''}`} data-hover="lift">
      <div className="stat__top">
        <p className="stat__label">{label}</p>
        <span className="stat__icon" aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="stat__value" data-count>
        {value}
      </p>
      <p className="stat__foot">
        {delta && (
          <span className={`delta delta--${delta.good ? 'good' : 'bad'}`}>
            <Icon name={delta.dir === 'up' ? 'arrow-up-right' : 'arrow-down-right'} size={14} />
            {delta.text}
          </span>
        )}
        <span>{note}</span>
      </p>
    </div>
  )
}
