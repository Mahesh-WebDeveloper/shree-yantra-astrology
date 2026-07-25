import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { OCCASIONS } from '@/data/occasions'
import { useLang } from '@/i18n/LangProvider'

export function OccasionsPage() {
  const { hi } = useLang()

  return (
    <FeaturePageShell route="/library" titleEn="Shubh Avsar" titleHi="शुभ अवसर">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <p className="mb-6 text-center text-sm text-[var(--sy-text-soft)]">
        {hi
          ? 'विवाह, गृह प्रवेश, नामकरण… — ऐप जैसी पूजा विधि गाइड'
          : 'Vivah, Grah Pravesh, Naamkaran… — app-like ritual guides'}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {OCCASIONS.map((o) => (
          <li key={o.id}>
            <Link
              to={`/occasions/${o.id}`}
              className="sy-stat-tile flex gap-3 hover:border-[var(--sy-accent)]"
              style={{ borderColor: `${o.accent}55` }}
            >
              <span className="text-3xl">{o.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold">{hi ? o.hi : o.en}</p>
                <p className="mt-1 text-xs text-[var(--sy-text-muted)]">{hi ? o.subHi : o.subEn}</p>
                <p className="mt-1 text-xs text-[var(--sy-accent)]">{hi ? o.deityHi : o.deityEn}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
