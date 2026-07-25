import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { AARTI_CATEGORIES, AARTI_LIST, type FullAarti } from '@/data/aartis'
import { useLang } from '@/i18n/LangProvider'

function AartiRow({ a, hi }: { a: FullAarti; hi: boolean }) {
  return (
    <Link
      to={`/aarti-sangrah/${a.id}`}
      className="sy-stat-tile flex items-center gap-3 hover:border-[var(--sy-accent)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--sy-glass-border)] text-lg">
        🪔
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{hi ? a.titleHi : a.titleEn}</p>
        <p className="text-xs text-[var(--sy-text-muted)]">{a.deity}</p>
      </div>
      <span className="text-[var(--sy-accent)]">→</span>
    </Link>
  )
}

export function AartiSangrahPage() {
  const { hi } = useLang()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return AARTI_LIST.filter((a) => `${a.titleHi} ${a.titleEn} ${a.deity}`.toLowerCase().includes(q))
  }, [query])

  return (
    <FeaturePageShell route="/library" titleEn="Aarti Sangrah" titleHi="आरती संग्रह">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <div className="sy-stat-tile mb-4 text-center">
        <p className="font-deva text-2xl">🪔</p>
        <h2 className="font-display mt-2 text-lg font-semibold text-[var(--sy-accent)]">
          {hi ? 'आरती संग्रह' : 'AARTI SANGRAH'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi
            ? `${AARTI_LIST.length} सम्पूर्ण आरतियाँ · सभी देवी-देवता`
            : `${AARTI_LIST.length} complete aartis · all deities`}
        </p>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={hi ? 'आरती या देवता खोजें…' : 'Search aarti or deity…'}
        className="sy-field-input mb-4 w-full"
      />
      {filtered ? (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-[var(--sy-text-muted)]">{hi ? 'कोई आरती नहीं मिली' : 'No aarti found'}</p>
          ) : (
            filtered.map((a) => <AartiRow key={a.id} a={a} hi={hi} />)
          )}
        </div>
      ) : (
        AARTI_CATEGORIES.map((cat) => {
          const items = AARTI_LIST.filter((a) => a.category === cat.key)
          if (!items.length) return null
          return (
            <section key={cat.key} className="mb-8">
              <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--sy-accent)]">
                {hi ? cat.hi : cat.en}
              </h3>
              <div className="space-y-2">{items.map((a) => <AartiRow key={a.id} a={a} hi={hi} />)}</div>
            </section>
          )
        })
      )}
      <p className="mt-8 text-center font-deva text-sm text-[var(--sy-text-muted)]">
        {hi ? '॥ जय जय देव हरे ॥' : '॥ Jai Jai Dev Hare ॥'}
      </p>
    </FeaturePageShell>
  )
}
