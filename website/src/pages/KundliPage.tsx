import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { BirthDetailsForm } from '@/components/feature/BirthDetailsForm'
import { KundliAppView } from '@/components/kundli/KundliAppView'
import { ErrorState } from '@/components/ui/ErrorState'
import { birthFormToKundli, htmlDateToDob } from '@/lib/birthForm'
import { getDasha, getAiInsights, getKundli, getVargaCharts } from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

export function KundliPage() {
  const { hi, lang } = useLang()
  const { form, setForm } = useBirthProfile()
  const [editOpen, setEditOpen] = useState(false)
  const input = useMemo(() => birthFormToKundli(form), [form])

  const queries = useQueries({
    queries: [
      { queryKey: ['kundli', input, lang], queryFn: () => getKundli(input), staleTime: 60_000 },
      { queryKey: ['varga', input, lang], queryFn: () => getVargaCharts(input), staleTime: 120_000 },
      { queryKey: ['dasha', input, lang], queryFn: () => getDasha(input), staleTime: 120_000 },
      {
        queryKey: ['ai-insights', input, lang],
        queryFn: () => getAiInsights(input),
        staleTime: 300_000,
        retry: false,
      },
    ],
  })

  const [kundliQ, vargaQ, dashaQ, insightsQ] = queries
  const loading = kundliQ.isLoading
  const kundli = kundliQ.data?.data
  const planets = kundli?.planets ?? null
  const insightsAuthHint =
    insightsQ.isError && (insightsQ.error as Error & { status?: number }).status === 401

  return (
    <FeaturePageShell route="/kundli">
      <p className="mb-4 text-sm text-[var(--sy-text-soft)]">
        {hi
          ? 'प्रोफ़ाइल से जन्म विवरण स्वतः लोड — ऐप की तरह। बदलने के लिए नीचे «संपादित करें»।'
          : 'Birth details load from your saved profile — like the app. Use «Edit details» below to change them.'}
      </p>

      <button
        type="button"
        className="kundli-tab-pill mb-4"
        onClick={() => setEditOpen((o) => !o)}
      >
        {editOpen ? (hi ? 'फॉर्म छुपाएँ' : 'Hide form') : hi ? 'जन्म विवरण संपादित करें' : 'Edit birth details'}
      </button>

      {editOpen ? (
        <div className="mb-6 rounded-2xl border border-[var(--sy-glass-border)] p-4">
          <BirthDetailsForm form={form} onChange={(p) => setForm(p)} showName />
        </div>
      ) : null}

      {kundliQ.isError && !kundli ? (
        <ErrorState
          message={hi ? 'कुंडली API से नहीं मिली — डेमो डेटा दिखाया जा सकता है।' : 'Could not load kundli from API.'}
          onRetry={() => kundliQ.refetch()}
        />
      ) : null}

      <KundliAppView
        name={form.name || null}
        dob={htmlDateToDob(form.dobHtml)}
        tob={form.tob || null}
        place={form.place || null}
        loading={loading}
        live={!!kundli && !kundliQ.isError}
        err={!!kundliQ.isError}
        ascendant={kundli?.ascendant ?? null}
        moonSign={kundli?.moonSign ?? null}
        planets={planets}
        vargaCharts={vargaQ.data?.data.charts ?? null}
        vargaLoading={vargaQ.isLoading}
        vargaErr={vargaQ.isError ? (hi ? 'वर्ग चार्ट उपलब्ध नहीं।' : 'Divisional charts unavailable.') : null}
        dashaRaw={dashaQ.data?.dasha ?? null}
        yogasLive={kundli?.yogas?.length ? kundli.yogas : null}
        doshasLive={kundli?.doshas?.length ? kundli.doshas : null}
        insightsLive={insightsQ.data?.insights?.length ? insightsQ.data.insights : kundli?.insights?.length ? kundli.insights : null}
        insightsAuthHint={insightsAuthHint}
      />
    </FeaturePageShell>
  )
}
