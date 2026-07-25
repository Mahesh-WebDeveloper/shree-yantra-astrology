import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { MANTRA_CATEGORIES, MANTRAS_COLL, type CollMantra } from '@/data/mantraSangrah'
import { useLang } from '@/i18n/LangProvider'

function Row({ m, hi }: { m: CollMantra; hi: boolean }) {
  return (
    <Link to={`/mantra-sangrah/${m.id}`} className="sy-stat-tile flex items-center gap-3 hover:border-[var(--sy-accent)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--sy-glass-border)] text-lg">
        📿
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{hi ? m.titleHi : m.titleEn}</p>
        <p className="truncate font-deva text-xs text-[var(--sy-text-muted)]">{m.sanskrit.split('\n')[0]}</p>
      </div>
      <span className="text-[var(--sy-accent)]">→</span>
    </Link>
  )
}

export function MantraSangrahPage() {
  const { hi } = useLang()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return MANTRAS_COLL.filter((m) => `${m.titleHi} ${m.titleEn} ${m.deity}`.toLowerCase().includes(q))
  }, [query])

  return (
    <FeaturePageShell route="/library" titleEn="Mantra Sangrah" titleHi="मंत्र संग्रह">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="sy-stat-tile mb-4 text-center">
        <p className="text-2xl">📿</p>
        <h2 className="font-display mt-2 text-lg font-semibold text-[var(--sy-accent)]">
          {hi ? 'मंत्र संग्रह' : 'MANTRA SANGRAH'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi
            ? `${MANTRAS_COLL.length} मुख्य मंत्र · अर्थ · कब व कितनी बार`
            : `${MANTRAS_COLL.length} key mantras · meaning · when & count`}
        </p>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={hi ? 'मंत्र या देवता खोजें…' : 'Search mantra or deity…'}
        className="sy-field-input mb-4 w-full"
      />
      {filtered ? (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[var(--sy-text-muted)]">{hi ? 'कोई मंत्र नहीं मिला' : 'No mantra found'}</p>
          ) : (
            filtered.map((m) => <Row key={m.id} m={m} hi={hi} />)
          )}
        </div>
      ) : (
        MANTRA_CATEGORIES.map((cat) => {
          const items = MANTRAS_COLL.filter((m) => m.category === cat.key)
          if (!items.length) return null
          return (
            <section key={cat.key} className="mb-8">
              <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--sy-accent)]">
                {hi ? cat.hi : cat.en}
              </h3>
              <div className="space-y-2">{items.map((m) => <Row key={m.id} m={m} hi={hi} />)}</div>
            </section>
          )
        })
      )}
      <p className="mt-8 text-center font-deva text-sm text-[var(--sy-text-muted)]">॥ ॐ ॥</p>
    </FeaturePageShell>
  )
}
