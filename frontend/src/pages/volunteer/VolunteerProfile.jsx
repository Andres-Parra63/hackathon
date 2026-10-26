import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAction, useApi } from '../../api/useApi'
import { useAuth } from '../../auth/authContext'
import AvailabilityGrid from '../../components/AvailabilityGrid'
import Button from '../../components/Button'
import { Note, SelectField } from '../../components/FormControls'
import LoadState, { ActionError } from '../../components/LoadState'
import SkillChip from '../../components/SkillChip'
import AreaHeader from '../../components/area/AreaHeader'
import { nearestPlace, PLACE_NAMES, placeByName } from '../../data/places'
import es from '../../i18n/es'
import { fromGrid, toGrid } from '../../lib/availability'
import { useReveal } from '../../motion/useReveal'
import './Volunteer.css'

const t = es.volunteer.profile

/** Profile: skills, weekly availability, radius, zone and the data-protection controls (Ley 1581). */
export default function VolunteerProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { data, loading, error, reload } = useApi(
    () => Promise.all([api.volunteer(user.id), api.skills()]).then(([profile, skills]) => ({ profile, skills })),
    [user.id],
  )
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [revoked, setRevoked] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { run, busy, error: actionError } = useAction()
  const root = useRef(null)
  useReveal(root, [loading])

  // Form state starts from the saved profile.
  useEffect(() => {
    if (!data) return
    const p = data.profile
    setForm({
      skills: p.habilidades.map((h) => h.id),
      availability: toGrid(p.disponibilidades),
      radius: Number(p.radio_km),
      zone: nearestPlace(Number(p.lat_aprox), Number(p.lon_aprox)).name,
      receive: p.recibir_convocatorias,
    })
  }, [data])

  const change = (patch) => {
    setSaved(false)
    setForm((current) => ({ ...current, ...patch }))
  }

  const toggleSkill = (id) =>
    change({ skills: form.skills.includes(id) ? form.skills.filter((s) => s !== id) : [...form.skills, id] })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.skills.length === 0) return
    const place = placeByName(form.zone)
    const result = await run('save', () =>
      api.updateVolunteer(user.id, {
        habilidad_ids: form.skills,
        disponibilidades: fromGrid(form.availability),
        radio_km: form.radius,
        barrio: place.name,
        lat: place.lat,
        lon: place.lon,
      }),
    )
    if (result) setSaved(true)
  }

  const revoke = async () => {
    // 204 responses resolve to null: return true so `run` can tell success from failure.
    const ok = await run('revoke', async () => {
      await api.revokeConsent(user.id)
      return true
    })
    if (ok) setRevoked(true)
  }

  const deleteAccount = async () => {
    const ok = await run('delete', async () => {
      await api.deleteVolunteer(user.id)
      return true
    })
    if (ok) {
      logout()
      navigate('/')
    }
  }

  return (
    <div ref={root}>
      <AreaHeader title={t.title} subtitle={t.subtitle} />
      <div className="panel-content">
        <LoadState loading={loading || (data && !form)} error={error} onRetry={reload}>
          {form && (
            <>
              <form className="card vol__form" onSubmit={handleSubmit} data-reveal="up">
                <fieldset>
                  <legend className="t-h3 c-strong">{t.skills}</legend>
                  <div className="vol__chips">
                    {data.skills.map((skill) => (
                      <SkillChip
                        key={skill.id}
                        label={skill.nombre}
                        selected={form.skills.includes(skill.id)}
                        onToggle={() => toggleSkill(skill.id)}
                      />
                    ))}
                  </div>
                  {form.skills.length === 0 && (
                    <p className="t-caption vol__error" role="alert">
                      {t.needSkill}
                    </p>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="t-h3 c-strong">{t.availability}</legend>
                  <p className="t-body-sm c-muted">{t.availabilityHelp}</p>
                  <AvailabilityGrid value={form.availability} onChange={(availability) => change({ availability })} />
                </fieldset>

                <div className="vol__form-row">
                  <SelectField
                    label={t.zone}
                    options={PLACE_NAMES}
                    value={form.zone}
                    hint={t.zoneHint}
                    onChange={(e) => change({ zone: e.target.value })}
                  />
                  <fieldset>
                    <legend className="field__label">{t.radius}</legend>
                    <label className="vol__range">
                      <span className="sr-only">{t.radius}</span>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={form.radius}
                        aria-valuetext={t.radiusValue(form.radius)}
                        onChange={(e) => change({ radius: Number(e.target.value) })}
                      />
                      <output className="t-label c-brand">{t.radiusValue(form.radius)}</output>
                    </label>
                  </fieldset>
                </div>

                <div className="vol__actions">
                  <Button type="submit" icon="check" disabled={form.skills.length === 0 || busy === 'save'} aria-busy={busy === 'save'}>
                    {busy === 'save' ? t.saving : t.save}
                  </Button>
                  <p className="t-caption c-muted" role="status">
                    {saved ? t.saved : ''}
                  </p>
                </div>
                <ActionError error={busy === null && !saved ? actionError : null} />
              </form>

              <section className="card" aria-labelledby="vol-privacy" data-reveal="up">
                <h2 id="vol-privacy" className="t-h3 c-strong">
                  {t.privacyTitle}
                </h2>
                <p className="t-body-sm c-default">{t.privacyText}</p>
                {revoked && (
                  <Note icon="info" tone="sunken">
                    {t.revoked}
                  </Note>
                )}
                <div className="vol__actions">
                  {!revoked && (
                    <Button variant="secondary" disabled={Boolean(busy)} onClick={revoke}>
                      {t.revoke}
                    </Button>
                  )}
                  <Button variant="emergency" disabled={Boolean(busy)} onClick={() => setConfirmDelete(true)}>
                    {t.delete}
                  </Button>
                </div>
                {confirmDelete && (
                  <div className="vol__confirm" role="alertdialog" aria-labelledby="del-title" aria-describedby="del-text">
                    <h3 id="del-title" className="t-label c-strong">
                      {t.deleteTitle}
                    </h3>
                    <p id="del-text" className="t-body-sm c-default">
                      {t.deleteText}
                    </p>
                    <div className="vol__actions">
                      <Button variant="emergency" onClick={deleteAccount} disabled={busy === 'delete'} autoFocus>
                        {t.deleteConfirm}
                      </Button>
                      <Button variant="tertiary" onClick={() => setConfirmDelete(false)}>
                        {t.deleteCancel}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </LoadState>
      </div>
    </div>
  )
}
