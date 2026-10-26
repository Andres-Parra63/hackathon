import es from '../../i18n/es'
import './WeekChart.css'

const t = es.dashboard.chart
const PLOT_HEIGHT = 168 // px, height of the value axis
const SERIES = ['emergency', 'normal'] // top to bottom inside each column

/**
 * Stacked columns, one per day: normal calls (blue) at the base, Emergency Mode (orange) on top.
 * Legend + selective cap label (today's total) carry identity and value; hovering a day shows
 * its numbers. The drawing is decorative for assistive tech: the same data is in the table below it.
 * Columns rise from the baseline when the chart scrolls into view (data-inview → .is-in).
 */
export default function WeekChart({ data, max = 10, ticks = [0, 5, 10] }) {
  return (
    <figure className="wchart" style={{ '--plot-h': `${PLOT_HEIGHT}px` }}>
      <ul className="wchart__legend" aria-hidden="true">
        {SERIES.slice()
          .reverse()
          .map((key) => (
            <li key={key}>
              <span className={`wchart__swatch wchart__swatch--${key}`} />
              {t.series[key]}
            </li>
          ))}
      </ul>

      <div className="wchart__plot" aria-hidden="true" data-inview>
        {ticks.map((tick) => (
          <div key={tick} className="wchart__tick" style={{ bottom: `calc(var(--axis-h) + ${(tick / max) * PLOT_HEIGHT}px)` }}>
            <span>{tick}</span>
          </div>
        ))}

        <div className="wchart__cols">
          {data.map((day, i) => {
            const empty = day.normal === null
            const total = empty ? 0 : day.normal + day.emergency
            return (
              <div
                key={day.day}
                className={`wchart__col ${day.today ? 'is-today' : ''} ${empty ? 'is-empty' : ''}`}
                style={{ '--i': i, '--bar-h': `${(total / max) * PLOT_HEIGHT}px` }}
              >
                <div className="wchart__bar">
                  {day.today && <div className="wchart__cap">{total}</div>}
                  {!empty &&
                    SERIES.filter((key) => day[key] > 0).map((key) => (
                      <span
                        key={key}
                        className={`wchart__seg wchart__seg--${key}`}
                        style={{ height: `${(day[key] / max) * PLOT_HEIGHT}px` }}
                      />
                    ))}
                </div>
                <span className="wchart__day">{day.today ? t.today : day.day}</span>

                <div className="wchart__tip">
                  <p className="wchart__tip-title">{day.label}</p>
                  {empty ? (
                    <p>{t.noData}</p>
                  ) : (
                    <>
                      {SERIES.slice()
                        .reverse()
                        .map((key) => (
                          <p key={key}>
                            <span className={`wchart__swatch wchart__swatch--${key}`} />
                            {t.series[key]}
                            <b>{day[key]}</b>
                          </p>
                        ))}
                      <p className="wchart__tip-total">
                        {t.total}
                        <b>{t.people(total)}</b>
                      </p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <table className="sr-only">
        <caption>{t.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.day}</th>
            <th scope="col">{t.series.normal}</th>
            <th scope="col">{t.series.emergency}</th>
            <th scope="col">{t.total}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.day}>
              <th scope="row">{day.label}</th>
              {day.normal === null ? (
                <td colSpan={3}>{t.noData}</td>
              ) : (
                <>
                  <td>{day.normal}</td>
                  <td>{day.emergency}</td>
                  <td>{day.normal + day.emergency}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
