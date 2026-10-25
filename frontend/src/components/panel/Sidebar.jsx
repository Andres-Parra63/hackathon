import { Link, NavLink } from 'react-router-dom'
import es from '../../i18n/es'
import Icon from '../Icon'
import IconTile from '../IconTile'
import Logo from '../Logo'
import './Sidebar.css'

const t = es.panel

const NAV = [
  { to: '/panel', end: true, icon: 'dashboard', label: t.nav.dashboard },
  { to: '/panel/mapa', icon: 'map', label: t.nav.map },
  { to: '/panel/convocatorias', icon: 'bell', label: t.nav.calls, count: 1 },
  { to: '/panel/historial', icon: 'list', label: t.nav.history },
]

/** Web/Barra lateral (Figma 22:593): 248 px, active item in brand/primary-soft. */
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar__logo" aria-label={es.brand.name}>
        <Logo />
      </Link>

      <div className="sidebar__org">
        <IconTile icon="building" tone="info" size={36} iconSize={18} radius={10} />
        <div>
          <p className="t-label-sm c-strong">{t.org.name}</p>
          <p className="t-caption c-muted">{t.org.status}</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label={t.menu}>
        <p className="t-overline c-muted">{t.menu}</p>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="sidebar__link">
            <Icon name={item.icon} size={20} />
            <span className="sidebar__label">{item.label}</span>
            {item.count && <span className="sidebar__count">{item.count}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__help">
        <p className="sidebar__help-title">
          <Icon name="info" size={16} />
          {t.help.title}
        </p>
        <p className="t-caption c-default">{t.help.text}</p>
      </div>

      <Link to="/ingreso" className="sidebar__user" aria-label={`${t.user.name} · ${t.user.logout}`}>
        <span className="sidebar__avatar" aria-hidden="true">
          {t.user.initials}
        </span>
        <span className="sidebar__user-text">
          <span className="t-label-sm c-strong">{t.user.name}</span>
          <span className="t-caption c-muted">{t.user.role}</span>
        </span>
        <Icon name="log-out" size={18} className="c-muted" />
      </Link>
    </aside>
  )
}
