import { useMemo, useState } from 'react'
import { useLang } from '@/i18n/LangProvider'
import type { PanchangAnga, PanchangResponse } from '@/lib/api'
import { todayDmy, useLivePanchang } from './hooks/useLivePanchang'
import { useRevealChildren } from './hooks/useSiteMotion'

const CITIES = [
  { key: 'Jaipur', hi: 'जयपुर', en: 'Jaipur' },
  { key: 'Delhi', hi: 'दिल्ली', en: 'Delhi' },
  { key: 'Mumbai', hi: 'मुंबई', en: 'Mumbai' },
  { key: 'Jodhpur', hi: 'जोधपुर', en: 'Jodhpur' },
  { key: 'Kolkata', hi: 'कोलकाता', en: 'Kolkata' },
]

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस']

/** "25 Jul 2026" / "25 जुल 2026" — always English numerals. */
function longDate(dmy: string, hi: boolean) {
  const [d, m, y] = dmy.split('/').map((n) => Number(n))
  if (!d || !m || !y) return dmy
  return `${d} ${(hi ? MONTHS_HI : MONTHS_EN)[m - 1]} ${y}`
}

function angaLabel(a: PanchangAnga | null | undefined, hi: boolean): string | null {
  if (!a) return null
  const name = hi ? a.hi || a.name : a.name
  return name || null
}

type Cell = { key: string; value: string; sub?: string }

function buildCells(p: PanchangResponse, hi: boolean): Cell[] {
  // UDAYA (sunrise) anga is the day's anga — the app's convention.
  const tithi = p.sunriseTithi ?? p.tithi
  const nak = p.sunriseNakshatra ?? p.nakshatra
  const yoga = p.sunriseYoga ?? p.yoga
  const karana = p.sunriseKarana ?? p.karana

  const paksha = tithi ? (hi ? tithi.pakshaHi || tithi.paksha : tithi.paksha) : null
  const endsAt = (a?: PanchangAnga | null) =>
    a?.endsAt?.hm
      ? hi
        ? `${a.endsAt.hm} तक${a.endsAt.nextDay ? ' (अगले दिन)' : ''}`
        : `until ${a.endsAt.hm}${a.endsAt.nextDay ? ' (next day)' : ''}`
      : undefined

  const cells: Cell[] = [
    {
      key: hi ? 'तिथि' : 'Tithi',
      value: [angaLabel(tithi, hi), paksha].filter(Boolean).join(' · ') || '—',
      sub: endsAt(tithi),
    },
    {
      key: hi ? 'नक्षत्र' : 'Nakshatra',
      value: angaLabel(nak, hi) ?? '—',
      sub: nak?.pada ? (hi ? `पाद ${nak.pada}` : `Pada ${nak.pada}`) : endsAt(nak),
    },
    { key: hi ? 'योग' : 'Yoga', value: angaLabel(yoga, hi) ?? '—', sub: endsAt(yoga) },
    { key: hi ? 'करण' : 'Karana', value: angaLabel(karana, hi) ?? '—', sub: endsAt(karana) },
    {
      key: hi ? 'सूर्योदय' : 'Sunrise',
      value: p.sunrise || '—',
      sub: p.timings?.daylight ? (hi ? p.timings.daylight.hi : p.timings.daylight.text) : undefined,
    },
    {
      key: hi ? 'सूर्यास्त' : 'Sunset',
      value: p.sunset || '—',
      sub: p.timings?.night ? (hi ? p.timings.night.hi : p.timings.night.text) : undefined,
    },
  ]

  if (p.masa) {
    cells.push({
      key: hi ? 'मास' : 'Masa',
      value: hi ? p.masa.amanta.hi : p.masa.amanta.en,
      sub: hi ? `अमांत · पूर्णिमांत ${p.masa.purnimanta.hi}` : `Amanta · Purnimanta ${p.masa.purnimanta.en}`,
    })
  }

  if (p.samvat?.vikram) {
    cells.push({
      key: hi ? 'संवत' : 'Samvat',
      value: `Vikram ${p.samvat.vikram}`,
      sub: p.samvat.shaka ? `Shaka ${p.samvat.shaka}` : undefined,
    })
  }

  return cells
}

function Skeletons() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="sy-proof__cell" key={i} aria-hidden>
          <div className="sy-skeleton" style={{ height: 9, width: '42%' }} />
          <div className="sy-skeleton" style={{ height: 18, width: '76%', marginTop: 8 }} />
          <div className="sy-skeleton" style={{ height: 8, width: '54%', marginTop: 8 }} />
        </div>
      ))}
    </>
  )
}

