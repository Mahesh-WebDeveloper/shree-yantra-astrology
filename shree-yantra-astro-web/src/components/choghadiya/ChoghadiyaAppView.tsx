import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GradientText } from '@/components/ui/GradientText'
import { OrnamentLine } from '@/components/ui/OrnamentLine'
import { getChoghadiyaMessage, getMuhuratPick } from '@/lib/api'
import { birthFormToKundli } from '@/lib/birthForm'
import { aActivity, aBlurb, aPeriod, aPeriodDesc, aTag, type AstroLang } from '@/lib/astroLabels'
import {
  accentForColor,
  buildChoghadiyaPeriods,
  findActiveChoghadiya,
  fmtChogDate,
  fmtChogTime,
  sameChogDay,
  stripChogDate,
  upcomingGood,
  UPCOMING_BLURB,
  type ChogPeriod,
  type SunTimes,
} from '@/lib/choghadiyaEngine'
import { useBirthProfile } from '@/hooks/useBirthProfile'

const MUHURAT_ACTIVITIES = [
  { en: 'Marriage', hi: 'विवाह' },
  { en: 'Travel / Journey', hi: 'यात्रा' },
  { en: 'New Business / Shop opening', hi: 'नया व्यापार' },
  { en: 'Buying a Vehicle', hi: 'वाहन खरीद' },
  { en: 'Griha Pravesh', hi: 'गृह-प्रवेश' },
  { en: 'Puja / Ritual', hi: 'पूजा' },
  { en: 'Important Meeting / Deal', hi: 'मीटिंग / डील' },
  { en: 'Interview / Exam', hi: 'इंटरव्यू / परीक्षा' },
]

const ACTIVITIES = [
  { id: 'business', title: 'Business / Deal Signing', tag: 'LABH / AMRIT', color: 'green' },
  { id: 'buying', title: 'Buying New Items', tag: 'SHUBH / LABH', color: 'purple' },
  { id: 'gold', title: 'Gold / Jewelry Purchase', tag: 'AMRIT', color: 'gold' },
  { id: 'vehicle', title: 'Vehicle Purchase', tag: 'SHUBH', color: 'green' },
  { id: 'money', title: 'Money Transfer', tag: 'LABH', color: 'blue' },
  { id: 'travel', title: 'Travel / Journey', tag: 'CHAR', color: 'gold' },
  { id: 'social', title: 'Social Media Posting', tag: 'CHAR', color: 'purple' },
  { id: 'interview', title: 'Interview / Meeting', tag: 'SHUBH', color: 'green' },
  { id: 'worship', title: 'Worship / Prayer', tag: 'AMRIT', color: 'gold' },
] as const

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const p = (n: number) => (n < 10 ? '0' : '') + n
  return `${p(h)}:${p(m)}:${p(sec)}`
}

function ActiveTimer({ active, durMin }: { active?: ChogPeriod; durMin: number }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  if (active) {
    const left = active.end.getTime() - Date.now()
    const pct = (Date.now() - active.start.getTime()) / (active.end.getTime() - active.start.getTime())
    return (
      <div className="cg-timer" aria-hidden>
        <svg width={70} height={70} viewBox="0 0 70 70">
          <circle cx={35} cy={35} r={31} className="cg-timer-track" fill="none" strokeWidth={4} />
          <circle
            cx={35}
            cy={35}
            r={31}
            className="cg-timer-fill"
            fill="none"
            strokeWidth={4}
            strokeDasharray={2 * Math.PI * 31}
            strokeDashoffset={2 * Math.PI * 31 * (1 - Math.min(1, Math.max(0, pct)))}
            transform="rotate(-90 35 35)"
          />
        </svg>
        <div className="cg-timer-label">
          <span className="cg-timer-time">{fmtCountdown(left)}</span>
          <span className="cg-timer-sub">LEFT</span>
        </div>
      </div>
    )
  }
  const p = (n: number) => (n < 10 ? '0' : '') + n
  return (
    <div className="cg-timer" aria-hidden>
      <div className="cg-timer-label">
        <span className="cg-timer-time">
          {p(Math.floor(durMin / 60))}:{p(durMin % 60)}
        </span>
        <span className="cg-timer-sub">DURATION</span>
      </div>
    </div>
  )
}

