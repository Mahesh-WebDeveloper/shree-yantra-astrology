import type { PanchangResponse } from '@/lib/api'
import { angaEndLabel } from '@/lib/location'

export function PanchangDetail({
  data,
  hi,
  festivals,
}: {
  data: PanchangResponse
  hi: boolean
  festivals?: { date: string; observances: { name: { en: string; hi: string } }[] }[]
}) {
  const tithiMeta = [
    data.tithi.paksha,
    angaEndLabel(data.tithi.endsAt, hi),
    data.isCurrent ? (hi ? 'वर्तमान तिथि' : 'Active tithi') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Tile label={hi ? 'स्थान' : 'Location'} value={data.location} />
      <Tile
        label={hi ? 'वार' : 'Weekday'}
        value={hi ? data.weekdayHi || data.weekday : data.weekday}
        meta={data.date}
      />
      <Tile
        label={hi ? 'तिथि' : 'Tithi'}
        value={hi ? data.tithi.hi || data.tithi.name : data.tithi.name}
        meta={tithiMeta || undefined}
      />
      {data.sunriseTithi ? (
        <Tile
          label={hi ? 'सूर्योदय तिथि' : 'Sunrise tithi'}
          value={hi ? data.sunriseTithi.hi || data.sunriseTithi.name : data.sunriseTithi.name}
          meta={data.sunriseTithi.paksha}
        />
      ) : null}
      <Tile
        label={hi ? 'नक्षत्र' : 'Nakshatra'}
        value={hi ? data.nakshatra.hi || data.nakshatra.name : data.nakshatra.name}
        meta={angaEndLabel(data.nakshatra.endsAt, hi) || `Pada ${data.nakshatra.pada}`}
      />
      <Tile label={hi ? 'योग' : 'Yoga'} value={hi ? data.yoga.hi || data.yoga.name : data.yoga.name} />
      <Tile label={hi ? 'करण' : 'Karana'} value={hi ? data.karana.hi || data.karana.name : data.karana.name} />
      <Tile label={hi ? 'सूर्योदय' : 'Sunrise'} value={data.sunrise} />
      <Tile label={hi ? 'सूर्यास्त' : 'Sunset'} value={data.sunset} />
      {data.masa ? (
        <>
          <Tile
            label={hi ? 'मास (अमान्त)' : 'Month (Amanta)'}
            value={hi ? data.masa.amanta.hi : data.masa.amanta.en}
          />
          <Tile
            label={hi ? 'मास (पूर्णिमान्त)' : 'Month (Purnimanta)'}
            value={hi ? data.masa.purnimanta.hi : data.masa.purnimanta.en}
          />
        </>
      ) : null}
      {data.moon?.sign || data.moon?.nakshatra ? (
        <Tile
          label={hi ? 'चंद्र' : 'Moon'}
          value={[data.moon.sign, data.moon.nakshatra].filter(Boolean).join(' · ')}
        />
      ) : null}
      {data.samvat ? (
        <Tile
          label={hi ? 'संवत' : 'Samvat'}
          value={`Vikram ${data.samvat.vikram} · Shaka ${data.samvat.shaka}`}
          meta={data.samvatsara}
        />
      ) : null}
      {data.panchak?.active ? (
        <div className="sy-stat-tile sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-text-muted)]">
            {hi ? 'पंचक' : 'Panchak'}
          </p>
          <p className="mt-1 text-sm text-[var(--sy-text-soft)]">
            {hi ? data.panchak.type.hi : data.panchak.type.en} · {data.panchak.startLabel} – {data.panchak.endLabel}
          </p>
        </div>
      ) : null}
      {data.observances?.length ? (
        <div className="sy-stat-tile sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-accent)]">
            {hi ? 'व्रत / त्योहार' : 'Observances'}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--sy-text-soft)]">
            {data.observances.map((o) => (
              <li key={o.key}>{hi ? o.name.hi : o.name.en}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.inauspicious?.length ? (
        <div className="sy-stat-tile sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-text-muted)]">
            {hi ? 'अशुभ समय' : 'Inauspicious periods'}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--sy-text-soft)]">
            {data.inauspicious.map((x, i) => (
              <li key={i}>
                {x.name}: {x.start} – {x.end}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {festivals?.length ? (
        <div className="sy-stat-tile sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-text-muted)]">
            {hi ? 'आगामी त्योहार' : 'Upcoming festivals'}
          </p>
          <ul className="mt-2 space-y-2 text-sm text-[var(--sy-text-soft)]">
            {festivals.slice(0, 10).map((row) =>
              row.observances.length ? (
                <li key={row.date}>
                  <span className="font-medium text-[var(--sy-text)]">{row.date}</span>
                  {' — '}
                  {row.observances.map((o) => (hi ? o.name.hi : o.name.en)).join(', ')}
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function Tile({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <div className="sy-stat-tile">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sy-text-muted)]">{label}</p>
      <p className="font-deva mt-1.5 text-lg font-semibold text-[var(--sy-text)]">{value}</p>
      {meta ? <p className="mt-1 text-[13px] text-[var(--sy-text-soft)]">{meta}</p> : null}
    </div>
  )
}
