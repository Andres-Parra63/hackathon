import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useApi } from '../api/useApi'
import { useAuth } from '../auth/authContext'
import AvailabilityGrid from '../components/AvailabilityGrid'
import Button from '../components/Button'
import { Checkbox, Note, SelectField, TextField } from '../components/FormControls'
import IconTile from '../components/IconTile'
import LoadState, { ActionError } from '../components/LoadState'
import SiteHeader from '../components/SiteHeader'
import SkillChip from '../components/SkillChip'
import { MUNICIPALITY, PLACE_NAMES, placeByName } from '../data/places'
import es from '../i18n/es'
import { fromGrid } from '../lib/availability'
import PageTransition from '../motion/PageTransition'
import { useReveal } from '../motion/useReveal'
import './VolunteerSignup.css'

const t = es.signup

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[0-9 +()-]{7,20}$/

const validate = (f) => {
  const errors = {}
  if (f.name.trim().length < 2) errors.name = t.errors.name
  if (!EMAIL.test(f.email.trim())) errors.email = t.errors.email
  if (f.password.length < 8) errors.password = t.errors.password
  if (f.phone && !PHONE.test(f.phone)) errors.phone = t.errors.phone
  if (!f.zone) errors.zone = t.errors.zone
  if (f.skills.length === 0) errors.skills = t.errors.skills
  if (!f.consent) errors.consent = t.errors.consent
  return errors
}

/** W07 · Registro de voluntario (Figma 25:400). Creates the account in the API and signs in. */
export default function VolunteerSignup() {
  const skillsApi = useApi(() => api.skills(), [])
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    zone: '',
    skills: [],
    availability: { 'Sáb-Mañana': true, 'Dom-Mañana': true },
    radius: 5,
    // Consent must be prior, express and informed (Ley 1581): never pre-checked.
    consent: false,
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const main = useRef(null)
  useReveal(main)

  const change = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => delete next[key])
      return next
    })
  }

  const toggleSkill = (id) =>
    change({ skills: form.skills.includes(id) ? form.skills.filter((s) => s !== id) : [...form.skills, id] })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formEl = event.currentTarget
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Move focus to the first invalid field once the errors render.
      requestAnimationFrame(() => formEl.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    const place = placeByName(form.zone)
    setBusy(true)
    setServerError(null)
    try {
      await api.registerVolunteer({
        nombre: form.name.trim(),
        correo: form.email.trim().toLowerCase(),
        telefono: form.phone || null,
        contrasena: form.password,
        barrio: place.name,
        municipio: MUNICIPALITY,
        lat: place.lat,
        lon: place.lon,
        radio_km: form.radius,
        habilidad_ids: form.skills,
        disponibilidades: fromGrid(form.availability),
        acepta_tratamiento_datos: form.consent,
      })
      await login(form.email, form.password)
      setDone(true)
    } catch (err) {
      setServerError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main ref={main} className="signup">
        <section className="signup__intro" aria-labelledby="signup-title">
          <p className="t-overline c-brand" data-reveal="fade">
            {t.eyebrow}
          </p>
          <h1 id="signup-title" className="t-h1-web c-strong" data-split>
            {t.title}
          </h1>
          <p className="t-body-xl c-muted" data-reveal="up" data-delay="0.2">
            {t.lead}
          </p>
          <ol className="signup__steps" data-stagger="left" data-delay="0.35">
            {t.steps.map((step, i) => (
              <li key={step.title}>
                <span className="signup__step-number">{i + 1}</span>
                <div>
                  <p className="t-label c-strong">{step.title}</p>
                  <p className="t-body-sm c-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="signup__notes" data-stagger="up" data-delay="0.6">
            <Note icon="message" tone="info">
              {t.notePush}
            </Note>
            <Note icon="eye-off" tone="sunken">
              {t.notePrivacy}
            </Note>
          </div>
        </section>

        <div className="signup__card" data-reveal="scale" data-delay="0.2">
          <PageTransition key={done ? 'done' : 'form'}>
          {done ? (
            <div className="signup__done" role="status">
              <IconTile icon="check" tone="solid-success" size={56} iconSize={28} round />
              <h2 className="t-h2-web c-strong">{t.doneTitle}</h2>
              <p className="t-body-lg c-default">{t.doneText}</p>
              <Button icon="arrow-right" onClick={() => navigate('/voluntario')}>
                {es.volunteer.signupDone.cta}
              </Button>
            </div>
          ) : (
            <form className="signup__form" onSubmit={handleSubmit} noValidate>
              <fieldset>
                <legend className="t-label c-default">{t.accountLegend}</legend>
                <TextField
                  label={t.nameLabel}
                  icon="user"
                  autoComplete="name"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => change({ name: e.target.value })}
                />
                <div className="signup__row">
                  <TextField
                    label={t.emailLabel}
                    icon="mail"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    error={errors.email}
                    onChange={(e) => change({ email: e.target.value })}
                  />
                  <TextField
                    label={t.passwordLabel}
                    icon="lock"
                    type="password"
                    autoComplete="new-password"
                    hint={t.passwordHint}
                    value={form.password}
                    error={errors.password}
                    onChange={(e) => change({ password: e.target.value })}
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend className="t-label c-default">{t.skillsLegend}</legend>
                <LoadState loading={skillsApi.loading} error={skillsApi.error} onRetry={skillsApi.reload} rows={1}>
                  <div className="signup__skills">
                    {(skillsApi.data ?? []).map((skill) => (
                      <SkillChip
                        key={skill.id}
                        label={skill.nombre}
                        selected={form.skills.includes(skill.id)}
                        onToggle={() => toggleSkill(skill.id)}
                      />
                    ))}
                  </div>
                </LoadState>
                {errors.skills && (
                  <p className="field__error" role="alert">
                    {errors.skills}
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="t-label c-default">{t.availabilityLegend}</legend>
                <p className="t-body-sm c-muted">{t.availabilityLabel}</p>
                <AvailabilityGrid value={form.availability} onChange={(availability) => change({ availability })} />
                <label className="signup__radius">
                  <span className="t-label c-default">{t.radiusLabel}</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={form.radius}
                    aria-valuetext={`${form.radius} km`}
                    onChange={(e) => change({ radius: Number(e.target.value) })}
                  />
                  <output className="t-label c-brand">{form.radius} km</output>
                </label>
              </fieldset>

              <fieldset>
                <legend className="t-label c-default">{t.zoneLegend}</legend>
                <div className="signup__row">
                  <SelectField
                    label={t.zoneLabel}
                    placeholder={t.zonePlaceholder}
                    options={PLACE_NAMES}
                    value={form.zone}
                    error={errors.zone}
                    onChange={(e) => change({ zone: e.target.value })}
                  />
                  <TextField
                    label={t.phoneLabel}
                    icon="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    hint={t.phoneHint}
                    value={form.phone}
                    error={errors.phone}
                    onChange={(e) => change({ phone: e.target.value })}
                  />
                </div>
                <Note icon="eye-off" tone="sunken">
                  {t.approxText}
                </Note>
              </fieldset>

              <Checkbox checked={form.consent} error={errors.consent} onChange={(consent) => change({ consent })}>
                {t.consent}
              </Checkbox>

              <div className="signup__submit">
                <Button type="submit" icon="heart" block disabled={busy} aria-busy={busy}>
                  {busy ? t.submitting : t.submit}
                </Button>
                <ActionError error={serverError} />
              </div>
            </form>
          )}
          </PageTransition>
        </div>
      </main>
    </>
  )
}
