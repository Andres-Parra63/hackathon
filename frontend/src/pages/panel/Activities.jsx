import { useRef, useState } from 'react'
import { api } from '../../api/client'
import { useAction, useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Note, ProgressBar, TextField } from '../../components/FormControls'
import SkillChip from '../../components/SkillChip'
import PanelHeader from '../../components/panel/PanelHeader'
import { placeByName } from '../../data/places'
import { score } from '../../data/matching'
import es from '../../i18n/es'
import { useReveal } from '../../motion/useReveal'
import LoadState, { ActionError } from '../../components/LoadState'
import { useOrgData } from './useOrgData'
import './Activities.css'

const t = es.orgArea.activities

const EMPTY_FORM = { title: '', place: '', start: '', end: '', slots: '1', skills: [] }

const validate = (form) => {
  const errors = {}
  if (!form.title.trim()) errors.title = t.errors.title
  if (!form.place.trim()) errors.place = t.errors.place
  if (!form.start) errors.start = t.errors.start
  if (!form.end || form.end <= form.start) errors.end = t.errors.end
  if (!(Number(form.slots) > 0)) errors.slots = t.errors.slots
  if (form.skills.length === 0) errors.skills = t.errors.skills
  return errors
}

const formatWhen = (start) =>
  new Date(start).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Activities: publish (required fields validated), review explained candidates, approve, record attendance. */
