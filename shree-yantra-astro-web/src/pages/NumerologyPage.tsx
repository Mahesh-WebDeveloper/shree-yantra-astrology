import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { SyField, SyInput } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { htmlDateToDob } from '@/lib/birthForm'
import { getNumerologyProfile, getNumerologyReading, type NumerologyProfile, type NumerologyReading } from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

const LOSHU_ROWS = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
]

export function NumerologyPage() {
  const { hi } = useLang()
  const { form, setForm } = useBirthProfile()
  const [name, setName] = useState(form.name)
  const [dobHtml, setDobHtml] = useState(form.dobHtml)

  const dob = useMemo(() => htmlDateToDob(dobHtml), [dobHtml])
  const profileReady = !!(name.trim() && dobHtml.trim())

  useEffect(() => {
    if (form.name && !name) setName(form.name)
    if (form.dobHtml && dobHtml !== form.dobHtml) setDobHtml(form.dobHtml)
  }, [form.name, form.dobHtml, name, dobHtml])

  const profileQ = useQuery({
    queryKey: ['numerology-profile', name, dob],
    queryFn: () => getNumerologyProfile({ name: name.trim() || undefined, dob }),
    enabled: profileReady,
    staleTime: 10 * 60_000,
  })

  const readingMutation = useMutation({
    mutationFn: () => getNumerologyReading({ name: name.trim() || undefined, dob }),
  })

  const profile = profileQ.data?.profile ?? null
  const reading: NumerologyReading | null = readingMutation.data?.reading ?? null

  return (
    <FeaturePageShell route="/numerology">
      <RequireAuth>
      <ProfileBirthHint />
      <p className="mb-3 text-sm text-[var(--sy-text-soft)]">
        {hi
          ? 'प्रोफ़ाइल ऐप जैसी लाइव API से खुलते ही लोड होती है।'
          : 'Profile loads from the same live API as the app when you open this page.'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <SyField label={hi ? 'नाम' : 'Name'}>
          <SyInput
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setForm({ name: e.target.value })
            }}
          />
        </SyField>
        <SyField label={hi ? 'जन्म तिथि' : 'Date of birth'}>
          <SyInput
            type="date"
            value={dobHtml}
            onChange={(e) => {
              setDobHtml(e.target.value)
              setForm({ dobHtml: e.target.value })
            }}
          />
        </SyField>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <GoldButton type="button" disabled={profileQ.isFetching} onClick={() => profileQ.refetch()}>
          {profileQ.isFetching ? '…' : hi ? 'प्रोफ़ाइल रीफ़्रेश' : 'Refresh profile'}
        </GoldButton>
        <button
          type="button"
          className="sy-btn-secondary rounded-full px-5 py-2.5 text-sm font-semibold"
          disabled={readingMutation.isPending}
          onClick={() => readingMutation.mutate()}
        >
          {readingMutation.isPending ? '…' : hi ? 'व्याख्या (AI)' : 'Interpretation (AI)'}
        </button>
      </div>
      <div className="mt-8">
        {profileQ.isLoading && !profile ? <Skeleton className="h-48 rounded-2xl" /> : null}
        {profileQ.isError ? (
          <ErrorState
            message={hi ? 'अंकशास्त्र लोड नहीं हुआ।' : 'Numerology request failed.'}
            onRetry={() => profileQ.refetch()}
          />
        ) : profile ? (
          <NumerologyProfileView profile={profile} reading={reading} hi={hi} />
        ) : null}
      </div>
      </RequireAuth>
    </FeaturePageShell>
  )
}

function NumerologyProfileView({
  profile,
  reading,
  hi,
}: {
  profile: NumerologyProfile
  reading: NumerologyReading | null
  hi: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Tile
        label={hi ? 'मूलांक' : 'Mulank'}
        value={String(profile.mulank.final)}
        sub={hi ? profile.mulank.planet?.hi : profile.mulank.planet?.en}
      />
      <Tile
        label={hi ? 'भाग्यांक' : 'Bhagyank'}
        value={String(profile.bhagyank.final)}
        sub={hi ? profile.bhagyank.planet?.hi : profile.bhagyank.planet?.en}
      />
      <Tile
        label={hi ? 'नामांक' : 'Namank'}
        value={String(profile.namank.final)}
        sub={`Pyth: ${profile.namank.pythagorean}`}
      />
      {profile.personalYear ? (
        <Tile label={hi ? 'व्यक्तिगत वर्ष' : 'Personal year'} value={String(profile.personalYear.final)} />
      ) : null}
      {profile.lucky ? (
        <div className="sy-stat-tile sm:col-span-3">
          <p className="text-xs font-bold uppercase text-[var(--sy-text-muted)]">{hi ? 'शुभ' : 'Lucky'}</p>
          <p className="mt-2 text-sm">
            {hi ? 'अंक' : 'Numbers'}: {profile.lucky.numbers.join(', ')}
          </p>
          <p className="mt-1 text-sm">
            {hi ? 'रंग' : 'Colors'}: {(hi ? profile.lucky.colors.hi : profile.lucky.colors.en).join(', ')}
          </p>
          <p className="mt-1 text-sm">
            {hi ? 'दिन' : 'Days'}: {(hi ? profile.lucky.days.hi : profile.lucky.days.en).join(', ')}
          </p>
          {profile.lucky.gem ? (
            <p className="mt-1 text-sm">
              {hi ? 'रत्न' : 'Gem'}: {hi ? profile.lucky.gem.hi : profile.lucky.gem.en}
            </p>
          ) : null}
        </div>
      ) : null}
      {profile.loShu ? (
        <div className="sy-stat-tile sm:col-span-3">
          <p className="text-xs font-bold uppercase text-[var(--sy-text-muted)]">{hi ? 'लो-शु ग्रिड' : 'Lo Shu grid'}</p>
          <div className="mt-3 inline-grid grid-cols-3 gap-1">
            {LOSHU_ROWS.flat().map((n) => {
              const c = profile.loShu!.counts[String(n)] || 0
              return (
                <div
                  key={n}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--sy-glass-border)] text-sm font-semibold"
                >
                  {c > 0 ? `${n}×${c}` : '—'}
                </div>
              )
            })}
          </div>
          {profile.loShu.missing.length ? (
            <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
              {hi ? 'अनुपस्थित' : 'Missing'}: {profile.loShu.missing.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
      {reading?.summary || reading?.saralVivaran ? (
        <div className="sy-stat-tile sm:col-span-3">
          <p className="text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
            {hi ? reading.saralVivaran || reading.summary : reading.summary}
          </p>
          {reading.loShu?.remedies?.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-[var(--sy-text-soft)]">
              {reading.loShu.remedies.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="sy-stat-tile">
      <p className="text-xs font-bold uppercase text-[var(--sy-text-muted)]">{label}</p>
      <p className="font-display mt-1 text-3xl font-bold text-[var(--sy-accent)]">{value}</p>
      {sub ? <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{sub}</p> : null}
    </div>
  )
}
