import { useEffect } from 'react'
import { EASE, FINE_POINTER, gsap, MOTION_OK } from './gsap'

/*
 * Hover / press micro-interactions for the whole app, by event delegation.
 * Each matching element gets a paused gsap.timeline() the first time the pointer reaches it:
 * mouseenter plays it, mouseleave reverses it, pressing scales it down and lets it settle.
 * Only on mouse/trackpad devices and when motion is allowed. Uses x/y/scale/rotation, which
 * compose with the xPercent/yPercent used by the scroll reveals.
 */

const HOVERS = [
  {
    // Buttons: lift a hair, icon nudges.
    selector: '.btn:not([data-magnetic]):not(:disabled)',
    build: (tl, el) => {
      tl.to(el, { y: -2 }, 0)
      const icon = el.querySelector('.icon')
      if (icon) tl.to(icon, { scale: 1.12, rotation: -6 }, 0)
    },
  },
  {
    // Cards: float up; their icon tile tilts.
    selector: '[data-hover="lift"]',
    build: (tl, el) => {
      tl.to(el, { y: -6, duration: 0.6 }, 0)
      const tile = el.querySelector('.icon-tile')
      if (tile) tl.to(tile, { rotation: -8, scale: 1.08, duration: 0.6 }, 0)
    },
  },
  { selector: '.skill-chip, .live__filter', build: (tl, el) => tl.to(el, { y: -2 }, 0) },
  {
    selector: '.dash__cta',
    build: (tl, el) => tl.to(el, { y: -3 }, 0).to(el.querySelector('.dash__cta-plus'), { rotation: 90, scale: 1.06 }, 0),
  },
  {
    selector: '.sidebar__link',
    build: (tl, el) => tl.to(el.querySelectorAll('.icon, .sidebar__label'), { x: 3, stagger: 0.03 }, 0),
  },
  { selector: '.dash__history li, .calls__history .card', build: (tl, el) => tl.to(el, { x: 4 }, 0) },
  { selector: '.drawer__close', build: (tl, el) => tl.to(el, { rotation: 90, duration: 0.5 }, 0) },
  {
    selector: '.panel-header__bell',
    build: (tl, el) =>
      tl.to(el.querySelector('img'), {
        keyframes: { rotation: [0, 10, -8, 5, -2, 0] },
        duration: 0.8,
        ease: 'none',
      }),
  },
]

const PRESSABLE =
  '.btn:not(:disabled), .skill-chip, .live__filter, .dash__cta, .stepper__btn:not(:disabled), .segmented__item, .live__zoom button'

const MAGNETIC = '[data-magnetic]'

export function useInteractions() {
  useEffect(() => {
    const allowed = () =>
      window.matchMedia(MOTION_OK).matches && window.matchMedia(FINE_POINTER).matches
    const ctx = gsap.context(() => {})
    const timelines = new WeakMap()

    const timelineFor = (el, hover) => {
      if (!timelines.has(el)) {
        ctx.add(() => {
          const tl = gsap.timeline({ paused: true, defaults: { duration: 0.45, ease: EASE.out } })
          hover.build(tl, el)
          timelines.set(el, tl)
        })
      }
      return timelines.get(el)
    }

    const match = (target) => {
      for (const hover of HOVERS) {
        const el = target.closest?.(hover.selector)
        if (el) return { el, hover }
      }
      return null
    }

    // mouseenter / mouseleave semantics through delegated pointerover / pointerout.
    const onOver = (e) => {
      if (!allowed()) return
      const hit = match(e.target)
      if (hit && !hit.el.contains(e.relatedTarget)) timelineFor(hit.el, hit.hover).play()
    }
    const onOut = (e) => {
      const hit = match(e.target)
      if (hit && !hit.el.contains(e.relatedTarget)) timelines.get(hit.el)?.reverse()
    }

    // Press: quick dip, then an elastic settle on release (the "click" feel).
    let pressed = null
    const onDown = (e) => {
      if (!allowed()) return
      pressed = e.target.closest?.(PRESSABLE)
      if (pressed) gsap.to(pressed, { scale: 0.96, duration: 0.14, ease: 'power2.out', overwrite: 'auto' })
    }
    const onUp = () => {
      if (pressed) gsap.to(pressed, { scale: 1, duration: 0.9, ease: EASE.settle, overwrite: 'auto' })
      pressed = null
    }

    // Magnetic CTAs: follow the pointer a little, glide back on leave.
    const onMove = (e) => {
      if (!allowed()) return
      const el = e.target.closest?.(MAGNETIC)
      if (!el) return
      const r = el.getBoundingClientRect()
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * 0.18,
        y: (e.clientY - (r.top + r.height / 2)) * 0.25,
        duration: 0.8,
        ease: EASE.out,
        overwrite: 'auto',
      })
    }
    const onMagnetOut = (e) => {
      const el = e.target.closest?.(MAGNETIC)
      if (el && !el.contains(e.relatedTarget)) gsap.to(el, { x: 0, y: 0, duration: 1, ease: EASE.out, overwrite: 'auto' })
    }

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    document.addEventListener('pointerout', onMagnetOut)
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerout', onMagnetOut)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      ctx.revert()
    }
  }, [])
}
