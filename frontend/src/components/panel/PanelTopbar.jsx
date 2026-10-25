import { useCallback, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { HISTORY, RESPONSES } from '../../data/demo'
import es from '../../i18n/es'
import Icon from '../Icon'
import IconTile from '../IconTile'
import Logo from '../Logo'
import Popover from './Popover'
import { useSlidingPill } from './useSlidingPill'
import './PanelTopbar.css'

const t = es.panel

const PANEL_NAV = [
  { to: '/panel', end: true, icon: 'dashboard', label: t.nav.dashboard },
  { to: '/panel/mapa', icon: 'map', label: t.nav.map },
  { to: '/panel/convocatorias', icon: 'bell', label: t.nav.calls, count: 1 },
  { to: '/panel/historial', icon: 'list', label: t.nav.history },
]

// Case- and accent-insensitive matching ("logistica" finds "Logística").
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/**
 * Main navigation. Desktop: centered pill with an ink indicator that slides to the active page.
 * Below 1024 px the same list becomes a bottom dock with icons, within reach of the thumb.
 */
function PanelNav() {
  const nav = useRef(null)
  const { pathname } = useLocation()
  const pill = useSlidingPill(nav, '.pnav__link.active', pathname)

  return (
    <nav ref={nav} className="pnav" aria-label={t.menu}>
      {pill && <span className="pnav__pill" aria-hidden="true" style={pill} />}
      {PANEL_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="pnav__link">
          <Icon name={item.icon} size={20} className="pnav__icon" />
          <span className="pnav__label">{item.label}</span>
          {item.count && (
            <span className="pnav__count">
              {item.count}
              <span className="sr-only"> {t.navCount(item.count)}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SearchPopover() {
  const [query, setQuery] = useState('')
  const input = useRef(null)
  const focusInput = useCallback(() => input.current?.focus(), [])

  const q = normalize(query)
  const volunteers = RESPONSES.filter((row) => normalize(`${row.id} ${row.skill} ${row.status}`).includes(q)).slice(0, 4)
  const calls = HISTORY.filter((item) => normalize(`${item.title} ${item.text}`).includes(q)).slice(0, 3)

  return (
    <Popover
      label={t.searchOpen}
      panelLabel={t.search}
      tooltip={t.searchOpen}
      triggerClassName="ptop__icon"
      trigger={<Icon name="search" size={20} />}
      onOpen={focusInput}
      className="ptop__search"
    >
      {(close) => (
        <>
          <label className="ptop__search-field">
            <Icon name="search" size={18} />
            <span className="sr-only">{t.search}</span>
            <input
              ref={input}
              type="search"
              placeholder={t.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {volunteers.length + calls.length === 0 ? (
            <p className="ptop__search-empty t-body-sm c-muted" role="status">
              {t.searchEmpty}
            </p>
          ) : (
            <div className="ptop__search-results">
              {volunteers.length > 0 && (
                <section aria-label={t.searchGroups.volunteers}>
                  <p className="pop__head t-overline c-muted">{t.searchGroups.volunteers}</p>
                  <ul className="pop__list">
                    {volunteers.map((row) => (
                      <li key={row.id}>
                        <Link to="/panel/convocatorias" className="pop__item" onClick={close}>
                          <span className="pop__glyph" aria-hidden="true">
                            <Icon name="user" size={16} />
                          </span>
                          <span>
                            <span className="t-label c-strong">
                              {t.table.volunteer} #{row.id}
                            </span>
                            <span className="t-caption c-muted">
                              {row.skill} · {row.distance} · {row.status}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {calls.length > 0 && (
                <section aria-label={t.searchGroups.calls}>
                  <p className="pop__head t-overline c-muted">{t.searchGroups.calls}</p>
                  <ul className="pop__list">
                    {calls.map((item) => (
                      <li key={item.title}>
                        <Link to="/panel/historial" className="pop__item" onClick={close}>
                          <span className="pop__glyph" aria-hidden="true">
                            <Icon name={item.icon} size={16} />
                          </span>
                          <span>
                            <span className="t-label c-strong">{item.title}</span>
                            <span className="t-caption c-muted">
                              {item.date} · {item.status}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </Popover>
  )
}

function NotificationsPopover() {
  return (
    <Popover
      label={t.notifications}
      panelLabel={t.notificationsTitle}
      tooltip={t.notificationsTitle}
      triggerClassName="ptop__icon ptop__icon--unread"
      trigger={<Icon name="bell" size={20} />}
      className="ptop__notifications"
    >
      <div className="pop__head">
        <p className="t-label c-strong">{t.notificationsTitle}</p>
        <span className="ptop__new t-caption">{t.notificationsNew}</span>
      </div>
      <ul className="pop__list">
        {t.notificationItems.map((item) => (
          <li key={item.title} className="pop__item">
            <span className={`pop__glyph ${item.unread ? 'pop__glyph--info' : ''}`} aria-hidden="true">
              <Icon name={item.icon} size={16} />
            </span>
            <span>
              <span className="t-label c-strong">{item.title}</span>
              <span className="t-caption c-muted">{item.time}</span>
            </span>
            {item.unread && <span className="pop__dot" aria-hidden="true" />}
          </li>
        ))}
      </ul>
    </Popover>
  )
}

function UserMenu() {
  return (
    <Popover
      label={t.user.menu}
      triggerClassName="ptop__user"
      className="ptop__account"
      trigger={
        <>
          <span className="ptop__avatar" aria-hidden="true">
            {t.user.initials}
          </span>
          <span className="ptop__user-text">
            <span className="t-label c-strong">{t.user.name}</span>
            <span className="t-caption c-muted">{t.user.email}</span>
          </span>
          <Icon name="chevron-down" size={16} className="ptop__chevron c-muted" />
        </>
      }
    >
      <div className="ptop__org">
        <IconTile icon="building" tone="info" size={40} iconSize={20} radius={12} />
        <div>
          <p className="t-label c-strong">{t.org.name}</p>
          <p className="t-caption c-muted">
            {t.user.role} · {t.org.status}
          </p>
        </div>
      </div>
      <div className="ptop__help">
        <p className="t-label-sm c-brand">{t.help.title}</p>
        <p className="t-caption c-default">{t.help.text}</p>
      </div>
      <div className="pop__divider" />
      <Link to="/ingreso" className="pop__item">
        <span className="pop__glyph" aria-hidden="true">
          <Icon name="log-out" size={16} />
        </span>
        <span className="t-label c-strong">{t.user.logout}</span>
      </Link>
    </Popover>
  )
}

/** Panel top bar: brand pill, page navigation, tools and the account menu. */
export default function PanelTopbar({ theme, onTheme }) {
  const dark = theme === 'dark'
  return (
    <header className="ptop">
      <Link to="/" className="ptop__brand" aria-label={es.brand.name}>
        <Logo />
      </Link>

      <PanelNav />

      <div className="ptop__end">
        <div className="ptop__tools">
          {/* The rail holds the theme switch on desktop; below 1024 px it lives here */}
          <button
            type="button"
            className="ptop__icon ptop__theme"
            aria-label={t.theme.toggle(dark)}
            onClick={(event) => onTheme(dark ? 'light' : 'dark', event.currentTarget)}
          >
            <Icon name={dark ? 'sun' : 'moon'} size={20} />
          </button>
          <SearchPopover />
          <NotificationsPopover />
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
