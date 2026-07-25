import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { BirthDetailsForm } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { htmlDateToDob } from '@/lib/birthForm'
import { getPlans, updateProfileApi } from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useAuth } from '@/context/AuthProvider'
import { useLang } from '@/i18n/LangProvider'

export function ProfilePage() {
  const { hi } = useLang()
  const { user, loggedIn, logout, refreshUser, patchUser } = useAuth()
  const { form, setForm } = useBirthProfile()

  const plans = useQuery({ queryKey: ['plans'], queryFn: getPlans })

  const sync = useMutation({
    mutationFn: () =>
      updateProfileApi({
        name: form.name,
        profile: {
          dob: htmlDateToDob(form.dobHtml),
          tob: form.tob,
          tz: form.tz,
          place: form.place,
          lat: form.lat ? Number(form.lat) : undefined,
          lng: form.lng ? Number(form.lng) : undefined,
        },
      }),
    onSuccess: async (r) => {
      patchUser(r.user)
      await refreshUser()
    },
  })

  if (!loggedIn) {
    return <Navigate to="/sign-in?returnTo=%2Fprofile" replace />
  }

  return (
    <FeaturePageShell route="/profile" titleEn="My Profile" titleHi="मेरी प्रोफ़ाइल">
      <div className="sy-stat-tile mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'साइन इन' : 'Signed in'}</p>
          <p className="font-semibold">{user?.name || form.name || (hi ? 'आप' : 'You')}</p>
          {user?.phone ? <p className="text-sm text-[var(--sy-text-soft)]">{user.phone}</p> : null}
        </div>
        <button
          type="button"
          className="sy-btn-secondary rounded-full px-4 py-2 text-sm font-semibold"
          onClick={() => void logout()}
        >
          {hi ? 'लॉग आउट' : 'Log out'}
        </button>
      </div>

      <BirthDetailsForm form={form} onChange={(p) => setForm(p)} showName />
      <p className="mt-4 text-xs text-[var(--sy-text-muted)]">
        {hi
          ? 'जन्म विवरण सहेजने पर सर्वर प्रोफ़ाइल अपडेट होती है — ऐप की तरह सभी सेवाएँ इसी से चलती हैं।'
          : 'Saving updates your server profile — all services use these details like the app.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <GoldButton type="button" disabled={sync.isPending} onClick={() => sync.mutate()}>
          {sync.isPending ? (hi ? 'सहेजा जा रहा है…' : 'Saving…') : hi ? 'प्रोफ़ाइल सहेजें' : 'Save profile'}
        </GoldButton>
        {sync.isSuccess ? <span className="self-center text-sm text-[var(--sy-accent)]">{hi ? 'सहेजा गया' : 'Saved'}</span> : null}
        {sync.isError ? (
          <span className="self-center text-sm text-red-500/90">
            {sync.error instanceof Error ? sync.error.message : hi ? 'विफल' : 'Failed'}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Link to="/notifications" className="sy-stat-tile text-sm font-semibold text-[var(--sy-accent)] hover:underline">
          🔔 {hi ? 'सूचनाएँ' : 'Notifications'}
        </Link>
        <Link to="/plans" className="sy-stat-tile text-sm font-semibold text-[var(--sy-accent)] hover:underline">
          👑 {hi ? 'सदस्यता / प्लान' : 'Subscription / plans'}
        </Link>
        <Link to="/legal" className="sy-stat-tile text-sm font-semibold text-[var(--sy-accent)] hover:underline">
          📜 {hi ? 'गोपनीयता व शर्तें' : 'Privacy & Terms'}
        </Link>
        <Link to="/help" className="sy-stat-tile text-sm font-semibold text-[var(--sy-accent)] hover:underline">
          ❓ {hi ? 'सहायता' : 'Help'}
        </Link>
      </div>

      {plans.data?.plans.length ? (
        <div className="mt-8">
          <h3 className="font-display mb-3 text-lg font-semibold">{hi ? 'प्लान' : 'Plans'}</h3>
          <ul className="space-y-2">
            {plans.data.plans.map((p) => (
              <li key={p._id} className="sy-stat-tile">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-[var(--sy-accent)]">₹{p.priceINR}</p>
              </li>
            ))}
          </ul>
          <Link to="/plans" className="mt-3 inline-block text-sm font-semibold text-[var(--sy-accent)] hover:underline">
            {hi ? 'सभी प्लान →' : 'All plans →'}
          </Link>
        </div>
      ) : null}
    </FeaturePageShell>
  )
}
