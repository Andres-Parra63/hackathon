import './Icon.css'

// The 44 icons from the Figma library (24 px grid, 2 px stroke), exported as SVG.
// They are drawn as a CSS mask so they take `currentColor` like text does.
const ICONS = import.meta.glob('../assets/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const iconUrl = (name) => ICONS[`../assets/icons/${name}.svg`]

export const ICON_NAMES = Object.keys(ICONS)
  .map((path) => path.match(/([^/]+)\.svg$/)[1])
  .sort()

/**
 * @param {{ name: string, size?: number, label?: string, className?: string }} props
 *   `label` makes the icon meaningful to screen readers; without it the icon is decorative.
 */
export default function Icon({ name, size = 24, label, className = '' }) {
  const url = iconUrl(name)
  if (!url) {
    if (import.meta.env.DEV) console.warn(`Icon "${name}" does not exist`)
    return null
  }
  return (
    <span
      className={`icon ${className}`}
      style={{ '--icon-size': `${size}px`, '--icon-url': `url("${url}")` }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
