import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import DotGlobe from '../components/DotGlobe'
import { Checkbox, ProgressBar, SelectField, TextField } from '../components/FormControls'
import Icon from '../components/Icon'
import LiveTicker from '../components/LiveTicker'
import SectionNav from '../components/SectionNav'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import es from '../i18n/es'
import { DESKTOP, DURATION, EASE, gsap, MOTION_OK, prefersReducedMotion, REDUCED, ScrollTrigger, SplitText, useGSAP } from '../motion/gsap'
import { countUp, useReveal } from '../motion/useReveal'
import './Landing.css'

const t = es.landing

function SectionHeader({ eyebrow, title, lead, id, center = false, tone, shimmer = false }) {
  return (
    <header className={`section-header ${center ? 'section-header--center' : ''}`}>
      <p className={`eyebrow ${tone ? `eyebrow--${tone}` : ''}`} data-reveal="fade" data-scramble>
        {eyebrow}
      </p>
      {shimmer ? (
        // Shimmer text (transitions-dev 15): a light band sweeps the heading; pure CSS.
        <h2 id={id} className="t-h1-web t-shimmer section-header__shimmer" data-text={title} data-reveal="up">
          {title}
        </h2>
      ) : (
        <h2 id={id} className="t-h1-web c-strong" data-split>
          {title}
        </h2>
      )}
      {lead && (
        <p className="t-body-xl t-mono c-muted section-header__lead" data-reveal="blur" data-delay="0.15">
          {lead}
        </p>
      )}
    </header>
  )
}

function Stat({ stat, align }) {
  return (
    <div className={`hero-stat hero-stat--${align}`}>
      <dt className="t-numeral-lg c-strong">{stat.value}</dt>
      <dd className="hero-stat__label">{stat.label}</dd>
      <dd className="hero-stat__note t-mono">{stat.note}</dd>
    </div>
  )
}

