import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { ProfileBirthHint } from '@/components/auth/ProfileBirthHint'
import { SyField } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { askAiAstrologer } from '@/lib/api'
import { birthFormToKundli } from '@/lib/birthForm'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

const QUICK = [
  { en: 'When is a good time for marriage?', hi: 'विवाह का शुभ समय?' },
  { en: 'Career guidance from my chart', hi: 'करियर मार्गदर्शन' },
  { en: 'Remedies for Saturn', hi: 'शनि के उपाय' },
]

export function AiAstrologerPage() {
  const { hi } = useLang()
  const { form } = useBirthProfile()
  const [searchParams] = useSearchParams()
  const [question, setQuestion] = useState('')
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setQuestion(decodeURIComponent(q))
  }, [searchParams])
  const mutation = useMutation({
    mutationFn: () => askAiAstrologer({ ...birthFormToKundli(form), name: form.name, question: question.trim() }),
  })

  return (
    <FeaturePageShell route="/ai-astrologer" titleEn="Vedic AI Astrologer" titleHi="वैदिक AI ज्योतिषी">
      <RequireAuth>
        <ProfileBirthHint />
        <SyField label={hi ? 'प्रश्न' : 'Your question'} className="mt-2">
          <textarea
            className="sy-field-input min-h-[100px] resize-y"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </SyField>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q.en}
              type="button"
              className="kundli-tab-pill text-xs"
              onClick={() => setQuestion(hi ? q.hi : q.en)}
            >
              {hi ? q.hi : q.en}
            </button>
          ))}
        </div>
        <GoldButton type="button" className="mt-4" disabled={!question.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (hi ? 'उत्तर…' : 'Answering…') : hi ? 'पूछें' : 'Ask'}
        </GoldButton>
        <div className="mt-8 space-y-3">
          {mutation.isError ? (
            <ErrorState message={hi ? 'AI उत्तर विफल' : 'AI answer failed'} onRetry={() => mutation.mutate()} />
          ) : null}
          {mutation.data ? (
            <>
              <div className="sy-stat-tile">
                <p className="leading-relaxed text-[var(--sy-text-soft)]">{mutation.data.answer}</p>
              </div>
              {mutation.data.sections.map((s, i) => (
                <div key={i} className="sy-stat-tile">
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{s.text}</p>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </RequireAuth>
    </FeaturePageShell>
  )
}
