import { useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Checkbox, Note, ProgressBar, Switch, TextField } from '../components/FormControls'
import Icon, { ICON_NAMES } from '../components/Icon'
import Logo, { AppIcon } from '../components/Logo'
import SkillChip from '../components/SkillChip'
import es from '../i18n/es'
import './StyleGuide.css'

// Developer-facing reference: token names and specs stay as in Figma (not translated UI copy).
const COLORS = [
  {
    group: 'Marca',
    tokens: [
      ['brand-primary', '#1F5FBF', 'Acción principal, enlaces'],
      ['brand-primary-strong', '#164A96', 'Presionado, texto sobre suave'],
      ['brand-primary-soft', '#E3ECFA', 'Fondos de acento'],
      ['brand-primary-subtle', '#F3F7FD', 'Fondos muy suaves'],
    ],
  },
  {
    group: 'Texto',
    tokens: [
      ['text-strong', '#161827', 'Títulos, valores'],
      ['text-default', '#3B3F54', 'Cuerpo'],
      ['text-muted', '#6C7086', 'Secundario'],
      ['text-on-color', '#FFFFFF', 'Sobre color'],
    ],
  },
  {
    group: 'Superficies y bordes',
    tokens: [
      ['surface-page', '#F5F6F8', 'Fondo de página'],
      ['surface-card', '#FFFFFF', 'Tarjetas'],
      ['surface-sunken', '#ECEEF2', 'Hundido, pistas'],
      ['border-default', '#E2E4E9', 'Bordes de tarjeta'],
      ['border-strong', '#C6CAD2', 'Bordes de control'],
      ['overlay-scrim', '#161827 · 45 %', 'Velo de paneles'],
    ],
  },
  {
    group: 'Estados',
    tokens: [
      ['status-success', '#12805A', 'Confirmado, disponible'],
      ['status-success-soft', '#E2F4EC', ''],
      ['status-warning', '#A55F00', 'Emergencia, pendiente'],
      ['status-warning-soft', '#FFF1D9', ''],
      ['status-info', '#2456C9', 'Información, en vivo'],
      ['status-info-soft', '#E7EEFC', ''],
    ],
  },
  {
    group: 'Mapa',
    tokens: [
      ['map-land', '#EEF0EA', ''],
      ['map-block', '#E3E6DE', ''],
      ['map-road', '#FFFFFF', ''],
      ['map-park', '#D6EBD0', ''],
      ['map-water', '#C7DFF1', ''],
    ],
  },
]

const TYPE = [
  ['t-display', 'Web/Display', '64 / 72 · ExtraBold · −3 %'],
  ['t-h1-web', 'Web/H1', '44 / 52 · Bold · −2 %'],
  ['t-h2-web', 'Web/H2', '32 / 40 · Bold · −1,5 %'],
  ['t-h2', 'Heading/H2', '20 / 26 · Bold · −1 %'],
  ['t-h3', 'Heading/H3', '17 / 22 · Bold · −0,5 %'],
  ['t-body-xl', 'Web/Body XL', '20 / 30 · Regular'],
  ['t-body-lg', 'Body/Large', '16 / 24 · Regular'],
  ['t-body', 'Body/Default', '15 / 22 · Regular'],
  ['t-body-strong', 'Body/Strong', '15 / 22 · SemiBold'],
  ['t-body-sm', 'Body/Small', '13 / 18 · Regular'],
  ['t-label', 'Label/Default', '14 / 18 · SemiBold'],
  ['t-label-sm', 'Label/Small', '12 / 16 · SemiBold'],
  ['t-caption', 'Caption', '12 / 16 · Medium'],
  ['t-overline', 'Overline', '11 / 14 · Bold · +8 % · MAYÚSCULAS'],
  ['t-button', 'Button', '16 / 20 · Bold'],
  ['t-numeral-lg', 'Numeral/Large', '44 / 48 · ExtraBold · −2 %'],
  ['t-numeral-md', 'Numeral/Medium', '28 / 32 · ExtraBold · −2 %'],
]

const RADII = [
  ['radius-xs', 7], ['radius-sm', 10], ['radius-md', 12], ['radius-control', 14], ['radius-lg', 16],
  ['radius-xl', 18], ['radius-2xl', 20], ['radius-3xl', 24], ['radius-4xl', 28], ['radius-5xl', 32],
]

const ELEVATIONS = [
  ['elevation-1', 'Tarjeta', '0 1 2 · 5 %  +  0 4 12 · 5 %'],
  ['elevation-2', 'Flotante', '0 2 6 · 5 %  +  0 8 24 · 10 %'],
  ['elevation-3', 'Notificación', '0 4 10 · 8 %  +  0 18 40 · 22 %'],
]

function Section({ title, children }) {
  return (
    <section className="sg__section">
      <h2 className="t-h2-web c-strong">{title}</h2>
      {children}
    </section>
  )
}

