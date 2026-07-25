import { Link, useParams } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { MANTRAS_COLL } from '@/data/mantraSangrah'
import { useLang } from '@/i18n/LangProvider'

export function MantraReaderPage() {
  const { hi } = useLang()
  const { id = '' } = useParams()
  const m = MANTRAS_COLL.find((x) => x.id === id)

  if (!m) {
    return (
      <FeaturePageShell route="/library">
        <Link to="/mantra-sangrah" className="text-sm text-[var(--sy-accent)]">
          ← {hi ? 'मंत्र संग्रह' : 'Mantra Sangrah'}
        </Link>
        <p className="mt-4 text-sm">{hi ? 'नहीं मिला' : 'Not found'}</p>
      </FeaturePageShell>
    )
  }

  return (
    <FeaturePageShell route="/library">
      <Link to="/mantra-sangrah" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'मंत्र संग्रह' : 'Mantra Sangrah'}
      </Link>
      <div className="sy-stat-tile text-center">
        <p className="text-2xl">📿</p>
        <h2 className="font-deva mt-2 text-xl font-semibold">{hi ? m.titleHi : m.titleEn}</h2>
        <p className="mt-1 text-sm text-[var(--sy-text-muted)]">{m.deity}</p>
      </div>
      <pre className="sy-stat-tile mt-4 whitespace-pre-wrap text-center font-deva text-xl leading-loose">{m.sanskrit}</pre>
      <p className="mt-3 text-center text-sm italic text-[var(--sy-text-soft)]">{m.roman}</p>
      <div className="sy-stat-tile mt-4 space-y-3 text-sm leading-relaxed">
        <p>
          <span className="font-semibold text-[var(--sy-accent)]">{hi ? 'अर्थ' : 'Meaning'}: </span>
          {hi ? m.meaningHi : m.meaningEn}
        </p>
        <p>
          <span className="font-semibold text-[var(--sy-accent)]">{hi ? 'कब' : 'When'}: </span>
          {hi ? m.whenHi : m.whenEn}
        </p>
        <p>
          <span className="font-semibold text-[var(--sy-accent)]">{hi ? 'संख्या' : 'Count'}: </span>
          {m.count}
        </p>
        <p>
          <span className="font-semibold text-[var(--sy-accent)]">{hi ? 'लाभ' : 'Benefit'}: </span>
          {hi ? m.benefitHi : m.benefitEn}
        </p>
      </div>
    </FeaturePageShell>
  )
}
