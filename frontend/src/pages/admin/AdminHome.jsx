import { useRef } from 'react'
import { api } from '../../api/client'
import { useApi } from '../../api/useApi'
import Button from '../../components/Button'
import { ProgressBar } from '../../components/FormControls'
import LoadState from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
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
      api.audit(8),
    ])
    return { orgs, emergencies, volunteers, audit }
  }, [])
  const root = useRef(null)
  useReveal(root, [loading])

  const metrics = data && [
    {
      icon: 'building',
      value: String(data.orgs.filter((o) => o.estado_verificacion === 'pendiente').length),
      label: t.metricOrgs,
    },
    {
      icon: 'alert-triangle',
      value: String(data.emergencies.filter((e) => e.estado === 'por_confirmar').length),
      label: t.metricPending,
    },
    {
      icon: 'activity',
      value: String(data.emergencies.filter((e) => e.estado === 'activa').length),
      label: t.metricActive,
    },
    { icon: 'users', value: String(data.volunteers.length), label: t.metricVolunteers },
  ]

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <LoadState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <div className="adm__metrics" data-stagger="up">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>

              <div className="adm__shortcuts" data-stagger="up">
                <Button variant="secondary" icon="building" to="/admin/organizaciones">
                  {t.goOrgs}
                </Button>
                <Button variant="emergency" to="/admin/emergencias">
                  {t.goEmergencies}
                </Button>
              </div>

              <div className="adm__columns">
                <section className="card" aria-labelledby="adm-weights" data-reveal="up">
                  <h2 id="adm-weights" className="t-h3 c-strong">
                    {t.weightsTitle}
                  </h2>
                  <p className="t-body-sm c-muted">{t.weightsText}</p>
                  {Object.keys(WEIGHTS).map((key) => (
                    <div key={key} className="adm__weight">
                      <div className="row-between">
                        <span className="t-body-sm c-default">{t.weights[key]}</span>
                        <span className="t-label c-strong">{Math.round(WEIGHTS[key] * 100)} %</span>
                      </div>
                      <ProgressBar value={WEIGHTS[key] / MAX_WEIGHT} label={t.weights[key]} />
                    </div>
                  ))}
                </section>

                <section className="card" aria-labelledby="adm-audit" data-reveal="up" data-delay="0.1">
                  <h2 id="adm-audit" className="t-h3 c-strong">
                    {t.auditTitle}
                  </h2>
                  <LoadState empty={data.audit.length === 0} emptyText={t.auditEmpty}>
                    <ol className="adm__timeline">
                      {data.audit.map((entry) => (
                        <li key={entry.id}>
                          <p className="t-label c-strong">{t.auditAction(entry.tabla, entry.accion)}</p>
                          <p className="t-caption c-muted">
                            {entry.usuario_nombre ?? t.system} · {formatDateTime(entry.creado_en)}
                          </p>
                        </li>
                      ))}
                    </ol>
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