function Hero() {
  const ref = useRef(null)
  // Shared with the globe: 0 = free spin, 1 = turned to face Colombia (driven by scroll).
  const globe = useRef({ focus: 0 })
  const [s1, s2, s3, s4] = t.hero.stats

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(ref)

      mm.add(MOTION_OK, () => {
        // Entrance: eyebrow, headline word by word, lead, actions, then the globe and the figures around it.
        // It waits for the web font, so the words are measured once and nothing jumps.
        const title = SplitText.create(q('h1')[0], { type: 'words', mask: 'words' })
        const intro = gsap.timeline({ paused: true, defaults: { duration: DURATION.slow, ease: EASE.out } })
        intro
          .from(q('.hero .eyebrow'), { y: 12, opacity: 0, duration: 0.9 })
          .from(title.words, { yPercent: 100, duration: 1.4, ease: EASE.smooth, stagger: 0.05 }, 0.1)
          .from(q('.hero__lead'), { y: 16, opacity: 0 }, 0.5)
          .from(q('.hero__actions > *'), { y: 16, opacity: 0, stagger: 0.08 }, 0.65)
          .fromTo(
            q('.hero__globe'),
            { scale: 0.86, opacity: 0, filter: 'blur(12px)' },
            { scale: 1, opacity: 1, filter: 'blur(0px)', clearProps: 'filter', duration: 2.2, ease: EASE.smooth },
            0.3,
          )
          .from(q('.hero-stat'), { y: 20, opacity: 0, stagger: 0.1 }, 0.9)
          .add(() => q('.hero-stat dt').forEach((el, i) => countUp(el, { delay: i * 0.1 })), 0.95)
          .from(q('.hero__legend'), { opacity: 0, duration: 1 }, 1.3)
        document.fonts.ready.then(() => intro.play())
      })

      // Desktop: scrollytelling. The hero pins; the copy fades away, the stage glides up until the
      // globe sits in the middle of the screen and the globe turns to face Colombia. The sphere
      // never changes size; the figures close in around it.
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        const section = ref.current
        section.classList.add('is-pinned')
        const stage = q('.hero__stage')[0]
        const travel = () => {
          const pad = parseFloat(getComputedStyle(section).paddingTop)
          return -(stage.offsetTop + pad - Math.max(0, (window.innerHeight - stage.offsetHeight) / 2))
        }
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '+=120%',
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(q('.hero__message'), { opacity: 0, y: -48, duration: 0.45 }, 0)
          .to(q('.hero__inner'), { y: travel, duration: 1, ease: 'power1.inOut' }, 0)
          .to(globe.current, { focus: 1, duration: 0.75 }, 0.2)
          .to(q('.hero__stats--start'), { x: 36, duration: 1 }, 0)
          .to(q('.hero__stats--end'), { x: -36, duration: 1 }, 0)
          .to({}, { duration: 0.3 }) // short hold on the focused globe before the pin releases
        return () => section.classList.remove('is-pinned')
      })

      // Tablet / phone: no pin; the copy lifts away and the globe turns toward Colombia as it scrolls in.
      mm.add(`${MOTION_OK} and (max-width: 1023px)`, () => {
        gsap.to(q('.hero__message'), {
          y: -40,
          opacity: 0.25,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 1 },
        })
        gsap.to(globe.current, {
          focus: 1,
          ease: 'none',
          scrollTrigger: { trigger: q('.hero__stage')[0], start: 'top 85%', end: 'center center', scrub: true },
        })
      })

      mm.add(REDUCED, () => {
        gsap.from(q('.hero__message, .hero__stage, .hero__legend'), {
          opacity: 0,
          duration: 0.7,
          ease: 'power1.out',
          stagger: 0.12,
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="inicio" className="section hero" aria-labelledby="hero-title">
      <div className="section__inner hero__inner">
        <div className="hero__message">
          <p className="eyebrow" data-scramble>
            {t.hero.eyebrow}
          </p>
          <h1 id="hero-title" className="t-display c-strong">
            {t.hero.title}
          </h1>
          <p className="t-body-xl t-mono c-muted hero__lead">{t.hero.lead}</p>
          <div className="hero__actions">
            <Button icon="heart" to="/registro" data-magnetic>
              {es.site.wantToHelp}
            </Button>
            <Button variant="secondary" icon="building" to="/ingreso" data-magnetic>
              {es.site.imOrganization}
            </Button>
          </div>
        </div>

        <div className="hero__stage">
          <dl className="hero__stats hero__stats--start">
            <Stat stat={s1} align="start" />
            <Stat stat={s3} align="start" />
          </dl>
          <DotGlobe className="hero__globe" label={t.hero.globeAlt} hud={t.hero.hud} control={globe} />
          <dl className="hero__stats hero__stats--end">
            <Stat stat={s2} align="end" />
            <Stat stat={s4} align="end" />
          </dl>
        </div>

        <div className="hero__legend">
          <ul>
            {t.hero.globeLegend.map((item) => (
              <li key={item.kind}>
                <span className={`legend-dot legend-dot--${item.kind}`} aria-hidden="true" />
                {item.text}
              </li>
            ))}
          </ul>
          <p className="t-mono">{t.hero.globeNote}</p>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section id="impacto" className="section" aria-labelledby="problem-title">
      <div className="section__inner stack-64" data-depth>
        <SectionHeader id="problem-title" eyebrow={t.problem.eyebrow} title={t.problem.title} lead={t.problem.lead} />
        <ul className="facts" data-stagger="card">
          {t.problem.facts.map((fact) => (
            <li key={fact.value} className="fact" data-inview>
              <p className="t-numeral-lg c-strong" data-count>
                {fact.value}
              </p>
              <p className="t-body-lg c-default">{fact.text}</p>
              <p className="t-caption t-mono c-muted">{fact.source}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function HowItWorks() {
  const ref = useRef(null)

  // The hairline above the steps fills as the section scrolls through the viewport.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        gsap.from(ref.current.querySelector('.how__track span'), {
          scaleX: 0,
          ease: 'none',
          scrollTrigger: { trigger: ref.current.querySelector('.steps'), start: 'top 85%', end: 'bottom 55%', scrub: 1 },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="como-funciona" className="section" aria-labelledby="how-title">
      <div className="section__inner stack-64" data-depth>
        <SectionHeader id="how-title" eyebrow={t.how.eyebrow} title={t.how.title} lead={t.how.lead} />
        <div>
          <div className="how__track" aria-hidden="true">
            <span />
          </div>
          <ol className="steps" data-stagger="card">
            {t.how.steps.map((step) => (
              <li key={step.number} className="step">
                <span className="step__number t-mono" aria-hidden="true" data-scramble>
                  {step.number}
                </span>
                <h3 className="t-h2 c-strong">{step.title}</h3>
                <p className="t-body c-muted">{step.text}</p>
                <div className="step__tags">
                  {step.tags.map((tag) => (
                    <Badge key={tag.text} tone={tag.tone}>
                      {tag.text}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Emergency() {
  const ref = useRef(null)

  // While reading, the step crossing the middle of the screen lights up and the line fills to it.
  // Without motion (or without JS) every step stays fully visible.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(ref)
      mm.add(MOTION_OK, () => {
        const list = q('.timeline')[0]
        list.classList.add('is-enhanced')
        const items = q('.timeline__item')
        items.forEach((item) =>
          ScrollTrigger.create({
            trigger: item,
            start: 'top 62%',
            end: 'bottom 62%',
            onToggle: (self) => self.isActive && items.forEach((el) => el.classList.toggle('is-active', el === item)),
          }),
        )
        items[0].classList.add('is-active')
        gsap.from(q('.timeline__progress'), {
          scaleY: 0,
          ease: 'none',
          scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.6 },
        })
        return () => {
          list.classList.remove('is-enhanced')
          items.forEach((el) => el.classList.remove('is-active'))
        }
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="emergencia" className="section emergency" aria-labelledby="emergency-title">
      <div className="section__inner emergency__inner">
        <div className="emergency__aside">
          <SectionHeader
            id="emergency-title"
            eyebrow={t.emergency.eyebrow}
            title={t.emergency.title}
            lead={t.emergency.lead}
            tone="emergency"
          />
          <figure className="messages" data-reveal="card" data-delay="0.2" data-spotlight data-tilt>
            <figcaption className="t-overline c-muted">{t.emergency.messagesTitle}</figcaption>
            <ul>
              {t.emergency.messages.map((message) => (
                <li key={message} className="t-h2 c-strong">
                  «{message}»
                </li>
              ))}
            </ul>
          </figure>
        </div>

        <ol className="timeline">
          <span className="timeline__progress" aria-hidden="true" />
          {t.emergency.steps.map((step, i) => (
            <li key={step.title} className="timeline__item" data-reveal="blur">
              <span className="timeline__icon" aria-hidden="true">
                <Icon name={step.icon} size={18} />
              </span>
              <div className="timeline__text">
                <h3 className="t-h2 c-strong">
                  <span className="t-mono timeline__number">{String(i + 1).padStart(2, '0')}</span> {step.title}
                </h3>
                <p className="t-body-lg c-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Audiences() {
  const [active, setActive] = useState(0)
  const tabs = useRef([])
  const panel = useRef(null)
  const baseId = useId()
  const roles = t.audiences.roles
  const role = roles[active]

  const switched = useRef(false)
  const select = (index, focus = false) => {
    switched.current = true
    setActive(index)
    if (focus) tabs.current[index]?.focus()
  }

  // Roving focus between tabs: arrows, Home and End (WAI-ARIA tabs pattern, automatic activation).
  const onKeyDown = (e) => {
    const last = roles.length - 1
    const keys = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }
    if (e.key in keys) {
      e.preventDefault()
      select(keys[e.key], true)
    }
  }

  // Tabs cascade in when the section arrives.
  const section = useRef(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          section.current.querySelectorAll('.tabs__tab'),
          { y: 26, opacity: 0, scale: 0.9, filter: 'blur(6px)' },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            clearProps: 'filter',
            duration: 0.8,
            ease: EASE.smooth,
            stagger: 0.08,
            scrollTrigger: { trigger: section.current.querySelector('.tabs'), start: 'top 85%', toggleActions: 'play none none reverse' },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: section },
  )

  // Switching roles: the visual wipes open, its icon pops, the figure counts, the copy follows.
  useGSAP(
    () => {
      if (prefersReducedMotion() || !switched.current) return
      const q = gsap.utils.selector(panel)
      gsap
        .timeline({ defaults: { ease: EASE.out } })
        .fromTo(
          q('.role__visual'),
          { clipPath: 'inset(0% 100% 0% 0% round 24px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 0.9, ease: EASE.smooth, clearProps: 'clipPath' },
        )
        .from(q('.role__icon'), { scale: 0.4, rotation: -30, opacity: 0, duration: 0.8, ease: 'back.out(2.2)' }, 0.15)
        .add(() => countUp(q('.role__metric')[0], { duration: 1.1 }), 0.2)
        .fromTo(
          q('.role__body h3'),
          { y: 22, opacity: 0, filter: 'blur(6px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', clearProps: 'filter', duration: 0.6 },
          0.1,
        )
        .from(q('.role__benefits li'), { x: -26, opacity: 0, stagger: 0.07, duration: 0.55 }, 0.22)
        .from(q('.role__body .btn'), { y: 14, opacity: 0, duration: 0.5 }, 0.42)
    },
    { dependencies: [active], scope: panel },
  )

  // Sliding pill (transitions-dev 16 · Tabs sliding), on two axes because the tabs wrap on phones.
  // The first placement and resizes are written without a transition so the pill never flies in.
  const pill = useRef(null)
  const placed = useRef(false)
  const movePill = (animate) => {
    const tab = tabs.current[active]
    const el = pill.current
    if (!tab || !el) return
    const write = () => {
      el.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`
      el.style.width = `${tab.offsetWidth}px`
      el.style.height = `${tab.offsetHeight}px`
    }
    if (animate) return write()
    const prev = el.style.transition
    el.style.transition = 'none'
    write()
    void el.offsetWidth
    el.style.transition = prev
  }
  useLayoutEffect(() => {
    movePill(placed.current)
    placed.current = true
  })
  useEffect(() => {
    const onResize = () => movePill(false)
    window.addEventListener('resize', onResize)
    document.fonts.ready.then(onResize)
    return () => window.removeEventListener('resize', onResize)
  })

  return (
    <section ref={section} id="para-quien" className="section" aria-labelledby="audiences-title">
      <div className="section__inner stack-48" data-depth>
        <SectionHeader id="audiences-title" eyebrow={t.audiences.eyebrow} title={t.audiences.title} center shimmer />
        <div className="tabs" role="tablist" aria-label={t.audiences.tabsLabel} data-reveal="fade">
          <span ref={pill} className="t-tabs-pill tabs__pill" aria-hidden="true" />
          {roles.map((r, i) => (
            <button
              key={r.id}
              ref={(el) => (tabs.current[i] = el)}
              type="button"
              role="tab"
              id={`${baseId}-tab-${r.id}`}
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              className={`tabs__tab ${i === active ? 'is-active' : ''}`}
              onClick={() => select(i)}
              onKeyDown={onKeyDown}
            >
              {r.tab}
            </button>
          ))}
        </div>
        <div
          ref={panel}
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${role.id}`}
          className="role"
          tabIndex={0}
        >
          <div className="role__visual" data-spotlight data-tilt>
            <span className="role__icon" aria-hidden="true">
              <Icon name={role.icon} size={28} />
            </span>
            <p key={role.id} className="t-numeral-lg c-strong role__metric">
              {role.metric.value}
            </p>
            <p className="t-body c-muted">{role.metric.label}</p>
          </div>
          <div className="role__body">
            <h3 className="t-h2-web c-strong">{role.title}</h3>
            <ul className="role__benefits">
              {role.benefits.map((benefit) => (
                <li key={benefit} className="t-body-lg c-default">
                  <Icon name="check" size={18} className="c-brand" />
                  {benefit}
                </li>
              ))}
            </ul>
            <Button variant="secondary" icon="arrow-right" to={role.cta.to}>
              {role.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Scenarios() {
  const s = t.scenarios
  const [index, setIndex] = useState(0)
  const card = useRef(null)
  const total = s.items.length
  const item = s.items[index]
  const coverage = Number.parseInt(item.coverage, 10) / 100

  const dir = useRef(1) // 1 = forward, -1 = back: the card slides in from that side
  const go = (next) => {
    dir.current = next >= index ? 1 : -1
    setIndex((next + total) % total)
  }
  // Relative moves read the latest index, so fast repeated presses never skip or stall.
  const step = (delta) => {
    dir.current = delta
    setIndex((i) => (i + delta + total) % total)
  }

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const q = gsap.utils.selector(card)
      gsap.fromTo(
        q('[data-animate]'),
        { x: 56 * dir.current, opacity: 0, filter: 'blur(6px)' },
        { x: 0, opacity: 1, filter: 'blur(0px)', clearProps: 'filter', duration: 0.7, stagger: 0.05, ease: EASE.smooth },
      )
      q('.scenario__metrics dd').forEach((el, i) => countUp(el, { duration: 1, delay: 0.15 + i * 0.06 }))
    },
    { dependencies: [index], scope: card },
  )

  const metrics = [
    ['slots', item.slots],
    ['notified', item.notified],
    ['firstCall', item.firstCall],
    ['coverage', item.coverage],
  ]

  return (
    <section id="escenarios" className="section" aria-labelledby="scenarios-title">
      <div className="section__inner scenarios" data-depth>
        <div className="scenarios__intro">
          <SectionHeader id="scenarios-title" eyebrow={s.eyebrow} title={s.title} lead={s.lead} />
          <dl className="scenarios__summary" data-stagger="card">
            {s.summary.map((stat) => (
              <div key={stat.label}>
                <dt className="t-numeral-md c-strong">{stat.value}</dt>
                <dd className="t-body-sm c-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="carousel"
          role="group"
          aria-roledescription="carrusel"
          aria-label={s.title}
          data-reveal="card"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') step(1)
            if (e.key === 'ArrowLeft') step(-1)
          }}
        >
          <div className="carousel__bar">
            <p className="t-label c-default" aria-live="polite">
              {s.position(index + 1, total)}
            </p>
            <div className="carousel__controls">
              <button type="button" className="round-btn" onClick={() => step(-1)} aria-label={s.prev}>
                <Icon name="chevron-left" size={18} />
              </button>
              <div className="carousel__dots">
                {s.items.map((it, i) => (
                  <button
                    key={it.type}
                    type="button"
                    className={`carousel__dot ${i === index ? 'is-active' : ''}`}
                    aria-label={s.goTo(i + 1)}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => go(i)}
                  />
                ))}
              </div>
              <button type="button" className="round-btn" onClick={() => step(1)} aria-label={s.next}>
                <Icon name="chevron-right" size={18} />
              </button>
            </div>
          </div>

          <article ref={card} className="scenario" data-spotlight data-tilt aria-roledescription="diapositiva" aria-label={s.position(index + 1, total)}>
            <div className="scenario__tags" data-animate>
              <Badge tone="warning">{`${es.common.emergency} · ${item.type}`}</Badge>
              <Badge tone="neutral">{s.simulated}</Badge>
            </div>
            <h3 className="t-h1-web c-strong" data-animate>
              {item.place}
            </h3>
            <dl className="scenario__meta" data-animate>
              <div>
                <dt className="t-overline c-muted">{s.labels.point}</dt>
                <dd className="t-body-lg c-default">{item.point}</dd>
              </div>
              <div>
                <dt className="t-overline c-muted">{s.labels.skills}</dt>
                <dd className="t-body-lg c-default">{item.skills}</dd>
              </div>
            </dl>
            <dl className="scenario__metrics">
              {metrics.map(([key, value]) => (
                <div key={`${index}-${key}`} data-animate>
                  <dt className="t-body-sm c-muted">{s.labels[key]}</dt>
                  <dd className="t-numeral-md c-strong">{value}</dd>
                </div>
              ))}
            </dl>
            <div data-animate>
              <ProgressBar value={coverage} height={4} label={`${s.labels.coverage}: ${item.coverage}`} />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function Mark({ yes }) {
  return yes ? (
    <span className="mark mark--yes">
      <Icon name="check" size={16} label={t.comparison.yes} />
    </span>
  ) : (
    <span className="mark mark--no">
      <Icon name="minus" size={16} label={t.comparison.no} />
    </span>
  )
}

function Comparison() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(ref)
      mm.add(MOTION_OK, () => {
        const scrollTrigger = { trigger: q('.compare')[0], start: 'top 75%', toggleActions: 'play none none reverse' }
        gsap
          .timeline({ scrollTrigger })
          .from(q('.compare tbody tr'), { x: -30, opacity: 0, duration: 0.6, stagger: 0.08, ease: EASE.out }, 0.2)
          .from(q('.compare .mark'), { scale: 0, rotation: -120, duration: 0.6, stagger: 0.06, ease: 'back.out(2.4)' }, 0.45)
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="por-que" className="section" aria-labelledby="comparison-title">
      <div className="section__inner stack-48" data-depth>
        <SectionHeader id="comparison-title" eyebrow={t.comparison.eyebrow} title={t.comparison.title} lead={t.comparison.lead} />
        <div className="compare" data-reveal="clip" data-spotlight>
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t.comparison.criterion}</span>
                </th>
                <th scope="col" className="c-muted">
                  {t.comparison.social}
                </th>
                <th scope="col" className="c-strong">
                  {t.comparison.us}
                </th>
              </tr>
            </thead>
            <tbody>
              {t.comparison.rows.map((row) => (
                <tr key={row.text}>
                  <th scope="row" className="t-body-lg c-default">
                    {row.text}
                  </th>
                  <td>
                    <Mark yes={row.social} />
                  </td>
                  <td>
                    <Mark yes />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="trust" aria-label={t.trustLabel} data-stagger="card">
          {t.trust.map((item) => (
            <li key={item.title}>
              <span className="trust__icon" aria-hidden="true">
                <Icon name={item.icon} size={18} />
              </span>
              <h3 className="t-h3 c-strong">{item.title}</h3>
              <p className="t-body c-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const EMPTY = { name: '', nit: '', city: '', type: '', email: '', consent: false }
const NIT = /^\d{9}(-?\d)?$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values) {
  const e = t.access.errors
  const errors = {}
  if (!values.name.trim()) errors.name = e.required
  if (!values.nit.trim()) errors.nit = e.required
  else if (!NIT.test(values.nit.replace(/[\s.]/g, ''))) errors.nit = e.nit
  if (!values.city) errors.city = e.required
  if (!values.type) errors.type = e.required
  if (!values.email.trim()) errors.email = e.required
  else if (!EMAIL.test(values.email.trim())) errors.email = e.email
  if (!values.consent) errors.consent = e.consent
  return errors
}

function AccessRequest() {
  const a = t.access
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [done, setDone] = useState(false)
  const fields = useRef({})
  const summary = useRef(null)
  const doneRef = useRef(null)

  const errors = validate(values)
  // Errors show after the user leaves a field, or for every field once they try to submit.
  const errorFor = (key) => (submitted || touched[key] ? errors[key] : undefined)
  const shownErrors = Object.keys(errors).filter((key) => errorFor(key))

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  const blur = (key) => () => setTouched((tc) => ({ ...tc, [key]: true }))
  const bind = (key) => ({
    value: values[key],
    onChange: set(key),
    onBlur: blur(key),
    error: errorFor(key),
    inputRef: (el) => (fields.current[key] = el),
    required: true,
    'aria-required': true,
  })

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    const invalid = Object.keys(errors)
    if (invalid.length) {
      // Move focus to the summary so screen readers announce it; the first field is one Tab away.
      requestAnimationFrame(() => summary.current?.focus())
      return
    }
    setDone(true)
    requestAnimationFrame(() => doneRef.current?.focus())
  }

  const reset = () => {
    setValues(EMPTY)
    setTouched({})
    setSubmitted(false)
    setDone(false)
  }

  return (
    <section id="acceso" className="section" aria-labelledby="access-title">
      <div className="section__inner" data-depth>
        <div className="access" data-reveal="card" data-spotlight>
          <div className="access__intro">
            <p className="eyebrow">{a.eyebrow}</p>
            <h2 id="access-title" className="t-h1-web c-strong">
              {a.title}
            </h2>
            <p className="t-body-lg t-mono c-muted">{a.lead}</p>
            <div className="access__volunteer">
              <h3 className="t-h3 c-strong">{a.volunteerTitle}</h3>
              <p className="t-body c-muted">{a.volunteerText}</p>
              <Button variant="outline" to="/registro">
                {a.volunteerCta}
              </Button>
            </div>
          </div>

          {done ? (
            <div ref={doneRef} className="access__done" role="status" tabIndex={-1}>
              {/* Success check (transitions-dev 10): fade + rotate + blur + bob, then the stroke draws */}
              <span className="access__done-icon t-success-check" data-state="in" aria-hidden="true">
                <svg viewBox="0 0 48 48" width="30" height="30" fill="none">
                  <path d="M13 24.5l7.5 7.5L35 17.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="t-h2-web c-strong">{a.doneTitle}</h3>
              <p className="t-body-lg c-muted">{a.doneText}</p>
              <Button variant="secondary" icon="refresh" onClick={reset}>
                {a.doneAgain}
              </Button>
            </div>
          ) : (
            <form className="access__form" noValidate onSubmit={onSubmit} data-stagger="blur" data-delay="0.2">
              {submitted && shownErrors.length > 0 && (
                <div ref={summary} className="access__summary" role="alert" tabIndex={-1}>
                  <Icon name="alert-triangle" size={18} />
                  <div>
                    <p className="t-label">{a.errors.summary(shownErrors.length)}</p>
                    <ul>
                      {shownErrors.map((key) => (
                        <li key={key}>
                          <a
                            href={`#${key}`}
                            onClick={(e) => {
                              e.preventDefault()
                              fields.current[key]?.focus()
                            }}
                          >
                            {key === 'consent' ? a.errors.consent : `${a.fields[key].label}: ${errors[key]}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <TextField label={a.fields.name.label} placeholder={a.fields.name.placeholder} autoComplete="organization" {...bind('name')} />
              <TextField
                label={a.fields.nit.label}
                placeholder={a.fields.nit.placeholder}
                hint={a.fields.nit.hint}
                inputMode="numeric"
                {...bind('nit')}
              />
              <div className="access__row">
                <SelectField label={a.fields.city.label} placeholder={a.fields.city.placeholder} options={a.cities} {...bind('city')} />
                <SelectField label={a.fields.type.label} placeholder={a.fields.type.placeholder} options={a.types} {...bind('type')} />
              </div>
              <TextField
                label={a.fields.email.label}
                type="email"
                placeholder={a.fields.email.placeholder}
                autoComplete="email"
                {...bind('email')}
              />
              <Checkbox
                checked={values.consent}
                onChange={(consent) => {
                  setValues((v) => ({ ...v, consent }))
                  setTouched((tc) => ({ ...tc, consent: true }))
                }}
                error={errorFor('consent')}
                inputRef={(el) => (fields.current.consent = el)}
                required
              >
                {a.consent}
              </Checkbox>
              <Button type="submit" block>
                {a.submit}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/** W01 · Sitio público — Inicio (v2.1, minimal dark with scrollytelling). */
export default function Landing() {
  const main = useRef(null)
  useReveal(main)

  return (
    <>
      <SiteHeader />
      <main ref={main}>
        <Hero />
        <LiveTicker copy={t.ticker} />
        <Problem />
        <HowItWorks />
        <Emergency />
        <Audiences />
        <Scenarios />
        <Comparison />
        <AccessRequest />
      </main>
      <SectionNav
        sections={t.sectionNav.sections}
        label={t.sectionNav.label}
        prevLabel={t.sectionNav.prev}
        nextLabel={t.sectionNav.next}
      />
      <SiteFooter />
    </>
  )
}
