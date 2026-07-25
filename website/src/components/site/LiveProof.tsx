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
      hint: hi ? 'चाँद के हिसाब से आज कौन-सा दिन है' : 'the lunar day',
      value: [angaLabel(tithi, hi), paksha].filter(Boolean).join(' · ') || '—',
      sub: endsAt(tithi),
    },
    {
      key: hi ? 'नक्षत्र' : 'Nakshatra',
      hint: hi ? 'चाँद आज किस तारा-समूह में है' : 'the star the moon is in today',
      value: angaLabel(nak, hi) ?? '—',
      sub: nak?.pada ? (hi ? `पाद ${nak.pada}` : `Pada ${nak.pada}`) : endsAt(nak),
    },
    {
      key: hi ? 'योग' : 'Yoga',
      hint: hi ? 'सूर्य और चंद्र की मिली-जुली स्थिति' : 'sun and moon taken together',
      value: angaLabel(yoga, hi) ?? '—',
      sub: endsAt(yoga),
    },
    {
      key: hi ? 'करण' : 'Karana',
      hint: hi ? 'तिथि का आधा हिस्सा' : 'half of a tithi',
      value: angaLabel(karana, hi) ?? '—',
      sub: endsAt(karana),
    },
    {
      key: hi ? 'सूर्योदय' : 'Sunrise',
      hint: hi ? 'आपके शहर में सूरज निकलने का समय' : 'when the sun rises in your city',
      value: p.sunrise || '—',
      sub: p.timings?.daylight ? (hi ? p.timings.daylight.hi : p.timings.daylight.text) : undefined,
    },
    {
      key: hi ? 'सूर्यास्त' : 'Sunset',
      hint: hi ? 'सूरज डूबने का समय' : 'when the sun sets',
      value: p.sunset || '—',
      sub: p.timings?.night ? (hi ? p.timings.night.hi : p.timings.night.text) : undefined,
    },
  ]

  if (p.masa) {
    cells.push({
      key: hi ? 'मास' : 'Masa',
      hint: hi ? 'हिंदू पंचांग का चालू महीना' : 'the running month of the Hindu calendar',
      value: hi ? p.masa.amanta.hi : p.masa.amanta.en,
      sub: hi ? `अमांत · पूर्णिमांत ${p.masa.purnimanta.hi}` : `Amanta · Purnimanta ${p.masa.purnimanta.en}`,
    })
  }

  if (p.samvat?.vikram) {
    cells.push({
      key: hi ? 'संवत' : 'Samvat',
      hint: hi ? 'हिंदू पंचांग का चालू वर्ष' : 'the running year of the Hindu calendar',
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
          <p className="sy-eyebrow">{t('आज का पंचांग', "Today's panchang")}</p>
          <h2 id="sy-live-title" className="sy-h2 mt-5">
            {t(
              'आज का पंचांग — अभी, आपके शहर के हिसाब से',
              "Today's panchang — right now, for your city",
            )}
          </h2>
          <p className="sy-lead mt-5">
            {t(
              'नीचे जो दिख रहा है वह पुरानी तस्वीर नहीं है — यह अभी, इसी वक़्त गिना गया है। शहर बदलकर देखिए: तिथि, नक्षत्र और सूर्योदय का समय भी बदल जाएगा, क्योंकि हर शहर का पंचांग अलग होता है।',
              'What you see below is not an old screenshot — it was worked out just now. Change the city and watch the tithi, nakshatra and sunrise time change with it, because every city has its own panchang.',
            )}
          </p>
        </div>

        <div className="syj-alm__cities" data-sy-reveal="80">
          <span className="syj-alm__citylabel">{t('अपना शहर चुनिए', 'Pick your city')}</span>
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
              <p className="sy-h3">{t('अभी जुड़ नहीं पाया', 'Could not connect just now')}</p>
              <p className="sy-body mt-3">
                {t(
                  'हमारा पंचांग इस समय इस ब्राउज़र से नहीं जुड़ पाया। हम यहाँ अंदाज़े से कोई तिथि या समय नहीं भर देते — इसलिए जब तक जुड़ न जाए, यह जगह खाली ही रहेगी।',
                  'Our panchang could not be reached from this browser right now. We never fill this space with a guessed date or time, so it stays empty until the connection is back.',
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
                    {t('अभी बना', 'Live')}
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
                <b>{t('गणना वही, जो पंडित जी करते हैं।', 'The same maths a pandit uses.')}</b>
                <small>
                  {t(
                    'लाहिड़ी (चित्रा पक्ष) अयनांश · तिथि सूर्योदय के समय के अनुसार · सभी समय आपके शहर के सूर्योदय से।',
                    'Lahiri (Chitra Paksha) ayanamsa · tithi taken at sunrise (udaya) · every timing from your own city’s sunrise.',
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
