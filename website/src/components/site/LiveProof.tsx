import { useMemo, useState } from 'react'
import { useLang } from '@/i18n/LangProvider'
import type { PanchangAnga, PanchangResponse } from '@/lib/api'
import { todayDmy, useLivePanchang } from './hooks/useLivePanchang'
import { useRevealChildren } from './hooks/useSiteMotion'
import './sections.css'

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

/** key = the traditional name, hint = what it means in ordinary words. */
type Cell = { key: string; hint?: string; value: string; sub?: string }

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
      hint: hi ? 'चंद्र मास का वर्तमान दिन' : 'the current lunar day',
      value: [angaLabel(tithi, hi), paksha].filter(Boolean).join(' · ') || '—',
      sub: endsAt(tithi),
    },
    {
      key: hi ? 'नक्षत्र' : 'Nakshatra',
      hint: hi ? 'आज चंद्रमा जिस नक्षत्र में स्थित है' : 'the nakshatra occupied by the Moon today',
      value: angaLabel(nak, hi) ?? '—',
      sub: nak?.pada ? (hi ? `पाद ${nak.pada}` : `Pada ${nak.pada}`) : endsAt(nak),
    },
    {
      key: hi ? 'योग' : 'Yoga',
      hint: hi ? 'सूर्य और चंद्रमा की संयुक्त स्थिति से बनने वाला योग' : 'the yoga formed from the combined positions of the Sun and Moon',
      value: angaLabel(yoga, hi) ?? '—',
      sub: endsAt(yoga),
    },
    {
      key: hi ? 'करण' : 'Karana',
      hint: hi ? 'तिथि का आधा भाग' : 'one half of a tithi',
      value: angaLabel(karana, hi) ?? '—',
      sub: endsAt(karana),
    },
    {
      key: hi ? 'सूर्योदय' : 'Sunrise',
      hint: hi ? 'आपके शहर में सूर्योदय का समय' : 'sunrise time in your city',
      value: p.sunrise || '—',
      sub: p.timings?.daylight ? (hi ? p.timings.daylight.hi : p.timings.daylight.text) : undefined,
    },
    {
      key: hi ? 'सूर्यास्त' : 'Sunset',
      hint: hi ? 'आपके शहर में सूर्यास्त का समय' : 'sunset time in your city',
      value: p.sunset || '—',
      sub: p.timings?.night ? (hi ? p.timings.night.hi : p.timings.night.text) : undefined,
    },
  ]

  if (p.masa) {
    cells.push({
      key: hi ? 'मास' : 'Masa',
      hint: hi ? 'हिंदू पंचांग का वर्तमान मास' : 'the current month in the Hindu calendar',
      value: hi ? p.masa.amanta.hi : p.masa.amanta.en,
      sub: hi ? `अमांत · पूर्णिमांत ${p.masa.purnimanta.hi}` : `Amanta · Purnimanta ${p.masa.purnimanta.en}`,
    })
  }

  if (p.samvat?.vikram) {
    cells.push({
      key: hi ? 'संवत' : 'Samvat',
      hint: hi ? 'हिंदू पंचांग का वर्तमान संवत' : 'the current year in the Hindu calendar',
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
        <div className="syj-alm__cell" key={i} aria-hidden>
          <div className="sy-skeleton" style={{ height: 9, width: '42%' }} />
          <div className="sy-skeleton" style={{ height: 18, width: '76%', marginTop: 10 }} />
          <div className="sy-skeleton" style={{ height: 8, width: '54%', marginTop: 9 }} />
        </div>
      ))}
    </>
  )
}

