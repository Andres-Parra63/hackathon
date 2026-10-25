import Icon from './Icon'
import './IconTile.css'

/**
 * Rounded square with a soft background and a centered icon (the "Ícono …" frames in Figma).
 * Tones set background + icon color: brand, info, success, sunken, card, solid-success.
 */
export default function IconTile({ icon, tone = 'brand', size = 52, iconSize = 26, radius = 16, round = false }) {
  return (
    <span
      className={`icon-tile icon-tile--${tone}`}
      style={{ width: size, height: size, borderRadius: round ? '50%' : radius }}
      aria-hidden="true"
    >
      <Icon name={icon} size={iconSize} />
    </span>
  )
}
