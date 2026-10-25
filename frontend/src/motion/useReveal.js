import { DISTANCE, DURATION, EASE, gsap, MOTION_OK, REDUCED, ScrollTrigger, SplitText, useGSAP } from './gsap'
import { scrambleText } from './scramble'

/*
 * Declarative scroll animations. Inside `scope`:
 *   data-reveal="up|fade|scale|left|right|card|blur|clip"  element enters at 80 % of the viewport
 *   data-stagger="<same variants>"          its direct children enter one after another
 *   data-split                              heading words rise in 3D out of a per-line mask, unblurring
 *   data-count                              the first number in the text counts up (once)
 *   data-parallax="-12"                     drifts that many % of its height while scrolling past
 *   data-scramble                           a short mono label decodes out of random glyphs (once)
 *   data-depth                              the block zooms in from depth as it enters and recedes as it leaves (scrub)
 *   data-inview                             gets .is-in once it enters (CSS draws lines, bars, glows)
 *   data-delay="0.2"                        extra delay in seconds
 * Entrances play on the way down and reverse on the way up ("play none none reverse").
 * With reduced motion the same elements only fade: no travel, blur, depth, parallax or masks.
 *
 * Entrances move with xPercent/yPercent; hover effects (useHoverFx) move with x/y/scale.
 * GSAP composes both, so a card can be revealed and hovered without the tweens fighting.
 *
 * Entrances fade `opacity`, never `autoAlpha`: autoAlpha sets visibility: hidden, which removes
 * not-yet-revealed links and fields from the Tab order (keyboard users would skip whole sections).
 * With opacity the element stays focusable; focusing it scrolls it into view, which reveals it.
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
  // 3D card: tips back, rises and comes into focus
  card: { yPercent: pct(64), rotationX: 14, scale: 0.94, filter: 'blur(8px)', transformPerspective: 900, transformOrigin: '50% 100%' },
  blur: { yPercent: pct(DISTANCE.y * 0.5), filter: 'blur(10px)' },
  // Curtain: the block is uncovered from the bottom edge up
  clip: { clipPath: 'inset(100% 0% 0% 0%)', yPercent: pct(24) },
}

// Values every variant settles on (blur and clip need an explicit end, GSAP can't tween to "none").
const MOTION_TO = {
  card: { filter: 'blur(0px)', clearProps: 'filter' },
  blur: { filter: 'blur(0px)', clearProps: 'filter' },
  clip: { clipPath: 'inset(0% 0% 0% 0%)', clearProps: 'clipPath' },
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

/** Heading words rise in 3D out of a per-line mask and come into focus; re-splits on layout change. */
export function splitReveal(el, vars = {}) {
  return SplitText.create(el, {
    type: 'lines,words',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      gsap.fromTo(
        self.words,
        { yPercent: 110, rotationX: -55, opacity: 0, filter: 'blur(6px)', transformPerspective: 700, transformOrigin: '50% 100%' },
        {
          yPercent: 0,
          rotationX: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: DURATION.slow,
          ease: EASE.smooth,
          stagger: 0.035,
          clearProps: 'filter',
          ...vars,
        },
      ),
  })
}

const reveal = (targets, variant, vars) =>
  gsap.fromTo(
    targets,
    { ...MOTION_FROM[variant || 'up'], opacity: 0 },
    {
      xPercent: 0,
      yPercent: 0,
      rotationX: 0,
      scale: 1,
      opacity: 1,
      duration: DURATION.slow,
      ease: EASE.out,
      ...MOTION_TO[variant],
      ...vars,
    },
  )

export function useReveal(scope, dependencies = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      const q = gsap.utils.selector(scope)

      // Full motion: travel + fade, masked 3D words, depth, parallax.
      mm.add(MOTION_OK, () => {
        q('[data-split]').forEach((el) =>
          splitReveal(el, { delay: delayOf(el), scrollTrigger: { trigger: el, ...ENTER } }),
        )

        q('[data-reveal]').forEach((el) =>
          reveal(el, el.dataset.reveal, { delay: delayOf(el), scrollTrigger: { trigger: el, ...ENTER } }),
        )

        q('[data-stagger]').forEach((parent) =>
          reveal(parent.children, parent.dataset.stagger, {
            stagger: 0.09,
            delay: delayOf(parent),
            scrollTrigger: { trigger: parent, ...ENTER },
          }),
        )

        q('[data-count]').forEach((el) =>
          countUp(el, { delay: delayOf(el) + 0.2, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
        )

        q('[data-inview]').forEach((el) =>
          ScrollTrigger.create({ trigger: el, start: 'top 82%', once: true, onEnter: () => el.classList.add('is-in') }),
        )

        const restores = q('[data-scramble]').map((el) =>
          scrambleText(el, { delay: delayOf(el), scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
        )
        return () => {
          restores.forEach((restore) => restore())
          q('[data-inview]').forEach((el) => el.classList.remove('is-in'))
        }
      })

      // Depth and parallax only where there is room for them.
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

        // Sections come forward out of depth as they arrive and sink back as they leave.
        q('[data-depth]').forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.93, y: 70, opacity: 0.35 },
            { scale: 1, y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: 0.8 } },
          )
          gsap.fromTo(
            el,
            { scale: 1, opacity: 1 },
            {
              scale: 0.96,
              opacity: 0.55,
              ease: 'none',
              immediateRender: false,
              scrollTrigger: { trigger: el, start: 'bottom 45%', end: 'bottom top', scrub: 0.8 },
            },
          )
        })
      })

      // Reduced motion: the same choreography, opacity only; lines and bars appear drawn.
      mm.add(REDUCED, () => {
        const fade = (targets, trigger, extra = {}) =>
          gsap.from(targets, {
            opacity: 0,
            duration: 0.6,
            ease: 'power1.out',
            scrollTrigger: { trigger, ...ENTER },
            ...extra,
          })
        q('[data-split], [data-reveal]').forEach((el) => fade(el, el))
        q('[data-stagger]').forEach((parent) => fade(parent.children, parent, { stagger: 0.06 }))
        q('[data-inview]').forEach((el) => el.classList.add('is-in'))
      })

      return () => mm.revert()
    },
    { scope, dependencies },
  )
}
