import { useState } from 'react'
import legendMatch from '../../assets/map/live/legend-match.svg'
import legendOther from '../../assets/map/live/legend-other.svg'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { ProgressBar } from '../../components/FormControls'
import Icon from '../../components/Icon'
import IconTile from '../../components/IconTile'
import IllustratedMap from '../../components/IllustratedMap'
import PanelHeader from '../../components/panel/PanelHeader'
import es from '../../i18n/es'
import './LiveMap.css'

const t = es.liveMap

// Marker kinds kept at full opacity for each filter; the rest are dimmed.
const HIGHLIGHT = {
  all: ['outside', 'other', 'unavailable', 'match'],
  skill: ['unavailable', 'match'],
  available: ['match'],
}

const LEGEND_DOT = { match: legendMatch, other: legendOther }
const FUNNEL_MAX = t.funnel[0].value
const ZOOM_STEP = 0.2

/** W05 · Mapa en vivo y filtro (Figma 27:1022). RF-03, RF-09. */
export default function LiveMap() {
  const [filter, setFilter] = useState('all')
  const [zoom, setZoom] = useState(1)

  return (
    <>
      <PanelHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content live">
        <IllustratedMap
          scene="live"
          alt={t.mapAlt}
          chipLabel={t.radius}
          highlight={HIGHLIGHT[filter]}
          zoom={zoom}
          className="live__map"
        >
          <div className="live__filters" role="group" aria-label={t.filtersLabel}>
            {t.filters.map((f) => (
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

          <div className="live__zoom">
            <button type="button" aria-label={t.zoomIn} onClick={() => setZoom((z) => Math.min(1.6, z + ZOOM_STEP))}>
              <Icon name="plus" size={18} />
            </button>
            <button type="button" aria-label={t.zoomOut} onClick={() => setZoom((z) => Math.max(0.8, z - ZOOM_STEP))}>
              <Icon name="minus" size={18} />
            </button>
            <button type="button" aria-label={t.locate} onClick={() => setZoom(1)}>
              <Icon name="locate" size={18} />
            </button>
          </div>

          <div className="live__legend">
            <p className="t-label c-strong">{t.legendTitle}</p>
            <ul>
              {t.legend.map((item) => (
                <li key={item.text}>
                  <img src={LEGEND_DOT[item.kind]} alt="" />
                  <span className="t-body-sm c-default">{item.text}</span>
                  <span className="t-label c-strong">{item.count}</span>
                </li>
              ))}
            </ul>
            <p className="live__legend-privacy t-caption c-muted">
              <Icon name="eye-off" size={14} />
              {t.legendPrivacy}
            </p>
          </div>
        </IllustratedMap>

        <aside className="live__side">
          <div className="live__sent" role="status">
            <IconTile icon="check" tone="solid-success" size={44} iconSize={24} round />
            <div>
              <p className="t-h3 c-strong">{t.sentTitle}</p>
              <p className="t-body-sm c-default">{t.sentText}</p>
            </div>
          </div>

          <section className="live__card live__card--raised" aria-labelledby="funnel-title">
            <div className="row-between">
              <h2 id="funnel-title" className="t-h3 c-strong">
                {t.funnelTitle}
              </h2>
              <Badge tone="neutral">{t.noAi}</Badge>
            </div>
            {t.funnel.map((step) => (
              <div key={step.text} className="live__step">
                <div className="row-between">
                  <span className="t-body-sm c-default">{step.text}</span>
                  <span className="t-label c-strong">{step.value}</span>
                </div>
                <ProgressBar value={step.value / FUNNEL_MAX} tone={step.tone} label={step.text} />
              </div>
            ))}
            <p className="t-caption c-muted">{t.excluded}</p>
          </section>

          <section className="live__card" aria-labelledby="responses-title">
            <div className="row-between">
              <h2 id="responses-title" className="t-h3 c-strong">
                {t.responsesTitle}
              </h2>
              <Badge tone="info">{t.live}</Badge>
            </div>
            <div className="row-between t-label">
              <span className="c-strong">{t.progress}</span>
              <span className="c-brand">75 %</span>
            </div>
            <ProgressBar value={0.75} label={t.progress} />
            <div className="badges">
              <Badge tone="success">{es.common.confirmed(3)}</Badge>
              <Badge tone="neutral">{es.common.cannot(1)}</Badge>
              <Badge tone="warning">{es.common.noAnswer(1)}</Badge>
            </div>
            <Button icon="users" block to="/panel/convocatorias">
              {es.dashboard.seeResponses}
            </Button>
          </section>
        </aside>
      </div>
    </>
  )
}
