import { useRef } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Note, ProgressBar } from '../../components/FormControls'
import Icon from '../../components/Icon'
import IllustratedMap from '../../components/IllustratedMap'
import MetricCard from '../../components/panel/MetricCard'
import { useNewCall } from '../../components/panel/newCallContext'
import PanelHeader from '../../components/panel/PanelHeader'
import ResponsesTable from '../../components/panel/ResponsesTable'
import { HISTORY, RESPONSES } from '../../data/demo'
import LoadState from '../../components/LoadState'
import { pickActiveCall, useOrgData } from './useOrgData'
import es from '../../i18n/es'
import { useReveal } from '../../motion/useReveal'
import './Dashboard.css'

const t = es.dashboard

/** W03 · Panel de la organización (Figma 26:507). */
export default function Dashboard() {
  const { data: orgData, loading, error, reload } = useOrgData()
  const activeCall = pickActiveCall(orgData?.calls ?? [])
  const { data: summary } = useApi(() => (activeCall ? api.callSummary(activeCall.id) : Promise.resolve(null)), [activeCall?.id])
  const { open } = useNewCall()
  const root = useRef(null)
  useReveal(root)

  return (
    <div ref={root}>
      <PanelHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
        {orgData && (
        <>
        <div className="dash__metrics" data-stagger="up">
          {t.metrics.map((metric, index) => (
            <MetricCard key={metric.label} {...metric} value={index === 0 ? String(orgData.calls.length) : index === 1 ? String(orgData.active ? 1 : 0) : index === 2 ? String(summary?.confirmados ?? 0) : metric.value} />
          ))}
        </div>

        <div className="dash__columns">
          <div className="dash__left">
            <section className="card card--raised" aria-labelledby="active-call" data-reveal="up" data-delay="0.2">
              <div className="dash__active-head">
                <span className="type-tile" aria-hidden="true">
                  LOG
                </span>
                <div className="dash__active-text">
                  <h2 id="active-call" className="t-h2 c-strong">
                    {activeCall?.titulo ?? t.activeTitle}
                  </h2>
                  <div className="badges">
                    <Badge tone="warning">{es.common.emergency}</Badge>
                    <Badge tone="neutral">{es.common.activatedAt}</Badge>
                    <Badge tone="info">{es.common.radius}</Badge>
                  </div>
                </div>
                <Button variant="secondary" icon="users" to="/panel/convocatorias">
                  {t.seeResponses}
                </Button>
              </div>
              <div className="row-between t-label">
                <span className="c-strong">{t.progress}</span>
                <span className="c-brand">75 %</span>
              </div>
              <ProgressBar value={0.75} height={10} label={t.progress} />
              <ResponsesTable rows={RESPONSES.slice(0, 3)} caption={activeCall?.titulo ?? t.activeTitle} />
            </section>

            <section className="card dash__history" aria-labelledby="recent-history" data-reveal="up">
              <h2 id="recent-history" className="t-h3 c-strong">
                {t.historyTitle}
              </h2>
              <ul data-stagger="up" data-delay="0.15">
                {HISTORY.map((item) => (
                  <li key={item.title}>
                    <div>
                      <p className="t-label c-strong">{item.title}</p>
                      <p className="t-body-sm c-muted">{item.text}</p>
                    </div>
                    <Badge tone={item.tone}>{item.status}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="dash__right" data-stagger="right" data-delay="0.3">
            <section className="dash__map" aria-labelledby="map-summary">
              <IllustratedMap scene="panel" alt={es.liveMap.mapAlt} className="dash__map-view" />
              <div className="dash__map-foot">
                <div>
                  <h2 id="map-summary" className="t-label c-strong">
                    {t.mapTitle}
                  </h2>
                  <p className="t-body-sm c-muted">{t.mapText}</p>
                </div>
                <Button variant="tertiary" icon="map" to="/panel/mapa">
                  {t.seeMap}
                </Button>
              </div>
            </section>

            <button type="button" className="dash__cta" onClick={open}>
              <span className="dash__cta-text">
                <span className="t-h2">{t.ctaTitle}</span>
                <span className="t-body-sm">{t.ctaText}</span>
              </span>
              <span className="dash__cta-plus" aria-hidden="true">
                <Icon name="plus" size={24} />
              </span>
            </button>

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
