import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  PanchangFestivalDay,
  PanchangFestivalDetail,
  PanchangObservance,
  PanchangPeriod,
  PanchangResponse,
  ObservanceCatalogItem,
} from '@/lib/api'
import {
  getPanchangFestivalDetail,
  searchPanchangFestivals,
  type ApiLang,
} from '@/lib/api'
import { rankObservances } from '@/lib/fuzzyMatch'
import {
  bilingual,
  cleanObservances,
  displayLimbs,
  durText,
  endLabel,
  isBhadra,
  nowNote,
  angaName,
  periodRowGuide,
  PANCHAK_AVOID_EN,
  PANCHAK_AVOID_HI,
  tmTime,
  toEng,
} from '@/lib/panchangHelpers'
import { GradientText } from '@/components/ui/GradientText'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type FestivalRow = {
  date: string
  weekday: string
  weekdayHi?: string
  tithi: PanchangFestivalDay['tithi']
  obs: PanchangObservance
}

type Where = { place?: string; lat?: number; lng?: number; tz: string }

export function PanchangAppView({
  data,
  hi,
  placeLabel,
  festivals,
  obsCatalog,
  where,
  lang,
}: {
  data: PanchangResponse
  hi: boolean
  placeLabel: string
  festivals: PanchangFestivalDay[]
  obsCatalog: ObservanceCatalogItem[]
  where: Where
  lang: ApiLang
}) {
  const [festivalQuery, setFestivalQuery] = useState('')
  const [festivalDates, setFestivalDates] = useState<Record<string, PanchangFestivalDay>>({})
  const [aiFestivals, setAiFestivals] = useState<PanchangFestivalDay[]>([])
  const [selected, setSelected] = useState<FestivalRow | null>(null)
  const [detail, setDetail] = useState<PanchangFestivalDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailMode, setDetailMode] = useState<'details' | 'ai'>('details')
  const detailReq = useRef(0)

  const weekday = hi ? data.weekdayHi || data.weekday : data.weekday
  const { dispTithi, dispNak, dispYoga, dispKarana } = displayLimbs(data)
  const observancesClean = useMemo(() => cleanObservances(data), [data])

  const searchQ = festivalQuery.trim()
  const searching = searchQ.length >= 2
  const searchMatches = useMemo(
    () => (searching ? rankObservances(searchQ, obsCatalog, { limit: 10 }) : []),
    [searching, searchQ, obsCatalog],
  )

  useEffect(() => {
    if (!searching) return
    const id = window.setTimeout(() => {
      const payload = {
        ...where,
        date: data.date,
        query: searchQ,
        years: 2,
      }
      void searchPanchangFestivals(payload).then((r) => {
        const items = r.items || []
        setFestivalDates((prev) => {
          const next = { ...prev }
          for (const it of items) {
            const k = it.observances?.[0]?.key
            if (k) next[k] = it
          }
          return next
        })
        setAiFestivals(items.filter((it) => !obsCatalog.some((o) => o.key === it.observances?.[0]?.key)))
      })
    }, 250)
    return () => window.clearTimeout(id)
  }, [searchQ, searching, where, data.date, obsCatalog])

  const dayToRows = (f: PanchangFestivalDay): FestivalRow[] =>
    (f.observances || []).map((obs) => ({
      date: f.date,
      weekday: f.weekday,
      weekdayHi: f.weekdayHi,
      tithi: f.tithi,
      obs,
    }))

  const festivalRows = useMemo<FestivalRow[]>(() => {
    if (!searching) return festivals.flatMap(dayToRows)
    const rows: FestivalRow[] = searchMatches.map((m) => {
      const day = festivalDates[m.key]
      const dated = day?.observances?.find((o) => o.key === m.key)
      return {
        date: day?.date || '',
        weekday: day?.weekday || '',
        weekdayHi: day?.weekdayHi,
        tithi: day?.tithi ?? null,
        obs: dated || {
          key: m.key,
          name: m.name,
          type: m.type,
          importance: m.importance,
          guidance: { en: '', hi: '' },
        },
      }
    })
    return rows.concat(aiFestivals.flatMap(dayToRows))
  }, [searching, festivals, searchMatches, festivalDates, aiFestivals])

  const festivalRowsClean = useMemo(() => {
    const seen = new Set<string>()
    return festivalRows.filter((f) => {
      if (isBhadra(f.obs.name?.en || f.obs.name?.hi) || isBhadra(f.obs.key)) return false
      const k = `${f.date}|${f.obs.key || f.obs.name.en}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [festivalRows])

  const openFestival = useCallback(
    async (row: FestivalRow, withAi: boolean) => {
      if (!row.date) return
      const reqId = detailReq.current + 1
      detailReq.current = reqId
      setSelected(row)
      setDetail(null)
      setDetailError(null)
      setDetailMode(withAi ? 'ai' : 'details')
      setDetailLoading(true)
      try {
        const d = await getPanchangFestivalDetail({
          ...where,
          date: row.date,
          key: row.obs.key,
          lang,
          ai: withAi,
        })
        if (detailReq.current !== reqId) return
        setDetail(d)
        if (withAi && d.aiError) {
          setDetailError(
            hi ?
              'मार्गदर्शन अभी उपलब्ध नहीं — नीचे सत्यापित विवरण देखें।'
            : 'Guide unavailable — verified details shown below.',
          )
        }
      } catch {
        if (detailReq.current !== reqId) return
        if (withAi) {
          try {
            const d = await getPanchangFestivalDetail({
              ...where,
              date: row.date,
              key: row.obs.key,
              lang,
              ai: false,
            })
            if (detailReq.current !== reqId) return
            setDetail(d)
            setDetailError(
              hi ?
                'AI मार्गदर्शन लोड नहीं हुआ — गणना-आधारित विवरण नीचे हैं।'
              : 'AI guide failed — calculation-based details below.',
            )
            return
          } catch {
            /* fall through */
          }
        }
        setDetailError(hi ? 'त्योहार विवरण लोड नहीं हुआ।' : 'Festival details could not load.')
      } finally {
        if (detailReq.current === reqId) setDetailLoading(false)
      }
    },
    [where, lang, hi],
  )

  const tithiPaksha = dispTithi ?
    hi ?
      (dispTithi as { pakshaHi?: string }).pakshaHi || dispTithi.paksha
    : dispTithi.paksha ?
      `${dispTithi.paksha} Paksha`
    : ''
  : ''
  const activeTithiSub = [tithiPaksha, nowNote(dispTithi, data.tithi, hi)].filter(Boolean).join(' · ')

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-[var(--sy-text-soft)]">
        {data.samvat ?
          <>
            {hi ? 'विक्रम सं. ' : 'Vikram '}
            <span className="text-[var(--sy-accent)]">
              {data.samvat.vikram}
              {data.samvatsara ? ` ${data.samvatsara}` : ''}
            </span>
          </>
        : null}
        {data.ritu ?
          <>
            {' · '}
            {hi ? 'ऋतु ' : 'Ritu '}
            <span className="text-[var(--sy-accent)]">{bilingual(data.ritu, hi)}</span>
          </>
        : null}
        {data.ayana ?
          <>
            {' · '}
            <span className="text-[var(--sy-accent)]">{bilingual(data.ayana, hi)}</span>
          </>
        : null}
      </p>

      {data.masa ?
        <MasaCard masa={data.masa} hi={hi} />
      : null}

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--sy-glass-border)] bg-amber-500/10 px-4 py-2 text-sm">
        <span aria-hidden>📍</span>
        <span className="font-semibold">{placeLabel || data.location}</span>
        {data.provider ?
          <span
            className={`h-2 w-2 rounded-full ${data.provider === 'local' ? 'bg-sky-400' : 'bg-emerald-400'}`}
            title={data.provider}
          />
        : null}
      </div>

      <SectionTitle hi={hi} en="Panchang — Five Limbs" hiTitle="पंचांग — पाँच अंग" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <AngTile label={hi ? 'तिथि' : 'Tithi'} num={dispTithi?.num} value={angaName(dispTithi, hi)} sub={activeTithiSub} end={endLabel(dispTithi?.endsAt, hi)} />
        <AngTile
          label={hi ? 'नक्षत्र' : 'Nakshatra'}
          num={dispNak?.num}
          value={angaName(dispNak, hi)}
          sub={[dispNak?.pada ? `${hi ? 'पाद' : 'Pada'} ${dispNak.pada}` : '', nowNote(dispNak, data.nakshatra, hi)].filter(Boolean).join(' · ')}
          end={endLabel(dispNak?.endsAt, hi)}
        />
        <AngTile label={hi ? 'योग' : 'Yoga'} num={dispYoga?.num} value={angaName(dispYoga, hi)} sub={nowNote(dispYoga, data.yoga, hi)} end={endLabel(dispYoga?.endsAt, hi)} />
        <AngTile label={hi ? 'करण' : 'Karana'} value={angaName(dispKarana, hi)} sub={nowNote(dispKarana, data.karana, hi)} end={endLabel(dispKarana?.endsAt, hi)} />
        <AngTile label={hi ? 'वार' : 'Vaar'} value={weekday} />
        <AngTile label={hi ? 'चंद्र राशि' : 'Moon Sign'} value={data.moon?.sign || '—'} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <TimingTile label={hi ? 'सूर्योदय' : 'Sunrise'} value={tmTime(data.timings?.sunrise, data.sunrise, hi)} sub={hi ? 'दिन की शुरुआत' : 'Panchang day starts'} />
        <TimingTile label={hi ? 'सूर्यास्त' : 'Sunset'} value={tmTime(data.timings?.sunset, data.sunset, hi)} sub={hi ? 'दिन समाप्त' : 'Day closes'} />
        <TimingTile label={hi ? 'दिनमान' : 'Day Length'} value={durText(data.timings?.daylight, hi)} sub={hi ? 'सूर्योदय से सूर्यास्त' : 'Sunrise to sunset'} />
        <TimingTile label={hi ? 'रात्रिमान' : 'Night Length'} value={durText(data.timings?.night, hi)} sub={hi ? 'सूर्यास्त से सूर्योदय' : 'Sunset to sunrise'} />
        {(data.timings?.moonrise || data.moonrise) ?
          <TimingTile label={hi ? 'चन्द्रोदय' : 'Moonrise'} value={tmTime(data.timings?.moonrise, data.moonrise, hi)} />
        : null}
        {(data.timings?.moonset || data.moonset) ?
          <TimingTile label={hi ? 'चन्द्रास्त' : 'Moonset'} value={tmTime(data.timings?.moonset, data.moonset, hi)} />
        : null}
        {data.timings?.midday ?
          <TimingTile label={hi ? 'मध्याह्न' : 'Midday'} value={tmTime(data.timings.midday, null, hi)} sub={hi ? 'स्थानीय सौर मध्य' : 'Local solar midpoint'} />
        : null}
      </div>

      {data.bhadra ?
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-center text-sm font-semibold text-amber-600 dark:text-amber-300">
          ⚠{' '}
          {hi ?
            'भद्रा (विष्टि करण) सक्रिय — शुभ कार्य व यात्रा से बचें।'
          : 'Bhadra (Vishti Karana) active — avoid auspicious work & travel.'}
        </div>
      : null}

      {data.panchak ?
        <PanchakCard p={data.panchak} hi={hi} />
      : null}

      {observancesClean.length ?
        <div className="sy-stat-tile border-amber-500/30 bg-amber-500/5">
          <SectionTitle hi={hi} en="Today's Vrat / Festival / Caution" hiTitle="आज के व्रत / उत्सव / सावधानी" icon="🪔" />
          <ul className="mt-3 space-y-2">
            {observancesClean.map((o) => (
              <li key={o.key} className="flex gap-3 rounded-xl border border-[var(--sy-glass-border)] bg-[var(--sy-glass-bg)] p-3">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${o.importance === 'major' ? 'bg-amber-400' : o.type === 'caution' ? 'bg-red-400' : 'bg-emerald-400'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{bilingual(o.name, hi)}</p>
                  {o.guidance ?
                    <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{bilingual(o.guidance, hi)}</p>
                  : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      : null}

      {(festivals.length > 0 || searching) && (
        <div className="sy-stat-tile">
          <SectionTitle hi={hi} en="Upcoming Vrat & Festivals" hiTitle="आने वाले व्रत और उत्सव" icon="📅" />
          <input
            type="search"
            value={festivalQuery}
            onChange={(e) => setFestivalQuery(e.target.value)}
            placeholder={hi ? 'व्रत या उत्सव खोजें' : 'Search vrat or festival'}
            className="sy-input mt-3 w-full"
          />
          <ul className="mt-3 space-y-2">
            {festivalRowsClean.slice(0, 10).map((f) => {
              const active = selected?.date === f.date && selected?.obs.key === f.obs.key
              const pending = !f.date
              return (
                <li key={`${f.obs.key}-${f.date || 'pending'}`} className="space-y-2">
                  <div className={`rounded-xl border p-3 ${active ? 'border-[var(--sy-accent)] bg-amber-500/10' : 'border-[var(--sy-glass-border)]'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void openFestival(f, false)} disabled={pending}>
                        <p className="font-semibold">{bilingual(f.obs.name, hi)}</p>
                        <p className="text-sm text-[var(--sy-text-muted)]">
                          {pending ?
                            hi ?
                              'तिथि गणना हो रही है…'
                            : 'Computing the date…'
                          : toEng(f.date)}
                        </p>
                      </button>
                      {!pending ?
                        <button
                          type="button"
                          className="rounded-full border border-[var(--sy-accent)] px-3 py-1 text-xs font-bold text-[var(--sy-accent)]"
                          onClick={() => void openFestival(f, true)}
                        >
                          {hi ? 'मार्गदर्शन' : 'Guide'}
                        </button>
                      : null}
                    </div>
                  </div>
                  {active && detailLoading ?
                    <p className="text-sm text-[var(--sy-text-muted)]">{hi ? 'लोड…' : 'Loading…'}</p>
                  : null}
                  {active && !detailLoading ?
                    <FestivalDetailPanel detail={detail} row={f} mode={detailMode} error={detailError} hi={hi} />
                  : null}
                </li>
              )
            })}
            {!festivalRowsClean.length ?
              <p className="text-sm text-[var(--sy-text-muted)]">{hi ? 'कोई परिणाम नहीं' : 'No results'}</p>
            : null}
          </ul>
        </div>
      )}

      {data.auspicious?.length ?
        <PeriodSection title={hi ? 'शुभ मुहूर्त — क्या करें' : 'Auspicious Muhurat — what to do'} color="good" periods={data.auspicious} hi={hi} icon="🟢" />
      : null}

      {data.inauspicious?.length ?
        <PeriodSection title={hi ? 'अशुभ काल — क्या न करें' : 'Inauspicious Kaal — what to avoid'} color="bad" periods={data.inauspicious} hi={hi} icon="🔴" />
      : null}

      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        🔒{' '}
        {hi ?
          'गणना Lahiri अयनांश, स्थान-आधारित सूर्योदय और शास्त्रीय पंचांग नियमों पर आधारित है।'
        : 'Calculated with Lahiri ayanamsa, location-based sunrise and classical Panchang rules.'}
      </p>
    </div>
  )
}

