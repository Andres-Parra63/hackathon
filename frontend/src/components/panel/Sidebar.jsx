import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import es from '../../i18n/es'
import Icon from '../Icon'
import IconTile from '../IconTile'
import Logo from '../Logo'
import './Sidebar.css'

const t = es.panel

const ORG_NAV = [
  { to: '/panel', end: true, icon: 'dashboard', label: t.nav.dashboard },
  { to: '/panel/mapa', icon: 'map', label: t.nav.map },
  { to: '/panel/actividades', icon: 'calendar', label: es.orgArea.nav.activities },
  { to: '/panel/emergencia', icon: 'alert-triangle', label: es.orgArea.nav.emergency },
  { to: '/panel/convocatorias', icon: 'bell', label: t.nav.calls, count: 1 },
  { to: '/panel/historial', icon: 'list', label: t.nav.history },
]
const ORG_IDENTITY = { icon: 'building', ...t.org }
const ORG_HELP = t.help

/** Web/Barra lateral (Figma 22:593): 248 px, active item in brand/primary-soft. */
export default function Sidebar({ nav = ORG_NAV, identity = ORG_IDENTITY, help = ORG_HELP }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = () => {
    logout()
    navigate('/ingreso')
  }

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar__logo" aria-label={es.brand.name}>
        <Logo />
      </Link>

      <div className="sidebar__org">
        <IconTile icon={identity.icon} tone="info" size={36} iconSize={18} radius={10} />
        <div>
          <p className="t-label-sm c-strong">{identity.name}</p>
          <p className="t-caption c-muted">{identity.status}</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label={t.menu}>
        <p className="t-overline c-muted">{t.menu}</p>
        {nav.map((item) => (
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
          {help.title}
        </p>
        <p className="t-caption c-default">{help.text}</p>
      </div>

      <button type="button" className="sidebar__user" onClick={signOut} aria-label={`${user?.name} · ${t.user.logout}`}>
        <span className="sidebar__avatar" aria-hidden="true">
          {user?.initials}
        </span>
        <span className="sidebar__user-text">
          <span className="t-label-sm c-strong">{user?.name}</span>
          <span className="t-caption c-muted">{t.user.logout}</span>
        </span>
        <Icon name="log-out" size={18} className="c-muted" />
      </button>
    </aside>
  )
}
