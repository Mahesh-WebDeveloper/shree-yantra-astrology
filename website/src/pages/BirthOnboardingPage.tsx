import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { BirthDetailsForm } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { GradientText } from '@/components/ui/GradientText'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { htmlDateToDob } from '@/lib/birthForm'
import { updateProfileApi } from '@/lib/api'
import { useAuth } from '@/context/AuthProvider'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

function safeReturnTo(raw: string | null) {
  if (!raw) return '/kundli'
  try {
    const path = decodeURIComponent(raw)
    if (path.startsWith('/') && !path.startsWith('//')) return path
  } catch {
    /* ignore */
  }
  return '/kundli'
}

function BirthOnboardingInner() {
  const { hi } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const { form, setForm } = useBirthProfile()
  const { patchUser, refreshUser } = useAuth()

  const save = useMutation({
    mutationFn: () =>
      updateProfileApi({
        name: form.name.trim() || undefined,
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
      navigate(returnTo, { replace: true })
    },
  })

  const canSave = useMemo(
    () => form.name.trim() && form.dobHtml && form.tob.trim() && form.place.trim(),
    [form],
  )

  return (
    <div className="auth-page min-h-screen">
      <div className="auth-page-inner max-w-lg">
        <GradientText className="font-display text-xl font-semibold tracking-wide">
          {hi ? 'जन्म विवरण' : 'Birth details'}
        </GradientText>
        <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
          {hi
            ? 'एक बार भरें — फिर कुंडली, गोचर, उपाय सब आपकी प्रोफ़ाइल से चलेंगे (ऐप जैसा)।'
            : 'Enter once — kundli, gochar, remedies and more will use your profile (like the app).'}
        </p>
        <div className="mt-6 rounded-2xl border border-[var(--sy-glass-border)] bg-[var(--sy-glass)] p-4">
          <BirthDetailsForm form={form} onChange={(p) => setForm(p)} showName />
        </div>
        {save.isError ? (
          <p className="mt-3 text-sm text-red-500/90">
            {save.error instanceof Error ? save.error.message : hi ? 'सहेजना विफल' : 'Save failed'}
          </p>
        ) : null}
        <GoldButton type="button" className="mt-6 w-full" disabled={!canSave || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? (hi ? 'सहेजा जा रहा है…' : 'Saving…') : hi ? 'सहेजें और जारी रखें' : 'Save & continue'}
        </GoldButton>
        <Link to="/kundli" className="mt-4 block text-center text-sm text-[var(--sy-text-muted)] hover:underline">
          {hi ? 'बाद में' : 'Skip for now'} →
        </Link>
      </div>
    </div>
  )
}

export function BirthOnboardingPage() {
  return (
    <RequireAuth requireBirthProfile={false}>
      <BirthOnboardingInner />
    </RequireAuth>
  )
}
