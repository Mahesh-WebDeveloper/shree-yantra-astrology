import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RashifalSectionTitle, DoAvoidGrid, SaralBox, AreaScoreCard, MoodMeter, GoldScoreBar } from '@/components/rashifal/RashifalBlocks'
import { GradientText } from '@/components/ui/GradientText'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { getPanchang, type DailyPrediction, type PanchangResponse, type PeriodPrediction } from '@/lib/api'
import { birthFormToKundli, type BirthFormState } from '@/lib/birthForm'
import { naamRashi, RASHI_TO_SIGN_KEY } from '@/lib/naamRashi'
import { SaralVivaranCard } from '@/components/rashifal/SaralVivaranCard'
import type { ReadingScale, ReadingWeight } from '@/hooks/useReadingPrefs'
import { readingClass } from '@/hooks/useReadingPrefs'
import { rashiImageUrl } from '@/lib/rashiImages'

const DEFAULT_MOODS = [
  { label: 'Energy', pct: 76 },
  { label: 'Love', pct: 70 },
  { label: 'Career', pct: 68 },
  { label: 'Health', pct: 72 },
]

function panchangName(v: unknown, hi: boolean): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null) {
    const o = v as { name?: string; hi?: string }
    return hi && o.hi ? o.hi : o.name || ''
  }
  return ''
}

function confidencePct(c?: number) {
  if (c == null) return null
  return c <= 1 ? Math.round(c * 100) : Math.round(c)
}

