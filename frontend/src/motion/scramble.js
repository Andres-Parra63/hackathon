import { gsap } from './gsap'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/<>_=+'

/**
 * "Decodes" a short mono label: characters resolve left to right out of random glyphs.
 * Screen readers get the real text from a visually hidden copy; the animated copy is aria-hidden,
 * so assistive tech never reads the noise. Returns a function that restores the original markup.
 */
export function scrambleText(el, vars = {}) {
  const text = el.textContent
  const real = document.createElement('span')
  real.className = 'sr-only'
  real.textContent = text
  const shown = document.createElement('span')
  shown.setAttribute('aria-hidden', 'true')
  shown.textContent = text
  el.replaceChildren(real, shown)

  const state = { p: 0 }
  const render = () => {
    const done = Math.floor(state.p * text.length)
    let out = text.slice(0, done)
    for (let i = done; i < text.length; i++) {
      const ch = text[i]
      out += ch === ' ' || ch === '·' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    shown.textContent = out
  }
  const tween = gsap.to(state, {
    p: 1,
    duration: Math.min(1.4, 0.35 + text.length * 0.03),
    ease: 'none',
    ...vars,
    onStart: render,
    onUpdate: render,
    onComplete: () => {
      shown.textContent = text
    },
  })

  return () => {
    tween.scrollTrigger?.kill()
    tween.kill()
    el.textContent = text
  }
}
