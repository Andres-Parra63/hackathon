import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

// Motion tokens. Soft, decelerating curves; no overshoot on entrances.
export const EASE = {
  out: 'power3.out',    // reveals, hover in
  smooth: 'expo.out',   // headline lines, page entry, panels
  inOut: 'power2.inOut', // exits, header hide/show
  settle: 'elastic.out(1, 0.75)', // the gentle "settle" after a click
}

export const DURATION = {
  fast: 0.4,
  base: 0.8,
  slow: 1.2,
}

// Distances are small on purpose: elegance comes from timing, not from travel.
export const DISTANCE = {
  y: 28, // px, entrance rise
  x: 28, // px, entrance slide
}

gsap.defaults({ ease: EASE.out, duration: DURATION.base })
ScrollTrigger.config({ ignoreMobileResize: true })

// matchMedia conditions shared by every animation.
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const REDUCED = '(prefers-reduced-motion: reduce)'
export const FINE_POINTER = '(hover: hover) and (pointer: fine)'
export const DESKTOP = '(min-width: 1024px)'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(REDUCED).matches

export { gsap, ScrollTrigger, SplitText, useGSAP }
