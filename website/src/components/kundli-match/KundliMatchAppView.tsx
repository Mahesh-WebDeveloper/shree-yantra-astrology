import { useCallback, useEffect, useRef, useState } from 'react'
import { BirthDetailsForm } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { GradientText } from '@/components/ui/GradientText'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  DEFAULT_BIRTH_FORM,
  htmlDateToDob,
  type BirthFormState,
} from '@/lib/birthForm'
import { getKundliMatch, resolveLocation, type KundliInput, type MatchKoota, type MatchResponse } from '@/lib/api'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

function verdictColor(v: string) {
  if (v === 'excellent') return '#3ec77a'
  if (v === 'good') return '#9ed36a'
  if (v === 'average') return '#e0a92e'
  return '#e06a5a'
}

function verdictLabel(v: string, hi: boolean) {
  const en: Record<string, string> = {
    excellent: 'Excellent Match',
    good: 'Good Match',
    average: 'Average Match',
    poor: 'Weak Match',
  }
  const hin: Record<string, string> = {
    excellent: 'उत्तम मेल',
    good: 'अच्छा मेल',
    average: 'सामान्य मेल',
    poor: 'कमज़ोर मेल',
  }
  return (hi ? hin : en)[v] || v
}

function barColor(ratio: number) {
  if (ratio >= 0.66) return '#3ec77a'
  if (ratio >= 0.34) return '#e0a92e'
  return '#e06a5a'
}

function validPerson(form: BirthFormState) {
  return !!(form.dobHtml?.trim() && form.tob.trim() && form.place.trim())
}

async function personToMatchInput(form: BirthFormState, nameFallback?: string): Promise<KundliInput & { name?: string }> {
  let place = form.place.trim()
  let lat = form.lat.trim() ? Number(form.lat) : undefined
  let lng = form.lng.trim() ? Number(form.lng) : undefined
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    const loc = await resolveLocation({ query: place }).catch(() => null)
    if (loc) {
      place = loc.place || loc.label || place
      lat = loc.lat
      lng = loc.lng
    }
  }
  const input: KundliInput & { name?: string } = {
    dob: htmlDateToDob(form.dobHtml),
    tob: form.tob.trim(),
    tz: form.tz.trim() || '+05:30',
    place,
    name: form.name.trim() || nameFallback,
  }
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    input.lat = lat
    input.lng = lng
  }
  return input
}

function ScoreGauge({ total, max, percent, color }: { total: number; max: number; percent: number; color: string }) {
  const R = 58
  const C = 2 * Math.PI * R
  const frac = Math.max(0, Math.min(1, total / max))
  return (
    <div className="match-gauge" aria-hidden>
      <svg width={150} height={150} className="match-gauge-svg">
        <circle cx={75} cy={75} r={R} className="match-gauge-track" strokeWidth={11} fill="none" />
        <circle
          cx={75}
          cy={75}
          r={R}
          stroke={color}
          strokeWidth={11}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 75 75)"
        />
      </svg>
      <div className="match-gauge-center">
        <span className="match-gauge-total">{total}</span>
        <span className="match-gauge-max">/ {max}</span>
        <span className="match-gauge-pct" style={{ color }}>
          {percent}%
        </span>
      </div>
    </div>
  )
}

function KootaRow({ k, hi }: { k: MatchKoota; hi: boolean }) {
  const ratio = k.max ? k.got / k.max : 0
  const col = barColor(ratio)
  const label = hi && k.labelHi ? k.labelHi : k.label
  const note = hi && k.noteHi ? k.noteHi : k.note
  return (
    <div className="match-koota">
      <div className="match-koota-top">
        <span className="font-semibold">{label}</span>
        <span className="font-display text-lg font-bold" style={{ color: col }}>
          {k.got}
          <span className="text-[var(--sy-text-muted)]">/{k.max}</span>
        </span>
      </div>
      <div className="match-bar-track">
        <div className="match-bar-fill" style={{ width: `${Math.max(6, ratio * 100)}%`, backgroundColor: col }} />
      </div>
      <div className="match-koota-meta">
        {(k.boy || k.girl) && (
          <p className="text-xs text-[var(--sy-text-muted)]">
            {hi ? 'वर' : 'Boy'}: <span className="text-[var(--sy-accent)]">{k.boy || '—'}</span>
            {' · '}
            {hi ? 'वधू' : 'Girl'}: <span className="text-[var(--sy-accent)]">{k.girl || '—'}</span>
          </p>
        )}
        {note ?
          <p className="text-xs leading-relaxed text-[var(--sy-text-muted)]">{note}</p>
        : null}
      </div>
    </div>
  )
}

