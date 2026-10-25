import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAction } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Note, SelectField, TextArea, TextField } from '../../components/FormControls'
import PanelHeader from '../../components/panel/PanelHeader'
import { SKILLS } from '../../data/demo'
import es from '../../i18n/es'
import { useReveal } from '../../motion/useReveal'
import './Activities.css'
import { useOrgData } from './useOrgData'

const t = es.orgArea.emergency

const STATE_BADGE = { pending: 'warning', active: 'warning', closed: 'neutral' }
const API_STATE = { por_confirmar: 'pending', activa: 'active', cerrada: 'closed' }
const POINT_TYPE = { 'Centro de acopio': 'centro_acopio', Albergue: 'albergue', 'Banco de sangre': 'banco_sangre', Comedor: 'comedor' }

/**
 * Emergency flow for the organization: request -> (admin confirms) -> points and shifts -> close + report.
 * Shifts are only created at safe points; nobody is convoked before the activation is confirmed.
 */
export default function Emergency() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useOrgData()
  const { run, error: actionError } = useAction()
  const [emergency, setEmergency] = useState(null) // { type, zone, description, status, points, shifts }
  const [form, setForm] = useState({ type: t.types[0], zone: '', description: '' })
  const [errors, setErrors] = useState({})
  const [pointForm, setPointForm] = useState({ kind: t.pointKinds[0], address: '' })
  const [pointError, setPointError] = useState('')
  const [shiftForm, setShiftForm] = useState({ point: '', skill: SKILLS[0], start: '', end: '', slots: '2' })
  const [shiftErrors, setShiftErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const root = useRef(null)
  useReveal(root)
  useEffect(() => {
    const current = data?.active ?? data?.pending
    if (current) setEmergency((previous) => previous ?? { ...current, status: API_STATE[current.estado] ?? current.estado, points: [], shifts: [] })
  }, [data])

  const requestActivation = async (event) => {
    event.preventDefault()
    const found = {}
    if (!form.zone.trim()) found.zone = t.errors.zone
    if (!form.description.trim()) found.description = t.errors.description
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const created = await run('request', () => api.requestEmergency(user.organizacion_id, {
      tipo: form.type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      titulo: `${form.type} en ${form.zone.trim()}`,
      descripcion: form.description.trim(), centro_lat: 4.65, centro_lon: -74.1, radio_km: 5, municipio: form.zone.trim(),
    }))
    if (created) {
      setEmergency({ ...created, status: API_STATE[created.estado] ?? created.estado, points: [], shifts: [] })
      reload()
    }
  }

  const addPoint = async (event) => {
    event.preventDefault()
    if (!pointForm.address.trim()) return setPointError(t.pointError)
    const point = { id: `${pointForm.kind} · ${pointForm.address.trim()}`, kind: pointForm.kind, address: pointForm.address.trim() }
    const created = await run('point', () => api.createPoint(user.organizacion_id, {
      emergencia_id: emergency.id, tipo: POINT_TYPE[pointForm.kind], nombre: pointForm.kind,
      direccion: pointForm.address.trim(), lat: 4.65, lon: -74.1, publico: true,
    }))
    if (!created) return
    setEmergency((current) => ({ ...current, points: [...current.points, created] }))
    setShiftForm((current) => ({ ...current, point: current.point || point.id }))
    setPointForm({ ...pointForm, address: '' })
    setPointError('')
  }

  const addShift = (event) => {
    event.preventDefault()
    const found = {}
    if (!shiftForm.point) found.point = t.shiftErrors.point
    if (!shiftForm.start || !shiftForm.end || shiftForm.end <= shiftForm.start) found.end = t.shiftErrors.range
    if (!(Number(shiftForm.slots) > 0)) found.slots = t.shiftErrors.slots
    setShiftErrors(found)
    if (Object.keys(found).length > 0) return
    const shift = { id: `t-${emergency.shifts.length + 1}`, ...shiftForm, slots: Number(shiftForm.slots) }
    setEmergency((current) => ({ ...current, shifts: [...current.shifts, shift] }))
    setNotice(t.convoked)
  }

  const closeEmergency = async () => {
    const closed = await run('close', () => api.closeEmergency(emergency.id))
    if (!closed) return
    setEmergency((current) => ({ ...current, status: API_STATE[closed.estado] ?? closed.estado }))
    setConfirmClose(false)
  }

  const reset = () => {
    setEmergency(null)
    setForm({ type: t.types[0], zone: '', description: '' })
    setNotice('')
  }

  return (
    <div ref={root}>
      <PanelHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        {actionError && <p className="act__error t-caption" role="alert">{actionError.message}</p>}
        {loading && <p className="t-body-sm c-muted">{es.loadState.loading}</p>}
        {error && <p className="act__error t-caption" role="alert">{error.message}</p>}
        <Note icon="alert-triangle" tone="sunken">
          {t.rule}
        </Note>

        {!emergency && (
          <form className="card card--raised act__form" onSubmit={requestActivation} noValidate data-reveal="up">
            <SelectField label={t.typeLabel} options={t.types} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <TextField label={t.zoneLabel} icon="map-pin" value={form.zone} error={errors.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
            <TextArea label={t.descriptionLabel} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {errors.description && (
              <p className="act__error t-caption" role="alert">
                {errors.description}
              </p>
            )}
            <div className="act__bar">
              <Button type="submit" variant="emergency">
                {t.request}
              </Button>
            </div>
          </form>
        )}

        {emergency && (
          <section className="card card--raised" aria-labelledby="em-state">
            <div className="row-between act__top">
              <div>
                <h2 id="em-state" className="t-h3 c-strong">
                  {emergency.type} · {emergency.zone}
                </h2>
                <p className="t-body-sm c-muted">{emergency.description}</p>
              </div>
              <Badge tone={STATE_BADGE[emergency.status]}>
                {emergency.status === 'closed' ? '' : `${es.common.emergency} · `}
                {t.states[emergency.status]}
              </Badge>
            </div>

            {emergency.status === 'pending' && (
              <>
                <Note icon="info">{t.pendingText}</Note>
                <div className="act__bar">
                  <Button variant="secondary" onClick={() => setEmergency({ ...emergency, status: 'active' })}>
                    {t.simulateConfirm}
                  </Button>
                  <span className="t-caption c-muted">{t.simulateNote}</span>
                </div>
              </>
            )}

            {emergency.status === 'active' && (
              <div className="act__sections">
                <section aria-labelledby="em-points">
                  <h3 id="em-points" className="t-label c-strong">
                    {t.pointsTitle}
                  </h3>
                  <ul className="act__plain">
                    {emergency.points.length === 0 && <li className="t-body-sm c-muted">{t.noPoints}</li>}
                    {emergency.points.map((p) => (
                      <li key={p.id} className="t-body-sm c-default">
                        {p.id}
                      </li>
                    ))}
                  </ul>
                  <form className="act__row act__row--2" onSubmit={addPoint} noValidate>
                    <SelectField label={t.pointKindLabel} options={t.pointKinds} value={pointForm.kind} onChange={(e) => setPointForm({ ...pointForm, kind: e.target.value })} />
                    <TextField label={t.pointAddressLabel} icon="map-pin" value={pointForm.address} error={pointError} onChange={(e) => { setPointForm({ ...pointForm, address: e.target.value }); setPointError('') }} />
                    <Button type="submit" variant="secondary" icon="plus">
                      {t.addPoint}
                    </Button>
                  </form>
                </section>

                <section aria-labelledby="em-shifts">
                  <h3 id="em-shifts" className="t-label c-strong">
                    {t.shiftsTitle}
                  </h3>
                  <ul className="act__plain">
                    {emergency.shifts.map((s) => (
                      <li key={s.id} className="t-body-sm c-default">
                        {s.point} — {t.shiftLine(s.skill, s.slots)}
                      </li>
                    ))}
                  </ul>
                  <form className="act__form" onSubmit={addShift} noValidate>
                    <SelectField
                      label={t.shiftPointLabel}
                      placeholder="—"
                      options={emergency.points.map((p) => p.id)}
                      value={shiftForm.point}
                      error={shiftErrors.point}
                      onChange={(e) => setShiftForm({ ...shiftForm, point: e.target.value })}
                    />
                    <SelectField label={t.shiftSkillLabel} options={SKILLS} value={shiftForm.skill} onChange={(e) => setShiftForm({ ...shiftForm, skill: e.target.value })} />
                    <div className="act__row">
                      <TextField label={t.shiftStartLabel} type="datetime-local" value={shiftForm.start} onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })} />
                      <TextField label={t.shiftEndLabel} type="datetime-local" value={shiftForm.end} error={shiftErrors.end} onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })} />
                      <TextField label={t.shiftSlotsLabel} type="number" min="1" inputMode="numeric" value={shiftForm.slots} error={shiftErrors.slots} onChange={(e) => setShiftForm({ ...shiftForm, slots: e.target.value })} />
                    </div>
                    <div className="act__bar">
                      <Button type="submit" variant="emergency" icon="send" disabled={emergency.points.length === 0}>
                        {t.addShift}
                      </Button>
                      <span className="t-caption c-muted" role="status">
                        {notice}
                      </span>
                    </div>
                  </form>
                </section>

                {confirmClose ? (
                  <div className="vol__confirm" role="alertdialog" aria-label={t.close}>
                    <div className="act__bar">
                      <Button variant="emergency" onClick={closeEmergency} autoFocus>
                        {t.confirmClose}
                      </Button>
                      <Button variant="tertiary" onClick={() => setConfirmClose(false)}>
                        {t.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="act__bar">
                    <Button variant="secondary" onClick={() => setConfirmClose(true)}>
                      {t.close}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {emergency.status === 'closed' && (
              <>
                <h3 className="t-label c-strong">{t.reportTitle}</h3>
                <p className="t-body-sm c-default" role="status">
                  {t.report(
                    emergency.points.length,
                    emergency.shifts.length,
                    emergency.shifts.reduce((sum, s) => sum + s.slots, 0),
                  )}
                </p>
                <div className="act__bar">
                  <Button variant="secondary" onClick={reset}>
                    {t.newOne}
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
