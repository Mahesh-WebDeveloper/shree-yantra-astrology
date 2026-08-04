import { TwinkleStars, ZodiacWheel } from '@/components/cosmic/ZodiacWheel'
import { useTheme } from '@/theme/ThemeProvider'

export function WelcomeBackdrop({ showWheel = true }: { showWheel?: boolean }) {
  const { theme } = useTheme()
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="welcome-glow absolute left-1/2 top-24 -translate-x-1/2" />
      {theme.isDark && <TwinkleStars />}
      {showWheel && (
        <div
          className="absolute left-1/2 top-[4.5rem] w-[min(92vw,380px)] -translate-x-1/2"
          style={{ opacity: theme.isDark ? 0.38 : 0.2 }}
        >
          <ZodiacWheel className="h-auto w-full" />
        </div>
      )}
    </div>
  )
}
