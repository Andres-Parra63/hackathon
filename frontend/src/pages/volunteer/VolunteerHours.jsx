import { useRef } from 'react'
import Badge from '../../components/Badge'
import LoadState from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
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
              <section className="vol__total" data-reveal="up">
                <div>
                  <p className="t-label c-muted">{t.total}</p>
                  <p className="t-numeral-lg c-strong" data-count>
                    {formatHours(data.hours.horas_voluntariado)}
                  </p>
                </div>
                <div>
                  <p className="t-label c-muted">{t.shifts}</p>
                  <p className="t-numeral-lg c-strong" data-count>
                    {data.hours.turnos_cumplidos}
                  </p>
                </div>
              </section>
              <section className="card" aria-labelledby="hours-list" data-reveal="up">
                <h2 id="hours-list" className="t-h3 c-strong">
                  {t.list}
                </h2>
                <LoadState empty={done.length === 0} emptyText={t.empty}>
                  <ul className="vol__hours" data-stagger="up">
                    {done.map((p) => (
                      <li key={p.id}>
                        <div>
                          <p className="t-label c-strong">{p.convocatoria.titulo}</p>
                          <p className="t-body-sm c-muted">
                            {formatDateTime(p.check_in)} · {es.enums.callType[p.convocatoria.tipo]}
                          </p>
                        </div>
                        <Badge tone="info">{formatHours(hoursOf(p))}</Badge>
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
