import { useMutation, useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { GoldButton } from '@/components/ui/GoldButton'
import { getDailyShloka, getDailyShlokaExplain } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function DailyShlokaPage() {
  const { hi } = useLang()
  const q = useQuery({ queryKey: ['daily-shloka'], queryFn: getDailyShloka })
  const explain = useMutation({
    mutationFn: () => getDailyShlokaExplain(q.data!.shloka.id),
  })

  const s = q.data?.shloka

  return (
    <FeaturePageShell route="/daily-shloka" titleEn="Daily Shloka" titleHi="दैनिक श्लोक">
      {s ? (
        <article className="sy-stat-tile">
          <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{s.book} · {s.refLabel}</p>
          <p className="font-deva mt-4 text-xl leading-relaxed">{s.sanskrit}</p>
          {s.transliteration ? <p className="mt-3 italic text-[var(--sy-text-soft)]">{s.transliteration}</p> : null}
          <p className="mt-4 text-[16px] leading-relaxed">{hi ? s.hindi : s.english || s.hindi}</p>
          <GoldButton type="button" className="mt-6" disabled={explain.isPending} onClick={() => explain.mutate()}>
            {explain.isPending ? '…' : hi ? 'AI व्याख्या' : 'AI explanation'}
          </GoldButton>
          {explain.data ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--sy-text-soft)]">
              {explain.data.saral || explain.data.explanation || explain.data.text}
            </p>
          ) : null}
        </article>
      ) : null}
    </FeaturePageShell>
  )
}
