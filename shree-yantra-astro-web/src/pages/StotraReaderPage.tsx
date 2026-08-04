import { Link, useParams } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { STOTRAS } from '@/data/stotras'
import { useLang } from '@/i18n/LangProvider'

export function StotraReaderPage() {
  const { hi } = useLang()
  const { id = '' } = useParams()
  const st = STOTRAS[id]

  if (!st) {
    return (
      <FeaturePageShell route="/library">
        <Link to="/stotra-sangrah" className="text-sm text-[var(--sy-accent)]">
          ← {hi ? 'स्तोत्र संग्रह' : 'Stotra Sangrah'}
        </Link>
        <p className="mt-4 text-sm">{hi ? 'नहीं मिला' : 'Not found'}</p>
      </FeaturePageShell>
    )
  }

  return (
    <FeaturePageShell route="/library">
      <Link to="/stotra-sangrah" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'स्तोत्र संग्रह' : 'Stotra Sangrah'}
      </Link>
      <div className="sy-stat-tile text-center">
        <p className="text-2xl">📿</p>
        <h2 className="font-deva mt-2 text-xl font-semibold">{hi ? st.titleHi : st.titleEn}</h2>
        <p className="mt-1 text-sm text-[var(--sy-text-muted)]">{st.deity}</p>
        <p className="mt-3 text-sm text-[var(--sy-text-soft)]">{hi ? st.introHi : st.introEn}</p>
      </div>
      <pre className="sy-stat-tile mt-4 whitespace-pre-wrap font-deva text-lg leading-loose">{st.lines}</pre>
    </FeaturePageShell>
  )
}
