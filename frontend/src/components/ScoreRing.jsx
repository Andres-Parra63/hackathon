import './ScoreRing.css'

const R = 22
const C = 2 * Math.PI * R

/** Compatibility ring: the number is always printed inside, so the value never depends on color. */
export default function ScoreRing({ value, label }) {
  const percent = Math.round(value * 100)
  const tone = percent >= 70 ? 'high' : percent >= 40 ? 'mid' : 'low'
  return (
    <span className={`score-ring score-ring--${tone}`} role="img" aria-label={label}>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <circle cx="28" cy="28" r={R} className="score-ring__track" />
        <circle
          cx="28"
          cy="28"
          r={R}
          className="score-ring__fill"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - value)}
        />
      </svg>
      <span className="score-ring__value" aria-hidden="true">
        {percent}
        <small>%</small>
      </span>
    </span>
  )
}
