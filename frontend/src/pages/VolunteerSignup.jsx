import { useRef, useState } from 'react'
import Button from '../components/Button'
import { Checkbox, Note, Switch, TextField } from '../components/FormControls'
import Icon from '../components/Icon'
import IconTile from '../components/IconTile'
import SiteHeader from '../components/SiteHeader'
import SkillChip from '../components/SkillChip'
import { SKILLS } from '../data/demo'
import es from '../i18n/es'
import PageTransition from '../motion/PageTransition'
import { useReveal } from '../motion/useReveal'
import './VolunteerSignup.css'

const t = es.signup

/** W07 · Registro de voluntario (Figma 25:400). One-page form, three steps. */
export default function VolunteerSignup() {
  const [skills, setSkills] = useState(['Logística'])
  const [approximate, setApproximate] = useState(true)
  // Consent must be prior, express and informed (Ley 1581): never pre-checked.
  const [consent, setConsent] = useState(false)
  const [done, setDone] = useState(false)
  const main = useRef(null)
  useReveal(main)

  const canSubmit = skills.length > 0 && consent

  const toggleSkill = (skill) =>
    setSkills((current) => (current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (canSubmit) setDone(true)
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
              <Button variant="secondary" onClick={() => setDone(false)}>
                {t.doneAgain}
              </Button>
            </div>
          ) : (
            <form className="signup__form" onSubmit={handleSubmit}>
              <fieldset>
                <legend className="t-label c-default">{t.skillsLegend}</legend>
                <div className="signup__skills" data-stagger="up" data-delay="0.5">
                  {SKILLS.map((skill) => (
                    <SkillChip
                      key={skill}
                      label={skill}
                      selected={skills.includes(skill)}
                      onToggle={() => toggleSkill(skill)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="t-label c-default">{t.availabilityLegend}</legend>
                <div className="signup__row signup__row--end">
                  <TextField label={t.availabilityLabel} icon="calendar" defaultValue={t.availabilityValue} />
                  <p className="signup__eligible">
                    <Icon name="check" size={18} />
                    {t.availabilityOk}
                  </p>
                </div>
              </fieldset>

              <fieldset>
                <legend className="t-label c-default">{t.zoneLegend}</legend>
                <div className="signup__row">
                  <TextField
                    label={t.phoneLabel}
                    icon="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    defaultValue={t.phoneValue}
                  />
                  <TextField label={t.zoneLabel} icon="map-pin" defaultValue={t.zoneValue} />
                </div>
              </fieldset>

              <div className="signup__approx">
                <div>
                  <p className="t-label c-strong">{t.approxTitle}</p>
                  <p className="t-body-sm c-muted">{t.approxText}</p>
                </div>
                <Switch checked={approximate} onChange={setApproximate} label={t.approxTitle} />
              </div>

              <Checkbox checked={consent} onChange={setConsent}>
                {t.consent}
              </Checkbox>

              <div className="signup__submit">
                <Button type="submit" icon="heart" block disabled={!canSubmit} aria-describedby="signup-missing">
                  {t.submit}
                </Button>
                {!canSubmit && (
                  <p id="signup-missing" className="t-caption c-muted">
                    {t.missing}
                  </p>
                )}
              </div>
            </form>
          )}
          </PageTransition>
        </div>
      </main>
    </>
  )
}
