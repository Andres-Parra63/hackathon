import { useState } from 'react'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { Checkbox, Note, ProgressBar, Switch, TextField } from '../components/FormControls'
import Icon, { ICON_NAMES } from '../components/Icon'
import Logo, { AppIcon } from '../components/Logo'
import SkillChip from '../components/SkillChip'
import es from '../i18n/es'
import './StyleGuide.css'

// Developer-facing reference: token names and specs mirror styles/tokens.css (not translated UI copy).
const COLORS = [
  {
    group: 'Marca (azul · modo normal)',
    tokens: [
      ['brand-primary', '#0A63E6', 'Rellenos con texto blanco (5,4:1)'],
      ['brand-primary-hover', '#0852C2', 'Relleno en hover / presionado'],
      ['brand-primary-strong', '#5C9DFF', 'Azul como texto, iconos y enlaces (7,7:1)'],
      ['brand-primary-soft', '#0D2147', 'Fondos de acento'],
      ['brand-primary-subtle', '#070F1F', 'Fondos muy suaves'],
    ],
  },
  {
    group: 'Texto',
    tokens: [
      ['text-strong', '#EBF1FF', 'Títulos, valores (18:1)'],
      ['text-default', '#C4C8D2', 'Cuerpo (12:1)'],
      ['text-muted', '#8F94A0', 'Secundario (6,9:1)'],
      ['text-on-color', '#FFFFFF', 'Sobre azul'],
      ['text-on-light', '#050608', 'Sobre rellenos claros'],
    ],
  },
  {
    group: 'Superficies y bordes',
    tokens: [
      ['surface-page', '#000000', 'Lienzo'],
      ['surface-card', '#0B0B0D', 'Tarjetas, paneles'],
      ['surface-raised', '#141418', 'Menús, filas en hover'],
      ['surface-sunken', '#18181D', 'Pistas, chips inactivos'],
      ['surface-glass', 'Blanco · 3 %', 'Cristal sobre negro'],
      ['border-default', 'Blanco · 10 %', 'Líneas finas (decorativas)'],
      ['border-strong', 'Blanco · 38 %', 'Bordes de control (3,3:1)'],
      ['overlay-scrim', 'Negro · 60 %', 'Velo de paneles'],
    ],
  },
  {
    group: 'Estados',
    tokens: [
      ['status-success', '#3ECF8E', 'Confirmado, disponible'],
      ['status-success-soft', '#0B2A1D', ''],
      ['status-warning', '#FFA733', 'Modo Emergencia, pendiente'],
      ['status-warning-soft', '#2E1D05', ''],
      ['status-danger', '#FF7A7A', 'Errores de formulario'],
      ['status-info', '#5C9DFF', 'Información, en vivo'],
      ['status-info-soft', '#0D2147', ''],
    ],
  },
  {
    group: 'Mapa',
    tokens: [
      ['map-land', '#101114', ''],
      ['map-block', '#0D0E11', ''],
      ['map-road', '#1C1D22', ''],
      ['map-park', '#0F1D14', ''],
      ['map-water', '#0B1626', ''],
    ],
  },
]

const TYPE = [
  ['t-display', 'Display', '64 · 1,05 · 520 · −3,5 %'],
  ['t-h1-web', 'H1', '44 · 1,1 · 510 · −3 %'],
  ['t-h2-web', 'H2', '30 · 1,2 · 510 · −2 %'],
  ['t-h2', 'Heading/H2', '20 · 1,3 · 510 · −1,5 %'],
  ['t-h3', 'Heading/H3', '17 · 1,3 · 510 · −1 %'],
  ['t-body-xl', 'Body XL', '19 · 1,55 · 400'],
  ['t-body-lg', 'Body/Large', '16 · 1,5 · 400'],
  ['t-body', 'Body/Default', '15 · 1,5 · 400'],
  ['t-body-strong', 'Body/Strong', '15 · 1,5 · 510'],
  ['t-body-sm', 'Body/Small', '13 · 1,4 · 400'],
  ['t-label', 'Label/Default', '14 · 1,3 · 510'],
  ['t-label-sm', 'Label/Small', '12 · 1,3 · 510'],
  ['t-caption', 'Caption', '12 · 1,35 · 400'],
  ['t-overline', 'Overline (DM Mono)', '12 / 16 · 400 · +6 % · MAYÚSCULAS'],
  ['t-button', 'Button', '15 / 20 · 510'],
  ['t-numeral-lg', 'Numeral/Large', '56 · 1 · 510 · −2 % · tabulares'],
  ['t-numeral-md', 'Numeral/Medium', '30 · 1,1 · 510 · −2 % · tabulares'],
  ['t-mono', 'Mono (DM Mono)', 'Leads y etiquetas de datos'],
]

const RADII = [
  ['radius-xs', 6], ['radius-sm', 8], ['radius-md', 10], ['radius-lg', 12], ['radius-xl', 16],
  ['radius-2xl', 18], ['radius-3xl', 22], ['radius-4xl', 24], ['radius-5xl', 28], ['radius-control', 999],
]

const ELEVATIONS = [
  ['elevation-1', 'Tarjeta', 'Brillo interior 4 %  +  0 8 24 · negro 40 %'],
  ['elevation-2', 'Flotante', 'Brillo interior 6 %  +  0 16 40 · negro 55 %'],
  ['elevation-3', 'Notificación', 'Brillo interior 8 %  +  0 24 60 · negro 70 %'],
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
            <h3 className="t-label c-default">Botón · Primario, Secundario, Contorno, Emergencia, Terciario (52 px, píldora)</h3>
            <div className="sg__inline">
              <Button icon="heart">Primario</Button>
              <Button variant="secondary" icon="building">
                Secundario
              </Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="emergency">Emergencia</Button>
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