export function LiveProof() {
  const { hi } = useLang()
  const [city, setCity] = useState('Jaipur')
  const date = useMemo(() => todayDmy(), [])
  const { data, loading, error, refetch } = useLivePanchang(city, date)
  const revealRef = useRevealChildren<HTMLDivElement>()

  const t = (h: string, e: string) => (hi ? h : e)
  const cells = data ? buildCells(data, hi) : []
  const observances = data?.observances ?? []
  const active = CITIES.find((c) => c.key === city)
  const cityLabel = hi ? (active?.hi ?? city) : (data?.location || active?.en || city)

  return (
    <section
      className="sy-section sy-site"
      id="live-proof"
      aria-labelledby="sy-live-title"
      ref={revealRef}
    >
      <div className="sy-container">
        <div data-sy-reveal="0">
          <p className="sy-eyebrow">{t('जीवंत प्रमाण', 'Live proof')}</p>
          <h2 id="sy-live-title" className="sy-h2 mt-5">
            {t(
              'यह पेज अभी हमारे सर्वर से जीवंत डेटा दिखा रहा है',
              'This page is showing LIVE data from our engine, right now',
            )}
          </h2>
          <p className="sy-lead mt-5">
            {t(
              'नीचे दिखा हर मान इसी क्षण हमारे गणना इंजन से आया है — स्क्रीनशॉट नहीं। शहर बदलिए, संख्याएँ बदल जाएँगी।',
              'Every value below was computed by our engine moments ago — not a screenshot. Change the city and the numbers change with it.',
            )}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3" data-sy-reveal="80">
          {error ? (
            <span className="sy-chip sy-num" style={{ opacity: 0.55 }}>
              {t('ऑफ़लाइन', 'OFFLINE')}
            </span>
          ) : (
            <span
              className="sy-chip sy-num"
              style={{ borderColor: 'var(--sy-line-strong)' }}
              aria-live="polite"
            >
              <span className="sy-live-dot" aria-hidden />
              {t('लाइव', 'LIVE')}
            </span>
          )}
          <span className="sy-body sy-num" style={{ color: 'var(--sy-ink)' }}>
            {longDate(date, hi)}
          </span>
          <span className="sy-micro">
            {t('स्थान', 'Location')}: {cityLabel}
            {data?.weekday ? ` · ${hi ? data.weekdayHi || data.weekday : data.weekday}` : ''}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t('शहर चुनें', 'Choose a city')} data-sy-reveal="120">
          {CITIES.map((c) => (
            <button
              key={c.key}
              type="button"
              className="sy-city"
              aria-pressed={city === c.key}
              onClick={() => setCity(c.key)}
            >
              {hi ? c.hi : c.en}
            </button>
          ))}
        </div>

        <div className="mt-7" data-sy-reveal="160">
          {error ? (
            <div className="sy-card sy-card--pad" role="status">
              <p className="sy-h3">{t('इंजन अभी नहीं पहुँच पाया', 'Could not reach the engine')}</p>
              <p className="sy-body mt-3">
                {t(
                  'हमारा गणना इंजन इस समय इस ब्राउज़र से नहीं जुड़ पाया — सुरक्षित HTTPS कनेक्शन जल्द उपलब्ध होगा। हम यहाँ कोई अनुमानित या नकली मान नहीं दिखाते, इसलिए यह जगह खाली है।',
                  'Our calculation engine could not be reached from this browser right now — secure HTTPS access is coming shortly. We never show estimated or placeholder values, so this space stays empty instead.',
                )}
              </p>
              <button type="button" className="sy-btn-ghost sy-btn-sm mt-5" onClick={refetch}>
                {t('फिर कोशिश करें', 'Try again')}
              </button>
            </div>
          ) : (
            <>
              <div className="sy-proof__grid" aria-busy={loading}>
                {loading && !data ? (
                  <Skeletons />
                ) : (
                  cells.map((cell) => (
                    <div className="sy-proof__cell" key={cell.key}>
                      <span className="sy-proof__key">{cell.key}</span>
                      <span className="sy-proof__val sy-num">{cell.value}</span>
                      {cell.sub ? <span className="sy-proof__sub sy-num">{cell.sub}</span> : null}
                    </div>
                  ))
                )}
              </div>

              {observances.length > 0 && (
                <div className="sy-card sy-card--pad mt-4">
                  <p className="sy-proof__key">{t('आज का पर्व / व्रत', "Today's observances")}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {observances.map((o) => (
                      <li key={o.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="sy-h3" style={{ fontSize: '1.05rem' }}>
                          {hi ? o.name.hi : o.name.en}
                        </span>
                        {o.guidance ? (
                          <span className="sy-micro">{hi ? o.guidance.hi : o.guidance.en}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="sy-micro mt-5">
                {t(
                  'गणना: लाहिड़ी (चित्रा पक्ष) अयनांश · उदयकालीन तिथि परंपरा · समय स्थानीय सूर्योदय पर आधारित।',
                  'Computed with the Lahiri (Chitra Paksha) ayanamsa · sunrise (udaya) tithi convention · timings from local sunrise.',
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
