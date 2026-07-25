import { useEffect, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { BirthDetailsCollapsible } from '@/components/feature/BirthDetailsCollapsible'
import { BirthChart } from '@/components/kundli/BirthChart'
import { SyField, SySelect } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { birthFormToKundli } from '@/lib/birthForm'
import {
  getKundli,
  getNameSuggestions,
  getRemedies,
  getVedicReading,
  getVargaCharts,
  getLifeTimeline,
} from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

export function JanamPatriPage() {
  const { hi } = useLang()
  const { form, setForm } = useBirthProfile()
  const [gender, setGender] = useState('boy')
  const [run, setRun] = useState(false)
  const input = useMemo(() => birthFormToKundli(form), [form])

  useEffect(() => {
    if (form.dobHtml?.trim() && form.place?.trim() && form.tob?.trim()) setRun(true)
  }, [form.dobHtml, form.place, form.tob])

  const qs = useQueries({
    queries: [
      { queryKey: ['jp-kundli', input, run], queryFn: () => getKundli(input), enabled: run },
      { queryKey: ['jp-varga', input, run], queryFn: () => getVargaCharts(input), enabled: run },
      { queryKey: ['jp-reading', input, run], queryFn: () => getVedicReading(input), enabled: run },
      { queryKey: ['jp-names', input, gender, run], queryFn: () => getNameSuggestions({ ...input, gender }), enabled: run },
      { queryKey: ['jp-rem', input, run], queryFn: () => getRemedies(input), enabled: run },
      { queryKey: ['jp-tl', input, run], queryFn: () => getLifeTimeline(input), enabled: run },
    ],
  })

  const kundli = qs[0].data?.data
  const loading = run && qs.some((q) => q.isLoading)

  return (
    <FeaturePageShell route="/janam-patri" titleEn="Janam Patri + Naamkaran" titleHi="जन्म पत्री + नामकरण">
      <RequireAuth>
        <ProfileBirthHint />
        <BirthDetailsCollapsible form={form} onChange={(p) => setForm(p)} showName />
        <SyField label={hi ? 'लिंग (नाम)' : 'Gender (names)'} className="mt-4">
          <SySelect value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="boy">{hi ? 'लड़का' : 'Boy'}</option>
            <option value="girl">{hi ? 'लड़की' : 'Girl'}</option>
          </SySelect>
        </SyField>
        <GoldButton type="button" className="mt-4" disabled={loading} onClick={() => setRun(true)}>
          {loading ? (hi ? 'रिपोर्ट…' : 'Building…') : hi ? 'जन्म पत्री बनाएं' : 'Generate Janam Patri'}
        </GoldButton>
        {kundli ?
          <div className="mt-8 space-y-6">
            <BirthChart style="north" planets={kundli.planets} ascendant={kundli.ascendant} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sy-stat-tile">
                {hi ? 'लग्न' : 'Asc'}: {kundli.ascendant}
              </div>
              <div className="sy-stat-tile">
                {hi ? 'चंद्र' : 'Moon'}: {kundli.moonSign}
              </div>
              <div className="sy-stat-tile">{qs[3].data?.syllable ? `Naamakshar: ${qs[3].data.syllable}` : '—'}</div>
            </div>
            {qs[2].data?.predictions.slice(0, 4).map((p, i) => (
              <div key={i} className="sy-stat-tile">
                <p className="font-semibold">{hi ? p.title.hi : p.title.en}</p>
                <p className="mt-1 text-sm">{hi ? p.text.hi : p.text.en}</p>
              </div>
            ))}
            {qs[3].data?.names.length ?
              <div>
                <h3 className="font-display mb-2 text-lg font-semibold">{hi ? 'नाम सुझाव' : 'Name suggestions'}</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {qs[3].data.names.slice(0, 12).map((n) => (
                    <li key={n.name} className="sy-stat-tile text-sm">
                      <span className="font-deva font-semibold">{n.name}</span> — {n.meaning}
                    </li>
                  ))}
                </ul>
              </div>
            : null}
          </div>
        : null}
      </RequireAuth>
    </FeaturePageShell>
  )
}
