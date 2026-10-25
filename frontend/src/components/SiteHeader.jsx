import { useRef } from 'react'
import { Link } from 'react-router-dom'
import es from '../i18n/es'
import { EASE, gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../motion/gsap'
import Button from './Button'
import Logo from './Logo'
import './SiteHeader.css'

const LINKS = [
  { to: '/#como-funciona', label: es.site.nav.howItWorks },
  { to: '/#para-quien', label: es.site.nav.volunteers },
  { to: '/#por-que', label: es.site.nav.organizations },
  { to: '/#impacto', label: es.site.nav.impact },
]

/** Web/Encabezado sitio (Figma 22:597): 1440 × 80, 120 px gutters. */
export default function SiteHeader() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const header = ref.current
      // Shadow once the page has scrolled (also without motion).
      ScrollTrigger.create({
        start: 8,
        end: 'max',
        onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
      })

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(header, { yPercent: -100, duration: 1.2, ease: EASE.smooth })

        // Hide while scrolling down, show again as soon as the user scrolls up.
        const hide = gsap.to(header, { yPercent: -100, duration: 0.6, ease: EASE.inOut, paused: true })
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => (self.scroll() > 240 && self.direction === 1 ? hide.play() : hide.reverse()),
        })

        // Reading progress along the bottom edge.
        gsap.fromTo(
          '.site-header__progress',
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.5 } },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <header ref={ref} className="site-header">
      <div className="site-header__inner">
        <Link to="/" aria-label={es.brand.name}>
          <Logo />
        </Link>
        <nav className="site-header__nav" aria-label={es.site.mainNavLabel}>
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <Button variant="secondary" icon="building" to="/ingreso" className="site-header__org">
            {es.site.orgLogin}
          </Button>
          <Button to="/registro">{es.site.wantToHelp}</Button>
        </div>
      </div>
      <span className="site-header__progress" aria-hidden="true" />
    </header>
  )
}
