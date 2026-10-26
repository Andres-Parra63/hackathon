import { useEffect, useRef } from 'react'
import { FINE_POINTER, gsap, MOTION_OK } from '../motion/gsap'
import './CursorGlow.css'

/**
 * A soft blue light that trails the pointer behind the content (mouse/trackpad only, motion
 * allowed). Purely decorative: aria-hidden and pointer-events: none.
 */
export default function CursorGlow() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!window.matchMedia(FINE_POINTER).matches || !window.matchMedia(MOTION_OK).matches) return undefined
    const x = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' })
    const move = (e) => {
      el.classList.add('is-on')
      x(e.clientX)
      y(e.clientY)
    }
    const leave = () => el.classList.remove('is-on')
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />
}
