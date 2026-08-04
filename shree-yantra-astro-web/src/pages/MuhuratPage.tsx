import { Link } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { GradientText } from '@/components/ui/GradientText'
import { MUHURAT_GROUPS } from '@/data/muhuratCategories'
import { useLang } from '@/i18n/LangProvider'

export function MuhuratPage() {
  const { hi } = useLang()

  return (
    <FeaturePageShell route="/muhurat">
      <RequireAuth>
        <header className="mb-6 text-center">
          <GradientText className="font-display text-2xl font-bold">
            {hi ? 'शुभ मुहूर्त खोजें' : 'Find an Auspicious Muhurat'}
          </GradientText>
          <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
            {hi ?
              'किसी भी शुभ कार्य के लिए सबसे अच्छा दिन व समय — ऐप जैसी श्रेणी चुनकर खोजें।'
            : 'Best day & time for any auspicious work — pick a category like the app.'}
          </p>
        </header>

        {MUHURAT_GROUPS.map((g) => (
          <section key={g.key} className="mb-8">
            <h2 className="mb-3 font-display text-lg font-semibold text-[var(--sy-accent)]">
              {hi ? g.title.hi : g.title.en}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {g.items.map((c) => (
                <li key={c.key}>
                  <Link
                    to={`/muhurat/${c.key}`}
                    className="sy-stat-tile flex gap-3 transition hover:border-[var(--sy-accent)]"
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span>
                      <span className="block font-semibold">{hi ? c.name.hi : c.name.en}</span>
                      <span className="mt-1 block text-xs text-[var(--sy-text-muted)]">
                        {hi ? c.blurb.hi : c.blurb.en}
                      </span>
                      {c.nameBased ?
                        <span className="mt-1 inline-block rounded-full bg-[var(--sy-glass-bg)] px-2 py-0.5 text-[10px] text-[var(--sy-accent)]">
                          {hi ? 'नाम से भी' : 'By name'}
                        </span>
                      : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-center text-xs text-[var(--sy-text-muted)]">
          🔒{' '}
          {hi ?
            'गणना खगोलीय इंजन (Lahiri अयनांश) और शास्त्रीय मुहूर्त नियमों पर आधारित — कोई अनुमान नहीं।'
          : 'Calculated with an astronomy engine (Lahiri ayanamsa) and classical rules — nothing guessed.'}
        </p>
      </RequireAuth>
    </FeaturePageShell>
  )
}
