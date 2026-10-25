import { useRef } from 'react'
import { api } from '../../api/client'
import { useAction } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { ProgressBar } from '../../components/FormControls'
import Icon from '../../components/Icon'
import LoadState, { ActionError } from '../../components/LoadState'
import ScoreRing from '../../components/ScoreRing'
import AreaHeader from '../../components/area/AreaHeader'
import MetricCard from '../../components/panel/MetricCard'
import { score, volunteerParts } from '../../data/matching'
import es from '../../i18n/es'
import { formatHours, formatKm, formatRange } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import { isOpen, useVolunteerData } from './useVolunteerData'
import './Volunteer.css'

const t = es.volunteer.home

/** Volunteer home: pending emergency shifts, then nearby activities ranked with an explainable score. */
export default function VolunteerHome() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useVolunteerData()
  const { run, busy, error: actionError } = useAction()
  const root = useRef(null)
  useReveal(root, [loading])

  const firstName = user.name.split(' ')[0]
  const appliedTo = new Set((data?.participations ?? []).filter(isOpen).map((p) => p.convocatoria.id))
  const pendingShifts = (data?.participations ?? []).filter(
    (p) => p.convocatoria.tipo === 'desastre' && p.estado === 'pendiente',
  )

  const ranked = (data?.nearby ?? [])
    .filter((call) => call.tipo !== 'desastre')
    .map((call) => {
      const { km, parts } = volunteerParts(data.profile, call, data.hours.turnos_cumplidos)
      return { call, km, parts, total: score(parts) }
    })
    .sort((a, b) => b.total - a.total)

  const apply = async (callId) => {
    if (await run(callId, () => api.apply(callId, user.id))) reload()
  }

  const metrics = data && [
    { icon: 'clock', value: formatHours(data.hours.horas_voluntariado), label: t.metricHours },
    { icon: 'check', value: String(data.hours.turnos_cumplidos), label: t.metricDone },
    { icon: 'bell', value: String(pendingShifts.length), label: t.metricPending },
  ]

  return (
    <div ref={root}>
      <AreaHeader title={t.title(firstName)} subtitle={t.subtitle} />
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <div className="vol__metrics" data-stagger="up">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>

              {pendingShifts.length > 0 && (
                <section className="vol__alert" aria-labelledby="vol-alert" data-reveal="up">
                  <span className="vol__alert-icon">
                    <Icon name="alert-triangle" size={24} />
                  </span>
                  <div>
                    <Badge tone="warning">{es.volunteer.shifts.emergency}</Badge>
                    <h2 id="vol-alert" className="t-h3 c-strong">
                      {t.alertTitle(pendingShifts.length)}
                    </h2>
                    <p className="t-body-sm c-default">{t.alertText}</p>
                  </div>
                  <Button variant="emergency" to="/voluntario/turnos">
                    {t.alertCta}
                  </Button>
                </section>
              )}

              <section aria-labelledby="vol-rec">
                <div className="vol__section-head">
                  <div>
                    <h2 id="vol-rec" className="t-h2 c-strong">
                      {t.recTitle}
                    </h2>
                    <p className="t-body-sm c-muted">{t.recLead}</p>
                  </div>
                  <Badge tone="neutral">{t.noAi}</Badge>
                </div>
                <ActionError error={actionError} />
                <LoadState empty={ranked.length === 0} emptyText={t.empty}>
                  <ul className="vol__list" data-stagger="up">
                    {ranked.map(({ call, km, parts, total }) => (
                      <li key={call.id} className="card vol__rec">
                        <div className="vol__rec-top">
                          <ScoreRing value={total} label={t.score(Math.round(total * 100))} />
                          <div className="vol__rec-text">
                            <h3 className="t-h3 c-strong">{call.titulo}</h3>
                            <p className="t-body-sm c-muted vol__when">
                              <Icon name="calendar" size={16} /> {formatRange(call.inicio, call.fin)}
                            </p>
                            <p className="t-body-sm c-muted vol__when">
                              <Icon name="map-pin" size={16} /> {call.direccion || t.noAddress} · {t.distanceFrom(formatKm(km))}
                            </p>
                          </div>
                        </div>
                        <div className="badges">
                          {call.habilidades.map((h) => (
                            <Badge key={h.id} tone="neutral">
                              {h.nombre}
                            </Badge>
                          ))}
                          <Badge tone="neutral">{t.slots(call.cupos)}</Badge>
                        </div>
                        <details className="vol__why">
                          <summary className="t-label c-brand">{t.why}</summary>
                          <dl>
                            {Object.keys(t.parts).map((key) => (
                              <div key={key}>
                                <dt className="row-between">
                                  <span className="t-body-sm c-default">{t.parts[key]}</span>
                                  <span className="t-label-sm c-muted">{Math.round(parts[key] * 100)} %</span>
                                </dt>
                                <dd>
                                  <ProgressBar value={parts[key]} label={t.parts[key]} />
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                        {appliedTo.has(call.id) ? (
                          <p className="vol__applied t-label" role="status">
                            <Icon name="check" size={18} /> {t.applied}
                            <span className="c-muted t-body-sm">{t.appliedStatus}</span>
                          </p>
                        ) : (
                          <Button
                            icon="send"
                            className="vol__cta"
                            disabled={busy === call.id}
                            aria-busy={busy === call.id}
                            onClick={() => apply(call.id)}
                          >
                            {t.apply}
                          </Button>
                        )}
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
