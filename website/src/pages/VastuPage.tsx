import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { SyField, SySelect } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { analyzeVastu, askVastu } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
const ROOMS = [
  { key: 'mainEntrance', en: 'Main entrance', hi: 'मुख्य द्वार' },
  { key: 'kitchen', en: 'Kitchen', hi: 'रसोई' },
  { key: 'masterBedroom', en: 'Master bedroom', hi: 'मुख्य शयनकक्ष' },
  { key: 'pujaRoom', en: 'Puja room', hi: 'पूजा-घर' },
  { key: 'toilet', en: 'Toilet', hi: 'शौचालय' },
] as const

export function VastuPage() {
  const { hi } = useLang()
  const [facing, setFacing] = useState<string>('E')
  const [rooms, setRooms] = useState<Record<string, string>>({
    mainEntrance: 'E',
    kitchen: 'SE',
    masterBedroom: 'SW',
    pujaRoom: 'NE',
    toilet: 'NW',
  })

  const [question, setQuestion] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      analyzeVastu({
        propertyType: 'home',
        facing,
        rooms,
      }),
  })
  const ask = useMutation({
    mutationFn: () =>
      askVastu({
        propertyType: 'home',
        facing,
        rooms,
        question: question.trim(),
      }),
  })

  return (
    <FeaturePageShell route="/vastu">
      <RequireAuth>
      <Link to="/vastu-learn" className="mb-4 inline-block text-sm font-semibold text-[var(--sy-accent)] hover:underline">
        {hi ? 'वास्तु सीखें (ऐप जैसा कोर्स) →' : 'Learn Vastu (app-like course) →'}
      </Link>
      <SyField label={hi ? 'मुख्य दिशा (फेसिंग)' : 'Main facing direction'}>
        <SySelect value={facing} onChange={(e) => setFacing(e.target.value)}>
          {DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SySelect>
      </SyField>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ROOMS.map((r) => (
          <SyField key={r.key} label={hi ? r.hi : r.en}>
            <SySelect
              value={rooms[r.key] || 'E'}
              onChange={(e) => setRooms((prev) => ({ ...prev, [r.key]: e.target.value }))}
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SySelect>
          </SyField>
        ))}
      </div>
      <GoldButton type="button" className="mt-6" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? (hi ? 'विश्लेषण…' : 'Analyzing…') : hi ? 'वास्तु जांचें' : 'Analyze vastu'}
      </GoldButton>
      <div className="mt-8 space-y-3">
        {mutation.isError ? (
          <ErrorState
            message={hi ? 'वास्तु विश्लेषण विफल।' : 'Vastu analysis failed.'}
            onRetry={() => mutation.mutate()}
          />
        ) : mutation.data ? (
          <>
            <div className="sy-stat-tile">
              <p className="text-3xl font-bold text-[var(--sy-accent)]">{mutation.data.summary.score ?? '—'}</p>
              <p className="font-display mt-1 text-lg font-semibold">
                {hi ? mutation.data.summary.title.hi : mutation.data.summary.title.en}
              </p>
              <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
                {hi ? mutation.data.summary.text.hi : mutation.data.summary.text.en}
              </p>
            </div>
            {mutation.data.priority.slice(0, 5).map((f, i) => (
              <div key={i} className="sy-stat-tile">
                <p className="font-semibold">{hi ? f.title.hi : f.title.en}</p>
                <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
                  {hi ? f.recommendation.hi : f.recommendation.en}
                </p>
              </div>
            ))}
          </>
        ) : null}
      </div>
      <div className="mt-10 border-t border-[var(--sy-glass-border)] pt-8">
        <SyField label={hi ? 'AI से पूछें' : 'Ask AI (like app)'}>
          <textarea className="sy-field-input min-h-[80px]" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </SyField>
        <GoldButton type="button" className="mt-3" disabled={!question.trim() || ask.isPending} onClick={() => ask.mutate()}>
          {ask.isPending ? '…' : hi ? 'उत्तर' : 'Get answer'}
        </GoldButton>
        {ask.data?.answer ? <p className="sy-stat-tile mt-4 text-sm leading-relaxed">{ask.data.answer}</p> : null}
      </div>
      </RequireAuth>
    </FeaturePageShell>
  )
}
