import Icon from './Icon'
import './SkillChip.css'

/**
 * Selectable chip (Figma "Chip", states Normal / Seleccionado). 56 px tall, 14 px radius.
 * It is a toggle button; the selected state shows a check badge besides the color change.
 */
export default function SkillChip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      className={`skill-chip ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {label}
      {selected && (
        <span className="skill-chip__check" aria-hidden="true">
          <Icon name="check" size={12} />
        </span>
      )}
    </button>
  )
}
