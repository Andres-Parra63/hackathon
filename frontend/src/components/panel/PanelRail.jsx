import { Link } from 'react-router-dom'
import es from '../../i18n/es'
import Icon from '../Icon'
import { useNewCall } from './newCallContext'
import Popover from './Popover'
import './PanelRail.css'

const t = es.panel

/**
 * Floating icon rail (desktop): theme switch, quick actions, help and sign-out, in three pills.
 * Every icon has an accessible name and a visible tooltip on hover and keyboard focus.
 */
export default function PanelRail({ theme, onTheme }) {
  const { open } = useNewCall()

  return (
    <aside className="prail" aria-label={t.rail.actions}>
      <div className="prail__group" role="group" aria-label={t.theme.label}>
        {['light', 'dark'].map((option) => (
          <button
            key={option}
            type="button"
            className="prail__btn"
            aria-label={t.theme[option]}
            aria-pressed={theme === option}
            data-tip={t.theme[option]}
            onClick={(event) => onTheme(option, event.currentTarget)}
          >
            <Icon name={option === 'light' ? 'sun' : 'moon'} size={18} />
          </button>
        ))}
      </div>

      <div className="prail__group" role="group" aria-label={t.rail.actions}>
        <button type="button" className="prail__btn prail__btn--solid" aria-label={t.newCall} data-tip={t.newCall} onClick={open}>
          <Icon name="plus" size={18} />
        </button>
        <Link to="/" className="prail__btn" aria-label={t.rail.site} data-tip={t.rail.site}>
          <Icon name="home" size={18} />
        </Link>
      </div>

      <div className="prail__group prail__group--end" role="group" aria-label={t.rail.account}>
        <Popover
          label={t.rail.help}
          panelLabel={t.help.title}
          tooltip={t.rail.help}
          side="right"
          align="end"
          triggerClassName="prail__btn"
          trigger={<Icon name="help-circle" size={18} />}
          className="prail__help"
        >
          <div className="prail__help-body">
            <p className="t-label c-strong">{t.help.title}</p>
            <p className="t-body-sm c-default">{t.help.text}</p>
          </div>
        </Popover>
        <Link to="/ingreso" className="prail__btn" aria-label={t.user.logout} data-tip={t.user.logout}>
          <Icon name="log-out" size={18} />
        </Link>
      </div>
    </aside>
  )
}
