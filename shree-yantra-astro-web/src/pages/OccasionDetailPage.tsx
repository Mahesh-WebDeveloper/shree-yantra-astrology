import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { occasionById } from '@/data/occasions'
import { askOccasion, getOccasionGuide } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

const MUHURAT_KEY: Record<string, string> = {
  vivah: 'vivah',
  'grah-pravesh': 'griha-pravesh',
  vehicle: 'vehicle',
  business: 'new-business',
}

function Acc({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="sy-stat-tile">
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <span className="font-semibold text-[var(--sy-accent)]">{title}</span>
        <span className="text-xs text-[var(--sy-text-muted)]">{open ? '▲' : '▼'}</span>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export function OccasionDetailPage() {
  const { hi, lang } = useLang()
  const { id = '' } = useParams()
  const o = occasionById(id)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')

  const guideQ = useQuery({
    queryKey: ['occasion-guide', id, lang],
    queryFn: () => getOccasionGuide(id),
    enabled: !!o,
    staleTime: 600_000,
  })

  const ask = useMutation({
    mutationFn: (question: string) => askOccasion(id, question),
  })

  const suggestions = useMemo(
    () =>
      hi
        ? ['इसमें कितना समय लगता है?', 'अब अगला चरण क्या है?', 'कौन सी दिशा शुभ है?']
        : ['How long does it take?', 'What is the next step?', 'Which direction is auspicious?'],
    [hi],
  )

  const muhuratKey = MUHURAT_KEY[id]
  const g = guideQ.data

  if (!o) {
    return (
      <FeaturePageShell route="/library">
        <Link to="/occasions" className="text-sm text-[var(--sy-accent)]">
          ← {hi ? 'शुभ अवसर' : 'Occasions'}
        </Link>
        <p className="mt-4 text-sm">{hi ? 'नहीं मिला' : 'Not found'}</p>
      </FeaturePageShell>
    )
  }

  const toggle = (i: number) => {
    setChecked((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  }

  return (
    <FeaturePageShell route="/library">
      <Link to="/occasions" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
        ← {hi ? 'शुभ अवसर' : 'Occasions'}
      </Link>
      <div className="sy-stat-tile mb-4 text-center" style={{ borderColor: `${o.accent}66` }}>
        <p className="text-4xl">{o.emoji}</p>
        <h2 className="font-display mt-2 text-xl font-semibold">{hi ? o.hi : o.en}</h2>
        <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{hi ? o.subHi : o.subEn}</p>
        <p className="mt-1 text-xs text-[var(--sy-accent)]">{hi ? o.deityHi : o.deityEn}</p>
      </div>

      {muhuratKey ? (
        <Link to={`/muhurat/${muhuratKey}`} className="mb-4 block">
          <GoldButton type="button" className="w-full">
            🔎 {hi ? 'अपना शुभ मुहूर्त देखें' : 'Check your Shubh Muhurat'} →
          </GoldButton>
        </Link>
      ) : null}

      {guideQ.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {guideQ.isError ? (
        <ErrorState message={hi ? 'गाइड लोड नहीं हुई।' : 'Could not load guide.'} onRetry={() => guideQ.refetch()} />
      ) : null}

      {g ? (
        <div className="space-y-3">
          <Acc title={`📖 ${hi ? 'महत्व' : 'Significance'}`}>
            <p className="text-sm leading-relaxed text-[var(--sy-text-soft)]">{g.significance}</p>
          </Acc>
          <Acc title={`🕰 ${hi ? 'मुहूर्त' : 'Muhurat'}`}>
            <p className="text-sm leading-relaxed text-[var(--sy-text-soft)]">{g.muhurat}</p>
          </Acc>
          <Acc title={`🛒 ${hi ? 'सामग्री' : 'Samagri'}`}>
            <ul className="space-y-2">
              {g.samagri.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 text-left text-sm"
                    onClick={() => toggle(i)}
                  >
                    <span className={checked.has(i) ? 'text-emerald-600' : 'text-[var(--sy-text-muted)]'}>
                      {checked.has(i) ? '✓' : '○'}
                    </span>
                    <span className={checked.has(i) ? 'line-through opacity-60' : ''}>{item}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Acc>
          <Acc title={`📜 ${hi ? 'विधि' : 'Vidhi'}`}>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--sy-text-soft)]">
              {g.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Acc>
          {g.mantras?.length ? (
            <Acc title={`📿 ${hi ? 'मंत्र' : 'Mantras'}`}>
              <div className="space-y-3">
                {g.mantras.map((m, i) => (
                  <div key={i} className="rounded-xl border border-[var(--sy-glass-border)] p-3">
                    <p className="font-deva text-lg leading-relaxed">{m.sanskrit}</p>
                    {m.transliteration ? <p className="mt-1 text-xs italic text-[var(--sy-text-muted)]">{m.transliteration}</p> : null}
                    <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{m.meaning}</p>
                    {m.count ? <p className="mt-1 text-xs text-[var(--sy-accent)]">🔢 {m.count}</p> : null}
                  </div>
                ))}
              </div>
            </Acc>
          ) : null}
          <Acc title={`✅ ${hi ? 'करें / न करें' : 'Do / Don’t'}`}>
            <ul className="space-y-1 text-sm text-emerald-700">
              {g.dos.map((d, i) => (
                <li key={i}>✓ {d}</li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              {g.donts.map((d, i) => (
                <li key={i}>✗ {d}</li>
              ))}
            </ul>
          </Acc>
          {g.faqs?.length ? (
            <Acc title={`❓ FAQ`}>
              <ul className="space-y-3">
                {g.faqs.map((f, i) => (
                  <li key={i}>
                    <p className="font-semibold text-sm">{f.q}</p>
                    <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{f.a}</p>
                  </li>
                ))}
              </ul>
            </Acc>
          ) : null}
          {g.disclaimer ? <p className="text-center text-xs text-[var(--sy-text-muted)]">{g.disclaimer}</p> : null}
        </div>
      ) : null}

      <div className="sy-stat-tile mt-6">
        <p className="font-semibold text-[var(--sy-accent)]">{hi ? 'AI से पूछें' : 'Ask AI'}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="kundli-tab-pill text-xs"
              onClick={() => {
                setQ(s)
                ask.mutate(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <textarea
          className="sy-field-input mt-3 min-h-[72px] w-full"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={hi ? 'अपना प्रश्न लिखें…' : 'Ask your question…'}
        />
        <GoldButton
          type="button"
          className="mt-3"
          disabled={!q.trim() || ask.isPending}
          onClick={() => ask.mutate(q.trim())}
        >
          {ask.isPending ? '…' : hi ? 'उत्तर' : 'Get answer'}
        </GoldButton>
        {ask.data?.answer ? <p className="mt-3 text-sm leading-relaxed text-[var(--sy-text-soft)]">{ask.data.answer}</p> : null}
      </div>
    </FeaturePageShell>
  )
}
