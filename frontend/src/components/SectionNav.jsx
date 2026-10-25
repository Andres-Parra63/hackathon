import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../motion/gsap'
import { scrollToTarget } from '../motion/smoothScroll'
import Icon from './Icon'
import './SectionNav.css'

/**
 * Floating "previous / next section" pill (as on the reference site). It tracks the section in
 * the middle of the viewport, appears once the reader leaves the hero and hides at the footer.
 */
export default function SectionNav({ sections, label, prevLabel, nextLabel }) {
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const triggers = sections.map((section, i) =>
      ScrollTrigger.create({
        trigger: `#${section.id}`,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => self.isActive && setActive(i),
      }),
    )
    const visibility = ScrollTrigger.create({
      trigger: `#${sections[0].id}`,
      start: 'bottom 70%',
      endTrigger: '.site-footer',
      end: 'top bottom',
      onToggle: (self) => setShown(self.isActive),
    })
    return () => {
      triggers.forEach((t) => t.kill())
      visibility.kill()
    }
  }, [sections])

  const go = (i) => scrollToTarget(`#${sections[i].id}`, { offset: -24 })
  const position = `${String(active + 1).padStart(2, '0')} / ${String(sections.length).padStart(2, '0')}`

  return (
    <nav className={`section-nav ${shown ? 'is-shown' : ''}`} aria-label={label} inert={!shown || undefined}>
      <button type="button" className="section-nav__btn" onClick={() => go(active - 1)} disabled={active === 0} aria-label={prevLabel}>
        <Icon name="chevron-left" size={16} />
      </button>
      <p className="section-nav__status">
        <span className="section-nav__count">{position}</span>
        <span className="section-nav__name">{sections[active].label}</span>
        <span className="section-nav__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${(active + 1) / sections.length})` }} />
        </span>
      </p>
      <button
        type="button"
        className="section-nav__btn"
        onClick={() => go(active + 1)}
        disabled={active === sections.length - 1}
        aria-label={nextLabel}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  )
}
