import { useRef, useState } from 'react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import PanelHeader from '../../components/panel/PanelHeader'
import ResponsesTable from '../../components/panel/ResponsesTable'
import Segmented from '../../components/panel/Segmented'
import StatTile from '../../components/panel/StatTile'
import { CALL_ACTIVITY, HISTORY, RESPONSES } from '../../data/demo'
import es from '../../i18n/es'
import PageTransition from '../../motion/PageTransition'
import { useReveal } from '../../motion/useReveal'
import './Calls.css'

const t = es.calls
const SLOTS = 4

/** Active call: the Modo Emergencia card, its instructions, who was called and the live log. */
function ActiveCall({ covered, onCover, resent, onResend }) {
  const root = useRef(null)
  const [guide, setGuide] = useState(t.guide.tabs[0].id)
  useReveal(root)

  const guideTab = t.guide.tabs.find((item) => item.id === guide)
  const filled = covered ? SLOTS : SLOTS - 1

  return (
    <div ref={root} id="calls-panel-active" role="tabpanel" aria-labelledby="calls-tab-active" className="calls" data-stagger="blur">
      <section className="calls__hero" aria-labelledby="call-title">
        <div className="calls__hero-top">
          <span className="calls__chip">
            <Icon name={covered ? 'check' : 'alert-triangle'} size={14} />
            {covered ? t.hero.covered : t.hero.badge}
          </span>
          <span className="calls__hero-meta">{t.hero.activated}</span>
        </div>

        <p className="calls__hero-figure">
          {/* Remounts on change so the count-up never fights React over the text node */}
          <span key={filled} className="calls__hero-value" data-count>
            {t.hero.value(filled, SLOTS)}
          </span>
          <span className="calls__hero-unit">{t.hero.unit}</span>
        </p>

        <div
          className="meter calls__meter"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={(filled / SLOTS) * 100}
          aria-label={covered ? t.progressDone : t.progress}
          style={{ '--meter-value': filled / SLOTS }}
          data-inview
        >
          <span className="meter__fill" />
        </div>
        <div className="calls__hero-legend">
          <h2 id="call-title">{t.hero.place}</h2>
          <span>{covered ? t.hero.done : t.hero.remaining}</span>
        </div>

        <div className="calls__hero-actions">
          <Button icon="check" className="btn--sm calls__btn-light" disabled={covered} onClick={onCover}>
            {t.markCovered}
          </Button>
          <Button variant="secondary" icon="refresh" className="btn--sm calls__btn-ghost" disabled={covered} onClick={onResend}>
            {t.resend}
          </Button>
          <p className="calls__status" role="status">
            {resent && !covered ? t.resent : ''}
          </p>
        </div>
      </section>

      <section className="card calls__guide" aria-labelledby="guide-title">
        <h2 id="guide-title" className="card-title">
          {t.guide.title}
        </h2>
        <Segmented items={t.guide.tabs} value={guide} onChange={setGuide} label={t.guide.tabsLabel} idBase="guide" />
        <ul key={guide} id={`guide-panel-${guide}`} role="tabpanel" aria-labelledby={`guide-tab-${guide}`} className="calls__checklist">
          {guideTab.items.map((item) => (
            <li key={item}>
              <span className="calls__check" aria-hidden="true">
                <Icon name="check" size={12} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="t-caption c-muted calls__guide-note">{t.guide.note}</p>
      </section>

      <section className="card calls__table" aria-labelledby="called-title">
        <div className="card-head">
          <div>
            <h2 id="called-title" className="card-title">
              {t.tableTitle}
            </h2>
            <p className="t-body-sm c-muted">{t.tableText}</p>
          </div>
          <Button variant="soft" icon="map" className="btn--sm" to="/panel/mapa">
            {t.seeOnMap}
          </Button>
        </div>
        <ResponsesTable rows={RESPONSES} withDetail caption={t.tableTitle} />
      </section>

      <section className="card calls__activity" aria-labelledby="activity-title">
        <div className="card-head">
          <h2 id="activity-title" className="card-title">
            {t.timeline.title}
          </h2>
          <Badge tone="info">{t.timeline.live}</Badge>
        </div>
        <ol className="calls__timeline" data-stagger="left" data-delay="0.3">
          {CALL_ACTIVITY.map((item) => (
            <li key={`${item.time}-${item.title}`}>
              <span className={`calls__dot calls__dot--${item.tone}`} aria-hidden="true">
                <Icon name={item.icon} size={14} />
              </span>
              <div>
                <p className="t-label c-strong">{item.title}</p>
                <p className="t-caption c-muted">{item.text}</p>
              </div>
              <time className="t-caption c-muted">{item.time}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

/** Closed calls, one card each. */
function CallHistory() {
  const root = useRef(null)
  useReveal(root)

  return (
    <div ref={root} id="calls-panel-history" role="tabpanel" aria-labelledby="calls-tab-history" className="calls-history">
      <section className="card calls-history__stats" aria-label={t.historyStatsLabel}>
        <div className="calls-history__tiles" data-stagger="scale">
          {t.historyStats.map(({ id, ...stat }) => (
            <StatTile key={id} {...stat} />
          ))}
        </div>
      </section>
      <p className="t-body c-muted">{t.historyLead}</p>
      <ul className="calls-history__grid" data-stagger="scale">
        {HISTORY.map((item) => (
          <li key={item.title} className="card calls-history__item" data-hover="lift">
            <span className="calls-history__icon" aria-hidden="true">
              <Icon name={item.icon} size={18} />
            </span>
            <div className="calls-history__text">
              <p className="t-h3 c-strong">{item.title}</p>
              <p className="t-body-sm c-muted">{item.text}</p>
            </div>
            <div className="row-between">
              <span className="t-caption c-muted">{item.date}</span>
              <Badge tone={item.tone}>{item.status}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** W06 · Convocatorias y respuestas (Figma 27:1395). RF-07, RF-08. */
export default function Calls({ initialTab = 'active' }) {
  const [tab, setTab] = useState(initialTab)
  const [covered, setCovered] = useState(false)
  const [resent, setResent] = useState(false)
  const head = useRef(null)
  useReveal(head)

  const tabs = [
    { id: 'active', label: t.tabs.active, count: 1 },
    { id: 'history', label: t.tabs.history, count: HISTORY.length },
  ]

  return (
    <>
      <div ref={head}>
        <PanelHeader title={t.title} subtitle={t.subtitle}>
          <Segmented items={tabs} value={tab} onChange={setTab} label={t.tabsLabel} idBase="calls" />
        </PanelHeader>
      </div>

      <PageTransition key={tab}>
        {tab === 'active' ? (
          <ActiveCall covered={covered} onCover={() => setCovered(true)} resent={resent} onResend={() => setResent(true)} />
        ) : (
          <CallHistory />
        )}
      </PageTransition>
    </>
  )
}
