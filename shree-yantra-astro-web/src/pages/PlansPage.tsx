import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { getPlans } from '@/lib/api'
import { useAuth } from '@/context/AuthProvider'
import { useLang } from '@/i18n/LangProvider'

const PERKS = [
  { en: 'Personal rashifal & AI guidance', hi: 'व्यक्तिगत राशिफल व AI मार्गदर्शन' },
  { en: 'Kundli, gochar, remedies, muhurat', hi: 'कुंडली, गोचर, उपाय, मुहूर्त' },
  { en: 'Brihat report & life timeline', hi: 'बृहत रिपोर्ट व दशा समयरेखा' },
  { en: 'Premium support', hi: 'प्रीमियम सहायता' },
]

export function PlansPage() {
  const { hi } = useLang()
  const { user } = useAuth()
  const premium = user?.plan === 'premium'
  const q = useQuery({ queryKey: ['plans'], queryFn: getPlans })

  return (
    <FeaturePageShell route="/plans" titleEn="Premium plans" titleHi="प्रीमियम प्लान">
      <div className="sy-stat-tile mb-6 text-center border border-[var(--sy-accent)]/40">
        <p className="text-3xl">👑</p>
        <h2 className="font-display mt-2 text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'प्रीमियम अनलॉक करें' : 'Unlock Premium'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
          {hi
            ? 'ऐप जैसे प्लान — भुगतान व सक्रियण मोबाइल ऐप में पूरा होता है।'
            : 'Same plans as the app — complete payment & activation in the mobile app.'}
        </p>
        {premium ? (
          <p className="mt-3 text-sm font-semibold text-emerald-600">
            {hi ? 'आपकी प्रीमियम सदस्यता सक्रिय है।' : 'Your premium membership is active.'}
          </p>
        ) : null}
      </div>

      <ul className="mb-8 grid gap-2 sm:grid-cols-2">
        {PERKS.map((p) => (
          <li key={p.en} className="sy-stat-tile text-sm">
            ✨ {hi ? p.hi : p.en}
          </li>
        ))}
      </ul>

      {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {q.isError ? <ErrorState message={hi ? 'प्लान लोड नहीं हुए।' : 'Could not load plans.'} onRetry={() => q.refetch()} /> : null}

      <ul className="space-y-3">
        {q.data?.plans.map((p, i) => (
          <li
            key={p._id}
            className={`sy-stat-tile ${i === 0 ? 'border-[var(--sy-accent)] shadow-[0_0_0_1px_var(--sy-accent)]' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-semibold">{p.name}</p>
                {p.badge ? <span className="mt-1 inline-block text-xs font-bold uppercase text-[var(--sy-accent)]">{p.badge}</span> : null}
              </div>
              <p className="font-display text-2xl font-bold text-[var(--sy-accent)]">₹{p.priceINR}</p>
            </div>
            <p className="mt-1 text-sm text-[var(--sy-text-muted)]">
              {p.durationDays} {hi ? 'दिन' : 'days'}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--sy-text-soft)]">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={user ? '/profile' : '/sign-in'}>
          <GoldButton type="button">{user ? (hi ? 'प्रोफ़ाइल' : 'Profile') : hi ? 'लॉगिन' : 'Sign in'}</GoldButton>
        </Link>
        <a href="https://play.google.com/store" target="_blank" rel="noreferrer" className="inline-block">
          <button type="button" className="sy-btn-secondary rounded-full px-5 py-2.5 text-sm font-semibold">
            {hi ? 'ऐप में सब्सक्राइब' : 'Subscribe in app'}
          </button>
        </a>
      </div>
    </FeaturePageShell>
  )
}
