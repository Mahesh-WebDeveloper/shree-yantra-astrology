import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { APP_FEATURES, type AppFeature } from '@/data/appFeatures'
import { useLang } from '@/i18n/LangProvider'

export function ServicesPage() {
  const { hi } = useLang()
  const groups = [
    { key: 'core', en: 'Astrology services', hi: 'ज्योतिष सेवाएँ' },
    { key: 'ai', en: 'Personal guidance', hi: 'व्यक्तिगत मार्गदर्शन' },
    { key: 'content', en: 'Sacred content', hi: 'धार्मिक सामग्री' },
    { key: 'account', en: 'Account & help', hi: 'खाता और सहायता' },
  ] as const

  return (
    <FeaturePageShell route="/services" titleEn="All app services" titleHi="सभी ऐप सेवाएँ">
      <p className="mb-2 text-sm text-[var(--sy-text-soft)]">
        {hi
          ? 'यहाँ mobile app की सभी main services web routes के साथ रखी गई हैं। जहाँ mobile screen का exact route नहीं है, वहाँ equivalent web page alias दिया गया है।'
          : 'All main mobile app services are mapped to website routes here. Where a mobile screen has no separate web page, an equivalent web alias is provided.'}
      </p>
      <ol className="mb-8 list-decimal space-y-1 pl-5 text-sm text-[var(--sy-text-soft)]">
        <li>{hi ? 'Login और जन्म विवरण profile से चलते हैं।' : 'Login and birth details work through the profile flow.'}</li>
        <li>{hi ? 'Panchang, Choghadiya, Kundli, Rashifal और Muhurat live backend APIs use करते हैं।' : 'Panchang, Choghadiya, Kundli, Rashifal and Muhurat use live backend APIs.'}</li>
        <li>{hi ? 'Library, Gita, Ramayan, Vedas, Aarti, Mantra और Stotra web पर available हैं।' : 'Library, Gita, Ramayan, Vedas, Aarti, Mantra and Stotra are available on web.'}</li>
        <li>{hi ? 'Payment gateway/backend में कोई change नहीं किया गया है।' : 'No payment gateway or backend changes were made.'}</li>
      </ol>
      {groups.map((g) => (
        <section key={g.key} className="mb-8">
          <h2 className="font-display mb-3 text-lg font-semibold">{hi ? g.hi : g.en}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {APP_FEATURES.filter((f) => f.group === g.key).map((f) => (
              <li key={f.route}>
                <Link to={f.route} className="sy-stat-tile flex items-center justify-between gap-2 text-sm font-semibold text-[var(--sy-accent)] hover:underline">
                  <span>{hi ? f.hi : f.en}</span>
                  <ParityBadge parity={f.parity} hi={hi} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </FeaturePageShell>
  )
}

function ParityBadge({ parity, hi }: { parity: AppFeature['parity']; hi: boolean }) {
  const label =
    parity === 'app'
      ? hi
        ? 'ऐप जैसा'
        : 'App-like'
      : parity === 'live'
        ? hi
          ? 'लाइव'
          : 'Live'
        : hi
          ? 'Alias'
          : 'Alias'
  const cls =
    parity === 'app'
      ? 'bg-[color-mix(in_srgb,var(--sy-accent)_18%,transparent)] text-[var(--sy-accent)]'
      : parity === 'live'
        ? 'bg-[color-mix(in_srgb,var(--sy-text-soft)_12%,transparent)] text-[var(--sy-text-soft)]'
        : 'bg-[color-mix(in_srgb,var(--sy-text-muted)_15%,transparent)] text-[var(--sy-text-muted)]'
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
