import './Badge.css'

/**
 * Badge (Figma 4:53). Tones: critical, success, warning, info, neutral.
 * Always carries text: status is never communicated by color alone (WCAG 1.4.1).
 */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
