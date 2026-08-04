import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { BirthDetailsForm } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { DailyPredictionPanel, PeriodPredictionPanel } from '@/components/rashifal/RashifalPanels'
import { ReadingBar } from '@/components/rashifal/ReadingBar'
import { getDailyPrediction, getPeriodPrediction, type PredPeriod } from '@/lib/api'
import { birthFormToKundli } from '@/lib/birthForm'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useReadingPrefs } from '@/hooks/useReadingPrefs'
import { useLang } from '@/i18n/LangProvider'

const MY_TABS: { key: 'daily' | PredPeriod; en: string; hi: string }[] = [
  { key: 'daily', en: 'Daily', hi: 'दैनिक' },
  { key: 'week', en: 'Weekly', hi: 'साप्ताहिक' },
  { key: 'month', en: 'Monthly', hi: 'मासिक' },
  { key: 'year', en: 'Yearly', hi: 'वार्षिक' },
]

/** App screen: DailyPrediction — profile birth, auto-load, period tabs, full AI sections */
export function MyRashifalPage() {
  const { hi } = useLang()
  const { form, setForm } = useBirthProfile()
  const [tab, setTab] = useState<'daily' | PredPeriod>('daily')
  const [editBirth, setEditBirth] = useState(false)
  const { scale, weight, stepScale, stepWeight } = useReadingPrefs()
  const input = useMemo(() => birthFormToKundli(form), [form])

  const dailyQ = useQuery({
    queryKey: ['daily-prediction', input, form.name, hi],
    queryFn: () => getDailyPrediction({ ...input, name: form.name || undefined }),
    enabled: tab === 'daily',
    staleTime: 10 * 60_000,
  })

  const periodQ = useQuery({
    queryKey: ['period-prediction', tab, input, form.name, hi],
    queryFn: () => getPeriodPrediction({ ...input, name: form.name || undefined }, tab as PredPeriod),
    enabled: tab !== 'daily',
    staleTime: 15 * 60_000,
  })

  const dailyErrMsg =
    dailyQ.error instanceof Error ? dailyQ.error.message : undefined
  const periodErrMsg =
    periodQ.error instanceof Error ? periodQ.error.message : undefined

  return (
    <FeaturePageShell route="/my-rashifal">
      <RequireAuth>
      <ProfileBirthHint />
      <div className="sy-stat-tile mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{hi ? 'प्रोफ़ाइल' : 'Profile'}</p>
          <p className="font-semibold">{form.name || (hi ? 'आप' : 'You')}</p>
          <p className="text-sm text-[var(--sy-text-soft)]">
            {form.dobHtml} · {form.tob} · {form.place || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="sy-btn-secondary rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setEditBirth((v) => !v)}>
            {editBirth ? (hi ? 'छिपाएं' : 'Hide') : hi ? 'जन्म विवरण' : 'Birth details'}
          </button>
          <Link to="/profile" className="sy-btn-secondary rounded-full px-4 py-2 text-sm font-semibold">
            {hi ? 'प्रोफ़ाइल' : 'Profile'}
          </Link>
          <Link to="/rashifal" className="text-sm font-medium text-[var(--sy-accent)] hover:underline">
            {hi ? '12 राशियाँ' : '12 signs'}
          </Link>
        </div>
      </div>
      {editBirth ? (
        <div className="mb-4">
          <BirthDetailsForm form={form} onChange={(p) => setForm(p)} showName />
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap gap-2">
        {MY_TABS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`kundli-tab-pill ${tab === p.key ? 'kundli-tab-pill--on' : ''}`}
            onClick={() => setTab(p.key)}
          >
            {hi ? p.hi : p.en}
          </button>
        ))}
      </div>

      <ReadingBar scale={scale} weight={weight} stepScale={stepScale} stepWeight={stepWeight} />

      <GoldButton
        type="button"
        className="mb-6"
        disabled={tab === 'daily' ? dailyQ.isFetching : periodQ.isFetching}
        onClick={() => (tab === 'daily' ? dailyQ.refetch() : periodQ.refetch())}
      >
        {tab === 'daily' && dailyQ.isFetching ? (hi ? 'तैयार…' : 'Preparing…') : hi ? 'रीफ़्रेश' : 'Refresh'}
      </GoldButton>

      {tab === 'daily' ?
        <DailyPredictionPanel
          pred={dailyQ.data}
          loading={dailyQ.isLoading}
          error={dailyQ.isError}
          errorMessage={dailyErrMsg}
          onRetry={() => dailyQ.refetch()}
          form={form}
          hi={hi}
          readingScale={scale}
          readingWeight={weight}
        />
      : <PeriodPredictionPanel
          data={periodQ.data}
          loading={periodQ.isLoading}
          error={periodQ.isError}
          errorMessage={periodErrMsg}
          onRetry={() => periodQ.refetch()}
          hi={hi}
          readingScale={scale}
          readingWeight={weight}
        />
      }
      </RequireAuth>
    </FeaturePageShell>
  )
}
