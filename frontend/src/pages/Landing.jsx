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
      <p className="t-overline c-brand">{eyebrow}</p>
      <h2 id={id} className="t-h1-web c-strong">
        {title}
      </h2>
      {lead && <p className="t-body-xl c-muted">{lead}</p>}
    </header>
  )
}

function Hero() {
  return (
    <section className="section section--page" aria-labelledby="hero-title">
      <div className="section__inner hero">
        <div className="hero__message">
          <p className="hero__eyebrow">{t.hero.eyebrow}</p>
          <h1 id="hero-title" className="t-display c-strong">
            {t.hero.title}
          </h1>
          <p className="t-body-xl c-muted">{t.hero.lead}</p>
          <div className="hero__actions">
            <Button icon="heart" to="/registro">
              {es.site.wantToHelp}
            </Button>
            <Button variant="secondary" icon="building" to="/ingreso">
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
    </section>
  )
}

function Problem() {
  return (
    <section id="impacto" className="section section--card" aria-labelledby="problem-title">
      <div className="section__inner stack-40">
        <SectionHeader id="problem-title" eyebrow={t.problem.eyebrow} title={t.problem.title} lead={t.problem.lead} />
        <ul className="grid-3">
          {t.problem.facts.map((fact) => (
            <li key={fact.value} className="fact">
              <p className="t-h1-web c-brand">{fact.value}</p>
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
  return (
    <section id="como-funciona" className="section section--page" aria-labelledby="how-title">
      <div className="section__inner stack-48">
        <SectionHeader id="how-title" eyebrow={t.how.eyebrow} title={t.how.title} lead={t.how.lead} center />
        <ol className="grid-3">
          {t.how.steps.map((step, i) => (
            <li key={step.number} className="step-card">
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

function AudienceCard({ data, tone, tile, button }) {
  return (
    <article className={`audience audience--${tone}`}>
      <IconTile {...tile} size={56} iconSize={28} radius={18} />
      <h3 className="t-h2-web c-strong">{data.title}</h3>
      <ul className="audience__benefits">
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
        <div className="grid-2">
          <AudienceCard
            data={t.audiences.volunteers}
            tone="volunteers"
            tile={{ icon: 'heart', tone: 'brand' }}
            button={
              <Button icon="heart" to="/registro">
                {t.audiences.volunteers.cta}
              </Button>
            }
          />
          <AudienceCard
            data={t.audiences.organizations}
            tone="organizations"
            tile={{ icon: 'building', tone: 'card' }}
            button={
              <Button variant="secondary" icon="building" to="/ingreso">
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
        <div className="compare">
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
      </div>
    </section>
  )
}

function Trust() {
  return (
    <section className="section section--card section--trust" aria-label={t.trustLabel}>
      <ul className="section__inner trust">
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
  return (
    <section className="section section--page" aria-labelledby="cta-title">
      <div className="section__inner">
        <div className="cta-band">
          <div className="cta-band__text">
            <h2 id="cta-title" className="t-h1-web c-on">
              {t.cta.title}
            </h2>
            <p className="t-body-xl c-on">{t.cta.lead}</p>
          </div>
          <div className="cta-band__actions">
            <Button variant="secondary" icon="heart" iconClass="c-brand" to="/registro">
              {es.site.wantToHelp}
            </Button>
            <Button variant="secondary" icon="building" to="/ingreso">
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
  return (
    <>
      <SiteHeader />
      <main>
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
