import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { VEDA_CONFIG } from '@/data/vedaConfig'
import { useLang } from '@/i18n/LangProvider'

const CORE = ['yajurveda', 'samaveda', 'atharvaveda', 'upanishads', 'mahabharata'] as const

export function VedasHubPage() {
  const { hi } = useLang()
  const core = CORE.map((k) => VEDA_CONFIG[k]).filter(Boolean)
  const puranas = Object.values(VEDA_CONFIG).filter((v) => v.key.startsWith('puran-'))

  return (
    <FeaturePageShell route="/library" titleEn="Vedas & Puranas" titleHi="वेद व पुराण">
      <Link to="/library" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'पुस्तकालय' : 'Library'}
      </Link>
      <p className="mb-6 text-center text-sm text-[var(--sy-text-soft)]">
        {hi ? 'ऐप जैसी लाइव पाठशाला — सर्वर से पूरा ग्रंथ' : 'App-like live scripture reader — full texts from API'}
      </p>

      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--sy-accent)]">
        {hi ? 'वेद व उपनिषद' : 'Vedas & Upanishads'}
      </h3>
      <ul className="mb-8 grid gap-2 sm:grid-cols-2">
        <li>
          <Link to="/rigveda" className="sy-stat-tile block font-semibold text-[var(--sy-accent)] hover:underline">
            {hi ? 'ऋग्वेद' : 'Rigveda'}
          </Link>
        </li>
        {core.map((v) => (
          <li key={v.key}>
            <Link to={`/veda/${v.key}`} className="sy-stat-tile block font-semibold text-[var(--sy-accent)] hover:underline">
              {hi ? v.title.hi : v.title.en}
              <span className="mt-1 block text-xs font-normal text-[var(--sy-text-muted)]">
                {hi ? v.subtitle.hi : v.subtitle.en}
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link to="/hanuman-chalisa" className="sy-stat-tile block font-semibold text-[var(--sy-accent)] hover:underline">
            {hi ? 'हनुमान चालीसा' : 'Hanuman Chalisa'}
          </Link>
        </li>
      </ul>

      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--sy-accent)]">
        {hi ? 'पुराण' : 'Puranas'}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {puranas.map((v) => (
          <li key={v.key}>
            <Link to={`/veda/${v.key}`} className="sy-stat-tile block text-sm font-semibold text-[var(--sy-accent)] hover:underline">
              {hi ? v.title.hi : v.title.en}
            </Link>
          </li>
        ))}
      </ul>
    </FeaturePageShell>
  )
}
