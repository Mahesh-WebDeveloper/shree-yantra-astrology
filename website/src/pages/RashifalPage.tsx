import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { HoroscopeHeroApp, SignRashifalBlock } from '@/components/rashifal/RashifalPanels'
import { RashifalSectionTitle, DoAvoidGrid, GoldScoreBar } from '@/components/rashifal/RashifalBlocks'
import { ReadingBar } from '@/components/rashifal/ReadingBar'
import { FamilyHoroscopeSection } from '@/components/rashifal/FamilyHoroscopeSection'
import { SIGN_LABEL } from '@/data/welcomeServices'
import { rashiImageUrl } from '@/lib/rashiImages'
import {
  getHoroscope,
  getPersonalizedHoroscope,
  getSignRashifal,
  type DailyPrediction,
  type HoroscopePeriod,
  type HoroscopeSign,
  type PublicHoroscopeResponse,
  type SignRashifal,
} from '@/lib/api'
import { birthFormToKundli } from '@/lib/birthForm'
import { naamRashi, RASHI_TO_SIGN_KEY } from '@/lib/naamRashi'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useReadingPrefs } from '@/hooks/useReadingPrefs'
import { useLang } from '@/i18n/LangProvider'

const PERIODS: { key: HoroscopePeriod; en: string; hi: string }[] = [
  { key: 'daily', en: 'Daily', hi: 'दैनिक' },
  { key: 'weekly', en: 'Weekly', hi: 'साप्ताहिक' },
  { key: 'monthly', en: 'Monthly', hi: 'मासिक' },
  { key: 'yearly', en: 'Yearly', hi: 'वार्षिक' },
]

export function RashifalPage() {
  const [params] = useSearchParams()
  if (params.get('mode') === 'mine') return <Navigate to="/my-rashifal" replace />
  return <RashifalTwelveSignsPage />
}

function RashifalTwelveSignsPage() {
  const { hi } = useLang()
  const [params, setParams] = useSearchParams()
  const sign = params.get('sign') || 'aries'
  const period = (params.get('period') as HoroscopePeriod) || 'daily'
  const { form } = useBirthProfile()
  const autoSignRef = useRef(false)
  const { scale, weight, stepScale, stepWeight } = useReadingPrefs()

  const hasBirthProfile = !!(form.dobHtml?.trim() && form.place?.trim())

  useEffect(() => {
    if (autoSignRef.current) return
    const r = naamRashi(form.name)
    if (!r) return
    const key = RASHI_TO_SIGN_KEY[r]
    if (!key) return
    autoSignRef.current = true
    const n = new URLSearchParams(params)
    n.set('sign', key)
    setParams(n, { replace: true })
  }, [form.name, params, setParams])

  const listQuery = useQuery({
    queryKey: ['horoscope', period, hi],
    queryFn: () => getHoroscope({ period }),
    staleTime: 5 * 60_000,
  })

  const selected = useMemo(
    () => listQuery.data?.signs.find((s) => s.key === sign) ?? listQuery.data?.signs[0],
    [listQuery.data, sign],
  )

  const signRashifalQ = useQuery({
    queryKey: ['sign-rashifal', selected?.name, period, listQuery.data?.basis, hi],
    queryFn: () =>
      getSignRashifal(selected!.name, period, {
        moonSign: listQuery.data?.basis?.moon?.sign,
        sunSign: listQuery.data?.basis?.sun?.sign,
      }),
    enabled: !!selected?.name,
  })

  const personalTeaserQ = useQuery({
    queryKey: ['personal-teaser', form, hi],
    queryFn: async () => {
      const r = await getPersonalizedHoroscope({ ...birthFormToKundli(form), name: form.name || undefined })
      return r.horoscope
    },
    enabled: hasBirthProfile,
    staleTime: 15 * 60_000,
  })

  const askQ =
    hi ?
      `${selected?.displayName || ''} राशि और मेरी कुंडली के आधार पर आज मेरे लिए सबसे महत्वपूर्ण सलाह क्या है?`
    : `Based on ${selected?.displayName || 'my sign'} and my birth chart, what is the most important guidance for me today?`

  return (
    <FeaturePageShell route="/rashifal">
      <p className="mb-4 text-sm text-[var(--sy-text-soft)]">
        {hi ? 'ऐप के “12 राशियाँ” स्क्रीन जैसा। ' : 'Same as the app “Rashifal · 12 Signs” screen. '}
        <Link to="/my-rashifal" className="text-[var(--sy-accent)] hover:underline">
          {hi ? 'मेरा राशिफल →' : 'My rashifal →'}
        </Link>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`kundli-tab-pill ${period === p.key ? 'kundli-tab-pill--on' : ''}`}
            onClick={() => {
              const n = new URLSearchParams(params)
              n.set('period', p.key)
              setParams(n)
            }}
          >
            {hi ? p.hi : p.en}
          </button>
        ))}
      </div>

      <ReadingBar scale={scale} weight={weight} stepScale={stepScale} stepWeight={stepWeight} />

      <SignsBody
        hi={hi}
        params={params}
        setParams={setParams}
        sign={sign}
        period={period}
        listQuery={listQuery}
        selected={selected}
        signRashifalQ={signRashifalQ}
        personalTeaser={personalTeaserQ.data}
        personalLoading={personalTeaserQ.isLoading}
        askQ={askQ}
      />
    </FeaturePageShell>
  )
}

