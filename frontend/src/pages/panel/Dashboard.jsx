import { useRef } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Note } from '../../components/FormControls'
import Icon from '../../components/Icon'
import HeroCard from '../../components/panel/HeroCard'
import MetricCard from '../../components/panel/MetricCard'
import { useNewCall } from '../../components/panel/newCallContext'
import PanelHeader from '../../components/panel/PanelHeader'
import ResponsesTable from '../../components/panel/ResponsesTable'
import VolunteerMap from '../../components/VolunteerMap'
import { HISTORY, RESPONSES } from '../../data/demo'
import LoadState from '../../components/LoadState'
import { formatKm } from '../../lib/format'
import { pickActiveCall, useCallMap, useOrgData } from './useOrgData'
import es from '../../i18n/es'
import { useReveal } from '../../motion/useReveal'
import './Dashboard.css'

const t = es.dashboard
const HISTORY_ICON = { success: 'check', warning: 'alert-triangle', info: 'calendar', neutral: 'clock' }

/** W03 · Panel de la organización (Figma 26:507), in the app-shell layout. */
export default function Dashboard() {
  const { data: orgData, loading, error, reload } = useOrgData()
  const activeCall = pickActiveCall(orgData?.calls ?? [])
  const { data: summary } = useApi(() => (activeCall ? api.callSummary(activeCall.id) : Promise.resolve(null)), [activeCall?.id])
  const { data: mapData } = useCallMap(activeCall)
  const { open } = useNewCall()
  const root = useRef(null)
  useReveal(root)

  const confirmed = summary?.confirmados ?? 0
  const slots = activeCall?.cupos ?? 0
  const emergency = activeCall?.tipo === 'desastre'
  const skillName = activeCall?.habilidades.map((h) => h.nombre).join(', ') ?? ''
  const values = [String(orgData?.calls.length ?? 0), String(orgData?.active ? 1 : 0), String(confirmed)]

  return (
    <div ref={root}>
      <PanelHeader title={t.title} subtitle={t.subtitle}>
        <Button variant="secondary" icon="map" to="/panel/mapa">
          {t.seeMap}
        </Button>
      </PanelHeader>
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
          {orgData && (
            <>
              <div className="hero-row">
                {activeCall ? (
                  <HeroCard
                    tone={emergency ? 'emergency' : 'brand'}
                    labelledBy="active-call"
                    badge={emergency ? t.heroEmergencyBadge : t.heroBadge}
                    meta={es.common.radius}
                    value={String(confirmed)}
                    unit={t.heroUnit(slots)}
                    text={activeCall.titulo}
                    progress={slots ? Math.min(confirmed / slots, 1) : 0}
                    progressLabels={t.heroProgress(confirmed, slots)}
                    action={
                      <Button icon="users" to="/panel/convocatorias">
                        {t.seeResponses}
                      </Button>
                    }
                    footnote={activeCall.direccion}
                  />
                ) : (
                  <HeroCard
                    labelledBy="active-call"
                    badge={t.heroIdleBadge}
                    meta={t.heroIdleTitle}
                    value={String(orgData.calls.length)}
                    unit={t.heroIdleUnit}
                    text={t.heroIdleText}
                    action={
                      <Button icon="plus" onClick={open}>
                        {es.panel.newCall}
                      </Button>
                    }
                  />
                )}

                <section className="dash__map" aria-labelledby="map-summary" data-reveal="up" data-delay="0.1">
                  <VolunteerMap
                    call={activeCall}
                    clusters={mapData?.clusters ?? []}
                    points={mapData?.points}
                    emergency={emergency}
                    compact
                    label={es.liveMap.mapAlt}
                    className="dash__map-view"
                  />
                  <div className="dash__map-foot">
                    <div>
                      <h2 id="map-summary" className="t-label c-strong">
                        {activeCall && mapData ? t.mapTitle(mapData.inRadius, formatKm(activeCall.radio_km)) : es.liveMap.title}
                      </h2>
                      <p className="t-body-sm c-muted">
                        {activeCall && mapData ? t.mapText(mapData.totals.match, skillName.toLowerCase()) : t.mapIdle}
                      </p>
                    </div>
                    <Button variant="tertiary" icon="map" to="/panel/mapa">
                      {t.seeMap}
                    </Button>
                  </div>
                </section>
              </div>

              <div className="dash__metrics" data-stagger="up">
                {t.metrics.map((metric, index) => (
                  <MetricCard key={metric.label} {...metric} value={values[index] ?? metric.value} tone={index === 0 ? 'accent' : 'default'} />
                ))}
              </div>

              <div className="split">
                <section className="card" aria-labelledby="dash-responses" data-reveal="up">
                  <div className="row-between">
                    <div>
                      <h2 id="dash-responses" className="t-h3 c-strong">
                        {t.responsesTitle}
                      </h2>
                      <div className="badges dash__badges">
                        {emergency && <Badge tone="warning">{es.common.emergency}</Badge>}
                        <Badge tone="neutral">{es.common.activatedAt}</Badge>
                        <Badge tone="info">{es.common.radius}</Badge>
                      </div>
                    </div>
                    <Button variant="tertiary" to="/panel/convocatorias">
                      {t.seeResponses}
                    </Button>
                  </div>
                  <ResponsesTable rows={RESPONSES.slice(0, 3)} caption={activeCall?.titulo ?? t.activeTitle} />
                </section>

                <div className="dash__side">
                  <button type="button" className="dash__cta" onClick={open} data-reveal="up">
                    <span className="dash__cta-text">
                      <span className="t-h3">{t.ctaTitle}</span>
                      <span className="t-body-sm">{t.ctaText}</span>
                    </span>
                    <span className="dash__cta-plus" aria-hidden="true">
                      <Icon name="plus" size={22} />
                    </span>
                  </button>

                  <section className="card" aria-labelledby="recent-history" data-reveal="up" data-delay="0.1">
                    <h2 id="recent-history" className="t-h3 c-strong">
                      {t.historyTitle}
                    </h2>
                    <ul className="feed">
                      {HISTORY.map((item) => (
                        <li key={item.title}>
                          <span className={`feed__icon feed__icon--${item.tone}`}>
                            <Icon name={HISTORY_ICON[item.tone] ?? 'clock'} size={16} />
                          </span>
                          <div className="feed__text">
                            <p className="t-label c-strong">{item.title}</p>
                            <p className="t-caption c-muted">{item.text}</p>
                          </div>
                          <Badge tone={item.tone}>{item.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <Note icon="eye-off" tone="sunken" className="dash__privacy">
                    {t.privacy}
                  </Note>
                </div>
              </div>
            </>
          )}
        </LoadState>
      </div>
    </div>
  )
}
