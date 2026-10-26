import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { ProgressBar } from '../../components/FormControls'
import Icon from '../../components/Icon'
import IconTile from '../../components/IconTile'
import LoadState from '../../components/LoadState'
import PanelHeader from '../../components/panel/PanelHeader'
import VolunteerMap from '../../components/VolunteerMap'
import { KINDS } from '../../data/volunteerMap'
import es from '../../i18n/es'
import { formatKm } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import { pickActiveCall, useCallMap, useOrgData } from './useOrgData'
import './LiveMap.css'

const t = es.liveMap

// Marker kinds kept at full opacity for each filter; the rest are dimmed.
const HIGHLIGHT = {
  all: KINDS,
  skill: ['unavailable', 'match'],
  available: ['match'],
}

/** W05 · Mapa en vivo y filtro (Figma 27:1022) on OpenStreetMap. RF-03, RF-09. */
export default function LiveMap() {
  const [filter, setFilter] = useState('all')
  const { data: orgData, loading, error, reload } = useOrgData()
  const call = pickActiveCall(orgData?.calls ?? [])
  const { data: mapData, error: mapError, reload: reloadMap } = useCallMap(call)
  const { data: stats } = useApi(
    () => (call ? Promise.all([api.funnel(call.id), api.callSummary(call.id)]) : Promise.resolve(null)),
    [call?.id],
  )
  const root = useRef(null)
  useReveal(root, [loading])

  const [funnel, summary] = stats ?? []
  const skill = call?.habilidades.map((h) => h.nombre).join(', ') ?? ''
  const emergency = call?.tipo === 'desastre'
  const steps = funnel && summary ? t.funnel(skill, funnel, summary.convocados) : []
  const legend = t.legend(skill)

  return (
    <div ref={root}>
      <PanelHeader title={t.title} subtitle={call ? t.subtitle(call.titulo) : t.idleSubtitle} />
      <div className="panel-content live">
        <LoadState loading={loading} error={error ?? mapError} onRetry={error ? reload : reloadMap} empty={!loading && !call} emptyText={t.empty}>
          <VolunteerMap
            call={call}
            clusters={mapData?.clusters ?? []}
            points={mapData?.points}
            highlight={HIGHLIGHT[filter]}
            emergency={emergency}
            controls
            label={t.mapAlt}
            className="live__map"
          >
            {mapData && (
              <div className="live__filters" role="group" aria-label={t.filtersLabel}>
                {t.filters(skill, mapData.totals, mapData.inRadius).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`live__filter ${filter === f.id ? 'is-active' : ''}`}
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {mapData && call && (
              <div className="live__legend">
                <p className="t-label c-strong">{t.legendTitle(mapData.inRadius, formatKm(call.radio_km))}</p>
                <ul>
                  {KINDS.map((kind) => (
                    <li key={kind} className={HIGHLIGHT[filter].includes(kind) ? '' : 'is-dimmed'}>
                      <span className={`vmap__cluster vmap__cluster--${kind} live__dot`} aria-hidden="true">
                        <span style={{ '--size': '14px' }} />
                      </span>
                      <span className="t-body-sm c-default">{legend[kind]}</span>
                      <span className="t-label c-strong">{mapData.totals[kind]}</span>
                    </li>
                  ))}
                </ul>
                <p className="live__legend-privacy t-caption c-muted">
                  <Icon name="eye-off" size={14} />
                  {t.legendPrivacy}
                </p>
              </div>
            )}
          </VolunteerMap>

          <aside className="live__side" data-stagger="right" data-delay="0.2">
            {summary && (
              <div className="live__sent" role="status">
                <IconTile icon="check" tone="solid-success" size={44} iconSize={24} round />
                <div>
                  <p className="t-h3 c-strong">{t.sentTitle(skill)}</p>
                  <p className="t-body-sm c-default">{t.sentText(summary.convocados)}</p>
                </div>
              </div>
            )}

            <section className="live__card live__card--raised" aria-labelledby="funnel-title">
              <div className="row-between">
                <h2 id="funnel-title" className="t-h3 c-strong">
                  {t.funnelTitle}
                </h2>
                <Badge tone="neutral">{t.noAi}</Badge>
              </div>
              {steps.map((step) => (
                <div key={step.text} className="live__step">
                  <div className="row-between">
                    <span className="t-body-sm c-default">{step.text}</span>
                    <span className="t-label c-strong">{step.value}</span>
                  </div>
                  <ProgressBar value={steps[0].value ? step.value / steps[0].value : 0} tone={step.tone} label={step.text} />
                </div>
              ))}
              {funnel && <p className="t-caption c-muted">{t.excluded(funnel)}</p>}
            </section>

            {summary && (
              <section className="live__card" aria-labelledby="responses-title">
                <div className="row-between">
                  <h2 id="responses-title" className="t-h3 c-strong">
                    {t.responsesTitle}
                  </h2>
                  <Badge tone="info">{t.live}</Badge>
                </div>
                <div className="row-between t-label">
                  <span className="c-strong">{t.progress(summary.confirmados, summary.cupos)}</span>
                  <span className="c-brand">{Math.round(Number(summary.porcentaje_cubierto))} %</span>
                </div>
                <ProgressBar value={Number(summary.porcentaje_cubierto) / 100} label={t.progress(summary.confirmados, summary.cupos)} />
                <div className="badges">
                  <Badge tone="success">{es.common.confirmed(summary.confirmados)}</Badge>
                  <Badge tone="neutral">{es.common.cannot(summary.no_pueden)}</Badge>
                  <Badge tone="warning">{es.common.noAnswer(summary.sin_respuesta)}</Badge>
                </div>
                <Button icon="users" block to="/panel/convocatorias">
                  {es.dashboard.seeResponses}
                </Button>
              </section>
            )}
          </aside>
        </LoadState>
      </div>
    </div>
  )
}
