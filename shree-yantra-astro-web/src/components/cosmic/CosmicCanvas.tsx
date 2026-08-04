import { Suspense, lazy } from 'react'
import { useTheme } from '@/theme/ThemeProvider'

const Scene = lazy(() => import('./CosmicSceneInner'))

/** Subtle WebGL starfield — fixed behind content, low opacity */
export function CosmicCanvas() {
  const { theme } = useTheme()

  if (!theme.isDark) return null

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]">
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </div>
  )
}