function PersonCard({
  role,
  form,
  onChange,
  hi,
}: {
  role: 'boy' | 'girl'
  form: BirthFormState
  onChange: (p: Partial<BirthFormState>) => void
  hi: boolean
}) {
  const accent = role === 'boy' ? '#5aa9e0' : '#e07aa9'
  const title =
    role === 'boy' ?
      hi ?
        'वर (लड़का)'
      : 'Groom (Boy)'
    : hi ?
      'वधू (लड़की)'
    : 'Bride (Girl)'
  return (
    <div className="match-person-card">
      <div className="match-person-head">
        <span className="match-person-dot" style={{ backgroundColor: accent }} />
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <BirthDetailsForm form={form} onChange={onChange} showName />
    </div>
  )
}

function MatchResults({ data, hi, onAgain }: { data: MatchResponse; hi: boolean; onAgain: () => void }) {
  const ex = data.explanation
  const vColor = verdictColor(data.milan.verdict)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div ref={resultsRef} className="match-results space-y-4">
      <div className="match-hero" style={{ borderColor: `${vColor}66` }}>
        <p className="match-hero-names">
          {data.people.boy.name || (hi ? 'वर' : 'Boy')}{' '}
          <span className="text-[var(--sy-accent)]">×</span> {data.people.girl.name || (hi ? 'वधू' : 'Girl')}
        </p>
        <ScoreGauge total={data.milan.total} max={data.milan.max} percent={data.milan.percent} color={vColor} />
        <div className="match-verdict-pill" style={{ borderColor: `${vColor}88`, backgroundColor: `${vColor}22` }}>
          <span style={{ color: vColor }}>{verdictLabel(data.milan.verdict, hi)}</span>
        </div>
        {ex?.verdict ?
          <p className="match-hero-verdict">{ex.verdict}</p>
        : null}
        {(data.people.boy.moonSign || data.people.girl.moonSign) && (
          <p className="mt-3 text-sm text-[var(--sy-text-muted)]">
            {data.people.boy.moonSign || data.people.boy.rashiName} · {data.people.girl.moonSign || data.people.girl.rashiName}
            {(data.people.boy.nakshatraName || data.people.girl.nakshatraName) && (
              <>
                <br />
                <span className="text-xs">
                  {data.people.boy.nakshatraName} · {data.people.girl.nakshatraName}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="match-card">
        <h4 className="match-card-title">{hi ? 'मंगल दोष' : 'Mangal (Manglik) Dosha'}</h4>
        <div className="match-mangal-row">
          <div>
            <p className="match-mangal-who">{hi ? 'वर' : 'Boy'}</p>
            <p className="match-mangal-val" style={{ color: data.mangal.boy ? '#e0a92e' : '#3ec77a' }}>
              {data.mangal.boy ? (hi ? 'मांगलिक' : 'Manglik') : hi ? 'नहीं' : 'No'}
            </p>
          </div>
          <div>
            <p className="match-mangal-who">{hi ? 'वधू' : 'Girl'}</p>
            <p className="match-mangal-val" style={{ color: data.mangal.girl ? '#e0a92e' : '#3ec77a' }}>
              {data.mangal.girl ? (hi ? 'मांगलिक' : 'Manglik') : hi ? 'नहीं' : 'No'}
            </p>
          </div>
          <div>
            <p className="match-mangal-who">{hi ? 'मेल' : 'Match'}</p>
            <p className="match-mangal-val" style={{ color: data.mangal.compatible ? '#3ec77a' : '#e06a5a' }}>
              {data.mangal.compatible ? (hi ? '✓ ठीक' : '✓ OK') : hi ? '⚠ ध्यान' : '⚠ Note'}
            </p>
          </div>
        </div>
        {(hi ? data.mangal.noteHi : data.mangal.note) ?
          <p className="match-mangal-note">{hi ? data.mangal.noteHi || data.mangal.note : data.mangal.note}</p>
        : null}
      </div>

      <div className="match-card">
        <h4 className="match-card-title">{hi ? 'अष्टकूट विवरण (8 गुण)' : 'Ashtakoot Breakdown (8 Kootas)'}</h4>
        <div className="mt-3 space-y-3">
          {data.milan.kootas.map((k) => (
            <KootaRow key={k.key} k={k} hi={hi} />
          ))}
        </div>
      </div>

      {ex && (ex.summary || (ex.strengths || []).length || ex.saralVivaran) ?
        <div className="match-card">
          <h4 className="match-card-title">{hi ? 'सरल व्याख्या' : 'Simple Explanation'}</h4>
          {ex.summary ?
            <p className="mt-2 text-sm leading-relaxed">{ex.summary}</p>
          : null}
          {(ex.strengths || []).length ?
            <div className="mt-4">
              <p className="text-xs font-bold text-emerald-600">{hi ? '✓ मज़बूत पक्ष' : '✓ Strengths'}</p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--sy-text-soft)]">
                {ex.strengths!.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          : null}
          {(ex.cautions || []).length ?
            <div className="mt-4">
              <p className="text-xs font-bold text-amber-600">{hi ? '⚠ ध्यान देने योग्य' : '⚠ Things to note'}</p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--sy-text-soft)]">
                {ex.cautions!.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          : null}
          {ex.advice ?
            <div className="match-advice-box">
              <p className="text-sm leading-relaxed">💛 {ex.advice}</p>
            </div>
          : null}
          {ex.aiAssisted ?
            <p className="match-ai-tag">
              {hi ?
                'गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) से'
              : 'Calculated from real planetary positions (Lahiri ayanamsa)'}
            </p>
          : null}
          {ex.saralVivaran ?
            <div className="match-saral-wrap">
              <p className="text-sm font-semibold text-[var(--sy-accent)]">🪔 {hi ? 'सरल भाषा में समझें' : 'In Simple Words'}</p>
              <p className="text-xs text-[var(--sy-text-muted)]">
                {hi ? 'बिना किसी कठिन शब्द के, आसान भाषा में' : 'Easy explanation, no jargon'}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--sy-text-soft)]">{ex.saralVivaran}</p>
            </div>
          : null}
        </div>
      : null}

      <GoldButton type="button" className="sy-btn-secondary w-full !rounded-full" onClick={onAgain}>
        {hi ? 'दूसरा मिलान करें' : 'Match Another'}
      </GoldButton>
    </div>
  )
}

