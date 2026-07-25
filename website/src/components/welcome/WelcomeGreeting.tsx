import { motion } from 'framer-motion'
import { GradientText } from '@/components/ui/GradientText'
import { greetingForHour } from '@/lib/location'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { SIGN_GLYPH } from '@/data/welcomeServices'

function GreetSunMoon({ kind }: { kind: 'sun' | 'moon' }) {
  const c = 'currentColor'
  if (kind === 'moon') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22" />
    </svg>
  )
}

export function WelcomeGreeting({
  moonSign,
  guestName = 'Guest',
}: {
  moonSign?: string | null
  guestName?: string
}) {
  const { hi } = useLang()
  const { theme } = useTheme()
  const hour = new Date().getHours()
  const greeting = greetingForHour(hour, hi)
  const greetKind: 'sun' | 'moon' = hour >= 5 && hour < 17 ? 'sun' : 'moon'
  const signKey = moonSign?.toLowerCase()
  const glyph = signKey && SIGN_GLYPH[signKey] ? SIGN_GLYPH[signKey] : '♌'
  const label = moonSign ? String(moonSign).toUpperCase() : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className={`welcome-greeting relative z-10 mt-6 flex items-center justify-between gap-4 rounded-[18px] border px-4 py-4 sm:px-[18px] ${theme.isDark ? 'border-[rgba(201,150,46,0.14)] bg-[#060606]' : 'border-[var(--sy-glass-border)] bg-white'}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[var(--sy-accent)]">
          <GreetSunMoon kind={greetKind} />
          <span className="text-xs font-semibold tracking-wide">
            {greeting}, {guestName}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <GradientText className="font-playfair text-xl font-bold">
            {hi ? 'स्वागत है' : 'Welcome'}, {guestName}
          </GradientText>
          <span className="text-lg" aria-hidden>
            🙏
          </span>
        </div>
        <p className="mt-1 text-[13px] text-[var(--sy-text-soft)]">
          {hi ? 'आपका दैनिक राशिफल' : 'Your daily horoscope'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full border text-2xl ${theme.isDark ? 'border-[rgba(233,184,80,0.38)] bg-black' : 'border-[var(--sy-glass-border)] bg-white'}`}
        >
          {glyph}
        </div>
        {label ? (
          <span className="font-display text-[10px] font-semibold tracking-wider text-[var(--sy-accent)]">{label}</span>
        ) : null}
      </div>
    </motion.div>
  )
}
