import { useRef } from 'react'
import { EASE, gsap, MOTION_OK, REDUCED, ScrollTrigger, useGSAP } from './gsap'

const CLEAR = 'transform,translate,rotate,scale,opacity,visibility'

/**
 * Page / tab entry. Remount it with `key` so the old content leaves at once and the new one
 * eases in. Full motion: soft rise + fade. Reduced motion: fade only.
 */
export default function PageTransition({ children, className = '' }) {
  const ref = useRef(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const done = () => ScrollTrigger.refresh()
      mm.add(MOTION_OK, () => {
        gsap.from(ref.current, { autoAlpha: 0, y: 18, duration: 1, ease: EASE.smooth, clearProps: CLEAR, onComplete: done })
      })
      mm.add(REDUCED, () => {
        gsap.from(ref.current, { autoAlpha: 0, duration: 0.5, ease: 'power1.out', clearProps: CLEAR, onComplete: done })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
