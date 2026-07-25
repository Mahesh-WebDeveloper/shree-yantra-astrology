import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/* ------------------------------------------------------------------ *
 * CountUp — animates a number once, when it scrolls into view.
 * English numerals only, grouped with the en-US separator.
 * ------------------------------------------------------------------ */
export type CountUpProps = {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function CountUp({ value, prefix, suffix, duration = 1500, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setShown(value)
      return
    }
    let raf = 0
    const started = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString('en-US')}
      {suffix ? <i>{suffix}</i> : null}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * TiltCard — subtle 3D tilt on pointer move (fine pointers only).
 * Writes CSS custom properties, so React never re-renders while moving.
 * ------------------------------------------------------------------ */
export function TiltCard({
  children,
  className,
  max = 6,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const reduce = useReducedMotion()

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const reset = () => {
    const el = ref.current
    if (!el) return
    cancelAnimationFrame(frame.current)
    el.style.setProperty('--tx', '0deg')
    el.style.setProperty('--ty', '0deg')
  }

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--ty', `${(px * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--tx', `${(-py * max * 2).toFixed(2)}deg`)
    })
  }

  return (
    <div
      ref={ref}
      className={['syj-tilt', className ?? ''].filter(Boolean).join(' ')}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Marquee — seamless infinite row. Two identical halves, translated by
 * exactly -50%; spacing lives on the items so the loop never drifts.
 * ------------------------------------------------------------------ */
export type MarqueeItem = {
  key: string
  label: string
  meta?: string
}

export function Marquee({
  items,
  reverse = false,
  seconds = 56,
  ariaLabel,
}: {
  items: readonly MarqueeItem[]
  reverse?: boolean
  seconds?: number
  ariaLabel: string
}) {
  const half = (copy: number) =>
    items.map((item) => (
      <span className="syj-marquee__item" key={`${copy}-${item.key}`}>
        <b>{item.label}</b>
        {item.meta ? (
          <>
            <i aria-hidden />
            <span>{item.meta}</span>
          </>
        ) : null}
      </span>
    ))

  return (
    <div
      className={['syj-marquee', reverse ? 'syj-marquee--rev' : ''].filter(Boolean).join(' ')}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="syj-marquee__track" style={{ '--dur': `${seconds}s` } as CSSProperties}>
        {half(0)}
        <span aria-hidden style={{ display: 'contents' }}>
          {half(1)}
        </span>
      </div>
    </div>
  )
}
