import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { HoroscopeSign } from '@/lib/api'
import { ZodiacWheel } from '@/components/cosmic/ZodiacWheel'
import { Panel } from '@/components/ui/Panel'
import { todayLabel } from '@/lib/location'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { SIGN_GLYPH } from '@/data/welcomeServices'
import { Skeleton } from '@/components/ui/Skeleton'

export function HoroscopeWelcomeCard({
  sign,
  loading,
  signKey,
}: {
  sign?: HoroscopeSign | null
  loading: boolean
  signKey?: string | null
}) {
  const { hi } = useLang()
  const { theme } = useTheme()
  const glyph = signKey && SIGN_GLYPH[signKey] ? SIGN_GLYPH[signKey] : '♌'

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="relative z-10 mt-4">
      <Panel className="!p-0 overflow-hidden" padding={false}>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-5 lg:p-8">
          <div className="mx-auto shrink-0 sm:mx-0">
            {theme.isDark ? (
              <div className="relative h-[112px] w-[112px]">
                <ZodiacWheel size={112} className="opacity-90" />
                <span className="absolute inset-0 flex items-center justify-center text-4xl">{glyph}</span>
              </div>
            ) : (
              <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full border border-[var(--sy-glass-border)] bg-white text-5xl shadow-sm">
                {glyph}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <CalendarIcon />
              <span className="text-[13px] font-medium text-[var(--sy-text-soft)]">{todayLabel(hi)}</span>
            </div>
            {loading && !sign ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[88%]" />
                <Skeleton className="h-3 w-[62%]" />
              </div>
            ) : (
              <p className="mt-3 text-[14px] leading-[1.6] text-[var(--sy-text-soft)]">
                {sign?.summary || (hi ? 'राशिफल लोड हो रहा है…' : 'Loading today’s rashifal…')}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-[var(--sy-glass-border)] px-5 py-4 sm:px-6">
          <Link
            to="/my-rashifal"
            className="welcome-horo-btn mx-auto flex max-w-md items-center justify-center gap-2 rounded-full border px-7 py-3 text-xs font-bold uppercase tracking-wider transition hover:brightness-105 sm:mx-0 sm:inline-flex"
          >
            {hi ? 'पूरा राशिफल पढ़ें' : 'Read full rashifal'}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </Panel>
    </motion.div>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-[var(--sy-accent)]">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
