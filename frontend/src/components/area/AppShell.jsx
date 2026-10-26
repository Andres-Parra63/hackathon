import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import es from '../../i18n/es'
import PageTransition from '../../motion/PageTransition'
import Icon from '../Icon'
import IconTile from '../IconTile'
import Logo from '../Logo'
import './AppShell.css'

const t = es.shell

/**
 * Shell for the organization, volunteer and admin areas: top bar with the pill menu and the
 * account chip, a slim icon rail with shortcuts, and the routed content.
 * `actions` are extra round buttons for the top bar (e.g. the organization's notifications).
 */
export default function AppShell({ nav, identity, help, actions = null, railActions = null }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [helpOpen, setHelpOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menu = useRef(null)

  const signOut = () => {
    logout()
    navigate('/ingreso')
  }

  // Popovers close on route change, Escape and clicks outside the account menu.
  useEffect(() => {
    setHelpOpen(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      setHelpOpen(false)
      setMenuOpen(false)
    }
    const onClick = (event) => {
      if (menu.current && !menu.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onClick)
    }
  }, [])

  return (
    <div className="shell">
      <header className="shell__top">
        <Link to="/" className="shell__logo" aria-label={es.brand.name}>
          <Logo />
        </Link>

        <nav className="shell__tabs" aria-label={t.menu}>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="shell__tab">
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
              {item.count && <span className="shell__count">{item.count}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="shell__tools">
          {actions}
          <button
            type="button"
            className="shell__round"
            aria-expanded={helpOpen}
            aria-controls="shell-help"
            aria-label={help.title}
            onClick={() => setHelpOpen((open) => !open)}
          >
            <Icon name="help-circle" size={18} />
          </button>

          <div className="shell__account" ref={menu}>
            <button
              type="button"
              className="shell__user"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="shell__avatar" aria-hidden="true">
                {user?.initials}
              </span>
              <span className="shell__user-text">
                <span className="t-label-sm c-strong">{user?.name}</span>
                <span className="t-caption c-muted">{identity.name}</span>
              </span>
              <Icon name="chevron-right" size={16} className="shell__chevron" />
            </button>
            {menuOpen && (
              <div className="shell__menu" role="menu">
                <div className="shell__menu-head">
                  <IconTile icon={identity.icon} tone="info" size={36} iconSize={18} radius={10} />
                  <div>
                    <p className="t-label-sm c-strong">{identity.name}</p>
                    <p className="t-caption c-muted">{identity.status}</p>
                  </div>
                </div>
                <button type="button" role="menuitem" className="shell__menu-item" onClick={signOut}>
                  <Icon name="log-out" size={18} />
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="shell__rail" aria-label={t.shortcuts}>
        <span className="shell__rail-id" title={identity.name}>
          <Icon name={identity.icon} size={18} />
        </span>
        <span className="shell__rail-sep" aria-hidden="true" />
        <nav className="shell__rail-nav" aria-label={t.shortcuts}>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="shell__rail-link" aria-label={item.label}>
              <Icon name={item.icon} size={18} />
              <span className="shell__tip" aria-hidden="true">
                {item.label}
              </span>
            </NavLink>
          ))}
          {railActions}
        </nav>
        <div className="shell__rail-foot">
          <button
            type="button"
            className="shell__rail-link"
            aria-expanded={helpOpen}
            aria-controls="shell-help"
            aria-label={help.title}
            onClick={() => setHelpOpen((open) => !open)}
          >
            <Icon name="info" size={18} />
            <span className="shell__tip" aria-hidden="true">
              {help.title}
            </span>
          </button>
          <button type="button" className="shell__rail-link" aria-label={t.logout} onClick={signOut}>
            <Icon name="log-out" size={18} />
            <span className="shell__tip" aria-hidden="true">
              {t.logout}
            </span>
          </button>
        </div>
      </aside>

      {helpOpen && (
        <div id="shell-help" className="shell__help" role="dialog" aria-label={help.title}>
          <p className="shell__help-title">
            <Icon name="info" size={16} />
            {help.title}
          </p>
          <p className="t-body-sm c-default">{help.text}</p>
          <button type="button" className="shell__help-close" onClick={() => setHelpOpen(false)} aria-label={t.close}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      <main className="shell__main">
        <PageTransition key={pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  )
}

/** Round icon link for the top bar, with an optional dot for unread items. */
export function ShellAction({ to, icon, label, dot = false }) {
  return (
    <Link to={to} className="shell__round" aria-label={label}>
      <Icon name={icon} size={18} />
      {dot && <span className="shell__dot" aria-hidden="true" />}
    </Link>
  )
}