function SectionTitle({ hi, en, hiTitle, icon }: { hi: boolean; en: string; hiTitle: string; icon?: string }) {
  return (
    <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--sy-accent)]">
      {icon ? `${icon} ` : ''}
      {hi ? hiTitle : en}
    </h3>
  )
}

function AngTile({ label, value, num, sub, end }: { label: string; value: string; num?: number; sub?: string; end?: string }) {
  return (
    <div className="sy-stat-tile min-h-[88px]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--sy-text-muted)]">
        {label}
        {num != null ? ` ${num}` : ''}
      </p>
      <p className="font-deva mt-1 text-base font-semibold">{toEng(value) || '—'}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-[var(--sy-text-soft)]">{sub}</p> : null}
      {end ? <p className="mt-1 text-[10px] font-semibold text-[var(--sy-accent)]">{end}</p> : null}
    </div>
  )
}

function TimingTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="sy-stat-tile">
      <p className="text-[10px] font-bold uppercase text-[var(--sy-text-muted)]">{label}</p>
      <p className="font-display mt-1 text-lg font-semibold">{value}</p>
      {sub ? <p className="text-[10px] text-[var(--sy-accent)]">{sub}</p> : null}
    </div>
  )
}

function MasaCard({ masa, hi }: { masa: NonNullable<PanchangResponse['masa']>; hi: boolean }) {
  const sys = masa.system === 'amanta' ? 'amanta' : 'purnimanta'
  const chosen = bilingual(sys === 'amanta' ? masa.amanta : masa.purnimanta, hi)
  const other = bilingual(sys === 'amanta' ? masa.purnimanta : masa.amanta, hi)
  const sysName = hi ? (sys === 'amanta' ? 'अमांत' : 'पूर्णिमांत') : sys === 'amanta' ? 'Amanta' : 'Purnimanta'
  const otherName = hi ? (sys === 'amanta' ? 'पूर्णिमांत' : 'अमांत') : sys === 'amanta' ? 'Purnimanta' : 'Amanta'
  return (
    <div className="sy-stat-tile border-[var(--sy-accent)]/40 bg-amber-500/5 text-center">
      <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'हिन्दू मास' : 'Hindu Month'}</p>
      <GradientText className="mt-2 block text-xl font-semibold">{sys === 'amanta' ? '🌙' : '🌕'} {chosen}</GradientText>
      <p className="mt-1 text-xs font-semibold text-[var(--sy-accent)]">
        {sysName} {hi ? 'पद्धति' : 'system'}
      </p>
      {chosen !== other ?
        <p className="mt-1 text-xs text-[var(--sy-text-muted)]">
          {otherName}: {other}
        </p>
      : null}
    </div>
  )
}

