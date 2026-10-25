import { useLayoutEffect, useState } from 'react'

/**
 * Measures the active item inside `ref` (found with `selector`) so a pill behind it can slide and
 * resize to it. Re-measures when `activeKey` changes and whenever the container resizes (fonts,
 * breakpoints). Returns the pill's inline style, or null while nothing is active.
 */
export function useSlidingPill(ref, selector, activeKey) {
  const [box, setBox] = useState(null)

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return undefined
    const measure = () => {
      const active = container.querySelector(selector)
      setBox(
        active
          ? { x: active.offsetLeft, y: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight }
          : null,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [ref, selector, activeKey])

  return box && { width: box.width, height: box.height, transform: `translate(${box.x}px, ${box.y}px)` }
}
