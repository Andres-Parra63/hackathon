import { ProgressBar } from '../FormControls'
import './HeroCard.css'

/**
 * Large gradient summary card (the reference's "Rewards" card).
 * Tones: `brand` (blue, normal mode) and `emergency` (orange). The badge text always states the
 * mode, so the color is never the only signal (WCAG 1.4.1).
 */
export default function HeroCard({ tone = 'brand', badge, meta, value, unit, text, progress, progressLabels, action, footnote, labelledBy }) {
  return (
    <section className={`hero-card hero-card--${tone}`} aria-labelledby={labelledBy} data-reveal="up">
      <div className="hero-card__top">
        <span className="hero-card__badge">
          <span className="hero-card__badge-dot" aria-hidden="true" />
          {badge}
        </span>
        {meta && <span className="hero-card__meta">{meta}</span>}
      </div>

      <p className="hero-card__value" id={labelledBy}>
        <span className="hero-card__number" data-count>
          {value}
        </span>
        {unit && <span className="hero-card__unit">{unit}</span>}
      </p>
      {text && <p className="hero-card__text">{text}</p>}

      {progress !== undefined && (
        <div className="hero-card__progress">
          <ProgressBar value={progress} height={6} tone="light" label={progressLabels?.join(' · ')} />
          {progressLabels && (
            <div className="hero-card__progress-labels">
              {progressLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {(action || footnote) && (
        <div className="hero-card__foot">
          {action}
          {footnote && <span className="hero-card__footnote">{footnote}</span>}
        </div>
      )}
    </section>
  )
}
