import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { PanchangResponse } from '@/lib/api'
import { angaEndLabel } from '@/lib/location'
import { useLang } from '@/i18n/LangProvider'
import { Panel } from '@/components/ui/Panel'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { serviceTintStyle } from '@/data/welcomeServices'
import { useGsapReveal } from '@/hooks/useGsapReveal'

export function PanchangCard({
  data,
  loading,
  isError,
  onRetry,
  city,
}: {
  data?: PanchangResponse
  loading: boolean
  isError?: boolean
  onRetry?: () => void
  city?: string
}) {
  const { hi } = useLang()
  const ref = useGsapReveal<HTMLElement>()

  return (
    <section ref={ref} className="flex h-full flex-col">
      <SectionHeading
        eyebrow={hi ? 'पंचांग' : 'Panchang'}
        title={hi ? 'आज की तिथि और समय' : 'Today’s sacred calendar'}
        subtitle={data?.location || city}
      />
      <Panel
        className="home-color-card flex flex-1 flex-col"
        style={serviceTintStyle('panchang', '#f3cd7e')}
      >
        <span className="bento-card-shine" aria-hidden />
        {loading && !data ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[76px] rounded-2xl" />
            ))}
          </div>
        ) : isError && !data ? (
          <ErrorState
            message={hi ? 'पंचांग लोड नहीं हो पाया।' : 'Unable to load panchang right now.'}
            onRetry={onRetry}
          />
        ) : data ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 sm:grid-cols-2">
            <Stat label={hi ? 'तिथि' : 'Tithi'} value={hi ? data.tithi.hi || data.tithi.name : data.tithi.name} meta={data.tithi.paksha} />
            <Stat
              label={hi ? 'नक्षत्र' : 'Nakshatra'}
              value={hi ? data.nakshatra.hi || data.nakshatra.name : data.nakshatra.name}
              meta={angaEndLabel(data.nakshatra.endsAt, hi) || `Pada ${data.nakshatra.pada}`}
            />
            <Stat label={hi ? 'योग' : 'Yoga'} value={hi ? data.yoga.hi || data.yoga.name : data.yoga.name} meta={hi ? data.karana.hi || data.karana.name : data.karana.name} />
            <Stat
              label={hi ? 'वार' : 'Weekday'}
              value={hi ? data.weekdayHi || data.weekday : data.weekday}
              meta={data.masa ? (hi ? data.masa.amanta.hi : data.masa.amanta.en) : data.date}
            />
            <Stat label={hi ? 'सूर्योदय' : 'Sunrise'} value={data.sunrise} />
            <Stat label={hi ? 'सूर्यास्त' : 'Sunset'} value={data.sunset} />
            {data.observances?.[0] && (
              <div className="sy-stat-tile sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-accent)]">
                  {hi ? 'विशेष' : 'Observance'}
                </p>
                <p className="font-deva mt-1 text-base font-semibold text-[var(--sy-text)]">
                  {hi ? data.observances[0].name.hi : data.observances[0].name.en}
                </p>
              </div>
            )}
          </motion.div>
        ) : null}
        <Link to="/panchang" className="mt-5 inline-flex text-sm font-medium text-[var(--sy-accent)] hover:underline">
          {hi ? 'पूरा पंचांग →' : 'Full panchang →'}
        </Link>
      </Panel>
    </section>
  )
}

function Stat({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="sy-stat-tile">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-text-muted)]">{label}</p>
      <p className="font-deva mt-1.5 text-lg font-semibold leading-snug text-[var(--sy-text)]">{value}</p>
      {meta ? <p className="mt-1 text-[13px] leading-snug text-[var(--sy-text-soft)]">{meta}</p> : null}
    </div>
  )
}
