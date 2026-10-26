import { useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import Badge from '../components/Badge'
import { Note } from '../components/FormControls'
import Icon from '../components/Icon'
import LoadState from '../components/LoadState'
import OperationsMap from '../components/OperationsMap'
import SiteHeader from '../components/SiteHeader'
import es from '../i18n/es'
import { useApi } from '../api/useApi'
import { useReveal } from '../motion/useReveal'
import './panel/Calls.css'
import './PublicMap.css'

const t = es.publicMap

/** Public map (no account): active operation points as GeoJSON on OpenStreetMap. */
export default function PublicMap() {
  const [selected, setSelected] = useState(null)
  const [kind, setKind] = useState('all')
  const { data: points, loading, error, reload } = useApi(() => api.points(), [])
  const main = useRef(null)
  useReveal(main)

  const source = useMemo(() => points ?? [], [points])
  const kinds = [...new Set(source.map((point) => point.tipo))]
  // Stable reference: the map is rebuilt only when the filter changes, not on every selection.
  const data = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: source
        .filter((point) => kind === 'all' || point.tipo === kind)
        .map((point) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] },
          properties: {
            id: point.id,
            name: point.nombre,
            kind: es.enums.pointType[point.tipo] ?? point.tipo,
            address: point.direccion,
            hours: point.horario ?? 'Horario no informado',
          },
        })),
    }),
    [kind, source],
  )

  return (
    <>
      <SiteHeader />
      <main ref={main} className="pubmap">
        <header className="pubmap__intro">
          <p className="t-overline c-brand" data-reveal="fade">
            {t.eyebrow}
          </p>
          <h1 className="t-h1-web c-strong">{t.title}</h1>
          <p className="t-body-lg c-muted">{t.lead}</p>
          <Note icon="alert-triangle" tone="sunken">
            {t.warning}
          </Note>
        </header>

        <LoadState loading={loading} error={error} onRetry={reload}>
          <div className="pubmap__filters" role="group" aria-label={t.filterLabel}>
            {['all', ...kinds].map((k) => (
              <button
                key={k}
                type="button"
                className={`calls__tab ${kind === k ? 'is-active' : ''}`}
                aria-pressed={kind === k}
                onClick={() => {
                  setKind(k)
                  setSelected(null)
                }}
              >
                {k === 'all' ? t.all : es.enums.pointType[k] ?? k}
              </button>
            ))}
          </div>

          <div className="pubmap__layout">
            <OperationsMap data={data} selectedId={selected} onSelect={setSelected} label={t.mapLabel} />
            <ul className="pubmap__list">
              {data.features.length === 0 && <li className="t-body-sm c-muted">{t.empty}</li>}
              {data.features.map(({ properties: p }) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`pubmap__item ${selected === p.id ? 'is-selected' : ''}`}
                    aria-pressed={selected === p.id}
                    onClick={() => setSelected(p.id)}
                  >
                    <span className="t-label c-strong">{p.name}</span>
                    <Badge tone="info">{p.kind}</Badge>
                    <span className="t-body-sm c-default pubmap__line">
                      <Icon name="map-pin" size={16} /> {p.address}
                    </span>
                    <span className="t-body-sm c-muted pubmap__line">
                      <Icon name="clock" size={16} /> {p.hours}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </LoadState>
      </main>
    </>
  )
}
