import { useEffect, useRef } from 'react'

/** Fire once on mount — matches opening a mobile screen with profile already saved. */
export function useAutoRunOnMount(onRun: () => void, enabled = true) {
  const fired = useRef(false)
  useEffect(() => {
    if (!enabled || fired.current) return
    fired.current = true
    onRun()
  }, [enabled, onRun])
}
