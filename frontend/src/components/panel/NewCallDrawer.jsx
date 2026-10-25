import { useEffect, useRef, useState } from 'react'
import es from '../../i18n/es'
import { EASE, gsap, prefersReducedMotion, useGSAP } from '../../motion/gsap'
import { getLenis } from '../../motion/smoothScroll'
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
export default function NewCallDrawer({ onClose, onSubmit, skillOptions = [], organizationId, userId }) {
  const [skills, setSkills] = useState([])
  const [slots, setSlots] = useState(4)
  const [type, setType] = useState(t.types[2])
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const leaving = useRef(false)

  // Entrance: the veil fades in while the panel glides from the right; its sections follow.
  // Reduced motion: both simply fade.
  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef)
      const scrim = q('.drawer-scrim')
      if (prefersReducedMotion()) {
        gsap.from([scrim, panelRef.current], { autoAlpha: 0, duration: 0.4, ease: 'power1.out' })
        return
      }
      gsap
        .timeline({ defaults: { ease: EASE.smooth } })
        .from(scrim, { autoAlpha: 0, duration: 0.7, ease: 'power2.out' }, 0)
        .from(panelRef.current, { xPercent: 100, duration: 1.1 }, 0)
        .from(
          q('.drawer__header > *, .drawer__body > *, .drawer__footer > *'),
          { y: 14, autoAlpha: 0, duration: 0.9, stagger: 0.045, clearProps: 'transform,opacity,visibility' },
          0.25,
        )
    },
    { scope: rootRef },
  )

  // Exit: glide out first, then unmount through the callback.
  const leave = contextSafe((then) => {
    if (leaving.current) return
    leaving.current = true
    const scrim = rootRef.current.querySelector('.drawer-scrim')
    if (prefersReducedMotion()) {
      gsap.to([scrim, panelRef.current], { autoAlpha: 0, duration: 0.25, onComplete: then })
      return
    }
    gsap
      .timeline({ onComplete: then, defaults: { ease: EASE.inOut } })
      .to(panelRef.current, { xPercent: 100, duration: 0.65 }, 0)
      .to(scrim, { autoAlpha: 0, duration: 0.55 }, 0.1)
  })
  const close = () => leave(onClose)
  const leaveRef = useRef(leave)
  leaveRef.current = leave

  // Focus the dialog on open, close with Escape, give focus back on close, pause page scroll.
  useEffect(() => {
    const previous = document.activeElement
    panelRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && leaveRef.current(onClose)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      getLenis()?.start()
      previous?.focus?.()
    }
  }, [onClose])

  const toggleSkill = (skill) =>
    setSkills((current) => (current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill]))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (skills.length) leave(() => onSubmit({ skills, slots, type: type === 'Desastre' ? 'desastre' : type === 'Prioritaria' ? 'prioritaria' : 'normal', organizationId, userId }))
  }

  return (
    <div ref={rootRef} className="drawer-root">
      <div className="drawer-scrim" onClick={close} aria-hidden="true" />
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
          <button type="button" className="drawer__close" onClick={close} aria-label={t.close}>
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="drawer__body" data-lenis-prevent>
          <fieldset className="drawer__group">
            <legend className="t-label c-default">{t.skillLabel}</legend>
            <div className="drawer__skills">
              {skillOptions.map((skill) => (
                <SkillChip
                  key={skill.id}
                  label={skill.nombre}
                  selected={skills.includes(skill.id)}
                  onToggle={() => toggleSkill(skill.id)}
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
                  <span key={slots}>{slots}</span>
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
          <Button variant="secondary" onClick={close}>
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
