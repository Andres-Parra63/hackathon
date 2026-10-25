import bellNotify from '../../assets/misc/bell-notify.svg'
import es from '../../i18n/es'
import Button from '../Button'
import Icon from '../Icon'
import { useNewCall } from './newCallContext'
import './PanelHeader.css'

const t = es.panel

/** Web/Encabezado panel (Figma 22:632): title, subtitle, search, notifications, primary action. */
export default function PanelHeader({ title, subtitle }) {
  const { open } = useNewCall()
  return (
    <header className="panel-header">
      <div className="panel-header__titles">
        <h1 className="t-h2-web c-strong">{title}</h1>
        <p className="t-body c-muted">{subtitle}</p>
      </div>
      <label className="panel-header__search">
        <Icon name="search" size={18} />
        <span className="sr-only">{t.search}</span>
        <input type="search" placeholder={t.search} />
      </label>
      <button type="button" className="panel-header__bell" aria-label={t.notifications}>
        <img src={bellNotify} width="44" height="44" alt="" />
      </button>
      <Button icon="plus" onClick={open}>
        {t.newCall}
      </Button>
    </header>
  )
}
