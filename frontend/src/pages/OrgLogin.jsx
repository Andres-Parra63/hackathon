import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ringLg from '../assets/misc/ring-lg.svg'
import ringMd from '../assets/misc/ring-md.svg'
import ringSm from '../assets/misc/ring-sm.svg'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Checkbox, Note, TextField } from '../components/FormControls'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import es from '../i18n/es'
import { gsap, MOTION_OK, useGSAP } from '../motion/gsap'
import { useReveal } from '../motion/useReveal'
import './OrgLogin.css'

const t = es.login

/** W02 · Ingreso de la organización (Figma 25:549). Access by role (RNF-02). */
export default function OrgLogin() {
  const navigate = useNavigate()
  const [remember, setRemember] = useState(false)
  const root = useRef(null)
  useReveal(root)

  // The concentric rings breathe slowly, each one out of phase with the next.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const rings = gsap.utils.toArray('.login__ring', root.current)
        gsap.from(rings, { scale: 0.6, autoAlpha: 0, duration: 1.8, stagger: 0.15 })
        rings.forEach((ring, i) =>
          gsap.to(ring, {
            scale: 1.05,
            duration: 3.2 + i * 0.6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 1.8 + i * 0.4,
          }),
        )
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/panel')
  }

  return (
    <div ref={root} className="login">
      <aside className="login__brand">
        <img className="login__ring login__ring--lg" src={ringLg} alt="" />
        <img className="login__ring login__ring--md" src={ringMd} alt="" />
        <img className="login__ring login__ring--sm" src={ringSm} alt="" />
        <Link to="/" className="login__logo" aria-label={es.brand.name}>
          <Logo boxed />
        </Link>
        <div className="login__message">
          <p className="t-overline c-on" data-reveal="fade">
            {t.eyebrow}
          </p>
          <h1 className="t-h1-web c-on" data-split>
            {t.title}
          </h1>
          <p className="t-body-xl c-on" data-reveal="up" data-delay="0.3">
            {t.lead}
          </p>
          <dl className="login__stats" data-stagger="scale" data-delay="0.5">
            {t.stats.map((stat) => (
              <div key={stat.label}>
                <Icon name={stat.icon} size={20} />
                <dt className="t-numeral-md" data-count data-delay="0.6">
                  {stat.value}
                </dt>
                <dd className="t-caption">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <main className="login__main">
        <form className="login__form" onSubmit={handleSubmit} data-stagger="up" data-delay="0.2">
          <Badge tone="info">{t.badge}</Badge>
          <h2 className="t-h2-web c-strong">{t.formTitle}</h2>
          <p className="t-body-lg c-muted">{t.formLead}</p>
          <TextField
            label={t.emailLabel}
            icon="mail"
            type="email"
            autoComplete="username"
            defaultValue={t.emailValue}
            autoFocus
            required
          />
          <TextField
            label={t.passwordLabel}
            icon="lock"
            type="password"
            autoComplete="current-password"
            defaultValue="demo-12345"
            required
          />
          <div className="login__options">
            <Checkbox checked={remember} onChange={setRemember} className="login__remember">
              {t.remember}
            </Checkbox>
            <a href="#" className="t-label-sm c-brand">
              {t.forgot}
            </a>
          </div>
          <Button type="submit" block>
            {t.submit}
          </Button>
          <Button variant="secondary" block>
            {t.requestAccess}
          </Button>
          <Note icon="shield-check" tone="success">
            {t.note}
          </Note>
        </form>
      </main>
    </div>
  )
}
