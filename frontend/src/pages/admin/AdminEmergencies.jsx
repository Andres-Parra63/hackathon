import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAction, useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Note } from '../../components/FormControls'
import Icon from '../../components/Icon'
import LoadState, { ActionError } from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
import es from '../../i18n/es'
import { TONES } from '../../i18n/enums'
import { formatDateTime, formatKm } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import './Admin.css'

const t = es.admin.emergencies
const ORDER = { por_confirmar: 0, activa: 1, cerrada: 2, rechazada: 3 }

/** Emergency requests: confirm (second confirmation) or close. The API audits every change. */
export default function AdminEmergencies() {
  const { user } = useAuth()
  const { data, loading, error, reload, setData } = useApi(async () => {
    const [emergencies, orgs] = await Promise.all([api.emergencies(false), api.organizations({ limite: 200 })])
    return { emergencies, orgNames: Object.fromEntries(orgs.map((o) => [o.id, o.nombre])) }
  }, [])
  const { run, busy, error: actionError } = useAction()
  const [closing, setClosing] = useState(null)
  const root = useRef(null)
  useReveal(root, [loading])

  const items = [...(data?.emergencies ?? [])].sort((a, b) => ORDER[a.estado] - ORDER[b.estado])

  const replace = (updated) =>
    updated &&
    setData((current) => ({
      ...current,
      emergencies: current.emergencies.map((e) => (e.id === updated.id ? updated : e)),
    }))

  const confirm = async (item) => replace(await run(item.id, () => api.confirmEmergency(item.id, user.id)))
  const close = async (item) => {
    replace(await run(item.id, () => api.closeEmergency(item.id)))
    setClosing(null)
  }

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <ActionError error={actionError} />
        <LoadState loading={loading} error={error} onRetry={reload} empty={items.length === 0} emptyText={t.empty}>
          <ul className="adm__list" data-stagger="up">
            {items.map((item) => (
              <li key={item.id} className={`card card--raised adm__emergency is-${item.estado}`}>
                <div className="row-between adm__top">
                  <div>
                    <p className="t-overline c-muted">{es.enums.emergencyType[item.tipo]}</p>
                    <h2 className="t-h3 c-strong">{item.titulo}</h2>
                  </div>
                  <Badge tone={TONES.emergencyState[item.estado]}>
                    {item.estado === 'activa' || item.estado === 'por_confirmar'
                      ? `${es.common.emergency} · ${es.enums.emergencyState[item.estado]}`
                      : es.enums.emergencyState[item.estado]}
                  </Badge>
                </div>
                {item.descripcion && <p className="t-body-sm c-default">{item.descripcion}</p>}
                <dl className="adm__facts">
                  <div>
                    <dt className="t-caption c-muted">{t.requestedBy}</dt>
                    <dd className="t-label c-strong">{data.orgNames[item.solicitada_por] ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="t-caption c-muted">{t.zone}</dt>
                    <dd className="t-body-sm c-default">
                      {item.municipio} · {t.radius(formatKm(item.radio_km))}
                    </dd>
                  </div>
                  <div>
                    <dt className="t-caption c-muted">{t.requestedAt}</dt>
                    <dd className="t-body-sm c-default">{formatDateTime(item.solicitada_en)}</dd>
                  </div>
                  {item.activada_en && (
                    <div>
                      <dt className="t-caption c-muted">{t.activatedAt}</dt>
                      <dd className="t-body-sm c-default">{formatDateTime(item.activada_en)}</dd>
                    </div>
                  )}
                </dl>

                {item.estado === 'por_confirmar' && (
                  <>
                    <Note icon="info">{t.confirmNote}</Note>
                    <div className="adm__actions">
                      <Button variant="emergency" disabled={busy === item.id} aria-busy={busy === item.id} onClick={() => confirm(item)}>
                        {t.confirm}
                      </Button>
                    </div>
                  </>
                )}

                {item.estado === 'activa' &&
                  (closing === item.id ? (
                    <div className="adm__confirm" role="alertdialog" aria-label={t.close}>
                      <p className="t-body-sm c-default">{t.closeText}</p>
                      <div className="adm__actions">
                        <Button variant="emergency" disabled={busy === item.id} onClick={() => close(item)} autoFocus>
                          {t.closeConfirm}
                        </Button>
                        <Button variant="tertiary" onClick={() => setClosing(null)}>
                          {t.cancel}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="adm__actions">
                      <Button variant="secondary" onClick={() => setClosing(item.id)}>
                        {t.close}
                      </Button>
                    </div>
                  ))}

                {item.estado === 'cerrada' && (
                  <p className="t-caption c-muted adm__inline">
                    <Icon name="check" size={14} /> {t.closedAt(formatDateTime(item.cerrada_en))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </LoadState>
      </div>
    </div>
  )
}
