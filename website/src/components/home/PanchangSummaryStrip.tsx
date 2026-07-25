import type { PanchangResponse } from '@/lib/api'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { SIGN_LABEL, serviceTintStyle } from '@/data/welcomeServices'
import { useLang } from '@/i18n/LangProvider'

type Props = {
  data?: PanchangResponse
  loading: boolean
  isError?: boolean
  city?: string
  onRetry?: () => void
}

function angaName(item: { name: string; hi?: string } | null | undefined, hi: boolean) {
  if (!item) return ''
  return hi ? item.hi || item.name : item.name
}

function moonName(sign: string | undefined, hi: boolean) {
  if (!sign) return ''
  const key = sign.toLowerCase()
  return hi ? SIGN_LABEL[key]?.hi || sign : SIGN_LABEL[key]?.en || sign
}

export function PanchangSummaryStrip({ data, loading, isError, city, onRetry }: Props) {
  const { hi } = useLang()
  const tithi = data?.sunriseTithi || data?.tithi
  const nakshatra = data?.sunriseNakshatra || data?.nakshatra
  const location = city || data?.location || 'Jaipur'

  const items = data
    ? [
        { k: hi ? 'तिथि' : 'Tithi', v: angaName(tithi, hi) },
        { k: hi ? 'नक्षत्र' : 'Nakshatra', v: angaName(nakshatra, hi) },
        { k: hi ? 'सूर्योदय' : 'Sunrise', v: data.sunrise },
        { k: hi ? 'सूर्यास्त' : 'Sunset', v: data.sunset },
        { k: hi ? 'चंद्र राशि' : 'Moon', v: moonName(data.moon?.sign, hi) },
      ].filter((x) => x.v)
    : []

  return (
    <section
      className="home-panchang-strip home-color-card"
      style={serviceTintStyle('panchang', '#f3cd7e')}
      aria-label={hi ? 'आज का पंचांग सारांश' : 'Today panchang summary'}
    >
      <span className="bento-card-shine" aria-hidden />
      <div className="home-panchang-head">
        <span className="home-panchang-dot" aria-hidden />
        <div>
          <p className="home-panchang-kicker">{hi ? 'स्थान अनुसार पंचांग' : 'Location Panchang'}</p>
          <h2>{location}</h2>
        </div>
      </div>

      {loading && !data ? (
        <div className="home-panchang-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-2xl" />
          ))}
        </div>
      ) : isError && !data ? (
        <div className="home-panchang-error">
          <ErrorState message={hi ? 'पंचांग लोड नहीं हो पाया।' : 'Unable to load panchang.'} onRetry={onRetry} />
        </div>
      ) : (
        <div className="home-panchang-grid">
          {items.map((item) => (
            <div key={item.k} className="home-panchang-item">
              <span>{item.k}</span>
              <strong>{item.v}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
