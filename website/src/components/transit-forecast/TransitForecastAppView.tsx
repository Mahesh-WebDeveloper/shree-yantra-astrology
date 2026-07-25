import type { TransitForecastResponse, TransitYear } from '@/lib/api'
import { aSign } from '@/lib/astroLabels'
import { SaralVivaranBlock } from '@/components/feature/BirthDetailsCollapsible'
import { useLang } from '@/i18n/LangProvider'

function kindColor(k?: string) {
  if (k === 'good') return '#3ec77a'
  if (k === 'caution') return '#e06a5a'
  return '#e0a92e'
}

function YearRow({ y }: { y: TransitYear }) {
  const { hi, lang } = useLang()
  const sat = y.shani
  const jup = y.guru
  const satEvent = hi ? sat.eventHi : sat.event
  const jupEvent = hi ? jup.eventHi : jup.event
  const satSign = hi && sat.signHi ? sat.signHi : sat.sign ? aSign(sat.sign, lang) : '—'
  const jupSign = hi && jup.signHi ? jup.signHi : jup.sign ? aSign(jup.sign, lang) : '—'

  return (
    <div className="dash-timeline-row">
      <div className="dash-timeline-rail">
        <div
          className="dash-timeline-node"
          style={{
            borderColor: y.current ? 'var(--sy-accent)' : 'var(--sy-glass-border)',
            backgroundColor: y.current ? 'var(--sy-accent)' : 'transparent',
          }}
        />
        <div className="dash-timeline-line" />
      </div>
      <div
        className={`sy-stat-tile flex-1 ${y.current ? 'border-[var(--sy-accent)] bg-amber-500/10' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-lg font-bold">{y.year}</p>
          {y.current ? (
            <span className="rounded-full bg-[var(--sy-accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-[#1a1200]">
              {hi ? 'अभी' : 'NOW'}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm font-semibold" style={{ color: kindColor(sat.kind) }}>
          ♄ {hi ? 'शनि' : 'Saturn'}: <span className="font-normal text-[var(--sy-text-soft)]">{satSign}</span>
          {satEvent ? ` · ${satEvent}` : ''}
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: kindColor(jup.kind) }}>
          ♃ {hi ? 'गुरु' : 'Jupiter'}: <span className="font-normal text-[var(--sy-text-soft)]">{jupSign}</span>
          {jupEvent ? ` · ${jupEvent}` : ''}
        </p>
        {y.note ? <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{y.note}</p> : null}
      </div>
    </div>
  )
}

export function TransitForecastAppView({ data }: { data: TransitForecastResponse }) {
  const { hi, lang } = useLang()

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'साल-दर-साल गोचर-फल' : 'Year-by-Year Forecast'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {data.fromYear}–{data.toYear}
          {data.moonSign ? ` · ${hi ? 'चंद्र' : 'Moon'} ${aSign(data.moonSign, lang)}` : ''}
        </p>
      </div>

      {data.summary ? (
        <div className="sy-stat-tile border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm leading-relaxed">{data.summary}</p>
        </div>
      ) : null}

      <div>{(data.years || []).map((y) => <YearRow key={y.year} y={y} />)}</div>

      <SaralVivaranBlock text={data.saralVivaran} />

      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        🔒{' '}
        {hi
          ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri) गोचर + चंद्र-आधारित शनि/गुरु फल।'
          : 'Real planetary positions (Lahiri) + Moon-based Saturn/Jupiter transits.'}
      </p>
    </div>
  )
}
