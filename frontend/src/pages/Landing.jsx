import { useRef } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { ProgressBar } from '../components/FormControls'
import Icon from '../components/Icon'
import IconTile from '../components/IconTile'
import IllustratedMap from '../components/IllustratedMap'
import { AppIcon } from '../components/Logo'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import es from '../i18n/es'
import { DESKTOP, DURATION, EASE, FINE_POINTER, gsap, MOTION_OK, REDUCED, SplitText, useGSAP } from '../motion/gsap'
import { countUp, useReveal } from '../motion/useReveal'
import './Landing.css'

const t = es.landing

const STEP_ICONS = [
  { icon: 'building', tone: 'info' },
  { icon: 'filter', tone: 'brand' },
  { icon: 'send', tone: 'success' },
]

const TRUST_ICONS = [
  { icon: 'shield-check', tone: 'success' },
  { icon: 'eye-off', tone: 'sunken' },
  { icon: 'id-card', tone: 'info' },
]

function SectionHeader({ eyebrow, title, lead, center = false, id }) {
  return (
    <header className={`section-header ${center ? 'section-header--center' : ''}`}>
      <p className="t-overline c-brand" data-reveal="fade">
        {eyebrow}
      </p>
      <h2 id={id} className="t-h1-web c-strong" data-split>
        {title}
      </h2>
      {lead && (
        <p className="t-body-xl c-muted" data-reveal="up" data-delay="0.15">
          {lead}
        </p>
      )}
    </header>
  )
}

