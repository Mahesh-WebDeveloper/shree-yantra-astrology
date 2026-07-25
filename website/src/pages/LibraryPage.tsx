import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getLibrary } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function LibraryPage() {
  const { hi } = useLang()
  const q = useQuery({ queryKey: ['library'], queryFn: getLibrary })

  return (
    <FeaturePageShell route="/library" titleEn="Divine Library" titleHi="दिव्य पुस्तकालय">
      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <Link to="/vedas" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          📚 {hi ? 'वेद · पुराण · उपनिषद' : 'Vedas · Puranas · Upanishads'}
        </Link>
        <Link to="/rigveda" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          {hi ? 'ऋग्वेद' : 'Rigveda'}
        </Link>
        <Link to="/ramayan" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          📖 {hi ? 'रामायण (7 काण्ड)' : 'Ramayana (7 Kandas)'}
        </Link>
        <Link to="/aarti-sangrah" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          🪔 {hi ? 'आरती संग्रह' : 'Aarti Sangrah'}
        </Link>
        <Link to="/stotra-sangrah" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          📿 {hi ? 'स्तोत्र संग्रह' : 'Stotra Sangrah'}
        </Link>
        <Link to="/mantra-sangrah" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          📿 {hi ? 'मंत्र संग्रह' : 'Mantra Sangrah'}
        </Link>
        <Link to="/hanuman-chalisa" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          🚩 {hi ? 'हनुमान चालीसा' : 'Hanuman Chalisa'}
        </Link>
        <Link to="/ramcharitmanas" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          {hi ? 'रामचरितमानस' : 'Ramcharitmanas'}
        </Link>
        <Link to="/gita" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          {hi ? 'श्रीमद् भगवद् गीता' : 'Bhagavad Gita'}
        </Link>
        <Link to="/occasions" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          🙏 {hi ? 'शुभ अवसर' : 'Shubh Avsar'}
        </Link>
        <Link to="/audio/ramayan_audio" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          🎧 {hi ? 'रामायण ऑडियो' : 'Ramayan audio'}
        </Link>
        <Link to="/audio/mahabharat_audio" className="sy-stat-tile font-semibold text-[var(--sy-accent)] hover:underline">
          🎧 {hi ? 'महाभारत ऑडियो' : 'Mahabharat audio'}
        </Link>
      </div>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'लाइब्रेरी लोड नहीं हुई' : 'Library unavailable'} onRetry={() => q.refetch()} /> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {q.data?.books.map((b) => (
          <li key={b._id}>
            <Link to={`/library/${b._id}`} className="sy-stat-tile flex gap-3 hover:border-[var(--sy-accent)]">
              {b.coverImage ? (
                <img src={mediaUrl(b.coverImage) || b.coverImage} alt="" className="h-16 w-12 rounded object-cover" />
              ) : null}
              <div>
                <p className="font-semibold">{b.title}</p>
                {b.author ? <p className="text-xs text-[var(--sy-text-muted)]">{b.author}</p> : null}
                {b.description ? <p className="mt-1 line-clamp-2 text-sm text-[var(--sy-text-soft)]">{b.description}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}

function mediaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  return base ? `${base}${path}` : path
}
