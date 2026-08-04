import { Link, useParams } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { AARTIS } from '@/data/aartis'
import { useLang } from '@/i18n/LangProvider'

export function AartiReaderPage() {
  const { hi } = useLang()
  const { id = '' } = useParams()
  const aarti = AARTIS[id]

  if (!aarti) {
    return (
      <FeaturePageShell route="/library">
        <Link to="/aarti-sangrah" className="text-sm text-[var(--sy-accent)]">
          ← {hi ? 'आरती संग्रह' : 'Aarti Sangrah'}
        </Link>
        <p className="mt-4 text-sm text-[var(--sy-text-soft)]">{hi ? 'आरती नहीं मिली।' : 'Aarti not found.'}</p>
      </FeaturePageShell>
    )
  }

  return (
    <FeaturePageShell route="/library">
      <Link to="/aarti-sangrah" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'आरती संग्रह' : 'Aarti Sangrah'}
      </Link>
      <div className="sy-stat-tile text-center">
        <p className="text-3xl">🪔</p>
        <h2 className="font-deva mt-2 text-xl font-semibold">{hi ? aarti.titleHi : aarti.titleEn}</h2>
        <p className="mt-1 text-sm text-[var(--sy-text-muted)]">{aarti.deity}</p>
      </div>
      <pre className="sy-stat-tile mt-4 whitespace-pre-wrap font-deva text-lg leading-loose text-[var(--sy-text)]">
        {aarti.lines}
      </pre>
    </FeaturePageShell>
  )
}
