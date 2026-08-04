import { useEffect } from 'react'
import { useAnimate, useInView } from 'framer-motion'

export function useGsapReveal<T extends HTMLElement>() {
  const [scope, animate] = useAnimate<T>()
  // We use framer-motion here despite the hook name, to eliminate GSAP conflicts.
  const isInView = useInView(scope, { once: true, margin: "-10%" })

  useEffect(() => {
    if (isInView && scope.current) {
      // Imperative animation matching the old GSAP reveal
      animate(scope.current, { opacity: [0, 1], y: [36, 0] }, { duration: 0.9, ease: [0.22, 1, 0.36, 1] })
    }
  }, [isInView, animate, scope])

  return scope
}
