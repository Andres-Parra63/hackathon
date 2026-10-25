import { useEffect, useRef } from 'react'
import { api } from '../../api/client'
import { useAction } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import LoadState, { ActionError } from '../../components/LoadState'
import AreaHeader from '../../components/area/AreaHeader'
import es from '../../i18n/es'
import { TONES } from '../../i18n/enums'
import { formatRange, formatTime } from '../../lib/format'
import { useReveal } from '../../motion/useReveal'
import { isOpen, useVolunteerData } from './useVolunteerData'
import './Volunteer.css'

const t = es.volunteer.shifts
const CACHE_KEY = 'mer.turnos'

// Accepted shifts stay on the phone so the address and schedule work with intermittent signal.
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) ?? []
  } catch {
    return []
  }
}
const writeCache = (shifts) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(shifts))
  } catch {
    /* no offline copy */
  }
}

function ShiftDetails({ call }) {
  return (
    <div className="vol__details">
      <div>
        <h3 className="t-label c-strong">{t.detailsTitle}</h3>
        <p className="t-body-sm c-default vol__when">
          <Icon name="map-pin" size={16} /> {call.direccion}
        </p>
        <p className="t-body-sm c-default vol__when">
          <Icon name="clock" size={16} /> {formatRange(call.inicio, call.fin)}
        </p>
        {call.indicaciones && <p className="t-body-sm c-muted">{call.indicaciones}</p>}
      </div>
      <div>
        <h3 className="t-label c-strong">{t.safetyTitle}</h3>
        <ul className="vol__safety">
          {t.safety.map((tip) => (
            <li key={tip} className="t-body-sm c-default">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Emergency shifts: accept or decline, then address, safety tips and check-in/out. */
export default function VolunteerShifts() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useVolunteerData()
  const { run, busy, error: actionError } = useAction()
  const root = useRef(null)
  useReveal(root, [loading])

  const mine = (data?.participations ?? []).filter((p) => p.convocatoria.tipo === 'desastre')
  const taken = new Set(mine.map((p) => p.convocatoria.id))
  // Open emergency calls near the volunteer that did not reach them yet: offered as alternatives.
  const others = (data?.nearby ?? []).filter((c) => c.tipo === 'desastre' && !taken.has(c.id))

  useEffect(() => {
    if (data) writeCache(mine.filter((p) => ['confirmado', 'en_camino'].includes(p.estado)))
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (key, action) => {
    if (await run(key, action)) reload()
  }
  const respond = (p, estado) => act(`r${p.id}`, () => api.respond(p.id, estado))
  const takeOther = (call) =>
    act(`c${call.id}`, async () => {
      const p = await api.apply(call.id, user.id)
      return api.respond(p.id, 'confirmado')
    })

  const cached = error ? readCache() : []

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <div className="vol__banner" role="note" data-reveal="up">
          <span className="vol__alert-icon">
            <Icon name="alert-triangle" size={22} />
          </span>
          <p className="t-body-sm c-default">
            <strong className="c-strong">{t.banner}</strong> {t.bannerText}
          </p>
        </div>

        <ActionError error={actionError} />

        {error && cached.length > 0 && (
          <section className="card" aria-labelledby="offline-title">
            <h2 id="offline-title" className="t-h3 c-strong">
              {t.offlineTitle}
            </h2>
            {cached.map((p) => (
              <ShiftDetails key={p.id} call={p.convocatoria} />
            ))}
          </section>
        )}

        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={mine.length === 0 && others.length === 0}
          emptyText={t.empty}
        >
          <ul className="vol__list" data-stagger="up">
            {mine.filter((p) => p.estado !== 'cancelado').map((p) => {
              const call = p.convocatoria
              const accepted = ['confirmado', 'en_camino'].includes(p.estado)
              return (
                <li key={p.id} className={`card card--raised vol__shift ${accepted ? 'is-accepted' : ''}`}>
                  <div className="row-between vol__top">
                    <div>
                      <Badge tone="warning">{t.emergency}</Badge>
                      <h2 className="t-h3 c-strong vol__shift-title">{call.titulo}</h2>
                      <p className="t-body-sm c-muted">{call.habilidades.map((h) => h.nombre).join(' · ')}</p>
                    </div>
                    <Badge tone={TONES.participation[p.estado]}>
                      {accepted ? t.accepted : es.enums.participation[p.estado]}
                    </Badge>
                  </div>
                  <p className="t-body-sm c-default vol__when">
                    <Icon name="calendar" size={16} /> {formatRange(call.inicio, call.fin)}
                  </p>

                  {p.estado === 'pendiente' && (
                    <div className="vol__actions">
                      <Button icon="check" disabled={Boolean(busy)} onClick={() => respond(p, 'confirmado')}>
                        {t.accept}
                      </Button>
                      <Button variant="secondary" disabled={Boolean(busy)} onClick={() => respond(p, 'no_puede')}>
                        {t.decline}
                      </Button>
                    </div>
                  )}

                  {p.estado === 'no_puede' && (
                    <div role="status" className="vol__declined">
                      <p className="t-label c-strong">{t.declinedTitle}</p>
                      <p className="t-body-sm c-muted">{t.declinedText}</p>
                      <Button variant="tertiary" disabled={Boolean(busy)} onClick={() => respond(p, 'confirmado')}>
                        {t.undo}
                      </Button>
                    </div>
                  )}

                  {accepted && (
                    <>
                      <p className="t-body-sm c-default" role="status">
                        {t.acceptedText}
                      </p>
                      <ShiftDetails call={call} />
                      <div className="vol__actions">
                        {!p.check_in && (
                          <Button icon="navigation" disabled={Boolean(busy)} onClick={() => act(`i${p.id}`, () => api.checkIn(p.id))}>
                            {t.checkIn}
                          </Button>
                        )}
                        {p.check_in && !p.check_out && (
                          <Button variant="secondary" icon="log-out" disabled={Boolean(busy)} onClick={() => act(`o${p.id}`, () => api.checkOut(p.id))}>
                            {t.checkOut}
                          </Button>
                        )}
                        {!p.check_in && (
                          <Button variant="tertiary" disabled={Boolean(busy)} onClick={() => act(`x${p.id}`, () => api.cancelParticipation(p.id))}>
                            {t.cancel}
                          </Button>
                        )}
                      </div>
                      <p className="t-caption c-muted" role="status">
                        {p.check_out ? t.checkedOut(formatTime(p.check_out)) : p.check_in ? t.checkedIn(formatTime(p.check_in)) : ''}
                      </p>
                      <p className="t-caption c-muted vol__when">
                        <Icon name="eye-off" size={14} /> {t.offline}
                      </p>
                    </>
                  )}
                </li>
              )
            })}
          </ul>

          {others.length > 0 && (
            <section aria-labelledby="other-shifts">
              <h2 id="other-shifts" className="t-h3 c-strong vol__subhead">
                {mine.some(isOpen) ? t.othersTitle : t.offeredTitle}
              </h2>
              <ul className="vol__list">
                {others.map((call) => (
                  <li key={call.id} className="card">
                    <div className="row-between vol__top">
                      <div>
                        <h3 className="t-h3 c-strong">{call.titulo}</h3>
                        <p className="t-body-sm c-muted vol__when">
                          <Icon name="calendar" size={16} /> {formatRange(call.inicio, call.fin)}
                        </p>
                      </div>
                      <Badge tone="info">{t.seats(call.cupos)}</Badge>
                    </div>
                    <div className="vol__actions">
                      <Button icon="check" disabled={Boolean(busy)} onClick={() => takeOther(call)}>
                        {t.accept}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </LoadState>
      </div>
    </div>
  )
}
