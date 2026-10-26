import { useRef } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { ProgressBar } from '../../components/FormControls'
import Icon from '../../components/Icon'
import LoadState from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
import HeroCard from '../../components/panel/HeroCard'
import MetricCard from '../../components/panel/MetricCard'
import { WEIGHTS } from '../../data/matching'
import es from '../../i18n/es'
import { formatDateTime } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import './Admin.css'

const t = es.admin.home
const MAX_WEIGHT = Math.max(...Object.values(WEIGHTS))

/** Admin overview: pending work, matching weights (read-only) and the latest audit entries. */
export default function AdminHome() {
  const { data, loading, error, reload } = useApi(async () => {
    const [orgs, emergencies, volunteers, audit] = await Promise.all([
      api.organizations({ limite: 200 }),
      api.emergencies(false),
      api.volunteers({ limite: 1000 }),
      // The audit log is secondary: if it fails, the rest of the summary still loads.
      api.audit(8).catch(() => null),
    ])
    return { orgs, emergencies, volunteers, audit }
  }, [])
  const root = useRef(null)
  useReveal(root, [loading])

  const pendingOrgs = (data?.orgs ?? []).filter((o) => o.estado_verificacion === 'pendiente')
  const verifiedOrgs = (data?.orgs ?? []).filter((o) => o.estado_verificacion === 'verificada')
  const pendingEmergencies = (data?.emergencies ?? []).filter((e) => e.estado === 'por_confirmar')

  const metrics = data && [
    { icon: 'users', value: String(data.volunteers.length), label: t.metricVolunteers, tone: 'accent' },
    { icon: 'building', value: String(pendingOrgs.length), label: t.metricOrgs },
    { icon: 'alert-triangle', value: String(pendingEmergencies.length), label: t.metricPending },
    {
      icon: 'activity',
      value: String(data.emergencies.filter((e) => e.estado === 'activa').length),
      label: t.metricActive,
    },
  ]

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle}>
        <Button variant="secondary" icon="building" to="/admin/organizaciones">
          {t.goOrgs}
        </Button>
        <Button variant="emergency" to="/admin/emergencias">
          {t.goEmergencies}
        </Button>
      </AreaHeader>
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <div className="hero-row">
                {pendingEmergencies.length > 0 ? (
                  <HeroCard
                    tone="emergency"
                    labelledBy="adm-hero"
                    badge={t.heroEmergencyBadge}
                    meta={t.heroMeta}
                    value={String(pendingEmergencies.length)}
                    unit={t.heroUnitEmergencies(pendingEmergencies.length)}
                    text={t.heroTextEmergencies}
                    action={
                      <Button icon="arrow-right" to="/admin/emergencias">
                        {t.goEmergencies}
                      </Button>
                    }
                    footnote={pendingOrgs.length > 0 ? t.heroAlso(pendingOrgs.length) : null}
                  />
                ) : (
                  <HeroCard
                    labelledBy="adm-hero"
                    badge={t.heroBadge}
                    meta={t.heroMeta}
                    value={String(pendingOrgs.length)}
                    unit={t.heroUnitOrgs(pendingOrgs.length)}
                    text={t.heroTextOrgs}
                    progress={data.orgs.length ? verifiedOrgs.length / data.orgs.length : 0}
                    progressLabels={t.heroProgress(verifiedOrgs.length, data.orgs.length)}
                    action={
                      <Button icon="arrow-right" to="/admin/organizaciones">
                        {t.goOrgs}
                      </Button>
                    }
                  />
                )}

                <section className="card" aria-labelledby="adm-weights" data-reveal="up" data-delay="0.1">
                  <div className="row-between">
                    <h2 id="adm-weights" className="t-h3 c-strong">
                      {t.weightsTitle}
                    </h2>
                    <Badge tone="neutral">{es.volunteer.home.noAi}</Badge>
                  </div>
                  <p className="t-body-sm c-muted">{t.weightsText}</p>
                  <div className="adm__weights">
                    {Object.keys(WEIGHTS).map((key) => (
                      <div key={key} className="adm__weight">
                        <div className="row-between">
                          <span className="t-body-sm c-default">{t.weights[key]}</span>
                          <span className="t-label c-strong">{Math.round(WEIGHTS[key] * 100)} %</span>
                        </div>
                        <ProgressBar value={WEIGHTS[key] / MAX_WEIGHT} label={t.weights[key]} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="adm__metrics" data-stagger="up">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>

              <div className="split">
                <section className="card" aria-labelledby="adm-queue" data-reveal="up">
                  <div className="row-between">
                    <h2 id="adm-queue" className="t-h3 c-strong">
                      {t.queueTitle}
                    </h2>
                    <Button variant="tertiary" to="/admin/organizaciones">
                      {t.seeAll}
                    </Button>
                  </div>
                  <LoadState empty={pendingOrgs.length === 0} emptyText={t.queueEmpty}>
                    <ul className="feed">
                      {pendingOrgs.slice(0, 5).map((org) => (
                        <li key={org.id}>
                          <span className="adm__avatar" aria-hidden="true">
                            {org.nombre.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="feed__text">
                            <p className="t-label c-strong">{org.nombre}</p>
                            <p className="t-caption c-muted">
                              {es.enums.orgType[org.tipo]} · {org.municipio} · <span className="t-mono">{org.nit}</span>
                            </p>
                          </div>
                          <Badge tone="warning">{es.enums.verification[org.estado_verificacion]}</Badge>
                        </li>
                      ))}
                    </ul>
                  </LoadState>
                </section>

                <section className="card" aria-labelledby="adm-audit" data-reveal="up" data-delay="0.1">
                  <h2 id="adm-audit" className="t-h3 c-strong">
                    {t.auditTitle}
                  </h2>
                  <LoadState empty={!data.audit?.length} emptyText={data.audit ? t.auditEmpty : t.auditUnavailable}>
                    <ul className="feed">
                      {(data.audit ?? []).map((entry) => (
                        <li key={entry.id}>
                          <span className="feed__icon feed__icon--info">
                            <Icon name="shield-check" size={16} />
                          </span>
                          <div className="feed__text">
                            <p className="t-label c-strong">{t.auditAction(entry.tabla, entry.accion)}</p>
                            <p className="t-caption c-muted">
                              {entry.usuario_nombre ?? t.system} · {formatDateTime(entry.creado_en)}
                            </p>
                          </div>
                        </li>
                      ))}
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
