import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import es from '../i18n/es'
import { EASE, gsap, MOTION_OK, ScrollTrigger, useGSAP } from '../motion/gsap'
import Button from './Button'
import Icon from './Icon'
import Logo from './Logo'
import './SiteHeader.css'

const LINKS = [
  { to: '/#como-funciona', label: es.site.nav.howItWorks },
  { to: '/#emergencia', label: es.site.nav.emergency },
  { to: '/#para-quien', label: es.site.nav.audiences },
  { to: '/#escenarios', label: es.site.nav.scenarios },
  { to: '/#impacto', label: es.site.nav.impact },
]

/** Floating site header: logo, centered dimmed links, outline CTA; side drawer below 1080 px. */
export default function SiteHeader() {
  const ref = useRef(null)
  const toggleRef = useRef(null)
  const drawerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()

  // Close the drawer when the route or the anchor changes.
  useEffect(() => setOpen(false), [pathname, hash])

  // Drawer: Escape closes it, focus moves in on open and back to the toggle on close.
  useEffect(() => {
    if (!open) return undefined
    const drawer = drawerRef.current
    drawer.querySelector('a, button')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab') return
      const items = drawer.querySelectorAll('a, button')
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const toggle = toggleRef.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      toggle?.focus()
    }
  }, [open])

  useGSAP(
    () => {
      const header = ref.current
      // Glass background once the page has scrolled (also without motion).
      ScrollTrigger.create({
        start: 8,
        end: 'max',
        onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
      })

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from(header.querySelector('.site-header__inner'), { y: -24, opacity: 0, duration: 1.2, ease: EASE.smooth })

        // Hide while scrolling down, show again as soon as the user scrolls up.
        const hide = gsap.to(header, { yPercent: -120, duration: 0.6, ease: EASE.inOut, paused: true })
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
        <div className="site-header__side">
          <Link to="/" aria-label={es.brand.name} className="site-header__home">
            <Logo />
          </Link>
        </div>
        <nav className="site-header__nav" aria-label={es.site.mainNavLabel}>
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__side site-header__actions">
          <Link to="/ingreso" className="site-header__login" aria-label={es.site.orgLogin}>
            {es.site.login}
          </Link>
          <Button variant="outline" to="/registro" className="site-header__cta">
            {es.site.wantToHelp}
          </Button>
          <button
            ref={toggleRef}
            type="button"
            className="site-header__toggle"
            aria-expanded={open}
            aria-controls="site-drawer"
            onClick={() => setOpen(true)}
          >
            <Icon name="list" size={22} />
            <span className="sr-only">{es.site.openMenu}</span>
          </button>
        </div>
      </div>
      <span className="site-header__progress" aria-hidden="true" />

      {/* Portal: the header gets a transform and a backdrop-filter, which would trap a fixed child */}
      {createPortal(
        <div className={`site-drawer ${open ? 'is-open' : ''}`} hidden={!open}>
          <button type="button" className="site-drawer__scrim" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            ref={drawerRef}
            id="site-drawer"
            className="site-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label={es.site.menu}
          >
            <div className="site-drawer__head">
              <Logo />
              <button type="button" className="site-drawer__close" onClick={() => setOpen(false)}>
                <Icon name="x" size={22} />
                <span className="sr-only">{es.site.closeMenu}</span>
              </button>
            </div>
            <nav className="site-drawer__nav" aria-label={es.site.mainNavLabel}>
              {LINKS.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <hr />
            <div className="site-drawer__actions">
              <Button variant="outline" to="/registro" block>
                {es.site.wantToHelp}
              </Button>
              <Button variant="secondary" icon="building" to="/ingreso" block>
                {es.site.orgLogin}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  )
}