/** Living style guide: renders the real tokens and components ("Guía de estilo y componentes" in Figma). */
export default function StyleGuide() {
  const [chip, setChip] = useState(true)
  const [checked, setChecked] = useState(true)
  const [on, setOn] = useState(true)

  return (
    <main className="sg">
      <header className="sg__header">
        <Logo />
        <h1 className="t-h1-web c-strong">{es.styleGuide.title}</h1>
        <p className="t-body-lg c-muted">{es.styleGuide.lead}</p>
      </header>

      <Section title="Color">
        {COLORS.map(({ group, tokens }) => (
          <div key={group} className="sg__group">
            <h3 className="t-label c-default">{group}</h3>
            <div className="sg__swatches">
              {tokens.map(([name, hex, use]) => (
                <figure key={name} className="sg__swatch">
                  <span style={{ background: `var(--${name})` }} />
                  <figcaption>
                    <code className="t-label-sm c-strong">--{name}</code>
                    <span className="t-caption c-muted">
                      {hex}
                      {use && ` · ${use}`}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Tipografía · Plus Jakarta Sans">
        <div className="sg__type">
          {TYPE.map(([cls, name, spec]) => (
            <div key={cls} className="sg__type-row">
              <div>
                <p className="t-label c-strong">{name}</p>
                <p className="t-caption c-muted">
                  {spec} · <code>.{cls}</code>
                </p>
              </div>
              <p className={`${cls} c-strong`}>Ayuda correcta, cerca y a tiempo</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radios y elevación">
        <div className="sg__radii">
          {RADII.map(([name, px]) => (
            <div key={name} className="sg__radius" style={{ borderRadius: px }}>
              <span className="t-label-sm c-strong">{px} px</span>
              <code className="t-caption c-muted">--{name}</code>
            </div>
          ))}
        </div>
        <div className="sg__elevations">
          {ELEVATIONS.map(([name, label, spec]) => (
            <div key={name} className="sg__elevation" style={{ boxShadow: `var(--${name})` }}>
              <p className="t-label c-strong">{label}</p>
              <code className="t-caption c-muted">--{name}</code>
              <span className="t-caption c-muted">{spec}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Iconos · ${ICON_NAMES.length} · 24 px, trazo 2`}>
        <div className="sg__icons">
          {ICON_NAMES.map((name) => (
            <div key={name} className="sg__icon">
              <Icon name={name} />
              <span className="t-caption c-muted">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Componentes">
        <div className="sg__components">
          <div className="sg__demo">
            <h3 className="t-label c-default">Marca</h3>
            <div className="sg__inline">
              <Logo />
              <AppIcon />
            </div>
          </div>
          <div className="sg__demo">
            <h3 className="t-label c-default">Botón · Primario, Secundario, Terciario (52 px, radio 14)</h3>
            <div className="sg__inline">
              <Button icon="heart">Primario</Button>
              <Button variant="secondary" icon="building">
                Secundario
              </Button>
              <Button variant="tertiary" icon="map">
                Terciario
              </Button>
              <Button disabled>Deshabilitado</Button>
            </div>
          </div>
          <div className="sg__demo">
            <h3 className="t-label c-default">Badge · Crítico, Éxito, Alerta, Info, Neutro</h3>
            <div className="sg__inline">
              <Badge tone="critical">Crítico</Badge>
              <Badge tone="success">Éxito</Badge>
              <Badge tone="warning">Alerta</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="neutral">Neutro</Badge>
            </div>
          </div>
          <div className="sg__demo">
            <h3 className="t-label c-default">Chip · Normal, Seleccionado (56 px)</h3>
            <div className="sg__inline sg__chips">
              <SkillChip label="Salud" selected={false} onToggle={() => {}} />
              <SkillChip label="Logística" selected={chip} onToggle={() => setChip((v) => !v)} />
            </div>
          </div>
          <div className="sg__demo sg__fields">
            <h3 className="t-label c-default">Campo de formulario · Normal, Foco</h3>
            <TextField label="Celular" icon="phone" placeholder="300 123 4567" />
            <TextField label="Barrio o zona" icon="map-pin" placeholder="Chapinero, Bogotá" />
          </div>
          <div className="sg__demo">
            <h3 className="t-label c-default">Interruptor, casilla y progreso</h3>
            <div className="sg__inline">
              <Switch checked={on} onChange={setOn} label="Interruptor" />
              <Checkbox checked={checked} onChange={setChecked}>
                Casilla
              </Checkbox>
            </div>
            <ProgressBar value={0.75} label="Progreso" />
          </div>
          <div className="sg__demo">
            <h3 className="t-label c-default">Notas</h3>
            <Note icon="message" tone="info">
              Información
            </Note>
            <Note icon="eye-off" tone="sunken">
              Privacidad
            </Note>
            <Note icon="shield-check" tone="success">
              Confirmación
            </Note>
          </div>
        </div>
      </Section>
    </main>
  )
}
