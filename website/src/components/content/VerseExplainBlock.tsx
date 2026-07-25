import { useMutation } from '@tanstack/react-query'
import { GoldButton } from '@/components/ui/GoldButton'
import { useLang } from '@/i18n/LangProvider'

export function VerseExplainBlock({
  fetcher,
}: {
  fetcher: () => Promise<{ anuvad?: string; katha?: string; seekh?: string; explanation?: string }>
}) {
  const { hi } = useLang()
  const m = useMutation({ mutationFn: fetcher })

  return (
    <div className="mt-3 border-t border-[var(--sy-glass-border)] pt-3">
      <GoldButton type="button" className="!px-3 !py-1.5 text-xs" disabled={m.isPending} onClick={() => m.mutate()}>
        {m.isPending ? '…' : hi ? 'अर्थ · कथा · सीख' : 'Meaning · story · lesson'}
      </GoldButton>
      {m.data ? (
        <div className="mt-2 space-y-2 text-sm text-[var(--sy-text-soft)]">
          {m.data.anuvad ? <p>{m.data.anuvad}</p> : null}
          {m.data.katha ? <p>{m.data.katha}</p> : null}
          {m.data.seekh ? <p>{m.data.seekh}</p> : null}
          {m.data.explanation ? <p>{m.data.explanation}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
