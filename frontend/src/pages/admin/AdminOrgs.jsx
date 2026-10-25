import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAction, useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import LoadState, { ActionError } from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
import es from '../../i18n/es'
import { TONES } from '../../i18n/enums'
import { formatDateTime } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import '../panel/Calls.css'
import './Admin.css'

const t = es.admin.orgs

/** Verification queue: review NIT and municipality, approve or reject. Every decision is audited. */
export default function AdminOrgs() {
  const { user } = useAuth()
  const { data, loading, error, reload, setData } = useApi(() => api.organizations({ limite: 200 }), [])
  const { run, busy, error: actionError } = useAction()
  const [tab, setTab] = useState('pending')
  const [confirming, setConfirming] = useState(null) // { id, approve }
  const root = useRef(null)
  useReveal(root, [loading])

  const orgs = data ?? []
  const pending = orgs.filter((o) => o.estado_verificacion === 'pendiente')
  const done = orgs.filter((o) => o.estado_verificacion !== 'pendiente')
  const rows = tab === 'pending' ? pending : done

  const decide = async (org, approve) => {
    const updated = await run(org.id, () => api.verifyOrganization(org.id, user.id, approve))
    if (updated) setData((current) => current.map((o) => (o.id === updated.id ? updated : o)))
    setConfirming(null)
  }

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <div className="calls__tabs" role="group" aria-label={t.title}>
          {['pending', 'done'].map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              className={`calls__tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {t.tabs[id]} ({id === 'pending' ? pending.length : done.length})
            </button>
          ))}
        </div>

        <ActionError error={actionError} />

        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={rows.length === 0}
          emptyText={tab === 'pending' ? t.empty : t.emptyDone}
        >
          <ul className="adm__list" data-stagger="up">
            {rows.map((org) => (
              <li key={org.id} className="card adm__org">
                <div className="row-between adm__top">
                  <div className="adm__org-name">
                    <span className="adm__avatar" aria-hidden="true">
                      {org.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h2 className="t-h3 c-strong">{org.nombre}</h2>
                      <p className="t-body-sm c-muted">{es.enums.orgType[org.tipo]}</p>
                    </div>
                  </div>
                  <Badge tone={TONES.verification[org.estado_verificacion]}>
                    {es.enums.verification[org.estado_verificacion]}
                  </Badge>
                </div>
                <dl className="adm__facts">
                  <div>
                    <dt className="t-caption c-muted">{t.nit}</dt>
                    <dd className="t-label c-strong t-mono">{org.nit}</dd>
                  </div>
                  <div>
                    <dt className="t-caption c-muted">{t.municipality}</dt>
                    <dd className="t-label c-strong">{org.municipio}</dd>
                  </div>
                  <div>
                    <dt className="t-caption c-muted">{t.contact}</dt>
                    <dd className="t-body-sm c-default">{org.correo}</dd>
                  </div>
                  <div>
                    <dt className="t-caption c-muted">{t.since}</dt>
                    <dd className="t-body-sm c-default">{formatDateTime(org.creado_en)}</dd>
                  </div>
                </dl>

                {org.estado_verificacion === 'pendiente' &&
                  (confirming?.id === org.id ? (
                    <div className="adm__confirm" role="alertdialog" aria-label={t.confirmTitle}>
                      <p className="t-body-sm c-default">
                        {confirming.approve ? t.confirmApprove(org.nombre) : t.confirmReject(org.nombre)}
                      </p>
                      <div className="adm__actions">
                        <Button
                          variant={confirming.approve ? 'primary' : 'emergency'}
                          icon={confirming.approve ? 'check' : undefined}
                          disabled={busy === org.id}
                          aria-busy={busy === org.id}
                          onClick={() => decide(org, confirming.approve)}
                          autoFocus
                        >
                          {confirming.approve ? t.approve : t.reject}
                        </Button>
                        <Button variant="tertiary" onClick={() => setConfirming(null)}>
                          {t.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="adm__actions">
                      <Button icon="check" onClick={() => setConfirming({ id: org.id, approve: true })}>
                        {t.approve}
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirming({ id: org.id, approve: false })}>
                        {t.reject}
                      </Button>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </LoadState>
      </div>
    </div>
  )
}
