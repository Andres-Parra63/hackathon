import { useCallback, useEffect, useId, useRef, useState } from 'react'
import './Popover.css'

/**
 * Disclosure popover: a trigger button plus a floating panel. Closes on Escape (focus returns to
 * the trigger), on a click outside and when focus leaves it. The panel stays mounted so it can
 * animate out; while closed it is `visibility: hidden`, which also takes it out of the Tab order.
 *
 * @param {{
 *   label: string,             accessible name of the trigger (icon-only triggers need it)
 *   trigger: React.ReactNode,  trigger content
 *   triggerClassName?: string,
 *   panelLabel?: string,       accessible name of the panel (defaults to `label`)
 *   align?: 'start' | 'end',   panel edge aligned with the trigger
 *   side?: 'bottom' | 'right', where the panel opens
 *   tooltip?: string,          visual tooltip on hover/focus (CSS, reads `data-tip`)
 *   onOpen?: () => void,       must be stable (useCallback): it runs each time the panel opens
 *   children: React.ReactNode | ((close: () => void) => React.ReactNode),
 * }} props
 */
export default function Popover({
  label,
  trigger,
  triggerClassName = '',
  panelLabel,
  align = 'end',
  side = 'bottom',
  className = '',
  tooltip,
  onOpen,
  children,
}) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)
  const id = useId()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return undefined
    onOpen?.()
    const onPointer = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpen])

  const onBlur = (event) => {
    if (!root.current?.contains(event.relatedTarget)) setOpen(false)
  }

  return (
    <div ref={root} className={`pop ${className}`} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        data-tip={tooltip}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      <div
        id={id}
        role="group"
        aria-label={panelLabel ?? label}
        className={`pop__panel pop__panel--${side} pop__panel--${align}`}
        data-open={open}
      >
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  )
}