export default function Activities() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useOrgData()
  const { data: skills = [] } = useApi(() => api.skills(), [])
  const { run, error: actionError } = useAction()
  const activities = (data?.calls ?? []).map((call) => ({ ...call, place: call.direccion, when: formatWhen(call.inicio), slots: call.cupos, skills: call.habilidades.map((skill) => skill.nombre), candidates: [] }))
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  // key `${activityId}:${candidateId}` -> { status, attendance, rating }
  const [reviews, setReviews] = useState({})
  const root = useRef(null)
  useReveal(root)

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const toggleSkill = (skill) =>
    setField('skills', form.skills.includes(skill) ? form.skills.filter((s) => s !== skill) : [...form.skills, skill])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const location = placeByName(form.place) ?? placeByName('Chapinero')
    const created = await run('create', () => api.createCall(user.organizacion_id, {
      creada_por: user.id, tipo: 'normal', titulo: form.title.trim(), direccion: form.place.trim(),
      lat: location.lat, lon: location.lon, inicio: new Date(form.start).toISOString(), fin: new Date(form.end).toISOString(),
      cupos: Number(form.slots), habilidad_ids: skills.filter((skill) => form.skills.includes(skill.nombre)).map((skill) => skill.id), publicar: true,
    }))
    if (!created) return
    setMessage(t.published(form.title.trim()))
    setForm(EMPTY_FORM)
    setFormOpen(false)
    reload()
  }

  const review = (activityId, candidateId, patch) =>
    setReviews((current) => {
      const key = `${activityId}:${candidateId}`
      return { ...current, [key]: { ...current[key], ...patch } }
    })

  const approvedCount = (activity) =>
    activity.candidates.filter((c) => reviews[`${activity.id}:${c.id}`]?.status === 'approved').length

  return (
    <div ref={root}>
      <PanelHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <div className="act__bar">
          <Button icon="plus" onClick={() => setFormOpen((open) => !open)} aria-expanded={formOpen}>
            {t.publish}
          </Button>
          <p className="t-body-sm c-muted" role="status">
            {message}
          </p>
        </div>

        {formOpen && (
          <form className="card card--raised act__form" onSubmit={handleSubmit} noValidate>
            <h2 className="t-h3 c-strong">{t.formTitle}</h2>
            <TextField label={t.titleLabel} value={form.title} error={errors.title} onChange={(e) => setField('title', e.target.value)} />
            <TextField label={t.placeLabel} icon="map-pin" value={form.place} error={errors.place} onChange={(e) => setField('place', e.target.value)} />
            <div className="act__row">
              <TextField label={t.startLabel} type="datetime-local" value={form.start} error={errors.start} onChange={(e) => setField('start', e.target.value)} />
              <TextField label={t.endLabel} type="datetime-local" value={form.end} error={errors.end} onChange={(e) => setField('end', e.target.value)} />
              <TextField label={t.slotsLabel} type="number" min="1" inputMode="numeric" value={form.slots} error={errors.slots} onChange={(e) => setField('slots', e.target.value)} />
            </div>
            <fieldset>
              <legend className="t-label c-default">{t.skillsLegend}</legend>
              <div className="act__chips">
                {skills.map((skill) => (
                  <SkillChip key={skill.id} label={skill.nombre} selected={form.skills.includes(skill.nombre)} onToggle={() => toggleSkill(skill.nombre)} />
                ))}
              </div>
              {errors.skills && (
                <p className="act__error t-caption" role="alert">
                  {errors.skills}
                </p>
              )}
            </fieldset>
            <div className="act__bar">
              <Button type="submit" icon="check">
                {t.publish}
              </Button>
              <Button variant="tertiary" onClick={() => setFormOpen(false)}>
                {t.cancel}
              </Button>
            </div>
          </form>
        )}

        <ActionError error={actionError} />
        <LoadState loading={loading} error={error} onRetry={reload} empty={activities.length === 0} emptyText={t.noActivities}>
        <ul className="act__list" data-stagger="up">
          {activities.map((activity) => {
            const taken = approvedCount(activity)
            const isFull = taken >= activity.slots
            return (
              <li key={activity.id} className="card">
                <div className="row-between act__top">
                  <div>
                    <h2 className="t-h3 c-strong">{activity.title}</h2>
                    <p className="t-body-sm c-muted">
                      {activity.when} · {activity.place}
                    </p>
                  </div>
                  <Badge tone={isFull ? 'success' : 'info'}>{isFull ? t.status.full : t.status.open}</Badge>
                </div>
                <div className="badges">
                  {activity.skills.map((skill) => (
                    <Badge key={skill} tone="neutral">
                      {skill}
                    </Badge>
                  ))}
                  <Badge tone="neutral">{t.slots(taken, activity.slots)}</Badge>
                </div>

                <details className="act__candidates">
                  <summary className="t-label c-brand">{t.candidates(activity.candidates.length)}</summary>
                  {activity.candidates.length === 0 ? (
                    <p className="t-body-sm c-muted">{t.noCandidates}</p>
                  ) : (
                    <>
                      <Note icon="info" tone="sunken">
                        {t.decisionNote}
                      </Note>
                      {isFull && <p className="t-caption c-muted">{t.full}</p>}
                      <ul>
                        {activity.candidates
                          .map((c) => ({ ...c, total: score(c.parts) }))
                          .sort((a, b) => b.total - a.total)
                          .map((candidate) => {
                            const state = reviews[`${activity.id}:${candidate.id}`] ?? {}
                            const percent = Math.round(candidate.total * 100)
                            return (
                              <li key={candidate.id} className="act__candidate">
                                <div className="row-between">
                                  <p className="t-label c-strong">
                                    {es.panel.table.volunteer} #{candidate.id} · {candidate.distance}
                                  </p>
                                  <Badge tone={percent >= 70 ? 'success' : 'info'}>{t.score(percent)}</Badge>
                                </div>
                                <details>
                                  <summary className="t-caption c-brand">{t.why}</summary>
                                  <dl className="act__parts">
                                    {Object.keys(t.parts).map((key) => (
                                      <div key={key}>
                                        <dt className="t-caption c-default">{t.parts[key]}</dt>
                                        <dd>
                                          <ProgressBar value={candidate.parts[key]} label={t.parts[key]} />
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                </details>

                                {!state.status && (
                                  <div className="act__actions">
                                    <Button icon="check" disabled={isFull} onClick={() => review(activity.id, candidate.id, { status: 'approved' })}>
                                      {t.approve}
                                    </Button>
                                    <Button variant="secondary" onClick={() => review(activity.id, candidate.id, { status: 'rejected' })}>
                                      {t.reject}
                                    </Button>
                                  </div>
                                )}
                                {state.status === 'rejected' && <Badge tone="neutral">{t.rejected}</Badge>}
                                {state.status === 'approved' && (
                                  <div className="act__attendance">
                                    <Badge tone="success">{t.approved}</Badge>
                                    <span className="t-label-sm c-muted">{t.attendance}:</span>
                                    <Button
                                      variant={state.attendance === 'present' ? 'primary' : 'secondary'}
                                      aria-pressed={state.attendance === 'present'}
                                      onClick={() => review(activity.id, candidate.id, { attendance: 'present' })}
                                    >
                                      {t.present}
                                    </Button>
                                    <Button
                                      variant={state.attendance === 'absent' ? 'primary' : 'secondary'}
                                      aria-pressed={state.attendance === 'absent'}
                                      onClick={() => review(activity.id, candidate.id, { attendance: 'absent', rating: undefined })}
                                    >
                                      {t.absent}
                                    </Button>
                                    {state.attendance === 'present' && (
                                      <div className="act__stars" role="group" aria-label={t.rate}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                          <button
                                            key={n}
                                            type="button"
                                            className={`act__star ${state.rating >= n ? 'is-on' : ''}`}
                                            aria-pressed={state.rating === n}
                                            aria-label={t.rateLabel(candidate.id, n)}
                                            onClick={() => review(activity.id, candidate.id, { rating: n })}
                                          >
                                            {n}
                                          </button>
                                        ))}
                                        {state.rating && <span className="t-caption c-muted">{t.rated(state.rating)}</span>}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                      </ul>
                    </>
                  )}
                </details>
              </li>
            )
          })}
        </ul>
        </LoadState>
      </div>
    </div>
  )
}
