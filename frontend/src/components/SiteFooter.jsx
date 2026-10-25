import es from '../i18n/es'
import Icon from './Icon'
import Logo from './Logo'
import './SiteFooter.css'

/** Pie de página (Figma 24:535). */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__content">
          <div className="site-footer__brand">
            <Logo />
            <p className="t-body c-muted">
              {es.footer.description[0]}
              <br />
              {es.footer.description[1]}
            </p>
          </div>
          {es.footer.columns.map((column) => (
            <nav key={column.title} className="site-footer__column" aria-label={column.title}>
              <p className="t-overline c-muted">{column.title}</p>
              {column.links.map((link) => (
                <a key={link} href={link.startsWith('github.com') ? `https://${link}` : '#'} className="t-body c-default">
                  {link}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <hr className="site-footer__divider" />
        <div className="site-footer__credits t-caption c-muted">
          <p>{es.footer.credits}</p>
          <p className="site-footer__lang">
            <Icon name="globe" size={16} />
            {es.footer.language}
          </p>
        </div>
      </div>
    </footer>
  )
}
