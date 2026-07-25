import { READING_SCALES, type ReadingScale, type ReadingWeight } from '@/hooks/useReadingPrefs'
import { useLang } from '@/i18n/LangProvider'

export function ReadingBar({
  scale,
  weight,
  stepScale,
  stepWeight,
}: {
  scale: ReadingScale
  weight: ReadingWeight
  stepScale: (dir: 1 | -1) => void
  stepWeight: (dir: 1 | -1) => void
}) {
  const { hi } = useLang()
  const scaleIdx = READING_SCALES.indexOf(scale)
  const atMinS = scaleIdx <= 0
  const atMaxS = scaleIdx >= READING_SCALES.length - 1
  const atMinW = weight <= 0
  const atMaxW = weight >= 2

  return (
    <div className="rashifal-reading-bar mb-4 flex flex-col gap-3 rounded-2xl border border-[var(--sy-glass-border)] p-3 sm:flex-row sm:items-center sm:justify-around">
      <div className="flex flex-1 flex-col items-center gap-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--sy-text-muted)]">
          {hi ? 'अक्षर आकार' : 'Font size'}
        </p>
        <div className="flex items-center gap-3">
          <BarBtn label="A−" disabled={atMinS} onClick={() => stepScale(-1)} />
          <span className="min-w-[1rem] text-center text-sm font-semibold text-[var(--sy-accent)]">
            {['S', 'M', 'L'][scaleIdx] || 'M'}
          </span>
          <BarBtn label="A+" disabled={atMaxS} onClick={() => stepScale(1)} large />
        </div>
      </div>
      <div className="hidden h-10 w-px bg-[var(--sy-glass-border)] sm:block" aria-hidden />
      <div className="flex flex-1 flex-col items-center gap-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--sy-text-muted)]">
          {hi ? 'अक्षर मोटाई' : 'Font weight'}
        </p>
        <div className="flex items-center gap-3">
          <BarBtn label="B−" disabled={atMinW} onClick={() => stepWeight(-1)} />
          <span className="min-w-[1rem] text-center text-sm font-semibold text-[var(--sy-accent)]">{weight + 1}</span>
          <BarBtn label="B+" disabled={atMaxW} onClick={() => stepWeight(1)} large />
        </div>
      </div>
    </div>
  )
}

function BarBtn({
  label,
  disabled,
  onClick,
  large,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  large?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-w-[44px] rounded-lg border border-[var(--sy-glass-border)] px-3 py-1.5 font-semibold text-[var(--sy-accent)] disabled:opacity-35 ${large ? 'text-base' : 'text-sm'}`}
    >
      {label}
    </button>
  )
}
