import { Link } from 'react-router-dom'
import es from '../i18n/es'
import Button from './Button'
import Logo from './Logo'
import './SiteHeader.css'

const LINKS = [
  { href: '/#como-funciona', label: es.site.nav.howItWorks },
  { href: '/#para-quien', label: es.site.nav.volunteers },
  { href: '/#por-que', label: es.site.nav.organizations },
  { href: '/#impacto', label: es.site.nav.impact },
]

/** Web/Encabezado sitio (Figma 22:597): 1440 × 80, 120 px gutters. */
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" aria-label={es.brand.name}>
          <Logo />
        </Link>
        <nav className="site-header__nav" aria-label={es.site.mainNavLabel}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="site-header__actions">
          <Button variant="secondary" icon="building" to="/ingreso" className="site-header__org">
            {es.site.orgLogin}
          </Button>
          <Button to="/registro">{es.site.wantToHelp}</Button>
        </div>
      </div>
    </header>
  )
}