function SignsBody({
  hi,
  params,
  setParams,
  sign,
  period,
  listQuery,
  selected,
  signRashifalQ,
  personalTeaser,
  personalLoading,
  askQ,
}: {
  hi: boolean
  params: URLSearchParams
  setParams: (p: URLSearchParams) => void
  sign: string
  period: HoroscopePeriod
  listQuery: UseQueryResult<PublicHoroscopeResponse>
  selected?: HoroscopeSign
  signRashifalQ: UseQueryResult<SignRashifal>
  personalTeaser?: DailyPrediction
  personalLoading: boolean
  askQ: string
}) {
  return (
    <>
      <section className="sy-stat-tile mb-6">
        <RashifalSectionTitle label={hi ? 'अपनी राशि चुनें' : 'Choose your sign'} />
        <div className="rashifal-sign-rail flex gap-3 overflow-x-auto pb-2">
          {(listQuery.data?.signs ?? []).map((s) => {
            const img = rashiImageUrl(s.key)
            const on = s.key === sign || (!sign && s.key === selected?.key)
            return (
              <button
                key={s.key}
                type="button"
                className={`rashifal-sign-chip shrink-0 ${on ? 'rashifal-sign-chip--on' : ''}`}
                onClick={() => {
                  const n = new URLSearchParams(params)
                  n.set('sign', s.key)
                  setParams(n)
                }}
              >
                {img ? <img src={img} alt="" className="mx-auto h-11 w-11 object-contain" /> : null}
                <span className="mt-1 block text-xs font-bold">{hi ? s.hi || SIGN_LABEL[s.key]?.hi : s.displayName}</span>
                {s.dates ? <span className="block text-[10px] text-[var(--sy-text-muted)]">{s.dates}</span> : null}
              </button>
            )
          })}
        </div>
      </section>

      {listQuery.isLoading ?
        <Skeleton className="h-56 rounded-2xl" />
      : listQuery.isError ?
        <ErrorState message={hi ? 'राशिफल लोड नहीं हुआ।' : 'Horoscope unavailable.'} onRetry={() => listQuery.refetch()} />
      : selected ?
        <div className="space-y-6">
          <HoroscopeHeroApp sign={selected} hi={hi} basis={listQuery.data?.basis} sourceNote={listQuery.data?.sourceNote} />

          {signRashifalQ.isLoading ?
            <div className="sy-stat-tile">
              <p className="text-sm text-[var(--sy-text-muted)]">
                {period === 'yearly' ?
                  hi ?
                    'पूरे वर्ष का गहन राशिफल तैयार हो रहा है…'
                  : 'Preparing your deep year-long rashifal…'
                : hi ?
                  'आपका विस्तृत राशिफल (AI) तैयार हो रहा है…'
                : 'Preparing your detailed AI rashifal…'}
              </p>
              <Skeleton className="mt-4 h-32 rounded-xl" />
            </div>
          : signRashifalQ.data ?
            <SignRashifalBlock data={signRashifalQ.data} hi={hi} />
          : signRashifalQ.isError ?
            <ErrorState
              message={hi ? 'विस्तृत AI राशिफल विफल।' : 'Detailed AI rashifal failed.'}
              onRetry={() => signRashifalQ.refetch()}
            />
          : null}

          {selected.areas?.length ?
            <section>
              <RashifalSectionTitle label={hi ? 'जीवन क्षेत्र' : 'Life areas'} />
              <div className="space-y-4">
                {selected.areas.map((a) => (
                  <div key={a.key}>
                    <div className="mb-2 flex justify-between text-sm font-semibold">
                      <span>{a.title}</span>
                      <span className="text-[var(--sy-accent)]">{a.score}%</span>
                    </div>
                    <GoldScoreBar pct={a.score} />
                    <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{a.text}</p>
                  </div>
                ))}
              </div>
            </section>
          : null}

          {(selected.doList?.length || selected.avoidList?.length) && (
            <section>
              <RashifalSectionTitle label={hi ? 'करें और बचें' : 'Do and avoid'} />
              <DoAvoidGrid doList={selected.doList || []} avoidList={selected.avoidList || []} hi={hi} />
            </section>
          )}

          {selected.remedy ?
            <section className="sy-stat-tile">
              <RashifalSectionTitle label={hi ? 'सरल उपाय' : 'Simple remedy'} />
              <p className="flex gap-2 text-sm">
                <span className="text-emerald-600">✓</span>
                {selected.remedy}
              </p>
            </section>
          : null}

          {selected.mantra?.text ?
            <section className="sy-stat-tile text-center">
              <RashifalSectionTitle label={hi ? 'मंत्र' : 'Mantra'} />
              <p className="font-deva text-lg text-[var(--sy-accent)]">{selected.mantra.text}</p>
              {selected.mantra.count ?
                <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{selected.mantra.count}</p>
              : null}
            </section>
          : null}

          {selected.basisBullets?.length ?
            <section className="sy-stat-tile">
              <RashifalSectionTitle label={hi ? 'गणना आधार' : 'Calculation basis'} />
              <ul className="space-y-2">
                {selected.basisBullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm text-[var(--sy-text-muted)]">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--sy-accent)]" />
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          : null}

          <section className="sy-stat-tile">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--sy-accent)]">
              {hi ? 'आपकी व्यक्तिगत कुंडली' : 'Your personalized horoscope'}
            </p>
            {personalLoading ?
              <Skeleton className="mt-3 h-20 rounded-xl" />
            : personalTeaser && !personalTeaser._fallback ?
              <>
                <p className="font-display mt-2 text-lg font-semibold">
                  {personalTeaser.headline || (hi ? 'आज का मार्गदर्शन' : "Today's guidance")}
                </p>
                <p className="mt-2 line-clamp-4 text-sm text-[var(--sy-text-soft)]">{personalTeaser.overall}</p>
                <Link to="/my-rashifal" className="sy-btn-primary mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold">
                  {hi ? 'पूरा व्यक्तिगत राशिफल देखें' : 'Open full personal reading'}
                </Link>
              </>
            : <Link to="/my-rashifal" className="mt-3 inline-block text-sm text-[var(--sy-accent)] hover:underline">
                {hi ? 'मेरा राशिफल खोलें' : 'Open my rashifal'}
              </Link>
            }
          </section>

          <FamilyHoroscopeSection />

          <Link to={`/ai-astrologer?q=${encodeURIComponent(askQ)}`}>
            <GoldButton type="button" className="w-full sm:w-auto">
              {hi ? 'ज्योतिषी से पूछें' : 'Ask the astrologer'}
            </GoldButton>
          </Link>
        </div>
      : null}
    </>
  )
}
