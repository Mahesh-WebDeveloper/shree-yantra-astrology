import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BirthChart } from '@/components/kundli/BirthChart'
import { KundliChartModal } from '@/components/kundli/KundliChartModal'
import { KundliDashaStrip } from '@/components/kundli/KundliDashaStrip'
import { KundliGlancePanel } from '@/components/kundli/KundliGlancePanel'
import { KundliRowList } from '@/components/kundli/KundliRowList'
import { VargaChartCard } from '@/components/kundli/VargaChartCard'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  CURRENT_DASHA,
  DASHA_TIMELINE,
  DOSHAS,
  KEY_INSIGHT,
  PLANETS,
  YOGAS,
} from '@/data/kundliDemo'
import { KUNDLI_TABS, type ChartStyle, type KundliTabKey } from '@/data/kundliChart'
import type { ApiPlanet, KundliInsight, VargaChart } from '@/lib/api'
import { aAstroText, aNakshatra, aSign } from '@/lib/astroLabels'
import {
  currentDashaFromApi,
  dashaToRows,
  doshaToRows,
  fmtDob,
  localizeDemoRows,
  toPlanetRows,
  yogaToRows,
} from '@/lib/kundliMappers'
import { useLang } from '@/i18n/LangProvider'

const CHART_STYLES: { key: ChartStyle; en: string; hi: string }[] = [
  { key: 'north', en: 'North', hi: 'उत्तर' },
  { key: 'south', en: 'South', hi: 'दक्षिण' },
  { key: 'east', en: 'East', hi: 'पूर्व' },
]

const FEATURES = [
  {
    kind: 'milan',
    to: '/kundli-match',
    tint: '#e07aa9',
    titleEn: 'Kundli Milan',
    titleHi: 'कुंडली मिलान',
    subEn: '36-guna matching — check marriage compatibility',
    subHi: '36 गुण मिलान — शादी की अनुकूलता जानें',
  },
  {
    kind: 'gochar',
    to: '/gochar',
    tint: '#5aa9e0',
    titleEn: 'Gochar · Transits',
    titleHi: 'गोचर',
    subEn: 'Where planets are now — Sade Sati & key transits',
    subHi: 'अभी ग्रह कहाँ — साढ़े साती व मुख्य गोचर',
  },
  {
    kind: 'remedies',
    to: '/remedies',
    tint: '#3ec77a',
    titleEn: 'Remedies · Upaay',
    titleHi: 'उपाय',
    subEn: 'Lucky gemstone, dosha remedies & graha mantras',
    subHi: 'भाग्य रत्न, दोष उपाय व नवग्रह मंत्र',
  },
  {
    kind: 'reading',
    to: '/vedic-reading',
    tint: '#9b8cff',
    titleEn: 'Vedic Reading',
    titleHi: 'वैदिक पठन',
    subEn: 'Gana-Yoni-Nadi, Gandmool, Rajyogas & classical readings',
    subHi: 'गण-योनि-नाड़ी, गण्डमूल, राजयोग व शास्त्रीय फलादेश',
  },
  {
    kind: 'timeline',
    to: '/life-timeline',
    tint: '#6ec8e0',
    titleEn: 'Life Timeline',
    titleHi: 'जीवन समयरेखा',
    subEn: 'Which dasha at which age — why, benefits & cautions',
    subHi: 'किस उम्र में कौन सी दशा — कारण, लाभ, सावधानी',
  },
  {
    kind: 'forecast',
    to: '/transit-forecast',
    tint: '#e0a92e',
    titleEn: 'Year Forecast',
    titleHi: 'वार्षिक गोचर',
    subEn: 'Year-by-year Sade Sati & Jupiter transit effects',
    subHi: 'साल-दर-साल साढ़े साती व गुरु गोचर का फल',
  },
] as const

