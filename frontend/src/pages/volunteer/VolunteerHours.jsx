import { useRef } from 'react'
import Icon from '../../components/Icon'
import LoadState from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
import HeroCard from '../../components/panel/HeroCard'
import MetricCard from '../../components/panel/MetricCard'
import es from '../../i18n/es'
import { formatDateTime, formatHours } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import { useVolunteerData } from './useVolunteerData'
import './Volunteer.css'

const t = es.volunteer.hours

// Hours of one attendance, from check-in/out (the API also stores them, rounded, for the total).
const hoursOf = (p) => (new Date(p.check_out) - new Date(p.check_in)) / 3_600_000

/** Volunteer hours history (not an official certificate). */
export default function VolunteerHours() {
  const { data, loading, error, reload } = useVolunteerData()
  const root = useRef(null)
  useReveal(root, [loading])

  const done = (data?.participations ?? []).filter((p) => p.check_in && p.check_out)

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <div className="hero-row">
                <HeroCard
                  labelledBy="hours-total"
                  badge={t.total}
                  meta={es.volunteer.home.heroMeta(data.hours.turnos_cumplidos)}
                  value={formatHours(data.hours.horas_voluntariado)}
                  unit={es.volunteer.home.heroUnit}
                  text={es.volunteer.home.heroText}
                />
                <div className="vol__hours-stats" data-stagger="up">
                  <MetricCard icon="check" value={String(data.hours.turnos_cumplidos)} label={t.shifts} tone="accent" />
                  <MetricCard icon="calendar" value={String(done.length)} label={t.list} />
                </div>
              </div>
              <section className="card" aria-labelledby="hours-list" data-reveal="up">
                <h2 id="hours-list" className="t-h3 c-strong">
                  {t.list}
                </h2>
                <LoadState empty={done.length === 0} emptyText={t.empty}>
                  <ul className="feed" data-stagger="up">
                    {done.map((p) => (
                      <li key={p.id}>
                        <span className="feed__icon feed__icon--success">
                          <Icon name="check" size={16} />
                        </span>
                        <div className="feed__text">
                          <p className="t-label c-strong">{p.convocatoria.titulo}</p>
                          <p className="t-body-sm c-muted">
                            {formatDateTime(p.check_in)} · {es.enums.callType[p.convocatoria.tipo]}
                          </p>
                        </div>
                        <span className="feed__value feed__value--success">+{formatHours(hoursOf(p))}</span>
                      </li>
                    ))}
                  </ul>
                </LoadState>
              </section>
            </>
          )}
        </LoadState>
      </div>
    </div>
  )
}
