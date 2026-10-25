import es from '../i18n/es'
import Button from './Button'
import Icon from './Icon'
import './LoadState.css'

const t = es.loadState

/**
 * Loading, error and empty states for API data. Renders `children` once there is data.
 * Loading shows skeleton rows (announced politely); errors keep a retry button.
 */
export default function LoadState({ loading, error, empty, emptyText, onRetry, rows = 3, children }) {
  if (error) {
    return (
      <div className="load-state load-state--error" role="alert">
        <Icon name="alert-triangle" size={22} />
        <div>
          <p className="t-label c-strong">{t.errorTitle}</p>
          <p className="t-body-sm c-default">{error.message}</p>
        </div>
        {onRetry && (
          <Button variant="secondary" icon="refresh" onClick={onRetry}>
            {t.retry}
          </Button>
        )}
      </div>
    )
  }
  if (loading) {
    return (
      <div className="load-state__skeleton" aria-busy="true" aria-live="polite">
        <span className="sr-only">{t.loading}</span>
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="load-state__bar" style={{ '--i': i }} />
        ))}
      </div>
    )
  }
  if (empty) {
    return (
      <div className="load-state load-state--empty" role="status">
        <Icon name="info" size={22} />
        <p className="t-body-sm c-default">{emptyText}</p>
      </div>
    )
  }
  return children
}

/** Inline error line for a failed action (keeps the form usable). */
export function ActionError({ error }) {
  if (!error) return null
  return (
    <p className="load-state__inline t-body-sm" role="alert">
      <Icon name="alert-triangle" size={16} />
      {error.message}
    </p>
  )
}
