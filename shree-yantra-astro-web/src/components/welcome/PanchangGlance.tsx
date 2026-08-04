import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { PanchangResponse } from '@/lib/api'
import { angaEndLabel } from '@/lib/location'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { Skeleton } from '@/components/ui/Skeleton'

const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस']

function dateShort(hi: boolean) {
  const d = new Date()
  return `${d.getDate()} ${(hi ? MON_HI : MON_EN)[d.getMonth()]}`
}

export function PanchangGlance({
  panchang,
  loading,
  city,
}: {
  panchang?: PanchangResponse
  loading: boolean
  city?: string
}) {
  const { hi } = useLang()
  const { theme } = useTheme()
  const t = panchang ? panchang.sunriseTithi || panchang.tithi : null
  const n = panchang ? panchang.sunriseNakshatra || panchang.nakshatra : null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="relative z-10 mt-4">
      <Link to="/panchang" className="welcome-panch-glance group block rounded-2xl border p-[15px] transition active:scale-[0.99] sm:flex sm:items-center sm:gap-3">
        <div
          className={`welcome-panch-topline ${theme.isDark ? '' : 'welcome-panch-topline-light'}`}
          aria-hidden
        />
        <div
          className={`mb-3 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border text-xl sm:mb-0 ${theme.isDark ? 'border-[rgba(243,205,126,0.55)] bg-[#1a1206]' : 'border-[var(--sy-glass-border)] bg-[#f8fafc]'}`}
        >
          📅
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--sy-accent)]">
            {hi ? 'आज का पंचांग' : "Today's panchang"} · {dateShort(hi)}
            {city ? ` · 📍 ${city}` : ''}
          </p>
          {loading && !panchang ? (
            <>
              <Skeleton className="mt-2 h-4 w-[72%]" />
              <Skeleton className="mt-2 h-3 w-[52%]" />
            </>
          ) : panchang && t && n ? (
            <>
              <p className="font-playfair mt-1 text-base font-bold text-[var(--sy-text)]">
                {hi ? t.hi || t.name : t.name} · {hi ? n.hi || n.name : n.name}
              </p>
              <p className="mt-1 text-[11.5px] text-[var(--sy-text-muted)]">
                <span className="font-semibold text-[var(--sy-gold)]">
                  🌅 {panchang.sunrise} 🌇 {panchang.sunset}
                </span>
                {t.endsAt ? ` · ⏳ ${hi ? 'तिथि' : 'Tithi'} ${angaEndLabel(t.endsAt, hi)}` : panchang.masa ? ` · ${hi ? panchang.masa.amanta.hi : panchang.masa.amanta.en}` : ''}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--sy-text-muted)]">
              {hi ? 'तिथि व नक्षत्र देखें' : 'View tithi & nakshatra'}
            </p>
          )}
        </div>
        <span className="hidden text-[var(--sy-gold)] transition group-hover:translate-x-0.5 sm:inline">→</span>
      </Link>
    </motion.div>
  )
}