export function KundliMatchAppView() {
  const { hi } = useLang()
  const { form: profileForm } = useBirthProfile()
  const [boy, setBoy] = useState<BirthFormState>(() => ({ ...DEFAULT_BIRTH_FORM, name: '' }))
  const [girl, setGirl] = useState<BirthFormState>(() => ({
    name: '',
    dobHtml: '',
    tob: '',
    tz: DEFAULT_BIRTH_FORM.tz,
    place: '',
    lat: '',
    lng: '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResponse | null>(null)
  const profileSynced = useRef(false)

  useEffect(() => {
    if (profileSynced.current) return
    if (!profileForm.dobHtml?.trim() || !profileForm.place?.trim()) return
    profileSynced.current = true
    setBoy((b) => ({
      ...b,
      ...profileForm,
      name: profileForm.name || b.name,
    }))
  }, [profileForm])

  const run = useCallback(async () => {
    if (!validPerson(boy) || !validPerson(girl)) {
      setError(hi ? 'दोनों के जन्म तिथि, समय और स्थान भरें।' : 'Please fill date, time & place of birth for both.')
      return
    }
    if (busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const [boyBirth, girlBirth] = await Promise.all([
        personToMatchInput(boy, hi ? 'वर' : 'Boy'),
        personToMatchInput(girl, hi ? 'वधू' : 'Girl'),
      ])
      const res = await getKundliMatch(boyBirth, girlBirth)
      setResult(res)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : hi ? 'कृपया दोबारा प्रयास करें।' : 'Please try again.'
      setError(msg)
    } finally {
      setBusy(false)
    }
  }, [boy, girl, busy, hi])

  const reset = () => {
    setResult(null)
    setError(null)
  }

  if (result) {
    return <MatchResults data={result} hi={hi} onAgain={reset} />
  }

  return (
    <div className="match-app">
      <header className="match-intro">
        <span className="match-heart" aria-hidden>
          ♥
        </span>
        <GradientText className="font-display text-2xl font-bold tracking-wide">
          {hi ? 'गुण मिलान' : 'Gun Milan'}
        </GradientText>
        <p className="match-intro-sub">
          {hi ?
            '36 गुण अष्टकूट विधि से शादी की अनुकूलता जानें — असली कुंडली गणना के साथ सरल व्याख्या।'
          : 'Marriage compatibility by the 36-guna Ashtakoot method — real chart calculation with simple explanation.'}
        </p>
      </header>

      <PersonCard role="boy" form={boy} onChange={(p) => setBoy((f) => ({ ...f, ...p }))} hi={hi} />

      <div className="match-heart-divider" aria-hidden>
        <span className="match-divider-line" />
        <span className="match-heart-sm">♥</span>
        <span className="match-divider-line" />
      </div>

      <PersonCard role="girl" form={girl} onChange={(p) => setGirl((f) => ({ ...f, ...p }))} hi={hi} />

      {error ?
        <div className="mt-4">
          <ErrorState message={error} onRetry={run} />
        </div>
      : null}

      <GoldButton type="button" className="mt-6 w-full sm:w-auto" disabled={busy} onClick={run}>
        {busy ? (hi ? 'मिलान हो रहा है…' : 'Matching…') : hi ? 'कुंडली मिलाएँ' : 'Match Kundli'}
      </GoldButton>

      <p className="match-trust">
        🔒{' '}
        {hi ?
          'गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) से · विवरण सुरक्षित।'
        : 'Calculated from real planetary positions (Lahiri ayanamsa) · details kept private.'}
      </p>
    </div>
  )
}