export function LiveProof() {
  const { hi } = useLang()
  const [city, setCity] = useState('Jaipur')
  const [typed, setTyped] = useState('')
  const date = useMemo(() => todayDmy(), [])
  const { data, loading, error, refetch } = useLivePanchang(city, date)
  const revealRef = useRevealChildren<HTMLDivElement>()

  const t = (h: string, e: string) => (hi ? h : e)
  const cells = data ? buildCells(data, hi) : []
  const observances = data?.observances ?? []
  const active = CITIES.find((c) => c.key === city)
  const cityLabel = hi ? (active?.hi ?? city) : (data?.location || active?.en || city)
  const weekday = data?.weekday ? (hi ? data.weekdayHi || data.weekday : data.weekday) : ''

  return (
    <section
      className="syj sy-section sy-site"
      id="live-proof"
      aria-labelledby="sy-live-title"
      ref={revealRef}
    >
      <div className="sy-container">
        <div data-sy-reveal="0">
          <p className="sy-eyebrow">{t('आपके शहर का आज का पंचांग', "Today's Panchang for your city")}</p>
          <h2 id="sy-live-title" className="sy-h2 mt-5">
            {t(
              'स्थान के अनुसार आज की तिथि और शुभ समय जानें',
              'Panchang timings calculated for your location',
            )}
          </h2>
          <p className="sy-lead mt-5">
            {t(
              'अपना शहर चुनें और आज की तिथि, नक्षत्र, योग, करण, सूर्योदय तथा सूर्यास्त का समय देखें। नीचे दिखाई गई जानकारी ऐप की वास्तविक पंचांग गणना से प्राप्त होती है।',
              'Select your city to view today’s tithi, nakshatra, yoga, karana, sunrise and sunset. The information below comes directly from the app’s live Panchang calculation.',
            )}
          </p>
        </div>

        <div className="syj-alm__cities" data-sy-reveal="80">
          <span className="syj-alm__citylabel">{t('अपना शहर चुनें', 'Select your city')}</span>

          {/* Type any place — the panchang is computed for whatever the engine
              can locate, not only for the shortcuts below. */}
          <form
            className="syj-alm__search"
            onSubmit={(e) => {
              e.preventDefault()
              const q = typed.trim()
              if (q) setCity(q)
            }}
          >
            <input
              type="text"
              className="syj-alm__input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t('अपना शहर लिखिए — जैसे जोधपुर', 'Type your city — e.g. Jodhpur')}
              aria-label={t('अपना शहर लिखिए', 'Type your city')}
              autoComplete="address-level2"
              enterKeyHint="search"
            />
            <button type="submit" className="syj-alm__go">
              {t('देखें', 'Show')}
            </button>
          </form>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('शहर चुनें', 'Choose a city')}
          >
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
        </div>

        <div className="mt-7" data-sy-reveal="140">
          {error ? (
            <div className="sy-card sy-card--pad" role="status">
              <p className="sy-h3">{t('पंचांग की जानकारी उपलब्ध नहीं है', 'Panchang information is currently unavailable')}</p>
              <p className="sy-body mt-3">
                {t(
                  'इस समय पंचांग सेवा से संपर्क नहीं हो पा रहा है। अनुमानित जानकारी दिखाने के बजाय हम सही डेटा उपलब्ध होने तक प्रतीक्षा करते हैं। कृपया कुछ समय बाद दोबारा प्रयास करें।',
                  'The Panchang service cannot be reached at the moment. Rather than display estimated information, we wait for verified data. Please try again shortly.',
                )}
              </p>
              <button type="button" className="sy-btn-ghost sy-btn-sm mt-5" onClick={refetch}>
                {t('फिर कोशिश करें', 'Try again')}
              </button>
            </div>
          ) : (
            <div className="syj-alm">
              <span className="syj-alm__edge" aria-hidden />

              <header className="syj-alm__head">
                <div className="syj-alm__when">
                  <span className="syj-alm__date sy-num">{longDate(date, hi)}</span>
                  {weekday ? <span className="syj-alm__day">{weekday}</span> : null}
                </div>
                <div className="syj-alm__where">
                  <span className="syj-alm__city">{cityLabel}</span>
                  <span className="syj-alm__live" aria-live="polite">
                    <span className="sy-live-dot" aria-hidden />
                    {t('लाइव गणना', 'Live calculation')}
                  </span>
                </div>
              </header>

              <div className="syj-alm__grid" aria-busy={loading}>
                {loading && !data ? (
                  <Skeletons />
                ) : (
                  cells.map((cell) => (
                    <div className="syj-alm__cell" key={cell.key}>
                      <span className="syj-alm__key">{cell.key}</span>
                      <span className="syj-alm__val sy-num">{cell.value}</span>
                      {cell.sub ? <span className="syj-alm__sub sy-num">{cell.sub}</span> : null}
                      {cell.hint ? <span className="syj-alm__hint">{cell.hint}</span> : null}
                    </div>
                  ))
                )}
              </div>

              {observances.length > 0 && (
                <div className="syj-alm__fest">
                  <p className="syj-alm__key">{t('आज क्या है', 'What today is')}</p>
                  <ul>
                    {observances.map((o) => (
                      <li key={o.key}>
                        <b>{hi ? o.name.hi : o.name.en}</b>
                        {o.guidance ? <span>{hi ? o.guidance.hi : o.guidance.en}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <footer className="syj-alm__foot">
                <b>{t('गणना का स्पष्ट और पारंपरिक आधार', 'A clear, traditional basis for every calculation')}</b>
                <small>
                  {t(
                    'लाहिड़ी (चित्रा पक्ष) अयनांश · उदय तिथि परंपरा · चुने गए स्थान के सूर्योदय और सूर्यास्त के अनुसार समय।',
                    'Lahiri (Chitra Paksha) ayanamsa · Udaya Tithi convention · timings aligned to sunrise and sunset at the selected location.',
                  )}
                </small>
              </footer>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
