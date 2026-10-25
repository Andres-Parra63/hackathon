import { useCallback, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../../motion/gsap'

const STORAGE_KEY = 'manos-en-red.panel-theme'

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Light / dark theme of the organization panel. Sets data-theme on <html> while the panel is
 * mounted (tokens.css holds both palettes) and removes it on the way out, so the public site keeps
 * its own dark theme. The choice is remembered per browser. Defaults to light.
 */
export function usePanelTheme() {
  const [theme, setThemeState] = useState(() => (readStored() === 'dark' ? 'dark' : 'light'))

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    return () => {
      delete root.dataset.theme
    }
  }, [theme])

  /** Switches theme; with motion allowed, the new one spreads in a circle from `origin` (an element). */
  const setTheme = useCallback(
    (next, origin) => {
      if (next === theme) return
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Private mode or blocked storage: the theme still changes for this visit.
      }
      const apply = () => flushSync(() => setThemeState(next))
      if (!document.startViewTransition || prefersReducedMotion()) {
        apply()
        return
      }
      const box = origin?.getBoundingClientRect()
      const x = box ? box.left + box.width / 2 : window.innerWidth / 2
      const y = box ? box.top + box.height / 2 : 0
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      const transition = document.startViewTransition(apply)
      transition.ready
        .then(() =>
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
          ),
        )
        .catch(() => {})
    },
    [theme],
  )

  return { theme, setTheme }
}
