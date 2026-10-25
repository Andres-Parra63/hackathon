import { useRef } from 'react'
import { useSlidingPill } from './useSlidingPill'

/**
 * Segmented control with a sliding pill (styles in PanelLayout.css, `.seg`).
 * `tabs` mode is an ARIA tablist (arrow keys move between tabs; give each panel the id from
 * `panelId(item.id)` and aria-labelledby `tabId(item.id)`). `toggle` mode is a group of pressed
 * buttons, for filters. `ink` paints the active pill in the inverse color.
 */
export default function Segmented({ items, value, onChange, label, idBase, mode = 'tabs', ink = false, className = '' }) {
  const root = useRef(null)
  const pill = useSlidingPill(root, '[data-active="true"]', value)
  const tabs = mode === 'tabs'

  const onKeyDown = (event) => {
    if (!tabs || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = items.findIndex((item) => item.id === value)
    const last = items.length - 1
    const next =
      event.key === 'Home' ? 0 : event.key === 'End' ? last : event.key === 'ArrowRight' ? (index + 1) % items.length : (index + last) % items.length
    onChange(items[next].id)
    root.current.querySelectorAll('button')[next]?.focus()
  }

  return (
    <div
      ref={root}
      className={`seg ${ink ? 'seg--ink' : ''} ${className}`}
      role={tabs ? 'tablist' : 'group'}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {pill && <span className="seg__pill" style={pill} aria-hidden="true" />}
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            className="seg__item"
            data-active={active}
            onClick={() => onChange(item.id)}
            {...(tabs
              ? {
                  role: 'tab',
                  id: tabId(idBase, item.id),
                  'aria-selected': active,
                  'aria-controls': panelId(idBase, item.id),
                  tabIndex: active ? 0 : -1,
                }
              : { 'aria-pressed': active })}
          >
            {item.label}
            {item.count !== undefined && <span className="seg__count">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

function tabId(base, id) {
  return `${base}-tab-${id}`
}

function panelId(base, id) {
  return `${base}-panel-${id}`
}
