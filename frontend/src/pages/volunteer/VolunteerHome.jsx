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
import HeroCard from '../../components/panel/HeroCard'
import MetricCard from '../../components/panel/MetricCard'
import { score, volunteerParts } from '../../data/matching'
import es from '../../i18n/es'
import { TONES } from '../../i18n/enums'
import { formatDateTime, formatHours, formatKm, formatRange } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import { isOpen, useVolunteerData } from './useVolunteerData'
import './Volunteer.css'

const t = es.volunteer.home
const GOALS = [10, 25, 50, 100, 200, 500]

// Next hours milestone shown in the hero bar.
const nextGoal = (hours) => GOALS.find((goal) => goal > hours) ?? Math.ceil((hours + 1) / 100) * 100
const hoursOf = (p) => (new Date(p.check_out) - new Date(p.check_in)) / 3_600_000

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

  const hours = Number(data?.hours.horas_voluntariado ?? 0)
  const goal = nextGoal(hours)
  const profile = data?.profile
  const recent = [...(data?.participations ?? [])]
    .sort((a, b) => b.convocatoria.inicio.localeCompare(a.convocatoria.inicio))
    .slice(0, 5)

  const metrics = data && [
    { icon: 'heart', value: String(ranked.length), label: t.metricCompatible, tone: 'accent' },
    { icon: 'check', value: String(data.hours.turnos_cumplidos), label: t.metricDone },
    // The hero already shows hours (normal mode) or pending shifts (emergency): show the other one.
    pendingShifts.length > 0
      ? { icon: 'clock', value: formatHours(hours), label: t.metricHours }
      : { icon: 'bell', value: '0', label: t.metricPending },
  ]

  return (
    <div ref={root}>
      <AreaHeader title={t.title(firstName)} subtitle={t.subtitle}>
        <Button variant="secondary" icon="bell" to="/voluntario/turnos">
          {es.volunteer.nav.shifts}
        </Button>
      </AreaHeader>
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <div className="hero-row">
                {pendingShifts.length > 0 ? (
                  <HeroCard
                    tone="emergency"
                    labelledBy="vol-hero"
                    badge={t.heroEmergencyBadge}
                    meta={t.heroEmergencyNote}
                    value={String(pendingShifts.length)}
                    unit={t.heroEmergencyUnit(pendingShifts.length)}
                    text={t.alertText}
                    action={
                      <Button icon="arrow-right" to="/voluntario/turnos">
                        {t.alertCta}
                      </Button>
                    }
                  />
                ) : (
                  <HeroCard
                    labelledBy="vol-hero"
                    badge={t.heroBadge}
                    meta={t.heroMeta(data.hours.turnos_cumplidos)}
                    value={formatHours(hours)}
                    unit={t.heroUnit}
                    text={t.heroText}
                    progress={Math.min(hours / goal, 1)}
                    progressLabels={[t.heroStart, t.heroGoal(formatHours(goal))]}
                    action={
                      <Button icon="clock" to="/voluntario/horas">
                        {t.heroCta}
                      </Button>
                    }
                  />
                )}

                <section className="card" aria-labelledby="vol-profile" data-reveal="up" data-delay="0.1">
                  <div className="row-between">
                    <h2 id="vol-profile" className="t-h3 c-strong">
                      {t.profileTitle}
                    </h2>
                    <Badge tone={profile.recibir_convocatorias ? 'success' : 'neutral'}>
                      {profile.recibir_convocatorias ? es.volunteer.identity.status : t.profileNoReceive}
                    </Badge>
                  </div>
                  <div className="badges">
                    {profile.habilidades.map((h) => (
                      <Badge key={h.id} tone="info">
                        {h.nombre}
                      </Badge>
                    ))}
                  </div>
                  <ul className="checklist">
                    {[
                      { on: profile.habilidades.length > 0, text: t.profileSkills(profile.habilidades.length) },
                      { on: true, text: t.profileRadius(formatKm(profile.radio_km)) },
                      { on: profile.disponibilidades.length > 0, text: t.profileSlots(profile.disponibilidades.length) },
                      { on: true, text: t.profileZone },
                      {
                        on: profile.recibir_convocatorias,
                        text: profile.recibir_convocatorias ? t.profileReceive : t.profileNoReceive,
                      },
                    ].map((item) => (
                      <li key={item.text} className="t-body-sm c-default">
                        <span className={`checklist__mark ${item.on ? '' : 'checklist__mark--off'}`}>
                          <Icon name={item.on ? 'check' : 'minus'} size={14} />
                        </span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  <Button variant="secondary" icon="user" to="/voluntario/perfil" className="vol__profile-cta">
                    {t.editProfile}
                  </Button>
                </section>
              </div>

              <div className="vol__metrics" data-stagger="up">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>

              <div className="split">
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
                  <ul className="vol__grid" data-stagger="up">
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

              <section className="card vol__recent" aria-labelledby="vol-recent" data-reveal="up" data-delay="0.15">
                <div className="row-between">
                  <h2 id="vol-recent" className="t-h3 c-strong">
                    {t.activityTitle}
                  </h2>
                  <Button variant="tertiary" to="/voluntario/horas">
                    {t.seeAll}
                  </Button>
                </div>
                <LoadState empty={recent.length === 0} emptyText={t.activityEmpty}>
                  <ul className="feed">
                    {recent.map((p) => {
                      const done = p.check_in && p.check_out
                      const emergency = p.convocatoria.tipo === 'desastre'
                      return (
                        <li key={p.id}>
                          <span className={`feed__icon feed__icon--${done ? 'success' : emergency ? 'warning' : 'info'}`}>
                            <Icon name={done ? 'check' : emergency ? 'alert-triangle' : 'calendar'} size={16} />
                          </span>
                          <div className="feed__text">
                            <p className="t-label c-strong">{p.convocatoria.titulo}</p>
                            <p className="t-caption c-muted">{formatDateTime(p.convocatoria.inicio)}</p>
                          </div>
                          {done ? (
                            <span className="feed__value feed__value--success">+{formatHours(hoursOf(p))}</span>
                          ) : (
                            <Badge tone={TONES.participation[p.estado]}>{es.enums.participation[p.estado]}</Badge>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </LoadState>
              </section>
              </div>
            </>
          )}
        </LoadState>
      </div>
    </div>
  )
}
