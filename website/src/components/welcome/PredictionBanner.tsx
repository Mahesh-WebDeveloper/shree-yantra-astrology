import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { HoroscopeSign } from '@/lib/api'
import { Panel } from '@/components/ui/Panel'
import { GradientText } from '@/components/ui/GradientText'
import { useLang } from '@/i18n/LangProvider'

export function PredictionBanner({ sign, loading }: { sign?: HoroscopeSign | null; loading: boolean }) {
  const { hi } = useLang()
  const chips = sign
    ? [
        sign.luckyNumber != null ? `${hi ? 'शुभ अंक' : 'Lucky'}: ${sign.luckyNumber}` : null,
        sign.luckyColor,
      ].filter(Boolean) as string[]
    : []

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 mt-5">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[var(--sy-glass-border)] bg-[var(--sy-glass)] text-2xl shadow-[0_0_24px_rgba(233,184,80,0.12)]">
            ✦
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--sy-accent)] opacity-80">
              {hi ? 'आज का फल' : "Today's prediction"}
            </p>
            {loading && !sign ? (
              <p className="mt-2 h-6 animate-pulse rounded bg-white/10" />
            ) : (
              <GradientText className="font-playfair mt-1 block text-lg font-bold leading-snug">
                {sign?.headline || sign?.summary?.slice(0, 80) || (hi ? 'आज का फलादेश' : "Today's reading")}
              </GradientText>
            )}
            {chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span key={c} className="rounded-full border border-[var(--sy-glass-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--sy-accent)]">
                    {c}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs leading-relaxed text-[var(--sy-text-muted)]">
              {sign?.plainSummary?.slice(0, 120) || sign?.summary?.slice(0, 140) || (hi ? 'ऐप में व्यक्तिगत कुंडली फल खोलें।' : 'Open personalized chart readings in the app.')}
            </p>
            <Link
              to="/my-rashifal"
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--sy-gold)] transition hover:border-[var(--sy-accent)]/40"
            >
              {hi ? 'विवरण देखें' : 'View details'} →
            </Link>
          </div>
        </div>
      </Panel>
    </motion.div>
  )
}
