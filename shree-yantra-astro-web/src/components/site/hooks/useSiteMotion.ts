import { useEffect, useRef, useState } from 'react'

/** True when the visitor asked for reduced motion. Live-updates with the media query. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/** True once the element has entered the viewport (fires once). */
export function useInViewOnce<T extends HTMLElement>(rootMargin = '-12% 0px -12% 0px') {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { rootMargin, threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, rootMargin])

  return { ref, seen }
}

/**
 * Adds `.is-in` to every `[data-sy-reveal]` descendant as it scrolls in.
 * Cheap, dependency-free, and stagger-aware via `--sy-delay`.
 */
export function useRevealChildren<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-sy-reveal]'))
    if (!nodes.length) return

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }

    nodes.forEach((n) => n.classList.add('sy-reveal'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const delay = Number(el.dataset.syReveal) || 0
          el.style.animationDelay = `${delay}ms`
          el.classList.add('is-in')
          // Once the entrance finishes, drop the animating class so the
          // element returns to its natural styles. A `forwards` fill would
          // otherwise pin `transform: none` for ever and defeat any later
          // transform (tilt cards, hover lifts).
          el.addEventListener(
            'animationend',
            (ev) => {
              if (ev.target !== el) return
              el.classList.remove('sy-reveal')
              el.style.animationDelay = ''
            },
            { once: true },
          )
          io.unobserve(el)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return ref
}

/** Counts 0 → target once `active` flips true. Instant when motion is reduced. */
export function useCountUp(target: number, active: boolean, durationMs = 1500) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    if (reduced || durationMs <= 0) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, durationMs, reduced])

  return value
}

/**
 * Smooth programmatic scroll to a hash target.
 * Uses its own rAF tween so it stays smooth whether or not Lenis is running
 * (Lenis forces `scroll-behavior: auto`, which kills native smooth scrolling).
 */
export function scrollToHash(hash: string, offset = 76) {
  const id = hash.replace(/^#/, '')
  const el = document.getElementById(id)
  if (!el) return false
  // Re-measure every frame: below-fold sections may lazily lay out
  // (content-visibility, images) while the tween is running, which would
  // otherwise leave us short of — or past — the target.
  tweenScrollTo(() => Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset))
  return true
}

/** Smooth scroll back to the very top of the page. */
export function scrollToTop() {
  tweenScrollTo(() => 0)
}

function tweenScrollTo(getTargetY: () => number) {
  const reduce =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const clamp = (y: number) =>
    Math.max(0, Math.min(y, document.documentElement.scrollHeight - window.innerHeight))

  if (reduce) {
    window.scrollTo(0, clamp(getTargetY()))
    return
  }

  const startY = window.scrollY
  const duration = Math.min(1200, Math.max(420, Math.abs(getTargetY() - startY) * 0.45))
  const start = performance.now()

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    const targetY = clamp(getTargetY())
    window.scrollTo(0, startY + (targetY - startY) * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