function Hero() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(ref)

      mm.add(MOTION_OK, () => {
        // Entrance, scaled in time: eyebrow, headline word by word, copy, actions, figures, then the map.
        // It starts once the web font is ready, so the words are measured once and nothing jumps.
        const title = SplitText.create(q('h1')[0], { type: 'words', mask: 'words' })
        const intro = gsap.timeline({ paused: true, defaults: { duration: DURATION.slow, ease: EASE.out } })
        intro
          .from(q('.hero__eyebrow'), { yPercent: 40, autoAlpha: 0, duration: 0.9 })
          .from(title.words, { yPercent: 100, duration: 1.4, ease: EASE.smooth, stagger: 0.06 }, 0.15)
          .from(q('.hero__lead'), { yPercent: 12, autoAlpha: 0 }, 0.55)
          .from(q('.hero__actions > *'), { yPercent: 40, autoAlpha: 0, stagger: 0.1 }, 0.7)
          .from(q('.hero__stats > div'), { yPercent: 30, autoAlpha: 0, stagger: 0.1 }, 0.85)
          .add(() => q('.hero__stats dt').forEach((el, i) => countUp(el, { delay: i * 0.12 })), 0.9)
          .from(q('.hero__visual'), { yPercent: 6, scale: 0.97, autoAlpha: 0, duration: 1.8, ease: EASE.smooth }, 0.3)
          .from(q('.hero__push'), { yPercent: -30, autoAlpha: 0, duration: 1.2, ease: EASE.smooth }, 1.2)
          .from(q('.hero__responses'), { yPercent: 30, autoAlpha: 0, duration: 1.2, ease: EASE.smooth }, 1.45)
        document.fonts.ready.then(() => intro.play())

        // Idle: the two cards breathe, out of phase.
        gsap.to(q('.hero__push'), { y: -5, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.6 })
        gsap.to(q('.hero__responses'), { y: 5, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.9 })

        // Scroll: the copy drifts up and dims slightly, the map lags behind it (parallax).
        const scroll = { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 1 }
        gsap.to(q('.hero__message'), { y: -50, opacity: 0.35, ease: 'none', scrollTrigger: scroll })
        gsap.to(q('.hero__tilt'), { y: 60, ease: 'none', scrollTrigger: scroll })
      })

      // Pointer: a restrained 3D tilt of the map card (mouse and trackpad only).
      mm.add(`${MOTION_OK} and ${FINE_POINTER}`, () => {
        const card = ref.current.querySelector('.hero__tilt')
        const rotX = gsap.quickTo(card, 'rotationX', { duration: 1.2, ease: EASE.out })
        const rotY = gsap.quickTo(card, 'rotationY', { duration: 1.2, ease: EASE.out })
        const move = (e) => {
          const r = card.getBoundingClientRect()
          rotY(((e.clientX - r.left) / r.width - 0.5) * 5)
          rotX(-((e.clientY - r.top) / r.height - 0.5) * 5)
        }
        const leave = () => {
          rotX(0)
          rotY(0)
        }
        card.addEventListener('mousemove', move)
        card.addEventListener('mouseleave', leave)
        return () => {
          card.removeEventListener('mousemove', move)
          card.removeEventListener('mouseleave', leave)
        }
      })

      // Reduced motion: the same order, opacity only.
      mm.add(REDUCED, () => {
        gsap.from(q('.hero__eyebrow, h1, .hero__lead, .hero__actions, .hero__stats, .hero__visual'), {
          autoAlpha: 0,
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
    <section ref={ref} className="section section--page" aria-labelledby="hero-title">
      <div className="section__inner hero">
        <div className="hero__message">
          <p className="hero__eyebrow">{t.hero.eyebrow}</p>
          <h1 id="hero-title" className="t-display c-strong">
            {t.hero.title}
          </h1>
          <p className="t-body-xl c-muted hero__lead">{t.hero.lead}</p>
          <div className="hero__actions">
            <Button icon="heart" to="/registro" data-magnetic>
              {es.site.wantToHelp}
            </Button>
            <Button variant="secondary" icon="building" to="/ingreso" data-magnetic>
              {es.site.imOrganization}
            </Button>
          </div>
          <dl className="hero__stats">
            {t.hero.stats.map((stat) => (
              <div key={stat.label}>
                <dt className="t-numeral-md c-brand">{stat.value}</dt>
                <dd className="t-body-sm c-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero__visual">
          <div className="hero__tilt">
          <IllustratedMap scene="hero" alt={t.hero.mapAlt} chipLabel={t.hero.radius} className="hero__map">
            <div className="hero__push" aria-hidden="true">
              <AppIcon />
              <div className="hero__push-text">
                <div className="hero__push-head">
                  <span className="t-overline">{t.hero.push.app}</span>
                  <span className="t-caption">{t.hero.push.time}</span>
                </div>
                <p className="t-label c-strong">{t.hero.push.title}</p>
                <p className="t-body-sm c-default">{t.hero.push.body}</p>
              </div>
            </div>
            <div className="hero__responses" aria-hidden="true">
              <div className="hero__responses-head">
                <span className="t-label-sm c-muted">{t.hero.responses.title}</span>
                <Badge tone="info">{t.hero.responses.live}</Badge>
              </div>
              <p className="t-h3 c-strong">{t.hero.responses.value}</p>
              <ProgressBar value={0.75} />
            </div>
          </IllustratedMap>
          </div>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section id="impacto" className="section section--card" aria-labelledby="problem-title">
      <div className="section__inner stack-40">
        <SectionHeader id="problem-title" eyebrow={t.problem.eyebrow} title={t.problem.title} lead={t.problem.lead} />
        <ul className="grid-3" data-stagger="up" data-parallax="-6">
          {t.problem.facts.map((fact) => (
            <li key={fact.value} className="fact" data-hover="lift">
              <p className="t-h1-web c-brand" data-count>
                {fact.value}
              </p>
              <p className="t-body-lg c-default">{fact.text}</p>
              <p className="t-caption c-muted">{fact.source}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function HowItWorks() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(ref)
      const cards = q('.step-card')

      // Desktop: the section pins while the three steps rise one after another and the
      // progress line fills, all tied to the scroll (scrub) so it never fights the reader.
      mm.add(`${MOTION_OK} and ${DESKTOP}`, () => {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: ref.current, start: 'top top', end: '+=110%', pin: true, scrub: 1, anticipatePin: 1 },
          })
          .from(q('.how__track span'), { scaleX: 0, duration: 3 }, 0)
          .from(cards, { yPercent: 14, autoAlpha: 0, duration: 0.8, stagger: 1, ease: EASE.out }, 0)
          .to({}, { duration: 0.4 }) // short hold before the pin releases
      })

      // Tablet / phone: no pin, a regular staggered entrance.
      mm.add(`${MOTION_OK} and (max-width: 1023px)`, () => {
        gsap.from(cards, {
          yPercent: 10,
          autoAlpha: 0,
          duration: DURATION.slow,
          stagger: 0.12,
          scrollTrigger: { trigger: q('ol')[0], start: 'top 80%', toggleActions: 'play none none reverse' },
        })
      })

      mm.add(REDUCED, () => {
        gsap.from(cards, {
          autoAlpha: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: { trigger: q('ol')[0], start: 'top 80%', toggleActions: 'play none none reverse' },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} id="como-funciona" className="section section--page how" aria-labelledby="how-title">
      <div className="section__inner stack-48">
        <SectionHeader id="how-title" eyebrow={t.how.eyebrow} title={t.how.title} lead={t.how.lead} center />
        <div className="how__track" aria-hidden="true">
          <span />
        </div>
        <ol className="grid-3">
          {t.how.steps.map((step, i) => (
            <li key={step.number} className="step-card" data-hover="lift">
              <div className="step-card__head">
                <IconTile {...STEP_ICONS[i]} />
                <span className="t-numeral-md step-card__number" aria-hidden="true">
                  {step.number}
                </span>
              </div>
              <h3 className="t-h2 c-strong">{step.title}</h3>
              <p className="t-body c-muted">{step.text}</p>
              <div className="step-card__tags">
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
    </section>
  )
}

function AudienceCard({ data, tone, tile, button, from }) {
  return (
    <article className={`audience audience--${tone}`} data-reveal={from} data-hover="lift">
      <IconTile {...tile} size={56} iconSize={28} radius={18} />
      <h3 className="t-h2-web c-strong">{data.title}</h3>
      <ul className="audience__benefits" data-stagger="left" data-delay="0.3">
        {data.benefits.map((benefit) => (
          <li key={benefit}>
            <IconTile icon="check" tone="card-success" size={26} iconSize={16} round />
            <span className="t-body-lg c-default">{benefit}</span>
          </li>
        ))}
      </ul>
      {button}
    </article>
  )
}

function Audiences() {
  return (
    <section id="para-quien" className="section section--card" aria-labelledby="audiences-title">
      <div className="section__inner stack-40">
        <SectionHeader id="audiences-title" eyebrow={t.audiences.eyebrow} title={t.audiences.title} />
        <div className="grid-2" data-parallax="-5">
          <AudienceCard
            data={t.audiences.volunteers}
            tone="volunteers"
            from="left"
            tile={{ icon: 'heart', tone: 'brand' }}
            button={
              <Button icon="heart" to="/registro" data-magnetic>
                {t.audiences.volunteers.cta}
              </Button>
            }
          />
          <AudienceCard
            data={t.audiences.organizations}
            tone="organizations"
            from="right"
            tile={{ icon: 'building', tone: 'card' }}
            button={
              <Button variant="secondary" icon="building" to="/ingreso" data-magnetic>
                {t.audiences.organizations.cta}
              </Button>
            }
          />
        </div>
      </div>
    </section>
  )
}

function Mark({ yes }) {
  return yes ? (
    <span className="mark mark--yes">
      <Icon name="check" size={18} label={t.comparison.yes} />
    </span>
  ) : (
    <span className="mark mark--no">
      <Icon name="x" size={18} label={t.comparison.no} />
    </span>
  )
}

function Comparison() {
  return (
    <section id="por-que" className="section section--page" aria-labelledby="comparison-title">
      <div className="section__inner stack-40">
        <SectionHeader
          id="comparison-title"
          eyebrow={t.comparison.eyebrow}
          title={t.comparison.title}
          lead={t.comparison.lead}
        />
        <div className="compare" data-reveal="up">
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t.comparison.criterion}</span>
                </th>
                <th scope="col" className="c-default">
                  {t.comparison.social}
                </th>
                <th scope="col" className="c-brand">
                  {t.comparison.us}
                </th>
              </tr>
            </thead>
            <tbody data-stagger="left" data-delay="0.25">
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
      </div>
    </section>
  )
}

function Trust() {
  return (
    <section className="section section--card section--trust" aria-label={t.trustLabel}>
      <ul className="section__inner trust" data-stagger="up">
        {t.trust.map((item, i) => (
          <li key={item.title}>
            <IconTile {...TRUST_ICONS[i]} />
            <div>
              <h3 className="t-h3 c-strong">{item.title}</h3>
              <p className="t-body c-muted">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function CallToAction() {
  const ref = useRef(null)

  // The band opens up from a narrower, rounder shape as it scrolls in.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        // The band opens up gently as it scrolls in (transform only).
        gsap.fromTo(
          ref.current.querySelector('.cta-band'),
          { scale: 0.94 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'center center', scrub: 1 },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="section section--page" aria-labelledby="cta-title">
      <div className="section__inner">
        <div className="cta-band">
          <div className="cta-band__text">
            <h2 id="cta-title" className="t-h1-web c-on" data-split>
              {t.cta.title}
            </h2>
            <p className="t-body-xl c-on" data-reveal="up" data-delay="0.2">
              {t.cta.lead}
            </p>
          </div>
          <div className="cta-band__actions" data-stagger="up" data-delay="0.3">
            <Button variant="secondary" icon="heart" iconClass="c-brand" to="/registro" data-magnetic>
              {es.site.wantToHelp}
            </Button>
            <Button variant="secondary" icon="building" to="/ingreso" data-magnetic>
              {es.site.imOrganization}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/** W01 · Sitio público — Inicio (Figma 23:233). */
export default function Landing() {
  const main = useRef(null)
  useReveal(main)

  return (
    <>
      <SiteHeader />
      <main ref={main}>
        <Hero />
        <Problem />
        <HowItWorks />
        <Audiences />
        <Comparison />
        <Trust />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  )
}
