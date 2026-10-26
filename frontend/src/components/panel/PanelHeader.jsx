import es from '../../i18n/es'
import Button from '../Button'
import { useNewCall } from './newCallContext'
import './PanelHeader.css'

const t = es.panel

/** Web/Encabezado panel (Figma 22:632): title, subtitle and the primary action. Notifications live in the top bar. */
export default function PanelHeader({ title, subtitle, children }) {
  const { open } = useNewCall()
  return (
    <header className="panel-header">
      <div className="panel-header__titles" data-stagger="up">
        <h1 className="t-h2-web c-strong">{title}</h1>
        <p className="t-body c-muted">{subtitle}</p>
      </div>
      <div className="panel-header__actions">
        {children}
        <Button icon="plus" onClick={open}>
          {t.newCall}
        </Button>
      </div>
    </header>
  )
}