function PeriodRow({
  idx,
  period,
  isActive,
  isPast,
  pct,
  hi,
  lang,
}: {
  idx: number
  period: ChogPeriod
  isActive: boolean
  isPast: boolean
  pct: number
  hi: boolean
  lang: AstroLang
}) {
  const accent = accentForColor(period.meta.color)
  return (
    <li
      className={`cg-period-row ${isActive ? 'cg-period-row--active' : ''} ${isPast ? 'cg-period-row--past' : ''}`}
      style={{ ['--cg-accent' as string]: accent }}
    >
      <span className="cg-period-edge" />
      <span className="cg-period-num">{idx + 1}</span>
      <span className="cg-period-icon">{period.name.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <p className="cg-period-name">
          {aPeriod(period.name, lang).toUpperCase()}
          {isActive ? (hi ? ' (वर्तमान)' : ' (NOW)') : ''}
        </p>
        <p className="cg-period-time">
          {fmtChogTime(period.start)} – {fmtChogTime(period.end)}
        </p>
      </div>
      <span className="cg-period-tag">{aTag(period.meta.tag, lang)}</span>
      {isActive ?
        <span className="cg-period-progress" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      : null}
    </li>
  )
}

export function ChoghadiyaAppView({
  selectedDate,
  onDateChange,
  sun,
  nextSunrise,
  placeLabel,
  hi,
}: {
  selectedDate: Date
  onDateChange: (d: Date) => void
  sun: SunTimes | null
  nextSunrise?: { h: number; m: number }
  placeLabel: string
  hi: boolean
}) {
  const lang: AstroLang = hi ? 'hi' : 'en'
  const { form } = useBirthProfile()
  const hasBirth = !!(form.dobHtml?.trim() && form.place?.trim())

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])

  const [phaseTab, setPhaseTab] = useState<'day' | 'night'>('day')
  const autoPhased = useRef('')
  const [calOpen, setCalOpen] = useState(false)
  const [muhuratOpen, setMuhuratOpen] = useState(false)
  const [muhuratBusy, setMuhuratBusy] = useState(false)
  const [muhuratResult, setMuhuratResult] = useState<{ label: string; pick: Awaited<ReturnType<typeof getMuhuratPick>> } | null>(
    null,
  )
  const [aiMsg, setAiMsg] = useState<string | null>(null)

  const isToday = sameChogDay(selectedDate, now)

  const periods = useMemo(
    () => buildChoghadiyaPeriods(selectedDate, sun ?? undefined, nextSunrise),
    [selectedDate, sun, nextSunrise],
  )

  const yesterdayPeriods = useMemo(() => {
    if (!isToday || !sun || now >= periods[0]?.start) return null
    const y = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1)
    return buildChoghadiyaPeriods(y, sun, nextSunrise ?? sun.sunrise)
  }, [isToday, sun, nextSunrise, now, periods, selectedDate])

  const active =
    isToday ?
      findActiveChoghadiya(periods, now) ?? (yesterdayPeriods ? findActiveChoghadiya(yesterdayPeriods, now) : undefined)
    : undefined

  const dayList = useMemo(() => periods.slice(0, 8), [periods])
  const nightList = useMemo(() => periods.slice(8, 16), [periods])
  const phaseList = phaseTab === 'night' ? nightList : dayList

  useEffect(() => {
    const key = `${selectedDate.toDateString()}|${sun ? 'live' : 'demo'}`
    if (autoPhased.current === key) return
    autoPhased.current = key
    if (isToday && (active?.phase === 'night' || (sun && periods[0] && now < periods[0].start))) setPhaseTab('night')
    else setPhaseTab('day')
  }, [selectedDate, sun, isToday, active, now, periods])

  const highlight = active ?? dayList.find((p) => p.meta.nature === 'good') ?? periods[0]
  const hAccent = accentForColor(highlight.meta.color)
  const durMin = Math.floor((highlight.end.getTime() - highlight.start.getTime()) / 60000)
  const progressPct =
    isToday && active ?
      Math.min(100, Math.max(0, Math.round(((now.getTime() - active.start.getTime()) / (active.end.getTime() - active.start.getTime())) * 100)))
    : 0

  const nextGood = useMemo(() => {
    if (!isToday || !active || active.meta.nature !== 'bad') return null
    const pool = [...(yesterdayPeriods ?? []), ...periods]
      .filter((p) => p.meta.nature === 'good' && p.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
    return pool[0] ?? null
  }, [isToday, active, periods, yesterdayPeriods, now])

  const upcoming = useMemo(() => upcomingGood(periods, isToday ? now : periods[0]?.start ?? now), [periods, isToday, now])
  const livePhase: 'day' | 'night' | null = isToday && active ? active.phase : null

  useEffect(() => {
    if (!hasBirth || !highlight) return
    let on = true
    setAiMsg(null)
    getChoghadiyaMessage({
      ...birthFormToKundli(form),
      period: highlight.name,
      quality: highlight.meta.nature,
    })
      .then((r) => {
        if (on) setAiMsg(r.message)
      })
      .catch(() => {})
    return () => {
      on = false
    }
  }, [highlight.name, highlight.meta.nature, isToday, hasBirth, form])

  const muhuratPeriods = useMemo(() => {
    let pool = periods.filter((p) => !isToday || p.end > now)
    if (pool.length < 3) pool = periods
    return pool.slice(0, 12).map((p) => ({
      name: p.name,
      time: `${fmtChogTime(p.start)} - ${fmtChogTime(p.end)}`,
      nature: p.meta.nature,
    }))
  }, [periods, isToday, now])

  const askMuhurat = async (activityEn: string, label: string) => {
    if (muhuratBusy) return
    setMuhuratBusy(true)
    setMuhuratResult(null)
    try {
      const pick = await getMuhuratPick({ activity: activityEn, periods: muhuratPeriods })
      setMuhuratResult({ label, pick })
    } catch {
      setMuhuratResult(null)
    } finally {
      setMuhuratBusy(false)
    }
  }

  const muhuratMatched = muhuratResult ? periods.find((p) => p.name === muhuratResult.pick.period) : null

  const goPrev = useCallback(() => {
    const d = stripChogDate(selectedDate)
    d.setDate(d.getDate() - 1)
    onDateChange(d)
  }, [selectedDate, onDateChange])

  const goNext = useCallback(() => {
    const d = stripChogDate(selectedDate)
    d.setDate(d.getDate() + 1)
    onDateChange(d)
  }, [selectedDate, onDateChange])

  const dateLabel =
    isToday ?
      `${hi ? 'आज · ' : 'Today · '}${hi ? fmtChogDate(selectedDate) : fmtChogDate(selectedDate)}`
    : fmtChogDate(selectedDate)

  const listTitle =
    isToday ?
      hi ?
        'आज का चौघड़िया'
      : "TODAY'S CHOGHADIYA"
    : hi ?
      `चौघड़िया · ${selectedDate.getDate()}`
    : `CHOGHADIYA · ${selectedDate.getDate()}`

  const activeUp = (active?.name || '').toUpperCase()

  return (
    <div className="cg-app">
      <header className="cg-header">
        <div className="cg-title-row">
          <OrnamentLine />
          <GradientText className="font-display text-xl font-bold tracking-wide">
            {hi ? 'चौघड़िया' : 'CHOGHADIYA'}
          </GradientText>
          <OrnamentLine />
        </div>
        <p className="cg-subtitle">{hi ? 'आज के शुभ व अशुभ समय जानें' : "Know today's auspicious & inauspicious timings"}</p>
        {placeLabel ?
          <p className="cg-place">📍 {placeLabel}</p>
        : null}

        <div className="cg-date-row">
          <button type="button" className="cg-date-arrow" onClick={goPrev} aria-label="Previous day">
            ←
          </button>
          <button type="button" className="cg-date-pill" onClick={() => setCalOpen((o) => !o)}>
            <span>{dateLabel}</span>
            <span className="text-xs opacity-70">{calOpen ? '▲' : '▼'}</span>
          </button>
          <button type="button" className="cg-date-arrow" onClick={goNext} aria-label="Next day">
            →
          </button>
        </div>
        {calOpen ?
          <div className="cg-cal-pop">
            <input
              type="date"
              className="sy-input w-full"
              value={`${selectedDate.getFullYear()}-${pad2(selectedDate.getMonth() + 1)}-${pad2(selectedDate.getDate())}`}
              onChange={(e) => {
                const [y, m, d] = e.target.value.split('-').map(Number)
                if (y && m && d) {
                  onDateChange(new Date(y, m - 1, d))
                  setCalOpen(false)
                }
              }}
            />
          </div>
        : null}
        {!isToday ?
          <button type="button" className="cg-today-chip" onClick={() => onDateChange(stripChogDate(new Date()))}>
            {hi ? '↩ आज पर लौटें' : '↩ Back to Today'}
          </button>
        : null}
      </header>

      <section className="cg-active-card" style={{ ['--cg-accent' as string]: hAccent }}>
        <div className="cg-active-top">
          <div className="flex-1 min-w-0">
            <p className="cg-active-label">
              <span className="cg-live-dot" />
              {isToday && active ?
                hi ?
                  'वर्तमान सक्रिय'
                : 'CURRENTLY ACTIVE'
              : hi ?
                'दिन की शुरुआत'
              : 'DAY BEGINS WITH'}
            </p>
            <div className="cg-active-main">
              <div className="cg-yantra" aria-hidden>
                ◈
              </div>
              <div>
                <p className="cg-active-name">{aPeriod(highlight.name, lang).toUpperCase()}</p>
                <p className="cg-active-time">
                  {fmtChogTime(highlight.start)} – {fmtChogTime(highlight.end)}
                </p>
              </div>
            </div>
          </div>
          <ActiveTimer active={isToday ? active : undefined} durMin={durMin} />
        </div>
        {isToday && active ?
          <div className="cg-hero-track">
            <div className="cg-hero-fill" style={{ width: `${progressPct}%` }} />
          </div>
        : null}
        {nextGood ?
          <p className="cg-next-good">
            {hi ?
              `अगला शुभ समय: ${aPeriod(nextGood.name, lang)} · ${fmtChogTime(nextGood.start)}`
            : `Next auspicious: ${aPeriod(nextGood.name, lang)} · ${fmtChogTime(nextGood.start)}`}
          </p>
        : null}
        <p className="cg-active-desc">{aiMsg || aPeriodDesc(highlight.name, lang) || highlight.meta.desc}</p>
      </section>

      <button type="button" className="cg-muhurat-cta" onClick={() => setMuhuratOpen(true)}>
        <span className="text-lg">✦</span>
        <span className="flex-1 text-left">
          <GradientText className="font-semibold">{hi ? 'शुभ मुहूर्त खोजें' : 'Find Your Muhurat'}</GradientText>
          <span className="block text-xs text-[var(--sy-text-soft)]">
            {hi ? 'अपने काम के लिए आज का सबसे शुभ समय जानें' : "Find today's best auspicious time for your work"}
          </span>
        </span>
        <span>→</span>
      </button>

      <OrnamentLine className="my-4" />
      <h2 className="cg-section-title">{listTitle}</h2>

      <div className="cg-list-card">
        <div className="cg-phase-tabs">
          {(
            [
              ['day', hi ? 'दिन' : 'Day'],
              ['night', hi ? 'रात' : 'Night'],
            ] as const
          ).map(([key, label]) => {
            const on = phaseTab === key
            const live = livePhase === key
            return (
              <button
                key={key}
                type="button"
                className={`cg-phase-btn ${on ? 'cg-phase-btn--on' : ''}`}
                onClick={() => setPhaseTab(key)}
              >
                {label}
                {live ?
                  <span className="cg-phase-live" />
                : null}
              </button>
            )
          })}
        </div>
        <p className="cg-phase-hint">
          {phaseTab === 'day' ?
            hi ?
              'सूर्योदय से सूर्यास्त तक'
            : 'Sunrise to sunset'
          : hi ?
            'सूर्यास्त से अगले सूर्योदय तक'
          : 'Sunset to next sunrise'}
        </p>
        <ul className="cg-period-list">
          {phaseList.map((p, i) => (
            <PeriodRow
              key={`${p.name}-${i}`}
              idx={i}
              period={p}
              isActive={active === p}
              isPast={isToday && p.end.getTime() <= now.getTime()}
              pct={progressPct}
              hi={hi}
              lang={lang}
            />
          ))}
        </ul>
        <p className="cg-location-foot">
          {sun ?
            `${hi ? 'वास्तविक सूर्योदय/सूर्यास्त' : 'Real sunrise/sunset'} · ${placeLabel}`
          : `${hi ? 'आपके स्थान के अनुसार समय' : 'Timings based on your location'} (${placeLabel})`}
        </p>
      </div>

      <section className="cg-activities">
        <h3 className="cg-activities-head">{hi ? 'किस कार्य के लिए कौन सा चौघड़िया?' : 'WHICH CHOGHADIYA FOR WHICH ACTIVITY?'}</h3>
        <div className="cg-act-grid">
          {ACTIVITIES.map((act) => {
            const names = act.tag.split('/').map((s) => s.trim())
            const isNow = !!activeUp && names.includes(activeUp)
            return (
              <div key={act.id} className={`cg-act-card ${isNow ? 'cg-act-card--now' : ''}`}>
                {isNow ?
                  <span className="cg-act-now">{hi ? 'अभी' : 'NOW'}</span>
                : null}
                <p className="font-semibold text-sm">{aActivity(act.id, lang, act.title)}</p>
                <p className="mt-1 text-xs text-[var(--sy-accent)]">
                  {lang === 'hi' ? names.map((s) => aPeriod(s, lang)).join(' / ') : act.tag}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="cg-special sy-stat-tile">
        <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'विशेष संदेश' : 'Special message'}</p>
        <p className="mt-2 font-display text-lg font-semibold">{aPeriod(highlight.name, lang)}</p>
        <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{aiMsg || aPeriodDesc(highlight.name, lang) || highlight.meta.desc}</p>
        <p className="mt-2 text-xs text-[var(--sy-text-muted)]">
          {fmtChogTime(highlight.start)} – {fmtChogTime(highlight.end)}
          {isToday && active ? (hi ? ' · आज लाइव' : ' · Live today') : ''}
        </p>
      </section>

      <h2 className="cg-section-title">{hi ? 'आगामी शुभ समय' : 'UPCOMING AUSPICIOUS TIMINGS'}</h2>
      <div className="cg-up-grid">
        {upcoming.map((p, i) => (
          <div key={`${p.name}-${i}`} className={`cg-up-card ${p.name === 'Amrit' ? 'cg-up-card--amrit' : ''}`}>
            <p className="font-bold text-[var(--sy-accent)]">{aPeriod(p.name, lang).toUpperCase()}</p>
            <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
              {fmtChogTime(p.start)} – {fmtChogTime(p.end)}
            </p>
            <p className="mt-2 text-xs text-emerald-600">
              {hi ? aBlurb(p.name, lang) || 'शुभ' : UPCOMING_BLURB[p.name] || 'AUSPICIOUS'}
            </p>
          </div>
        ))}
      </div>

      {muhuratOpen ?
        <div className="cg-modal-backdrop" role="presentation" onClick={() => setMuhuratOpen(false)}>
          <div className="cg-modal-sheet" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cg-modal-handle" />
            <GradientText className="text-lg font-bold">{hi ? 'शुभ मुहूर्त खोजें' : 'Find Your Muhurat'}</GradientText>
            <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
              {hi ?
                'काम चुनें — आज के चौघड़िया से सबसे अच्छा समय बताएँगे'
              : "Pick a task — we'll suggest today's best window from the Choghadiya"}
            </p>
            <div className="cg-muhurat-chips">
              {MUHURAT_ACTIVITIES.map((a) => {
                const label = hi ? a.hi : a.en
                const on = muhuratResult?.label === label
                return (
                  <button
                    key={a.en}
                    type="button"
                    disabled={muhuratBusy}
                    className={`cg-muhurat-chip ${on ? 'cg-muhurat-chip--on' : ''}`}
                    onClick={() => askMuhurat(a.en, label)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {muhuratBusy ?
              <p className="text-center text-sm text-[var(--sy-accent)]">
                {hi ? 'सबसे शुभ समय खोज रहे हैं…' : 'Finding the best window…'}
              </p>
            : null}
            {muhuratResult && !muhuratBusy ?
              <div className="cg-muhurat-result">
                <p className="text-xs uppercase text-[var(--sy-text-muted)]">
                  {hi ? 'के लिए शुभ समय' : 'BEST TIME FOR'} · {muhuratResult.label}
                </p>
                <p className="mt-2 text-xl font-bold" style={{ color: muhuratMatched ? accentForColor(muhuratMatched.meta.color) : undefined }}>
                  {aPeriod(muhuratResult.pick.period, lang).toUpperCase()}
                </p>
                {muhuratMatched ?
                  <p className="text-sm">
                    {fmtChogTime(muhuratMatched.start)} – {fmtChogTime(muhuratMatched.end)}
                  </p>
                : null}
                <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{muhuratResult.pick.reason}</p>
              </div>
            : null}
            <button type="button" className="sy-btn-secondary mt-4 w-full rounded-full py-2" onClick={() => setMuhuratOpen(false)}>
              {hi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      : null}
    </div>
  )
}

function pad2(n: number) {
  return (n < 10 ? '0' : '') + n
}
