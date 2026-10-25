import { DISTANCE, DURATION, EASE, gsap, MOTION_OK, REDUCED, SplitText, useGSAP } from './gsap'

/*
 * Declarative scroll animations. Inside `scope`:
 *   data-reveal="up|fade|scale|left|right"  element enters when it reaches 80 % of the viewport
 *   data-stagger="up|fade|scale|left|right" its direct children enter one after another
 *   data-split                              heading rises line by line behind a mask
 *   data-count                              the first number in the text counts up (once)
 *   data-parallax="-12"                     drifts that many % of its height while scrolling past
 *   data-delay="0.2"                        extra delay in seconds
 * Entrances play on the way down and reverse on the way up ("play none none reverse").
 * With reduced motion the same elements only fade: no travel, no parallax, no masks.
 *
 * Entrances move with xPercent/yPercent; hover effects (useHoverFx) move with x/y/scale.
 * GSAP composes both, so a card can be revealed and hovered without the tweens fighting.
 */

// Converts a pixel distance into a percentage of the element's own size.
const pct = (px, axis = 'y') => (i, el) => {
  const size = axis === 'y' ? el.offsetHeight : el.offsetWidth
  return size ? (px / size) * 100 : 0
}

const MOTION_FROM = {
  up: { yPercent: pct(DISTANCE.y) },
  fade: {},
  scale: { scale: 0.97, yPercent: pct(DISTANCE.y * 0.6) },
  left: { xPercent: pct(-DISTANCE.x, 'x') },
  right: { xPercent: pct(DISTANCE.x, 'x') },
}

const ENTER = { start: 'top 80%', toggleActions: 'play none none reverse' }
const delayOf = (el) => Number(el.dataset.delay || 0)

// "46,8 %", "+10.000", "≤ 30 min", "2,3 s" -> animates only the number, keeps the rest.
export function countUp(el, vars = {}) {
  // Keep the original text: a re-run (StrictMode, remount) must not read a half-counted value.
  el.dataset.countText ??= el.textContent
  const text = el.dataset.countText
  const match = text.match(/\d[\d.,]*/)
  if (!match) return null
  const raw = match[0]
  const decimals = raw.includes(',') ? raw.split(',')[1].length : 0
  const target = Number(raw.replace(/\./g, '').replace(',', '.'))
  const [before, after] = [text.slice(0, match.index), text.slice(match.index + raw.length)]
  const format = (n) =>
    n.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const state = { n: 0 }
  el.setAttribute('aria-label', text)
  return gsap.to(state, {
    n: target,
    duration: 1.8,
    ease: 'power2.out',
    ...vars,
    onUpdate: () => {
      el.textContent = `${before}${format(state.n)}${after}`
    },
    onComplete: () => {
      el.textContent = text
    },
  })
}

/** Lines rise from behind a mask; re-splits by itself when the layout changes. */
export function splitReveal(el, vars = {}) {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 100,
        duration: DURATION.slow,
        ease: EASE.smooth,
        stagger: 0.08,
        ...vars,
      }),
  })
}

export function useReveal(scope, dependencies = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(scope)

      // Full motion: travel + fade, masked lines, parallax.
      mm.add(MOTION_OK, () => {
        q('[data-split]').forEach((el) =>
          splitReveal(el, { delay: delayOf(el), scrollTrigger: { trigger: el, ...ENTER } }),
        )

        q('[data-reveal]').forEach((el) =>
          gsap.from(el, {
            ...MOTION_FROM[el.dataset.reveal || 'up'],
            autoAlpha: 0,
            duration: DURATION.slow,
            delay: delayOf(el),
            scrollTrigger: { trigger: el, ...ENTER },
          }),
        )

        q('[data-stagger]').forEach((parent) =>
          gsap.from(parent.children, {
            ...MOTION_FROM[parent.dataset.stagger || 'up'],
            autoAlpha: 0,
            duration: DURATION.slow,
            stagger: 0.09,
            delay: delayOf(parent),
            scrollTrigger: { trigger: parent, ...ENTER },
          }),
        )

        q('[data-count]').forEach((el) =>
          countUp(el, { delay: delayOf(el) + 0.2, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
        )
      })

      // Subtle parallax only where there is room for it.
      mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
        q('[data-parallax]').forEach((el) =>
          gsap.fromTo(
            el,
            { yPercent: -Number(el.dataset.parallax) / 2 },
            {
              yPercent: Number(el.dataset.parallax) / 2,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
            },
          ),
        )
      })

      // Reduced motion: the same choreography, opacity only.
      mm.add(REDUCED, () => {
        const fade = (targets, trigger, extra = {}) =>
          gsap.from(targets, {
            autoAlpha: 0,
            duration: 0.6,
            ease: 'power1.out',
            scrollTrigger: { trigger, ...ENTER },
            ...extra,
          })
        q('[data-split], [data-reveal]').forEach((el) => fade(el, el))
        q('[data-stagger]').forEach((parent) => fade(parent.children, parent, { stagger: 0.06 }))
      })

      return () => mm.revert()
    },
    { scope, dependencies },
  )
}
