import { Link } from 'react-router-dom'
import bellNotify from '../../assets/misc/bell-notify.svg'
import es from '../../i18n/es'
import Button from '../Button'
import { useNewCall } from './newCallContext'
import './PanelHeader.css'

const t = es.panel

/** Web/Encabezado panel (Figma 22:632): title, subtitle, search, notifications, primary action. */
export default function PanelHeader({ title, subtitle }) {
  const { open } = useNewCall()
  return (
    <header className="panel-header">
      <div className="panel-header__titles" data-stagger="up">
        <h1 className="t-h2-web c-strong">{title}</h1>
        <p className="t-body c-muted">{subtitle}</p>
      </div>
      <Link to="/panel/convocatorias" className="panel-header__bell" aria-label={t.notifications}>
        <img src={bellNotify} width="44" height="44" alt="" />
      </Link>
      <Button icon="plus" onClick={open}>
        {t.newCall}
      </Button>
    </header>
  )
}
