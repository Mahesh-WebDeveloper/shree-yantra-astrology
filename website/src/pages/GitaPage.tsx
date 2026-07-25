import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { getGitaChapters } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function GitaPage() {
  const { hi } = useLang()
  const q = useQuery({ queryKey: ['gita'], queryFn: getGitaChapters })

  return (
    <FeaturePageShell route="/gita" titleEn="Bhagavad Gita" titleHi="श्रीमद् भगवद् गीता">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <ul className="grid gap-2 sm:grid-cols-2">
        {q.data?.chapters.map((ch) => (
          <li key={ch.number}>
            <Link to={`/gita/${ch.number}`} className="sy-stat-tile block font-semibold text-[var(--sy-accent)]">
              {hi ? ch.nameHi || ch.name : ch.name} · {ch.verses} {hi ? 'श्लोक' : 'verses'}
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
