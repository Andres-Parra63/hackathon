import { useEffect, useRef, useState } from 'react'
import { SKILLS } from '../../data/demo'
import es from '../../i18n/es'
import Button from '../Button'
import { TextArea } from '../FormControls'
import Icon from '../Icon'
import IconTile from '../IconTile'
import SkillChip from '../SkillChip'
import './NewCallDrawer.css'

const t = es.newCall
const MIN_SLOTS = 1
const MAX_SLOTS = 50

/** W04 · Nueva convocatoria (Figma 26:1005): 520 px side panel over a scrim. */
export default function NewCallDrawer({ onClose, onSubmit }) {
  const [skills, setSkills] = useState(['Logística'])
  const [slots, setSlots] = useState(4)
  const [type, setType] = useState(t.types[2])
  const panelRef = useRef(null)

  // Focus the dialog on open, close with Escape, give focus back on close.
  useEffect(() => {
    const previous = document.activeElement
    panelRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [onClose])

  const toggleSkill = (skill) =>
    setSkills((current) => (current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (skills.length) onSubmit({ skills, slots, type })
  }

  return (
    <div className="drawer-root">
      <div className="drawer-scrim" onClick={onClose} aria-hidden="true" />
      <form
        ref={panelRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-call-title"
        tabIndex={-1}
        onSubmit={handleSubmit}
      >
        <header className="drawer__header">
          <div>
            <h2 id="new-call-title" className="t-h2-web c-strong">
              {t.title}
            </h2>
            <p className="t-body c-muted">{t.lead}</p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label={t.close}>
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="drawer__body">
          <fieldset className="drawer__group">
            <legend className="t-label c-default">{t.skillLabel}</legend>
            <div className="drawer__skills">
              {SKILLS.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  selected={skills.includes(skill)}
                  onToggle={() => toggleSkill(skill)}
                />
              ))}
            </div>
            <p className="drawer__hint">
              <Icon name="info" size={18} />
              {t.skillHint}
            </p>
          </fieldset>

          <div className="drawer__row">
            <div className="drawer__group drawer__slots">
              <p className="t-label c-default" id="slots-label">
                {t.slotsLabel}
              </p>
              <div className="stepper" role="group" aria-labelledby="slots-label">
                <button
                  type="button"
                  className="stepper__btn stepper__btn--less"
                  onClick={() => setSlots((n) => Math.max(MIN_SLOTS, n - 1))}
                  disabled={slots <= MIN_SLOTS}
                  aria-label={t.less}
                >
                  <Icon name="minus" size={18} />
                </button>
                <output className="stepper__value t-h2" aria-live="polite">
                  {slots}
                </output>
                <button
                  type="button"
                  className="stepper__btn stepper__btn--more"
                  onClick={() => setSlots((n) => Math.min(MAX_SLOTS, n + 1))}
                  disabled={slots >= MAX_SLOTS}
                  aria-label={t.more}
                >
                  <Icon name="plus" size={18} />
                </button>
              </div>
            </div>

            <fieldset className="drawer__group drawer__type">
              <legend className="t-label c-default">{t.typeLabel}</legend>
              <div className="segmented">
                {t.types.map((option, i) => (
                  <label key={option} className={`segmented__item ${type === option ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="call-type"
                      className="sr-only"
                      checked={type === option}
                      onChange={() => setType(option)}
                    />
                    {i === t.types.length - 1 && <Icon name="alert-triangle" size={16} />}
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <TextArea label={t.notesLabel} defaultValue={t.notesValue} />

          <div className="drawer__reach" aria-live="polite">
            <IconTile icon="users" tone="brand" size={44} iconSize={22} radius={14} />
            <div>
              <p className="t-h3 c-strong">{t.reachTitle(skills.length ? 5 : 0)}</p>
              <p className="t-body-sm c-muted">{t.reachText}</p>
            </div>
          </div>
        </div>

        <footer className="drawer__footer">
          <Button variant="secondary" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" icon="send" className="drawer__submit" disabled={!skills.length}>
            {t.submit}
          </Button>
        </footer>
      </form>
    </div>
  )
}
