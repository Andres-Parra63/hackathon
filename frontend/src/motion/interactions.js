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
  { selector: '.dash__history li', build: (tl, el) => tl.to(el, { x: 4 }, 0) },
  { selector: '.drawer__close', build: (tl, el) => tl.to(el, { rotation: 90, duration: 0.5 }, 0) },
  // Panel rail and top-bar icons: the glyph grows a touch; the bell rings.
  {
    selector: '.prail__btn, .ptop__icon:not(.ptop__icon--unread)',
    build: (tl, el) => tl.to(el.querySelector('.icon'), { scale: 1.14 }, 0),
  },
  {
    selector: '.ptop__icon--unread',
    build: (tl, el) =>
      tl.to(el.querySelector('.icon'), {
        keyframes: { rotation: [0, 12, -9, 5, -2, 0] },
        duration: 0.8,
        ease: 'none',
      }),
  },
]

const PRESSABLE =
  '.btn:not(:disabled), .skill-chip, .live__filter, .stepper__btn:not(:disabled), .segmented__item, .live__zoom button, .seg__item, .prail__btn, .ptop__icon, .ptop__user, .pnav__link'

const MAGNETIC = '[data-magnetic]'

const SPOTLIGHT = '[data-spotlight]'

// Cards that lean toward the pointer in 3D (max degrees).
const TILT = '[data-tilt]'
const TILT_MAX = 6

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
    // Spotlight: glass cards light their border and surface where the pointer is (CSS reads --mx/--my).
    const onSpot = (e) => {
      if (!window.matchMedia(FINE_POINTER).matches) return
      const el = e.target.closest?.(SPOTLIGHT)
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }

    // Tilt: rotate toward the pointer with smoothed setters; settle back flat on leave.
    const tilters = new WeakMap()
    const tilterFor = (el) => {
      if (!tilters.has(el)) {
        gsap.set(el, { transformPerspective: 900 })
        tilters.set(el, {
          rx: gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: EASE.out }),
          ry: gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: EASE.out }),
        })
      }
      return tilters.get(el)
    }
    const onTilt = (e) => {
      if (!allowed()) return
      const el = e.target.closest?.(TILT)
      if (!el) return
      const r = el.getBoundingClientRect()
      const t = tilterFor(el)
      t.ry(((e.clientX - r.left) / r.width - 0.5) * 2 * TILT_MAX)
      t.rx(-((e.clientY - r.top) / r.height - 0.5) * 2 * TILT_MAX)
    }
    const onTiltOut = (e) => {
      const el = e.target.closest?.(TILT)
      if (!el || el.contains(e.relatedTarget) || !tilters.has(el)) return
      const t = tilters.get(el)
      t.rx(0)
      t.ry(0)
    }

    const onMagnetOut = (e) => {
      const el = e.target.closest?.(MAGNETIC)
      if (el && !el.contains(e.relatedTarget)) gsap.to(el, { x: 0, y: 0, duration: 1, ease: EASE.out, overwrite: 'auto' })
    }

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    document.addEventListener('pointerout', onMagnetOut)
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointermove', onSpot, { passive: true })
    document.addEventListener('pointermove', onTilt, { passive: true })
    document.addEventListener('pointerout', onTiltOut)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerout', onMagnetOut)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointermove', onSpot)
      document.removeEventListener('pointermove', onTilt)
      document.removeEventListener('pointerout', onTiltOut)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      ctx.revert()
    }
  }, [])
}
