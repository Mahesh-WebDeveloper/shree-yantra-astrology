import { GradientText } from '@/components/ui/GradientText'

/** App-style gold section title + fading rule */
export function RashifalSectionTitle({ label }: { label: string }) {
  return (
    <div className="rashifal-sec-title mb-4">
      <GradientText className="text-[13px] uppercase tracking-[0.18em]">{label}</GradientText>
      <div className="rashifal-sec-rule mt-2 h-px w-full" aria-hidden />
    </div>
  )
}

export function GoldScoreBar({ pct, className }: { pct: number; className?: string }) {
  const w = Math.max(0, Math.min(100, pct))
  return (
    <div className={`h-[7px] overflow-hidden rounded-full bg-[var(--sy-glass-border)] ${className ?? ''}`}>
      <div className="sy-gold-bar-fill h-full rounded-full" style={{ width: `${w}%` }} />
    </div>
  )
}

export function DoAvoidGrid({
  doList,
  avoidList,
  hi,
}: {
  doList: string[]
  avoidList: string[]
  hi: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {doList.length ? (
        <div className="rashifal-do-box rounded-2xl border p-4">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{hi ? 'करें' : 'Do'}</p>
          <ul className="mt-3 space-y-2">
            {doList.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-[var(--sy-text-soft)]">
                <span className="mt-0.5 text-emerald-600" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {avoidList.length ? (
        <div className="rashifal-avoid-box rounded-2xl border p-4">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{hi ? 'बचें' : 'Avoid'}</p>
          <ul className="mt-3 space-y-2">
            {avoidList.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-[var(--sy-text-soft)]">
                <span className="mt-0.5 text-red-500" aria-hidden>
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function SaralBox({ text, hi }: { text: string; hi: boolean }) {
  return (
    <div className="rashifal-saral-box mt-3 rounded-xl border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--sy-accent)]">
        {hi ? 'सरल भाषा में समझें' : 'In simple words'}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--sy-text-soft)]">{text}</p>
    </div>
  )
}

function barColor(score: number) {
  if (score >= 70) return 'var(--sy-green, #16a34a)'
  if (score >= 50) return 'var(--sy-accent)'
  return '#e06a5a'
}

export function AreaScoreCard({
  title,
  text,
  score = 70,
  action,
}: {
  title: string
  text: string
  score?: number
  action?: string
}) {
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="sy-stat-tile">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display font-semibold text-[var(--sy-text)]">{title}</p>
        <p className="text-sm font-bold" style={{ color: barColor(pct) }}>
          {pct}%
        </p>
      </div>
      <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-[var(--sy-glass-border)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor(pct) }} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--sy-text-soft)]">{text}</p>
      {action ? (
        <p className="mt-2 flex gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-[var(--sy-text)]">
          <span className="text-emerald-600">✓</span>
          {action}
        </p>
      ) : null}
    </div>
  )
}

export function MoodMeter({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className="text-[var(--sy-accent)]">{pct}%</span>
      </div>
      <GoldScoreBar pct={pct} />
    </div>
  )
}