export function KundliAppView({
  name,
  dob,
  tob,
  place,
  loading,
  live,
  err,
  ascendant,
  moonSign,
  planets,
  vargaCharts,
  vargaLoading,
  vargaErr,
  dashaRaw,
  yogasLive,
  doshasLive,
  insightsLive,
  insightsAuthHint,
}: {
  name: string | null
  dob: string | null
  tob: string | null
  place: string | null
  loading: boolean
  live: boolean
  err: boolean
  ascendant: string | null
  moonSign: string | null
  planets: ApiPlanet[] | null
  vargaCharts: VargaChart[] | null
  vargaLoading: boolean
  vargaErr: string | null
  dashaRaw: { lord: string; start: string; end: string; durationText: string }[] | null
  yogasLive: { name: string; description: string }[] | null
  doshasLive: { name: string; present: boolean; detail: string; tag: string }[] | null
  insightsLive: KundliInsight[] | null
  insightsAuthHint?: boolean
}) {
  const { hi, lang } = useLang()
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north')
  const [tab, setTab] = useState<KundliTabKey>('charts')
  const [showMainFull, setShowMainFull] = useState(false)
  const [vargaModal, setVargaModal] = useState<VargaChart | null>(null)
  const [visibleVarga, setVisibleVarga] = useState(3)

  useEffect(() => {
    if (tab !== 'charts') return
    const total = vargaCharts?.length ?? 0
    if (visibleVarga >= total) return
    const id = window.setTimeout(() => setVisibleVarga((n) => Math.min(n + 2, total)), 140)
    return () => window.clearTimeout(id)
  }, [tab, vargaCharts, visibleVarga])

  const planetRows = useMemo(() => {
    if (planets?.length) return toPlanetRows(planets, lang)
    return localizeDemoRows(PLANETS, lang, 'planet')
  }, [planets, lang])

  const dashaRows = useMemo(() => {
    if (dashaRaw?.length) return dashaToRows(dashaRaw, lang)
    return localizeDemoRows(DASHA_TIMELINE, lang, 'dasha')
  }, [dashaRaw, lang])

  const yogaRows = useMemo(() => {
    if (yogasLive?.length) return yogaToRows(yogasLive, lang)
    return localizeDemoRows(YOGAS, lang, 'yoga')
  }, [yogasLive, lang])

  const doshaRows = useMemo(() => {
    if (doshasLive?.length) return doshaToRows(doshasLive, lang)
    return localizeDemoRows(DOSHAS, lang, 'dosha')
  }, [doshasLive, lang])

  const currentDasha = useMemo(() => currentDashaFromApi(dashaRaw ?? undefined, lang), [dashaRaw, lang])

  const moonNakshatra = useMemo(() => {
    const m = planets?.find((p) => p.planet === 'Moon')
    return m?.nakshatra ? m.nakshatra.split(' - ')[0] : null
  }, [planets])

  const glanceItems = useMemo(
    () => [
      { glyph: '↑', label: hi ? 'लग्न' : 'Lagna', value: ascendant ? aSign(ascendant, lang) : '—' },
      { glyph: '☽', label: hi ? 'चंद्र राशि' : 'Moon Sign', value: moonSign ? aSign(moonSign, lang) : '—' },
      { glyph: '✦', label: hi ? 'नक्षत्र' : 'Nakshatra', value: moonNakshatra ? aNakshatra(moonNakshatra, lang) : '—' },
    ],
    [hi, lang, ascendant, moonSign, moonNakshatra],
  )

  const mainAskHref = `/ai-astrologer?q=${encodeURIComponent(
    hi
      ? 'मेरी जन्म कुंडली का पूरा, सरल भाषा में विश्लेषण दें। अलग-अलग शीर्षकों में बताएँ — स्वभाव व व्यक्तित्व, करियर व धन, रिश्ते व विवाह, स्वास्थ्य, मुख्य शक्तियाँ, और सावधानियाँ — साथ में 1-2 आसान उपाय।'
      : 'Give a complete, easy-to-understand reading of my birth chart. Use separate sections — personality & nature, career & money, relationships & marriage, health, key strengths, and cautions — plus 1-2 simple remedies.',
  )}`

  const chartPlanets = planets ?? []

  const statusLine = loading
    ? hi
      ? '⟳ लाइव चार्ट लोड…'
      : '⟳ Loading live chart…'
    : err
      ? hi
        ? '● ऑफलाइन — डेमो डेटा'
        : '● Offline — showing demo data'
      : hi
        ? '● लाइव · वास्तविक ग्रह डेटा'
        : '● LIVE · real planetary data'

  return (
    <div className="kundli-app space-y-8">
      <section className="kundli-hero sy-stat-tile">
        <h2 className="font-display text-xl font-semibold">{name || (hi ? 'आपकी कुंडली' : 'Your Kundli')}</h2>
        <p className={`mt-2 text-sm ${err ? 'text-red-600' : live ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--sy-text-muted)]'}`}>
          {statusLine}
        </p>

        <div className="kundli-meta-grid mt-4">
          {[
            { k: hi ? 'जन्म तिथि' : 'DOB', v: dob ? fmtDob(dob, lang) : '—' },
            { k: hi ? 'समय' : 'Time', v: tob || '—' },
            { k: hi ? 'स्थान' : 'Place', v: place || '—' },
          ].map((m) => (
            <div key={m.k} className="kundli-meta-cell">
              <span className="kundli-meta-key">{m.k}</span>
              <span className="kundli-meta-val">{m.v}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CHART_STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`kundli-tab-pill ${chartStyle === s.key ? 'kundli-tab-pill--on' : ''}`}
              onClick={() => setChartStyle(s.key)}
            >
              {hi ? s.hi : s.en}
            </button>
          ))}
        </div>

        <div className="kundli-main-chart-wrap mt-4">
          {loading && !planets?.length ? (
            <Skeleton className="mx-auto h-64 max-w-sm rounded-2xl" />
          ) : (
            <button type="button" className="kundli-main-chart-hit" onClick={() => setShowMainFull(true)}>
              <BirthChart style={chartStyle} planets={chartPlanets} ascendant={ascendant} className="mx-auto max-w-sm" />
              <span className="kundli-varga-expand" aria-hidden>
                ⤢
              </span>
            </button>
          )}
          <p className="kundli-chart-hint">
            {hi
              ? '👆 चार्ट बड़ा करने के लिए टैप करें · ← स्वाइप की जगह ऊपर उत्तर/दक्षिण/पूर्व बटन →'
              : '👆 Tap to enlarge the chart · use North/South/East buttons above to switch style →'}
          </p>
        </div>

        <KundliGlancePanel loading={loading} items={glanceItems} />

        <Link to={mainAskHref} className="mt-4 block text-center">
          <span className="inline-flex w-full max-w-md items-center justify-center rounded-full bg-gradient-to-r from-[#fce8a8] via-[#e9b850] to-[#b87f1a] px-6 py-3 text-sm font-bold text-[#2a1c00] shadow-md">
            {hi ? 'कुंडली समझें' : 'Understand This Chart'}
          </span>
          <p className="mt-2 text-center text-xs text-[var(--sy-text-muted)]">
            {hi ? 'सरल भाषा — स्वभाव · करियर · रिश्ते · सेहत · उपाय' : 'In simple words — nature · career · relationships · health · remedies'}
          </p>
        </Link>
      </section>

      <KundliChartModal
        open={showMainFull}
        onClose={() => setShowMainFull(false)}
        title={hi ? 'जन्मांग चक्र' : 'Birth Chart'}
        planets={chartPlanets}
        ascendant={ascendant}
        initialStyle={chartStyle}
      />
      <KundliChartModal
        open={!!vargaModal}
        onClose={() => setVargaModal(null)}
        title={vargaModal ? `${vargaModal.code} · ${hi && vargaModal.nameHi ? vargaModal.nameHi : vargaModal.name}` : ''}
        planets={vargaModal?.planets ?? []}
        ascendant={vargaModal?.ascendantSign}
        initialStyle={vargaModal?.ascendantSign ? 'north' : 'south'}
      />

      {currentDasha ? (
        <KundliDashaStrip
          lord={currentDasha.lord}
          title={currentDasha.title}
          range={currentDasha.range}
          progress={currentDasha.progress}
          hi={hi}
        />
      ) : null}

      <Link to="/kundli-learn" className="kundli-entry-row">
        <span className="kundli-entry-icon kundli-entry-icon--learn">📖</span>
        <span className="min-w-0 flex-1">
          <span className="kundli-entry-title">{hi ? 'कुंडली सीखें' : 'Learn Kundli'}</span>
          <span className="kundli-entry-sub">
            {hi
              ? 'बिलकुल basic से chart, लग्न, चंद्र राशि, दशा, गोचर और पंचांग को कहानी की तरह समझें'
              : 'Start from zero: charts, lagna, moon sign, dasha, transits and panchang in story format'}
          </span>
        </span>
        <span aria-hidden>›</span>
      </Link>

      <Link to="/brihat-kundli" className="kundli-entry-row kundli-entry-row--gold">
        <span className="kundli-entry-icon kundli-entry-icon--brihat">📜</span>
        <span className="min-w-0 flex-1">
          <span className="kundli-entry-title">{hi ? 'बृहत कुंडली रिपोर्ट' : 'Brihat Kundli Report'}</span>
          <span className="kundli-entry-sub">
            {hi ? 'कुंडली, वर्ग, दशा, दोष, गोचर और जीवन-क्षेत्र आधारित विस्तृत रिपोर्ट' : 'Charts, varga, dasha, dosha, transits and domain-wise advanced report'}
          </span>
        </span>
        <span aria-hidden>›</span>
      </Link>

      <div>
        <h3 className="kundli-section-label">{hi ? 'कुंडली सेवाएँ' : 'KUNDLI TOOLS'}</h3>
        <div className="kundli-feat-grid">
          {FEATURES.map((f) => (
            <Link key={f.to} to={f.to} className="kundli-feat-card" style={{ ['--feat-tint' as string]: f.tint }}>
              <span className="kundli-feat-dot" />
              <span className="kundli-feat-title">{hi ? f.titleHi : f.titleEn}</span>
              <span className="kundli-feat-sub">{hi ? f.subHi : f.subEn}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="kundli-section-label">{hi ? 'विस्तृत विश्लेषण' : 'DETAILED ANALYSIS'}</h3>
        <div className="flex flex-wrap gap-2 border-b border-[var(--sy-glass-border)] pb-2">
          {KUNDLI_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`kundli-tab-pill ${tab === t.key ? 'kundli-tab-pill--on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {hi ? t.hi : t.en}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tab === 'overview' ? (
          <>
            <div className="sy-stat-tile">
              <h4 className="kundli-card-head">{hi ? 'मुख्य अंतर्दृष्टि' : 'KEY INSIGHTS'}</h4>
              {insightsAuthHint ? (
                <p className="text-sm text-[var(--sy-text-soft)]">
                  {hi ? (
                    <>
                      AI अंतर्दृष्टि के लिए{' '}
                      <Link to="/profile" className="text-[var(--sy-accent)] underline">
                        प्रोफ़ाइल
                      </Link>{' '}
                      पर OTP लॉगिन करें।
                    </>
                  ) : (
                    <>
                      For AI insights,{' '}
                      <Link to="/profile" className="text-[var(--sy-accent)] underline">
                        sign in with OTP
                      </Link>{' '}
                      on Profile.
                    </>
                  )}
                </p>
              ) : null}
              {insightsLive?.length ? (
                <ul className="mt-3 space-y-3">
                  {insightsLive.map((it, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="kundli-insight-dot" />
                      <div>
                        <p className="font-semibold text-[var(--sy-accent)]">{aAstroText(it.title, lang)}</p>
                        <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{aAstroText(it.text, lang)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{aAstroText(KEY_INSIGHT, lang)}</p>
              )}
            </div>
            <div className="sy-stat-tile">
              <h4 className="kundli-card-head">{hi ? 'ग्रह स्थिति' : 'PLANETARY POSITIONS'}</h4>
              <KundliRowList rows={planetRows} zebra />
            </div>
            <div className="sy-stat-tile">
              <h4 className="kundli-card-head">{hi ? 'वर्तमान दशा' : 'CURRENT DASHA'}</h4>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{currentDasha?.title ?? (hi ? 'गुरु महादशा' : CURRENT_DASHA.title)}</p>
                  <p className="text-sm text-[var(--sy-text-soft)]">
                    {currentDasha?.range ?? aAstroText(CURRENT_DASHA.range, lang)}
                  </p>
                </div>
                <span className="kundli-row-pill kundli-row-pill--solid">{hi ? 'चल रही है' : 'Running'}</span>
              </div>
            </div>
          </>
        ) : null}

        {tab === 'charts' ? (
          <>
            <div className="sy-stat-tile">
              <h4 className="kundli-card-head">{hi ? 'वर्ग चार्ट' : 'DIVISIONAL CHARTS'}</h4>
              <p className="text-sm text-[var(--sy-text-soft)]">
                {hi ? 'आपके जन्म विवरण और सटीक ग्रह स्थिति से गणना।' : 'Calculated from your birth details and precise planetary positions.'}
              </p>
              {vargaLoading ? <p className="mt-2 text-sm text-[var(--sy-accent)]">{hi ? 'वर्ग चार्ट तैयार…' : 'Preparing divisional charts…'}</p> : null}
              {vargaErr ? <p className="mt-2 text-sm text-red-600">{vargaErr}</p> : null}
            </div>
            {(vargaCharts ?? []).slice(0, visibleVarga).map((chart) => (
              <VargaChartCard key={chart.code} chart={chart} onOpen={setVargaModal} />
            ))}
            {vargaCharts && visibleVarga < vargaCharts.length ? (
              <p className="text-center text-sm text-[var(--sy-accent)]">{hi ? 'और चार्ट लोड…' : 'Loading more charts…'}</p>
            ) : null}
          </>
        ) : null}

        {tab === 'planets' ? (
          <div className="sy-stat-tile">
            <h4 className="kundli-card-head">{hi ? 'ग्रह स्थिति' : 'PLANETARY POSITIONS'}</h4>
            <KundliRowList rows={planetRows} zebra />
          </div>
        ) : null}

        {tab === 'dasha' ? (
          <div className="sy-stat-tile">
            <h4 className="kundli-card-head">{hi ? 'विम्शोत्तरी दशा' : 'VIMSHOTTARI TIMELINE'}</h4>
            <KundliRowList rows={dashaRows} />
          </div>
        ) : null}

        {tab === 'yoga' ? (
          <div className="sy-stat-tile">
            <h4 className="kundli-card-head">{hi ? 'शुभ योग' : 'AUSPICIOUS YOGAS'}</h4>
            <KundliRowList rows={yogaRows} />
          </div>
        ) : null}

        {tab === 'dosha' ? (
          <div className="sy-stat-tile">
            <h4 className="kundli-card-head">{hi ? 'दोष जाँच' : 'DOSHA CHECK'}</h4>
            <KundliRowList rows={doshaRows} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
