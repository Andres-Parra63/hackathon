import { useRef } from 'react'
import { Link } from 'react-router-dom'
import es from '../i18n/es'
import Icon from './Icon'
import { useReveal } from '../motion/useReveal'
import Logo from './Logo'
import './SiteFooter.css'

function FooterLink({ link }) {
  if (link.to) return <Link to={link.to}>{link.label}</Link>
  const external = link.href.startsWith('http')
  return (
    <a href={link.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {link.label}
      {external && <span className="sr-only"> {es.footer.newTab}</span>}
    </a>
  )
}

/** Glass footer: brand, three link columns, credits, SDG line and a large wordmark that rises in. */
export default function SiteFooter() {
  const ref = useRef(null)
  useReveal(ref)

  return (
    <footer ref={ref} className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__content" data-stagger="blur">
          <div className="site-footer__brand">
            <Logo />
            <p className="t-body c-muted">{es.footer.description}</p>
          </div>
          {es.footer.columns.map((column) => (
            <nav key={column.title} className="site-footer__column" aria-label={column.title}>
              <p className="site-footer__title">{column.title}</p>
              {column.links.map((link) => (
                <FooterLink key={link.label} link={link} />
              ))}
            </nav>
          ))}
        </div>
        <p className="site-footer__wordmark" aria-hidden="true" data-split>
          {es.brand.name}
        </p>
        <div className="site-footer__credits">
          <p>{es.footer.credits}</p>
          <p className="t-mono">{es.footer.ods}</p>
          <p className="site-footer__lang">
            <Icon name="globe" size={16} />
            {es.footer.language}
          </p>
        </div>
      </div>
    </footer>
  )
}
