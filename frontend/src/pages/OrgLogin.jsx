import { useState } from 'react'
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
import './OrgLogin.css'

const t = es.login

/** W02 · Ingreso de la organización (Figma 25:549). Access by role (RNF-02). */
export default function OrgLogin() {
  const navigate = useNavigate()
  const [remember, setRemember] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    navigate('/panel')
  }

  return (
    <div className="login">
      <aside className="login__brand">
        <img className="login__ring login__ring--lg" src={ringLg} alt="" />
        <img className="login__ring login__ring--md" src={ringMd} alt="" />
        <img className="login__ring login__ring--sm" src={ringSm} alt="" />
        <Link to="/" className="login__logo" aria-label={es.brand.name}>
          <Logo boxed />
        </Link>
        <div className="login__message">
          <p className="t-overline c-on">{t.eyebrow}</p>
          <h1 className="t-h1-web c-on">{t.title}</h1>
          <p className="t-body-xl c-on">{t.lead}</p>
          <dl className="login__stats">
            {t.stats.map((stat) => (
              <div key={stat.label}>
                <Icon name={stat.icon} size={20} />
                <dt className="t-numeral-md">{stat.value}</dt>
                <dd className="t-caption">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <main className="login__main">
        <form className="login__form" onSubmit={handleSubmit}>
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
