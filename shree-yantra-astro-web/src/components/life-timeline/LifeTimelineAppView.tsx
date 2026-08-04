import { useState } from 'react'
import type { DashaPeriod, LifeTimelineResponse } from '@/lib/api'
import { aPlanet } from '@/lib/astroLabels'
import { SaralVivaranBlock } from '@/components/feature/BirthDetailsCollapsible'
import { useLang } from '@/i18n/LangProvider'

const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

const DIGNITY: Record<string, { en: string; hi: string }> = {
  exalted: { en: 'exalted', hi: 'उच्च' },
  own: { en: 'own sign', hi: 'स्वगृही' },
  debilitated: { en: 'debilitated', hi: 'नीच' },
  neutral: { en: 'neutral', hi: 'सम' },
}

function natureColor(n?: string) {
  if (n === 'favorable') return '#3ec77a'
  if (n === 'challenging') return '#e06a5a'
  return '#e0a92e'
}

function natureLabel(n: string | undefined, hi: boolean) {
  if (hi) return n === 'favorable' ? 'अनुकूल' : n === 'challenging' ? 'चुनौतीपूर्ण' : 'मिश्रित'
  return n === 'favorable' ? 'Favorable' : n === 'challenging' ? 'Challenging' : 'Mixed'
}

function PeriodCard({ p }: { p: DashaPeriod }) {
  const { hi, lang } = useLang()
  const [open, setOpen] = useState(false)
  const col = natureColor(p.nature)
  const planet = aPlanet(p.lord, lang)
  const dig = p.dignity ? (hi ? DIGNITY[p.dignity]?.hi : DIGNITY[p.dignity]?.en) : ''
  const why = p.house
    ? hi
      ? `${p.house}वें भाव में (${dig})`
      : `in house ${p.house} (${dig})`
    : ''

  return (
    <div className="dash-timeline-row">
      <div className="dash-timeline-rail">
        <div
          className="dash-timeline-node"
          style={{ borderColor: col, backgroundColor: p.current ? col : 'transparent' }}
        />
        <div className="dash-timeline-line" />
      </div>
      <div
        className="sy-stat-tile dash-timeline-card flex-1"
        style={{
          borderColor: p.current ? col : undefined,
          backgroundColor: p.current ? `${col}14` : undefined,
          opacity: p.past ? 0.72 : 1,
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" style={{ color: col }}>
            {GLYPH[p.lord] || '✦'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {planet} {hi ? 'महादशा' : 'Mahadasha'}
            </p>
            <p className="text-xs text-[var(--sy-accent)]">
              {hi ? 'आयु' : 'Age'} {Math.round(p.fromAge)}–{Math.round(p.toAge)} · {p.fromYear}–{p.toYear} ·{' '}
              {Math.round(p.years)}
              {hi ? ' वर्ष' : ' yr'}
            </p>
          </div>
          {p.current ? (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ backgroundColor: col, color: '#1a1200' }}>
              {hi ? 'अभी' : 'NOW'}
            </span>
          ) : null}
        </div>
        {why ? (
          <p className="mt-2 text-xs font-semibold" style={{ color: col }}>
            {hi ? 'कारण: ' : 'Why: '}
            {planet} {why} · {natureLabel(p.nature, hi)}
          </p>
        ) : null}
        {p.phala?.effect ? <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{p.phala.effect}</p> : null}
        {p.phala?.good ? <p className="mt-1 text-sm text-emerald-600">✓ {p.phala.good}</p> : null}
        {p.phala?.caution ? <p className="mt-1 text-sm text-amber-600">⚠ {p.phala.caution}</p> : null}
        {p.phala?.remedy ? <p className="mt-1 text-sm text-[var(--sy-accent)]">🕉 {p.phala.remedy}</p> : null}
        {p.antardashas?.length ? (
          <div className="mt-3">
            <button
              type="button"
              className="w-full rounded-full border border-[var(--sy-glass-border)] py-1.5 text-xs font-semibold text-[var(--sy-accent)]"
              onClick={() => setOpen((s) => !s)}
            >
              {open
                ? hi
                  ? 'अंतर्दशा छिपाएँ ▲'
                  : 'Hide Antardasha ▲'
                : hi
                  ? `अंतर्दशा देखें (${p.antardashas.length}) ▾`
                  : `Show Antardasha (${p.antardashas.length}) ▾`}
            </button>
            {open ? (
              <ul className="mt-2 space-y-1 text-xs">
                {p.antardashas.map((a, i) => (
                  <li
                    key={i}
                    className={`flex justify-between gap-2 rounded-md px-2 py-1 ${a.current ? 'bg-black/5 dark:bg-white/5' : ''}`}
                  >
                    <span className={a.current ? 'font-semibold text-[var(--sy-accent)]' : ''}>
                      {aPlanet(a.lord, lang)}
                      {a.current ? (hi ? ' • अभी' : ' • now') : ''}
                    </span>
                    <span className="text-[var(--sy-text-muted)]">
                      {hi ? 'आयु' : 'age'} {Math.round(a.fromAge)}–{Math.round(a.toAge)} · {a.fromYear}–{a.toYear}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function LifeTimelineAppView({ data }: { data: LifeTimelineResponse }) {
  const { hi, lang } = useLang()
  const [showPast, setShowPast] = useState(false)
  const periods = data.periods || []
  const visible = showPast ? periods : periods.filter((p) => !p.past)
  const pastCount = periods.filter((p) => p.past).length

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'जीवन दशा-काल' : 'Vimshottari Dasha'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi ? 'वर्तमान आयु' : 'Current age'} ~{data.currentAge}
        </p>
      </div>

      <div className="sy-stat-tile border border-amber-500/30 bg-amber-500/10">
        <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">
          {hi ? 'जन्म के समय दशा-शेष' : 'Dasha Balance at Birth'}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {hi
            ? `जन्म ${aPlanet(data.balance.lord, lang)} महादशा (${data.balance.totalYears} वर्ष) में हुआ — ${data.balance.bhuktaYears} वर्ष जन्म से पहले बीत चुके (भुक्त), ${data.balance.bhogyaYears} वर्ष जन्म के बाद शेष (भोग्य)।`
            : `Born in ${aPlanet(data.balance.lord, lang)} Mahadasha (${data.balance.totalYears} yr) — ${data.balance.bhuktaYears} yr elapsed before birth (Bhukta), ${data.balance.bhogyaYears} yr remained after birth (Bhogya).`}
        </p>
      </div>

      {pastCount > 0 ? (
        <button
          type="button"
          className="w-full rounded-full border border-[var(--sy-glass-border)] py-2 text-sm font-semibold text-[var(--sy-accent)]"
          onClick={() => setShowPast((s) => !s)}
        >
          {showPast
            ? hi
              ? 'बीते काल छिपाएँ'
              : 'Hide past periods'
            : hi
              ? `बीते ${pastCount} काल दिखाएँ`
              : `Show ${pastCount} past periods`}
        </button>
      ) : null}

      <div>{visible.map((p, i) => <PeriodCard key={`${p.lord}-${p.fromAge}-${i}`} p={p} />)}</div>

      <SaralVivaranBlock text={data.saralVivaran} />

      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        🔒{' '}
        {hi
          ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri) + शास्त्रीय विंशोत्तरी दशा।'
          : "Real planetary positions (Lahiri) + classical Vimshottari dasha."}
      </p>
    </div>
  )
}
