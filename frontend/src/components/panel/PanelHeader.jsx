import es from '../../i18n/es'
import Button from '../Button'
import { useNewCall } from './newCallContext'
import './PanelHeader.css'

const t = es.panel

/**
 * Page heading: large title whose words rise out of focus, a one-line lead, and the page actions
 * (extra `children` first, then "Nueva convocatoria", the panel's main call to action).
 */
export default function PanelHeader({ title, subtitle, children }) {
  const { open } = useNewCall()
  return (
    <header className="phead">
      <div className="phead__titles">
        <h1 className="phead__title" data-split>
          {title}
        </h1>
        <p className="t-body-lg c-muted" data-reveal="blur" data-delay="0.15">
          {subtitle}
        </p>
      </div>
      <div className="phead__actions" data-reveal="blur" data-delay="0.25">
        {children}
        <Button icon="plus" onClick={open}>
          {t.newCall}
        </Button>
      </div>
    </header>
  )
}
