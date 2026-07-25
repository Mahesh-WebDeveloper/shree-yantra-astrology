import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { BirthDetailsCollapsible } from '@/components/feature/BirthDetailsCollapsible'
import { SyField, SyInput, SySelect } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { birthFormToKundli } from '@/lib/birthForm'
import { getBabyNames, getNameSuggestions } from '@/lib/api'
import { useAutoRunOnMount } from '@/hooks/useAutoRunOnMount'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

export function BabyNamesPage() {
  const { hi } = useLang()
  const [tab, setTab] = useState<'chart' | 'browse'>('chart')
  const { form, setForm } = useBirthProfile()
  const [gender, setGender] = useState('any')
  const [startWith, setStartWith] = useState('')

  const chartMutation = useMutation({
    mutationFn: () => getNameSuggestions({ ...birthFormToKundli(form), gender: gender === 'any' ? undefined : gender }),
  })

  const browseMutation = useMutation({
    mutationFn: () =>
      getBabyNames({
        gender: gender === 'any' ? undefined : gender,
        startWith: startWith.trim() || undefined,
        count: 24,
      }),
  })

  useAutoRunOnMount(
    () => {
      if (form.dobHtml?.trim() && form.place?.trim()) chartMutation.mutate()
    },
    tab === 'chart',
  )

  const names = chartMutation.data?.names ?? browseMutation.data?.names ?? []

  return (
    <FeaturePageShell route="/baby-names">
      <RequireAuth>
      <ProfileBirthHint />
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'chart' ? 'sy-btn-primary' : 'sy-btn-secondary'}`}
          onClick={() => setTab('chart')}
        >
          {hi ? 'कुंडली से' : 'From chart'}
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'browse' ? 'sy-btn-primary' : 'sy-btn-secondary'}`}
          onClick={() => setTab('browse')}
        >
          {hi ? 'नाम खोजें' : 'Browse names'}
        </button>
      </div>
      <SyField label={hi ? 'लिंग' : 'Gender'}>
        <SySelect value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="any">{hi ? 'कोई भी' : 'Any'}</option>
          <option value="boy">{hi ? 'लड़का' : 'Boy'}</option>
          <option value="girl">{hi ? 'लड़की' : 'Girl'}</option>
        </SySelect>
      </SyField>
      {tab === 'chart' ? (
        <div className="mt-4">
          <BirthDetailsCollapsible form={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} showName />
          <GoldButton type="button" className="mt-4" disabled={chartMutation.isPending} onClick={() => chartMutation.mutate()}>
            {chartMutation.isPending ? (hi ? '…' : '…') : hi ? 'नाम सुझाव' : 'Suggest names'}
          </GoldButton>
          {chartMutation.data ? (
            <p className="mt-3 text-sm text-[var(--sy-text-soft)]">
              {hi ? 'नामाक्षर' : 'Naamakshar'}: {chartMutation.data.syllable}
              {chartMutation.data.nakshatra ? ` · ${chartMutation.data.nakshatra}` : ''}
              {chartMutation.data.moonSign ? ` · ${chartMutation.data.moonSign}` : ''}
            </p>
          ) : chartMutation.isPending ? (
            <p className="mt-3 text-sm text-[var(--sy-text-soft)]">{hi ? 'लाइव सुझाव…' : 'Loading live suggestions…'}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4">
          <SyField label={hi ? 'अक्षर से' : 'Starts with'}>
            <SyInput value={startWith} onChange={(e) => setStartWith(e.target.value)} placeholder="A, Ra, …" />
          </SyField>
          <GoldButton type="button" className="mt-4" disabled={browseMutation.isPending} onClick={() => browseMutation.mutate()}>
            {browseMutation.isPending ? (hi ? '…' : '…') : hi ? 'नाम लाएं' : 'Get names'}
          </GoldButton>
        </div>
      )}
      <div className="mt-8">
        {(chartMutation.isError || browseMutation.isError) && (
          <ErrorState
            message={hi ? 'नाम लोड नहीं हुए।' : 'Could not load names.'}
            onRetry={() => (tab === 'chart' ? chartMutation.mutate() : browseMutation.mutate())}
          />
        )}
        {names.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {names.map((n) => (
              <li key={n.name} className="sy-stat-tile">
                <p className="font-deva font-semibold text-[var(--sy-text)]">{hi && n.nameHi ? n.nameHi : n.name}</p>
                <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{hi && n.meaningHi ? n.meaningHi : n.meaning}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      </RequireAuth>
    </FeaturePageShell>
  )
}