export function DailyPredictionPanel({
  pred,
  loading,
  error,
  errorMessage,
  onRetry,
  form,
  hi,
  readingScale = 1,
  readingWeight = 0,
}: {
  pred: DailyPrediction | undefined
  loading: boolean
  error: boolean
  errorMessage?: string
  onRetry: () => void
  form: BirthFormState
  hi: boolean
  readingScale?: ReadingScale
  readingWeight?: ReadingWeight
}) {
  const input = birthFormToKundli(form)
  const panchQ = useQuery({
    queryKey: ['rashifal-panch', input.place, input.lat, input.lng],
    queryFn: () =>
      getPanchang({
        place: input.place,
        lat: input.lat,
        lng: input.lng,
        tz: input.tz,
      }),
    staleTime: 10 * 60_000,
  })

  const displayRashi = naamRashi(form.name)
  const signKey = displayRashi ? RASHI_TO_SIGN_KEY[displayRashi] : null
  const img = signKey ? rashiImageUrl(signKey) : null
  const moonSign = pred?.basis?.moonSign || '—'
  const displayLabel = (displayRashi || moonSign).toString()

  if (loading && !pred) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (error && !pred) {
    return (
      <ErrorState
        message={
          errorMessage ||
          (hi ? 'व्यक्तिगत राशिफल लोड नहीं हुआ।' : 'Personal rashifal could not load.')
        }
        onRetry={onRetry}
      />
    )
  }

  if (!pred) return null

  if (pred._fallback) {
    return (
      <ErrorState
        message={
          hi ?
            'AI राशिफल अभी तैयार नहीं हुआ। कनेक्शन जांचकर पुनः प्रयास करें।'
          : 'AI rashifal could not be generated yet. Check connection and retry.'
        }
        onRetry={onRetry}
      />
    )
  }

  const moods = pred.moods?.length ? pred.moods : DEFAULT_MOODS
  const areas = pred.areas?.length ? pred.areas : []
  const readCls = readingClass(readingScale, readingWeight)
  const readStyle = { fontSize: `${15 * readingScale}px`, lineHeight: `${24 * readingScale}px` }
  const doList =
    pred.doList?.length ? pred.doList : hi ?
      ['पहले जरूरी काम पूरा करें', 'बातचीत शांत रखें']
    : ['Complete priority work first', 'Keep communication calm']
  const avoidList =
    pred.avoidList?.length ? pred.avoidList : hi ?
      ['जल्दबाजी में निर्णय', 'अनावश्यक बहस']
    : ['Rushed decisions', 'Unnecessary arguments']
  const focus = pred.focus?.length ? pred.focus : hi ? ['स्पष्टता', 'धैर्य'] : ['Clarity', 'Patience']
  const aiQuestions =
    pred.aiQuestions?.length ? pred.aiQuestions : hi ?
      ['आज करियर में किस बात पर ध्यान दूँ?', 'महत्वपूर्ण काम के लिए कौन सा समय बेहतर है?']
    : ['What should I focus on in career today?', 'Which time is best for important work?']

  const timeWindows = pred.timeWindows?.length ?
    pred.timeWindows
  : pred.luckyTime ?
    [{ label: hi ? 'शुभ समय' : 'Lucky time', time: pred.luckyTime, quality: 'good' as const, advice: pred.advice }]
  : []

  const remedies = pred.remedies?.length ? pred.remedies : []
  const conf = confidencePct(pred.confidence)
  const panch = panchQ.data

  return (
    <div className="space-y-6">
      <article className="rashifal-hero-card sy-stat-tile text-center">
        {img ? <img src={img} alt="" className="mx-auto h-24 w-24 object-contain" /> : null}
        <GradientText className="mt-3 block text-2xl">{displayLabel}</GradientText>
        <p className="text-sm text-[var(--sy-text-soft)]">{hi ? 'कुंडली आधारित मार्गदर्शन' : 'Chart-based guidance'}</p>
        <p className="mt-4 border-t border-[var(--sy-glass-border)] pt-4 text-xs font-semibold text-[var(--sy-accent)]">
          {pred.generatedFor ? `${hi ? 'तारीख' : 'For'}: ${pred.generatedFor}` : hi ? 'आज' : 'Today'}
        </p>
        {pred.headline ? <p className="font-display mt-4 text-xl font-semibold text-[var(--sy-accent)]">{pred.headline}</p> : null}
        <p className={`mt-4 text-left leading-relaxed text-[var(--sy-text)] ${readCls}`} style={readStyle}>
          {pred.overall}
        </p>
        {pred.detailedSummary ? (
          <p className={`mt-3 text-left text-[var(--sy-text-soft)] ${readCls}`} style={{ fontSize: `${13.5 * readingScale}px` }}>
            {pred.detailedSummary}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {focus.map((f) => (
            <span key={f} className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1 text-xs font-semibold text-[var(--sy-accent)]">
              {f}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5">
            # {pred.luckyNumber}
          </span>
          <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5">{pred.luckyColour}</span>
          {pred.luckyTime ? (
            <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5">{pred.luckyTime}</span>
          ) : null}
          {conf != null ? (
            <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5">
              {hi ? 'विश्वास' : 'Confidence'} {conf}%
            </span>
          ) : null}
        </div>
      </article>

      <section className="sy-stat-tile">
        <RashifalSectionTitle label={hi ? 'ज्योतिष आधार' : 'Astro basis'} />
        <BasisStrip pred={pred} panch={panch} hi={hi} />
        {pred.transitSummary ? <p className="mt-3 text-sm text-[var(--sy-text-soft)]">{pred.transitSummary}</p> : null}
      </section>

      <section className="sy-stat-tile">
        <RashifalSectionTitle label={hi ? 'आज की ऊर्जा' : "Today's cosmic mood"} />
        <div className="space-y-4">
          {moods.map((m) => (
            <MoodMeter key={m.label} label={m.label} pct={Math.round(m.pct)} />
          ))}
        </div>
      </section>

      {areas.length ? (
        <section>
          <RashifalSectionTitle label={hi ? 'विस्तृत अंतर्दृष्टि' : 'More insights'} />
          <div className="grid gap-3 sm:grid-cols-2">
            {areas.map((a) => (
              <AreaScoreCard key={a.title} title={a.title} text={a.text} score={a.score} action={a.action} />
            ))}
          </div>
        </section>
      ) : null}

      {timeWindows.length ? (
        <section className="sy-stat-tile overflow-hidden">
          <RashifalSectionTitle label={hi ? 'शुभ समय' : 'Best timing today'} />
          <div className="flex gap-3 overflow-x-auto pb-2">
            {timeWindows.map((w, i) => (
              <div
                key={`${w.label}-${i}`}
                className={`min-w-[180px] shrink-0 rounded-xl border p-3 ${
                  w.quality === 'good' ? 'border-l-4 border-l-emerald-500' : w.quality === 'caution' ? 'border-l-4 border-l-orange-500' : ''
                }`}
              >
                <p className="text-sm font-bold">{w.label}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--sy-accent)]">{w.time}</p>
                {w.advice ? <p className="mt-2 text-xs text-[var(--sy-text-soft)]">{w.advice}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sy-stat-tile">
        <RashifalSectionTitle label={hi ? 'आज का पंचांग' : "Today's panchang"} />
        {panch ? (
          <PanchangMiniGrid panch={panch} hi={hi} />
        ) : panchQ.isLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : (
          <TodayFromPred today={pred.basis?.today} hi={hi} />
        )}
        {pred.panchangSummary ? <p className="mt-3 text-sm text-[var(--sy-text-soft)]">{pred.panchangSummary}</p> : null}
      </section>

      <section>
        <RashifalSectionTitle label={hi ? 'करें और बचें' : 'Do and avoid'} />
        <DoAvoidGrid doList={doList} avoidList={avoidList} hi={hi} />
      </section>

      {remedies.length ? (
        <section className="sy-stat-tile">
          <RashifalSectionTitle label={hi ? 'सुझाए गए उपाय' : 'Suggested remedies'} />
          <div className="space-y-2">
            {remedies.map((r, i) => (
              <details key={`${r.title}-${i}`} className="rounded-xl border border-[var(--sy-glass-border)] p-3" open={i === 0}>
                <summary className="cursor-pointer font-semibold">{r.title}</summary>
                {(r.body || r.text) && <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{r.body || r.text}</p>}
                {r.mantra ? <p className="font-deva mt-2 text-sm text-[var(--sy-accent)]">{r.mantra}</p> : null}
                {r.timing ? <p className="mt-1 text-xs text-[var(--sy-text-muted)]">{r.timing}</p> : null}
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {pred.mantra?.text ? (
        <section className="sy-stat-tile text-center">
          <RashifalSectionTitle label={pred.mantra.title || (hi ? 'आज का मंत्र' : "Today's mantra")} />
          <p className="font-deva text-lg text-[var(--sy-accent)]">{pred.mantra.text}</p>
          {pred.mantra.count || pred.mantra.bestTime ? (
            <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
              {[pred.mantra.count, pred.mantra.bestTime].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </section>
      ) : null}

      {pred.advice ? (
        <div className="rashifal-advice-box rounded-2xl border p-4 text-sm leading-relaxed">{pred.advice}</div>
      ) : null}

      {pred.saralVivaran ? <SaralVivaranCard text={pred.saralVivaran} scale={readingScale} weight={readingWeight} /> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="sy-btn-secondary rounded-full px-5 py-2.5 text-sm font-semibold"
          onClick={() => {
            try {
              localStorage.setItem('sy.savedRashifal', JSON.stringify({ at: Date.now(), headline: pred.headline, overall: pred.overall }))
            } catch {
              /* ignore */
            }
          }}
        >
          {hi ? 'सहेजें' : 'Save'}
        </button>
        <button
          type="button"
          className="sy-btn-primary rounded-full px-5 py-2.5 text-sm font-semibold"
          onClick={() => {
            const msg = `${pred.headline ? pred.headline + '\n\n' : ''}${pred.overall}\n\n${pred.advice || ''}`
            if (navigator.share) void navigator.share({ title: 'Rashifal', text: msg }).catch(() => {})
            else void navigator.clipboard?.writeText(msg)
          }}
        >
          {hi ? 'शेयर' : 'Share'}
        </button>
      </div>

      <section className="sy-stat-tile">
        <RashifalSectionTitle label={hi ? 'आगे पूछें' : 'Ask further'} />
        <div className="flex flex-col gap-2">
          {aiQuestions.map((q) => (
            <Link
              key={q}
              to={`/ai-astrologer?q=${encodeURIComponent(q)}`}
              className="rounded-xl border border-[var(--sy-glass-border)] px-3 py-2.5 text-sm font-medium hover:border-[var(--sy-accent)]"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      {pred.sourceNote ? (
        <p className="text-center text-xs text-[var(--sy-text-muted)]">{pred.sourceNote}</p>
      ) : null}
    </div>
  )
}

function BasisStrip({ pred, panch, hi }: { pred: DailyPrediction; panch?: PanchangResponse; hi: boolean }) {
  const today = pred.basis?.today
  const chips = [
    pred.basis?.moonSign ? { label: hi ? 'चंद्र' : 'Moon', value: pred.basis.moonSign } : null,
    pred.basis?.ascendant ? { label: hi ? 'लग्न' : 'Lagna', value: pred.basis.ascendant } : null,
    pred.basis?.dasha ? { label: hi ? 'दशा' : 'Dasha', value: pred.basis.dasha } : null,
    {
      label: hi ? 'तिथि' : 'Tithi',
      value: panchangName(today?.tithi, hi) || (panch ? (hi ? panch.tithi.hi || panch.tithi.name : panch.tithi.name) : ''),
    },
    {
      label: hi ? 'नक्षत्र' : 'Nakshatra',
      value: panchangName(today?.nakshatra, hi) || (panch ? (hi ? panch.nakshatra.hi || panch.nakshatra.name : panch.nakshatra.name) : ''),
    },
  ].filter((c): c is { label: string; value: string } => !!(c && c.value))

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <div key={c.label} className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5 text-xs">
          <span className="text-[var(--sy-text-muted)]">{c.label}: </span>
          <span className="font-semibold">{c.value}</span>
        </div>
      ))}
    </div>
  )
}

function PanchangMiniGrid({ panch, hi }: { panch: PanchangResponse; hi: boolean }) {
  const cells = [
    { lbl: hi ? 'तिथि' : 'Tithi', val: hi ? panch.tithi.hi || panch.tithi.name : panch.tithi.name },
    { lbl: hi ? 'पक्ष' : 'Paksha', val: hi ? panch.tithi.pakshaHi || panch.tithi.paksha : panch.tithi.paksha },
    {
      lbl: hi ? 'नक्षत्र' : 'Nakshatra',
      val: `${hi ? panch.nakshatra.hi || panch.nakshatra.name : panch.nakshatra.name} · Pada ${panch.nakshatra.pada}`,
    },
    { lbl: hi ? 'योग' : 'Yoga', val: hi ? panch.yoga.hi || panch.yoga.name : panch.yoga.name },
    { lbl: hi ? 'सूर्योदय' : 'Sunrise', val: panch.sunrise },
    { lbl: hi ? 'सूर्यास्त' : 'Sunset', val: panch.sunset },
  ]
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {cells.map((c) => (
        <div key={c.lbl} className="rounded-xl border border-[var(--sy-glass-border)] p-3 text-center">
          <p className="text-xs font-semibold text-[var(--sy-accent)]">{c.lbl}</p>
          <p className="mt-1 text-sm font-medium">{c.val}</p>
        </div>
      ))}
    </div>
  )
}

type PredToday = NonNullable<NonNullable<DailyPrediction['basis']>['today']>

function TodayFromPred({ today, hi }: { today?: PredToday; hi: boolean }) {
  if (!today) return null
  return (
    <div className="grid gap-2 sm:grid-cols-2 text-sm">
      {panchangName(today.tithi, hi) ? (
        <div className="rounded-xl border p-3">
          {hi ? 'तिथि' : 'Tithi'}: {panchangName(today.tithi, hi)}
        </div>
      ) : null}
      {panchangName(today.nakshatra, hi) ? (
        <div className="rounded-xl border p-3">
          {hi ? 'नक्षत्र' : 'Nakshatra'}: {panchangName(today.nakshatra, hi)}
        </div>
      ) : null}
    </div>
  )
}

export function PeriodPredictionPanel({
  data,
  loading,
  error,
  errorMessage,
  onRetry,
  hi,
  readingScale = 1,
  readingWeight = 0,
}: {
  data: PeriodPrediction | undefined
  loading: boolean
  error: boolean
  errorMessage?: string
  onRetry: () => void
  hi: boolean
  readingScale?: ReadingScale
  readingWeight?: ReadingWeight
}) {
  if (loading && !data) return <Skeleton className="h-48 rounded-2xl" />
  if (error && !data) {
    return (
      <ErrorState
        message={errorMessage || (hi ? 'अवधि राशिफल विफल।' : 'Period forecast failed.')}
        onRetry={onRetry}
      />
    )
  }
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="rashifal-advice-box sy-stat-tile">
        <p className="text-xs text-[var(--sy-accent)]">{data.range}</p>
        {data.headline ? <p className="font-display mt-2 text-xl font-semibold">{data.headline}</p> : null}
        {data.overall ? <p className="mt-3 text-sm leading-relaxed text-[var(--sy-text-soft)]">{data.overall}</p> : null}
      </div>
      {data.areas.map((a) => (
        <AreaScoreCard key={a.title} title={a.title} text={a.text} score={a.score} action={a.action} />
      ))}
      {data.phases?.length ? (
        <section className="sy-stat-tile">
          <RashifalSectionTitle label={hi ? 'अवधि-वार' : 'Phase by phase'} />
          {data.phases.map((p, i) => (
            <div key={i} className="border-t border-[var(--sy-glass-border)] py-3 first:border-0 first:pt-0">
              <p className="font-semibold text-[var(--sy-accent)]">{p.title}</p>
              <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{p.text}</p>
            </div>
          ))}
        </section>
      ) : null}
      {data.highlights?.length ? (
        <section className="sy-stat-tile">
          <RashifalSectionTitle label={hi ? 'मुख्य बातें' : 'Highlights'} />
          {data.highlights.map((h, i) => (
            <div key={i} className="mt-2">
              <p className="text-sm font-semibold text-[var(--sy-accent)]">{h.label}</p>
              <p className="text-sm text-[var(--sy-text-soft)]">{h.text}</p>
            </div>
          ))}
        </section>
      ) : null}
      {[...(data.bestDays || []), ...(data.majorDates || [])].length ? (
        <section className="sy-stat-tile">
          <RashifalSectionTitle label={hi ? 'शुभ दिन / तिथियाँ' : 'Good days / key dates'} />
          <ul className="list-disc pl-5 text-sm text-[var(--sy-text-soft)]">
            {[...(data.bestDays || []), ...(data.majorDates || [])].map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {data.remedies?.length ? (
        <section className="sy-stat-tile">
          <RashifalSectionTitle label={hi ? 'उपाय' : 'Remedies'} />
          {data.remedies.map((r, i) => (
            <div key={i} className="mt-2 text-sm">
              <p className="font-semibold">{r.title}</p>
              {r.body ? <p className="text-[var(--sy-text-soft)]">{r.body}</p> : null}
            </div>
          ))}
        </section>
      ) : null}
      {data.advice ? <div className="rashifal-advice-box rounded-2xl border p-4 text-sm">{data.advice}</div> : null}
      {data.saralVivaran ? <SaralVivaranCard text={data.saralVivaran} scale={readingScale} weight={readingWeight} /> : null}
      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        {hi ? 'आपकी जन्म कुंडली, दशा व गोचर पर आधारित।' : 'Based on your birth chart, dasha & transits.'}
      </p>
      {data.sourceNote ? <p className="text-center text-xs text-[var(--sy-text-muted)]">{data.sourceNote}</p> : null}
    </div>
  )
}

export function SignRashifalBlock({ data, hi }: { data: import('@/lib/api').SignRashifal; hi: boolean }) {
  return (
    <section className="sy-stat-tile">
      <RashifalSectionTitle label={hi ? 'विस्तृत राशिफल (AI)' : 'Detailed rashifal (AI)'} />
      {data.aiAssisted ? <span className="live-badge mb-3 inline-block">{hi ? 'AI सहायित' : 'AI assisted'}</span> : null}
      <p className="text-xs text-[var(--sy-accent)]">{data.range}</p>
      {data.headline ? <GradientText className="mt-2 block text-lg">{data.headline}</GradientText> : null}
      <div className="mt-4 space-y-3">
        {data.sections.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[var(--sy-glass-border)] p-4">
            {s.heading ? <p className="font-semibold text-[var(--sy-accent)]">{s.heading}</p> : null}
            <p className="mt-2 text-sm leading-relaxed text-[var(--sy-text)]">{s.text}</p>
            {s.saral ? <SaralBox text={s.saral} hi={hi} /> : null}
          </div>
        ))}
      </div>
      <div className="rashifal-advice-box mt-4 rounded-2xl border p-4">
        <p className="font-semibold text-[var(--sy-accent)]">{hi ? 'निष्कर्ष' : 'Conclusion'}</p>
        <p className="mt-2 text-sm text-[var(--sy-text)]">{hi ? data.conclusion.saral || data.conclusion.text : data.conclusion.text}</p>
        {data.conclusion.saral && hi ? (
          <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{data.conclusion.text}</p>
        ) : null}
      </div>
    </section>
  )
}

export function HoroscopeHeroApp({
  sign,
  hi,
  basis,
  sourceNote,
}: {
  sign: import('@/lib/api').HoroscopeSign
  hi: boolean
  basis?: import('@/lib/api').PublicHoroscopeResponse['basis']
  sourceNote?: string
}) {
  const img = rashiImageUrl(sign.key)
  const heroScore = Math.max(0, Math.min(100, sign.score || 0))
  const conf =
    sign.confidence != null ?
      sign.confidence <= 1 ?
        Math.round(sign.confidence * 100)
      : Math.round(sign.confidence)
    : null
  const kicker = [sign.lord, sign.element, sign.dates].filter(Boolean).join(' · ')

  return (
    <article className="rashifal-hero-card sy-stat-tile">
      <div className="text-center">
        {img ? (
          <div className="rashifal-hero-ring mx-auto inline-flex p-1">
            <img src={img} alt="" className="h-20 w-20 object-contain" />
          </div>
        ) : null}
        <GradientText className="mt-3 block text-2xl">{hi ? sign.hi || sign.displayName : sign.displayName}</GradientText>
        {kicker ? <p className="mt-1 text-xs font-semibold text-[var(--sy-accent)]">{kicker}</p> : null}
      </div>
      {sign.headline ? (
        <p className="font-display mt-4 border-t border-[var(--sy-glass-border)] pt-4 text-center text-lg font-semibold text-[var(--sy-accent)]">
          {sign.headline}
        </p>
      ) : null}
      <p className="mt-4 text-[15px] leading-relaxed">{sign.plainSummary || sign.summary}</p>
      {sign.summary && sign.plainSummary ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--sy-text-soft)]">{sign.summary}</p>
      ) : null}
      <div className="mt-4 flex justify-between text-sm font-semibold">
        <span>{hi ? 'कुल स्कोर' : 'Overall score'}</span>
        <span className="text-[var(--sy-accent)]">{heroScore}%</span>
      </div>
      <GoldScoreBar pct={heroScore} className="mt-2" />
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5 text-xs">
          {hi ? 'शुभ रंग' : 'Lucky colour'}: <strong>{sign.luckyColor}</strong>
        </span>
        <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5 text-xs">
          {hi ? 'शुभ अंक' : 'Lucky number'}: <strong>{sign.luckyNumber}</strong>
        </span>
        {conf != null ? (
          <span className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1.5 text-xs">
            {hi ? 'विश्वास' : 'Confidence'}: <strong>{conf}%</strong>
          </span>
        ) : null}
      </div>
      {basis ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {[basis.moon?.sign, basis.sun?.sign, basis.nakshatra?.name].filter(Boolean).map((x) => (
            <span key={String(x)} className="rounded-full border border-[var(--sy-glass-border)] px-2.5 py-1 text-xs font-semibold text-[var(--sy-accent)]">
              {x}
            </span>
          ))}
        </div>
      ) : null}
      {sourceNote ? <p className="mt-3 text-center text-xs text-[var(--sy-text-muted)]">{sourceNote}</p> : null}
    </article>
  )
}
