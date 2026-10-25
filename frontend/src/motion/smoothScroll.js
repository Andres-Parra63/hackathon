import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'
import { FINE_POINTER, gsap, prefersReducedMotion, ScrollTrigger } from './gsap'

let lenis = null

/** The running Lenis instance, or null when scroll is native (touch, reduced motion). */
export const getLenis = () => lenis

/** Scrolls to a selector or Y position, smoothly when Lenis is on. */
export function scrollToTarget(target, { offset = 0, immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, duration: 1.4 })
    return
  }
  const top =
    typeof target === 'number'
      ? target
      : (document.querySelector(target)?.getBoundingClientRect().top ?? 0) + window.scrollY + offset
  window.scrollTo({ top, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

/**
 * Inertial smooth scroll on desktop (mouse / trackpad) only; touch devices keep their native,
 * already smooth scrolling. Lenis runs on the GSAP ticker so ScrollTrigger reads the same frame.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia(FINE_POINTER).matches) return undefined

    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), // expo-out
      wheelMultiplier: 0.9,
      autoRaf: false,
    })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenis = null
    }
  }, [])
}
