import { useRef } from 'react'

/** Sets --mx/--my CSS vars on the element to the pointer position (magic-ui spotlight). */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const onMouseMove = (e: React.MouseEvent<T>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }
  return { ref, onMouseMove }
}
