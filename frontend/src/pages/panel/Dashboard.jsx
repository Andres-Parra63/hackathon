import { useRef, useState } from 'react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import PanelHeader from '../../components/panel/PanelHeader'
import ResponsesTable from '../../components/panel/ResponsesTable'
import Segmented from '../../components/panel/Segmented'
import StatTile from '../../components/panel/StatTile'
import WeekChart from '../../components/panel/WeekChart'
import { CONFIRMED_STATUSES, HISTORY, RESPONSES, WEEK_CALLS } from '../../data/demo'
import es from '../../i18n/es'
import { useReveal } from '../../motion/useReveal'
import './Dashboard.css'

const t = es.dashboard

const FILTERS = {
  all: () => true,
  confirmed: (row) => CONFIRMED_STATUSES.includes(row.status),
  open: (row) => !CONFIRMED_STATUSES.includes(row.status),
}

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** W03 · Panel de la organización: today's network, the active emergency and the latest answers. */
export default function Dashboard() {
  const root = useRef(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  useReveal(root)

  const q = normalize(query)
  const rows = RESPONSES.filter(FILTERS[filter]).filter((row) =>
    normalize(`${row.id} ${row.skill} ${row.status} ${row.detail}`).includes(q),
  )
  const n = t.network

  return (
    <div ref={root}>
      <PanelHeader title={`${t.greeting(new Date().getHours())}, ${es.panel.user.name.split(' ')[0]}`} subtitle={t.subtitle} />

      <div className="dash" data-stagger="blur" data-delay="0.1">
        <section className="card dash__network" aria-labelledby="dash-network">
          <div className="card-head">
            <h2 id="dash-network" className="t-label c-default">
              {n.title}
            </h2>
            <span className="tag">
              <Icon name="map-pin" size={14} />
              {n.radius}
            </span>
          </div>
          <div className="dash__hero">
            <p className="dash__hero-value" data-count>
              {n.value}
            </p>
            <p className="dash__hero-meta">
              <span className="delta delta--good">
                <Icon name="arrow-up-right" size={14} />
                {n.delta}
              </span>
              <span className="t-body-sm c-muted">{n.deltaText}</span>
            </p>
          </div>
          <div className="dash__actions">
            <Button icon="map" className="btn--sm" to="/panel/mapa">
              {n.seeMap}
            </Button>
            <Button variant="soft" icon="users" className="btn--sm" to="/panel/convocatorias">
              {t.seeResponses}
            </Button>
          </div>
          <div className="well">
            <div className="row-between">
              <p className="t-label c-strong">{n.skillsTitle}</p>
              <span className="t-caption c-muted">{n.skillsCount}</span>
            </div>
            <ul className="dash__skills" data-stagger="up" data-delay="0.4">
              {n.skills.map((skill) => (
                <li key={skill.name} className="dash__skill" data-hover="lift">
                  <p className="t-caption c-muted">{skill.name}</p>
                  <p className="dash__skill-value">{skill.value}</p>
                  <p className={`dash__skill-note dash__skill-note--${skill.tone}`}>{skill.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card dash__stats" aria-label={t.statsLabel}>
          <div className="dash__tiles" data-stagger="scale" data-delay="0.3">
            {t.stats.map(({ id, ...stat }) => (
              <StatTile key={id} {...stat} />
            ))}
          </div>
        </section>

        <section className="card dash__chart" aria-labelledby="dash-chart">
          <div className="card-head">
            <div>
              <h2 id="dash-chart" className="card-title">
                {t.chart.title}
              </h2>
              <p className="t-body-sm c-muted">{t.chart.subtitle}</p>
            </div>
          </div>
          <div className="well dash__chart-well">
            <WeekChart data={WEEK_CALLS} />
          </div>
        </section>

        <div className="dash__side">
          <section className="card" aria-labelledby="dash-coverage">
            <div className="card-head">
              <h2 id="dash-coverage" className="card-title">
                {t.coverage.title}
              </h2>
              <Badge tone="warning">{es.common.emergency}</Badge>
            </div>
            <p className="dash__coverage">
              <span className="dash__coverage-value">{t.coverage.value}</span>
              <span className="t-body-sm c-muted">{t.coverage.unit}</span>
            </p>
            <div
              className="meter"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={75}
              aria-label={t.coverage.label}
              style={{ '--meter-value': 0.75 }}
              data-inview
            >
              <span className="meter__fill" />
            </div>
            <div className="row-between t-caption">
              <span className="c-default">{t.coverage.remaining}</span>
              <span className="c-muted">{t.coverage.goal}</span>
            </div>
          </section>

          <section className="card" aria-labelledby="dash-history">
            <div className="card-head">
              <h2 id="dash-history" className="card-title">
                {t.historyTitle}
              </h2>
              <Button variant="tertiary" className="btn--sm" to="/panel/historial">
                {t.seeAll}
              </Button>
            </div>
            <ul className="dash__history">
              {HISTORY.slice(0, 3).map((item) => (
                <li key={item.title}>
                  <span className="dash__history-icon" aria-hidden="true">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <div>
                    <p className="t-label c-strong">{item.title}</p>
                    <p className="t-caption c-muted">{item.date}</p>
                  </div>
                  <Badge tone={item.tone}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card dash__responses" aria-labelledby="dash-responses">
          <div className="dash__responses-head">
            <div>
              <h2 id="dash-responses" className="card-title">
                {t.responses.title}
              </h2>
              <p className="t-body-sm c-muted">{t.responses.subtitle}</p>
            </div>
            <div className="dash__tools">
              <label className="dash__search">
                <Icon name="search" size={18} />
                <span className="sr-only">{t.responses.search}</span>
                <input
                  type="search"
                  placeholder={t.responses.search}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <Segmented
                mode="toggle"
                ink
                items={t.responses.filters}
                value={filter}
                onChange={setFilter}
                label={t.responses.filtersLabel}
              />
            </div>
          </div>
          <p className="sr-only" role="status">
            {t.responses.count(rows.length)}
          </p>
          {rows.length > 0 ? (
            <ResponsesTable rows={rows} withDetail caption={t.responses.title} />
          ) : (
            <p className="dash__empty t-body-sm c-muted">{t.responses.empty}</p>
          )}
          <p className="dash__privacy t-caption c-muted">
            <Icon name="eye-off" size={14} />
            {t.privacy}
          </p>
        </section>
      </div>
    </div>
  )
}
