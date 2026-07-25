import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getBook } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function LibraryBookPage() {
  const { hi } = useLang()
  const { id } = useParams()
  const q = useQuery({ queryKey: ['book', id], queryFn: () => getBook(id!), enabled: !!id })

  return (
    <FeaturePageShell route="/library" titleEn={q.data?.book.title} titleHi={q.data?.book.title}>
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        {hi ? '← पुस्तकालय' : '← Library'}
      </Link>
      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'पुस्तक नहीं मिली' : 'Book not found'} onRetry={() => q.refetch()} /> : null}
      {q.data?.book.chapters?.length ? (
        <ol className="space-y-2">
          {q.data.book.chapters
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((ch) => (
              <li key={ch._id || ch.order} className="sy-stat-tile">
                <p className="font-semibold">{ch.title}</p>
                {ch.content ? (
                  <div
                    className="prose prose-sm mt-3 max-w-none text-[var(--sy-text-soft)] dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: ch.content }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-[var(--sy-text-muted)]">{hi ? 'सामग्री जल्द…' : 'Content loading…'}</p>
                )}
              </li>
            ))}
        </ol>
      ) : q.data ? (
        <p className="text-sm text-[var(--sy-text-soft)]">{q.data.book.description}</p>
      ) : null}
    </FeaturePageShell>
  )
}
