import { RESPONSE_TONE } from '../../data/demo'
import es from '../../i18n/es'
import Badge from '../Badge'
import Icon from '../Icon'
import './ResponsesTable.css'

const t = es.panel.table

/**
 * Web/Tabla (Figma 22:653). Volunteers are anonymized: code only, never name or phone.
 * `withDetail` adds the 190 px "Detalle" column used in W06.
 */
export default function ResponsesTable({ rows, withDetail = false, caption }) {
  return (
    <div className="rtable">
      <table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">{t.volunteer}</th>
            <th scope="col" className="rtable__skill">{t.skill}</th>
            <th scope="col" className="rtable__distance">{t.distance}</th>
            <th scope="col" className="rtable__status">{t.status}</th>
            <th scope="col" className="rtable__time">{t.time}</th>
            {withDetail && <th scope="col" className="rtable__detail">{t.detail}</th>}
          </tr>
        </thead>
        <tbody data-stagger="left" data-delay="0.2">
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <span className="rtable__who">
                  <span className="rtable__avatar" aria-hidden="true">
                    <Icon name="user" size={16} />
                  </span>
                  {t.volunteer} #{row.id}
                </span>
              </th>
              <td className="rtable__skill t-label c-default">{row.skill}</td>
              <td className="t-body-sm c-default">{row.distance}</td>
              <td>
                <Badge tone={RESPONSE_TONE[row.status]}>{row.status}</Badge>
              </td>
              <td className="t-body-sm c-default">{row.time}</td>
              {withDetail && <td className="t-body-sm c-muted">{row.detail}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
