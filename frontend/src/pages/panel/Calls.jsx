import { useState } from 'react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { ProgressBar } from '../../components/FormControls'
import PanelHeader from '../../components/panel/PanelHeader'
import ResponsesTable from '../../components/panel/ResponsesTable'
import { HISTORY, RESPONSES } from '../../data/demo'
import es from '../../i18n/es'
import './Calls.css'

const t = es.calls

/** W06 · Convocatorias y respuestas (Figma 27:1395). RF-07, RF-08. */
export default function Calls({ initialTab = 'active' }) {
  const [tab, setTab] = useState(initialTab)
  const [covered, setCovered] = useState(false)
  const [resent, setResent] = useState(false)

  const tabs = [
    { id: 'active', label: t.tabs.active },
    { id: 'history', label: t.tabs.history },
  ]

  return (
    <>
      <PanelHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content calls">
        <div className="calls__tabs" role="tablist" aria-label={t.title}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              className={`calls__tab ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'active' ? (
          <div id="panel-active" role="tabpanel" aria-labelledby="tab-active" className="calls__panel">
            <section className="card card--raised calls__summary" aria-labelledby="call-title">
              <div className="calls__head">
                <span className="type-tile type-tile--solid" aria-hidden="true">
                  LOG
                </span>
                <div className="calls__head-text">
                  <h2 id="call-title" className="t-h2 c-strong">
                    {t.activeTitle}
                  </h2>
                  <div className="badges">
                    {covered ? (
                      <Badge tone="success">{t.covered}</Badge>
                    ) : (
                      <Badge tone="warning">{es.common.emergency}</Badge>
                    )}
                    <Badge tone="neutral">{es.common.activatedAt}</Badge>
                    <Badge tone="info">{es.common.radius}</Badge>
                  </div>
                  <p className="t-body-sm c-muted">{t.instructions}</p>
                </div>
                <div className="calls__actions">
                  <Button variant="secondary" icon="refresh" disabled={covered} onClick={() => setResent(true)}>
                    {t.resend}
                  </Button>
                  <Button icon="check" disabled={covered} onClick={() => setCovered(true)}>
                    {t.markCovered}
                  </Button>
                </div>
              </div>

              <div className="calls__progress">
                <div className="calls__bar">
                  <div className="row-between t-label">
                    <span className="c-strong">{covered ? t.progressDone : t.progress}</span>
                    <span className="c-brand">{covered ? '100 %' : '75 %'}</span>
                  </div>
                  <ProgressBar value={covered ? 1 : 0.75} height={10} label={t.progress} />
                </div>
                <div className="badges">
                  <Badge tone="success">{es.common.confirmed(covered ? 4 : 3)}</Badge>
                  <Badge tone="neutral">{es.common.cannot(1)}</Badge>
                  {!covered && <Badge tone="warning">{es.common.noAnswer(1)}</Badge>}
                </div>
              </div>
              <p className="t-caption c-muted calls__status" role="status">
                {resent && !covered ? t.resent : ''}
              </p>
            </section>

            <section className="card" aria-labelledby="called-title">
              <div className="row-between calls__table-head">
                <div>
                  <h2 id="called-title" className="t-h3 c-strong">
                    {t.tableTitle}
                  </h2>
                  <p className="t-body-sm c-muted">{t.tableText}</p>
                </div>
                <Button variant="tertiary" icon="map" to="/panel/mapa">
                  {t.seeOnMap}
                </Button>
              </div>
              <ResponsesTable rows={RESPONSES} withDetail caption={t.tableTitle} />
            </section>
          </div>
        ) : (
          <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" className="calls__panel">
            <ul className="calls__history">
              {HISTORY.map((item) => (
                <li key={item.title} className="card">
                  <div className="row-between">
                    <div>
                      <p className="t-h3 c-strong">{item.title}</p>
                      <p className="t-body-sm c-muted">{item.text}</p>
                    </div>
                    <Badge tone={item.tone}>{item.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
