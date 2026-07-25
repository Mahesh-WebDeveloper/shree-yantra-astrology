import { useEffect, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touchLayout = window.matchMedia('(max-width: 768px)').matches
    if (reducedMotion || touchLayout) return

    let cancelled = false
    let lenis: Lenis | null = null
    let ticker: ((time: number) => void) | null = null

    void import('lenis').then(({ default: LenisCtor }) => {
      if (cancelled) return

      lenis = new LenisCtor({
        duration: 1.05,
        easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true,
      })

      lenis.on('scroll', ScrollTrigger.update)

      ticker = (time: number) => {
        lenis?.raf(time * 1000)
      }
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)

      ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      if (ticker) gsap.ticker.remove(ticker)
      lenis?.destroy()
      ScrollTrigger.refresh()
    }
  }, [])

  return <>{children}</>
}