function PanchakCard({ p, hi }: { p: NonNullable<PanchangResponse['panchak']>; hi: boolean }) {
  const good = p.type.auspicious
  const accent = !p.active ? 'text-[var(--sy-accent)]' : good ? 'text-emerald-500' : 'text-red-400'
  const avoid = hi ? PANCHAK_AVOID_HI : PANCHAK_AVOID_EN
  return (
    <div className="sy-stat-tile">
      <div className="flex items-center justify-between gap-2">
        <SectionTitle hi={hi} en="Panchak (Bichhuda)" hiTitle="पंचक (बिच्छुड़ो)" icon="🌙" />
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.active ? 'bg-[var(--sy-accent)] text-black' : 'border border-[var(--sy-glass-border)]'}`}>
          {p.active ? (hi ? 'सक्रिय' : 'ACTIVE') : hi ? 'नहीं' : 'OFF'}
        </span>
      </div>
      {p.active ?
        <>
          <p className={`mt-2 font-semibold ${accent}`}>{hi ? p.type.hi : p.type.en}</p>
          {p.type.effect ?
            <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{hi ? p.type.effect.hi : p.type.effect.en}</p>
          : null}
          <p className="mt-2 text-sm">
            {hi ? 'आरंभ' : 'From'}: <strong>{p.startLabel}</strong> · {hi ? 'समाप्ति' : 'Until'}: <strong>{p.endLabel}</strong>
          </p>
          <p className="mt-3 text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'पंचक में ये न करें:' : 'Avoid during Panchak:'}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-[var(--sy-text-soft)]">
            {avoid.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      : <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
          {hi ?
            `अभी पंचक नहीं है। अगला ${p.startLabel} – ${p.endLabel} (${p.type.hi})।`
          : `No Panchak now. Next: ${p.startLabel} – ${p.endLabel} (${p.type.en}).`}
        </p>
      }
    </div>
  )
}

function PeriodSection({
  title,
  periods,
  hi,
  color,
  icon,
}: {
  title: string
  periods: PanchangPeriod[]
  hi: boolean
  color: 'good' | 'bad'
  icon: string
}) {
  const border = color === 'good' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
  return (
    <div className={`sy-stat-tile ${border}`}>
      <h3 className={`font-display text-sm font-semibold ${color === 'good' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
        {icon} {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {periods.map((p) => {
          const g = periodRowGuide(p, hi)
          return (
            <li key={p.name} className="rounded-lg border border-[var(--sy-glass-border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{p.name}</span>
                <span className="text-sm text-[var(--sy-text-soft)]">
                  {toEng(p.start)} – {toEng(p.end)}
                </span>
              </div>
              {g ?
                <p className="mt-1 text-xs text-[var(--sy-text-muted)]">
                  {g.bad ? '⛔ ' : '✓ '}
                  {g.text}
                </p>
              : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FestivalDetailPanel({
  detail,
  row,
  mode,
  error,
  hi,
}: {
  detail: PanchangFestivalDetail | null
  row: FestivalRow
  mode: 'details' | 'ai'
  error: string | null
  hi: boolean
}) {
  const L = (o?: { en: string; hi: string } | null) => (o ? (hi ? o.hi : o.en) : '')
  return (
    <div className="rounded-xl border border-[var(--sy-accent)]/40 bg-[var(--sy-glass-bg)] p-4 text-sm">
      <p className="text-xs text-[var(--sy-accent)]">
        {toEng(row.date)} · {hi ? row.weekdayHi || row.weekday : row.weekday}
      </p>
      <p className="font-display mt-1 text-lg font-semibold">{detail?.title || L(row.obs.name)}</p>
      <p className="mt-2 text-[var(--sy-text-soft)]">
        {detail?.ai?.summary || (detail?.catalog?.guidance ? L(detail.catalog.guidance) : L(row.obs.guidance))}
      </p>
      {error ?
        <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs">{error}</p>
      : null}
      {detail?.catalog?.why ?
        <>
          <p className="mt-3 text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'क्यों मनाया जाता है' : 'Why it matters'}</p>
          <p className="mt-1 text-[var(--sy-text-soft)]">{L(detail.catalog.why)}</p>
        </>
      : null}
      {detail?.recommendedMuhurat?.length ?
        <>
          <p className="mt-3 text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'शुभ समय' : 'Muhurat'}</p>
          <ul className="mt-1 space-y-1">
            {detail.recommendedMuhurat.slice(0, 4).map((m) => (
              <li key={`${m.name}-${m.start}`} className="flex justify-between gap-2">
                <span>{m.name}</span>
                <span className="text-[var(--sy-accent)]">
                  {toEng(m.start)} – {toEng(m.end)}
                </span>
              </li>
            ))}
          </ul>
        </>
      : null}
      {(detail?.doList?.length || detail?.avoidList?.length) ?
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {detail?.doList?.length ?
            <div>
              <p className="text-xs font-bold text-emerald-500">{hi ? 'करें' : 'Do'}</p>
              {detail.doList.slice(0, 3).map((x) => (
                <p key={x} className="text-[var(--sy-text-soft)]">
                  • {x}
                </p>
              ))}
            </div>
          : null}
          {detail?.avoidList?.length ?
            <div>
              <p className="text-xs font-bold text-red-400">{hi ? 'न करें' : 'Avoid'}</p>
              {detail.avoidList.slice(0, 3).map((x) => (
                <p key={x} className="text-[var(--sy-text-soft)]">
                  • {x}
                </p>
              ))}
            </div>
          : null}
        </div>
      : null}
      {detail?.catalog?.steps?.length ?
        <>
          <p className="mt-3 text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'कैसे करें' : 'How to Perform'}</p>
          {detail.catalog.steps.slice(0, 6).map((x, i) => (
            <p key={x} className="text-[var(--sy-text-soft)]">
              {i + 1}. {x}
            </p>
          ))}
        </>
      : null}
      {mode === 'ai' && detail?.ai?.ritualSteps?.length ?
        <>
          <p className="mt-3 text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'पूजा मार्गदर्शन' : 'Puja Guide'}</p>
          {detail.ai.ritualSteps.slice(0, 5).map((x, i) => (
            <p key={`${i}-${x}`} className="text-[var(--sy-text-soft)]">
              {i + 1}. {x}
            </p>
          ))}
        </>
      : null}
    </div>
  )
}

export function PanchangDateNav({
  date,
  onDateChange,
  weekday,
  hi,
}: {
  date: Date
  onDateChange: (d: Date) => void
  weekday?: string
  hi: boolean
}) {
  const isToday = toDmyLocal(date) === toDmyLocal(new Date())
  const dLabel = `${date.getDate()} ${MON[date.getMonth()]} ${date.getFullYear()}`
  const shift = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    onDateChange(d)
  }
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--sy-glass-border)] bg-[var(--sy-glass-bg)] p-2">
      <button type="button" className="sy-btn-secondary rounded-lg px-3 py-2" onClick={() => shift(-1)} aria-label="Previous day">
        ←
      </button>
      <button type="button" className="min-w-0 flex-1 text-center" onClick={() => onDateChange(new Date())}>
        <GradientText className="font-display text-lg font-semibold">{dLabel}</GradientText>
        <p className="text-xs text-[var(--sy-accent)]">
          {weekday}
          {isToday ? ` · ${hi ? 'आज' : 'Today'}` : ''}
        </p>
      </button>
      <button type="button" className="sy-btn-secondary rounded-lg px-3 py-2" onClick={() => shift(1)} aria-label="Next day">
        →
      </button>
    </div>
  )
}

function toDmyLocal(d: Date) {
  const pad = (n: number) => (n < 10 ? '0' : '') + n
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export { toDmyLocal as panchangDmyFromDate }
