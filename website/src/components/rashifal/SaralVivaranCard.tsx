import { readingClass } from '@/hooks/useReadingPrefs'
import type { ReadingScale, ReadingWeight } from '@/hooks/useReadingPrefs'
import { useLang } from '@/i18n/LangProvider'

export function SaralVivaranCard({
  text,
  scale = 1,
  weight = 0,
}: {
  text?: string | null
  scale?: ReadingScale
  weight?: ReadingWeight
}) {
  const { hi } = useLang()
  if (!text?.trim()) return null
  return (
    <div className="rashifal-saral-box mt-4 rounded-2xl border p-4">
      <p className="font-display text-sm font-semibold text-[var(--sy-accent)]">
        {hi ? 'सरल भाषा में समझें' : 'In simple words'}
      </p>
      <p className="mt-1 text-[11px] text-[var(--sy-text-muted)]">
        {hi ? 'बिना किसी कठिन शब्द के, आसान भाषा में' : 'Easy explanation, no jargon'}
      </p>
      <p className={`mt-3 leading-relaxed text-[var(--sy-text)] ${readingClass(scale, weight)}`} style={{ fontSize: `${14 * scale}px` }}>
        {text}
      </p>
    </div>
  )
}
