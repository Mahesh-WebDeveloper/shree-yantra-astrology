import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { STOTRA_CATEGORIES, STOTRA_LIST, type Stotra } from '@/data/stotras'
import { useLang } from '@/i18n/LangProvider'

function Row({ s, hi }: { s: Stotra; hi: boolean }) {
  return (
    <Link to={`/stotra-sangrah/${s.id}`} className="sy-stat-tile flex items-center gap-3 hover:border-[var(--sy-accent)]">
      <span className="text-xl">📿</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{hi ? s.titleHi : s.titleEn}</p>
        <p className="text-xs text-[var(--sy-text-muted)]">{s.deity}</p>
      </div>
      <span className="text-[var(--sy-accent)]">→</span>
    </Link>
  )
}

export function StotraSangrahPage() {
  const { hi } = useLang()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return STOTRA_LIST.filter((s) => `${s.titleHi} ${s.titleEn} ${s.deity}`.toLowerCase().includes(q))
  }, [query])

  return (
    <FeaturePageShell route="/library" titleEn="Stotra Sangrah" titleHi="स्तोत्र संग्रह">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="sy-stat-tile mb-4 text-center">
        <p className="text-2xl">📿</p>
        <h2 className="font-display mt-2 text-lg font-semibold text-[var(--sy-accent)]">
          {hi ? 'स्तोत्र संग्रह' : 'STOTRA SANGRAH'}
        </h2>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={hi ? 'स्तोत्र खोजें…' : 'Search stotra…'}
        className="sy-field-input mb-4 w-full"
      />
      {filtered ?
        <div className="space-y-2">
          {filtered.length === 0 ?
            <p className="text-center text-sm text-[var(--sy-text-muted)]">{hi ? 'नहीं मिला' : 'Not found'}</p>
          : filtered.map((s) => <Row key={s.id} s={s} hi={hi} />)
          }
        </div>
      : STOTRA_CATEGORIES.map((cat) => {
          const items = STOTRA_LIST.filter((s) => s.category === cat.key)
          if (!items.length) return null
          return (
            <section key={cat.key} className="mb-8">
              <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--sy-accent)]">
                {hi ? cat.hi : cat.en}
              </h3>
              <div className="space-y-2">{items.map((s) => <Row key={s.id} s={s} hi={hi} />)}</div>
            </section>
          )
        })
      }
    </FeaturePageShell>
  )
}
