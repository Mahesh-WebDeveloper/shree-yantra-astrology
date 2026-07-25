import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { PanchangResponse } from '@/lib/api'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { GoldButton } from '@/components/ui/GoldButton'
import { Panel } from '@/components/ui/Panel'
import { greetingForHour, todayLabel, mediaUrl } from '@/lib/location'
import { useLang } from '@/i18n/LangProvider'

type Props = {
  appName: string
  tagline: string
  logoUrl?: string | null
  panchang?: PanchangResponse
  panchCity?: string
}

export function HeroSection({ appName, tagline, logoUrl, panchang, panchCity }: Props) {
  const { hi } = useLang()
  const hour = new Date().getHours()
  const greeting = greetingForHour(hour, hi)

  const stats = panchang
    ? [
        {
          label: hi ? 'तिथि' : 'Tithi',
          value: hi ? panchang.tithi.hi || panchang.tithi.name : panchang.tithi.name,
        },
        {
          label: hi ? 'नक्षत्र' : 'Nakshatra',
          value: hi ? panchang.nakshatra.hi || panchang.nakshatra.name : panchang.nakshatra.name,
        },
        { label: hi ? 'सूर्योदय' : 'Sunrise', value: panchang.sunrise },
        { label: hi ? 'सूर्यास्त' : 'Sunset', value: panchang.sunset },
      ]
    : null

  return (
    <section className="relative z-10 pb-12 pt-4 sm:pb-16 sm:pt-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 flex items-center gap-3">
            {logoUrl ? (
              <img
                src={mediaUrl(logoUrl) || logoUrl}
                alt=""
                className="h-11 w-11 rounded-xl object-contain"
              />
            ) : (
              <ShreeYantraLogo size={44} pulse={false} />
            )}
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--sy-text)]">{appName}</p>
              <p className="text-xs text-[var(--sy-text-muted)]">{tagline}</p>
            </div>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--sy-accent)]">
            {todayLabel(hi)}
          </p>
          <h1 className="mt-3 text-balance text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-[var(--sy-text)]">
            {greeting}
            <span className="sy-gradient-text">.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--sy-text-muted)]">
            {hi
              ? 'पंचांग, दैनिक श्लोक और राशिफल — सटीक गणना, सरल भाषा।'
              : 'Panchang, daily shloka & rashifal — precise calculations, clear guidance.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/rashifal">
              <GoldButton type="button" size="lg">
                {hi ? 'राशिफल' : 'Rashifal'}
              </GoldButton>
            </Link>
            <GoldButton
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('today')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {hi ? 'आज का विवरण' : 'Today’s details'}
            </GoldButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <Panel className="overflow-hidden !p-0">
            <div className="border-b border-[var(--sy-glass-border)] px-5 py-4 sm:px-6">
              <p className="text-xs font-medium text-[var(--sy-text-muted)]">{hi ? 'आज का सार' : 'At a glance'}</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--sy-text)]">
                {panchCity || panchang?.location || (hi ? 'स्थान…' : 'Location…')}
              </p>
            </div>
            {stats ? (
              <div className="grid grid-cols-2 gap-px bg-[var(--sy-glass-border)] p-px">
                {stats.map((s) => (
                  <div key={s.label} className="sy-stat-tile !rounded-none border-0 bg-[var(--sy-card-inner)]">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--sy-text-muted)]">{s.label}</p>
                    <p className="font-deva mt-1 text-[15px] font-semibold leading-snug text-[var(--sy-text)]">{s.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="sy-stat-tile animate-pulse">
                    <div className="h-3 w-12 rounded bg-white/10" />
                    <div className="mt-2 h-5 w-20 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>
    </section>
  )
}
