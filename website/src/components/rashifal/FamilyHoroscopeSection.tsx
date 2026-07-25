import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { RashifalSectionTitle } from '@/components/rashifal/RashifalBlocks'
import { GoldButton } from '@/components/ui/GoldButton'
import { SyField, SyInput } from '@/components/feature/BirthDetailsForm'
import { getPersonalizedHoroscope, resolveLocation, type DailyPrediction } from '@/lib/api'
import { htmlDateToDob } from '@/lib/birthForm'
import { useLang } from '@/i18n/LangProvider'

function to24h(t: string): string | null {
  const m = String(t || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) {
    const hm = t.match(/^(\d{1,2}):(\d{2})$/)
    if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`
    return null
  }
  let h = Number(m[1])
  const min = m[2]
  const ap = (m[3] || '').toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}`
}

export function FamilyHoroscopeSection() {
  const { hi } = useLang()
  const [name, setName] = useState('')
  const [dobHtml, setDobHtml] = useState('2000-01-01')
  const [tob, setTob] = useState('06:42')
  const [place, setPlace] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const tob24 = to24h(tob)
      if (!tob24) throw new Error(hi ? 'जन्म समय सही भरें।' : 'Enter a valid birth time.')
      if (!place.trim()) throw new Error(hi ? 'जन्म स्थान भरें।' : 'Enter birth place.')
      let lat = coords?.lat
      let lng = coords?.lng
      let finalPlace = place.trim()
      if (lat == null) {
        const r = await resolveLocation({ query: place.trim() }).catch(() => null)
        if (r) {
          finalPlace = r.place || r.label || finalPlace
          lat = r.lat
          lng = r.lng
        }
      }
      return getPersonalizedHoroscope({
        name: name.trim() || (hi ? 'परिवार सदस्य' : 'Family Member'),
        dob: htmlDateToDob(dobHtml),
        tob: tob24,
        tz: '+05:30',
        place: finalPlace,
        lat,
        lng,
      })
    },
  })

  const result: DailyPrediction | null = mutation.data?.horoscope ?? null

  return (
    <section className="sy-stat-tile mt-6">
      <RashifalSectionTitle label={hi ? 'परिवार / अन्य व्यक्ति' : 'Family / other person'} />
      <p className="font-display text-lg font-semibold">{hi ? 'किसी और का व्यक्तिगत राशिफल' : "Someone else's personalized horoscope"}</p>
      <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
        {hi ?
          'जन्म तिथि, समय और स्थान भरें — परिणाम उसी व्यक्ति की कुंडली और पंचांग से बनेगा।'
        : 'Enter birth date, time, and place. Result uses that person’s chart and panchang.'}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SyField label={hi ? 'नाम' : 'Name'}>
          <SyInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Sharma" />
        </SyField>
        <SyField label={hi ? 'जन्म तिथि' : 'Date of birth'}>
          <SyInput type="date" value={dobHtml} onChange={(e) => setDobHtml(e.target.value)} />
        </SyField>
        <SyField label={hi ? 'जन्म समय' : 'Time of birth'}>
          <SyInput value={tob} onChange={(e) => setTob(e.target.value)} placeholder="06:42 AM" />
        </SyField>
        <SyField label={hi ? 'जन्म स्थान' : 'Birth place'}>
          <SyInput
            value={place}
            onChange={(e) => {
              setPlace(e.target.value)
              setCoords(null)
            }}
            placeholder={hi ? 'जोधपुर, राजस्थान' : 'Jaipur, Rajasthan'}
            onBlur={async () => {
              if (!place.trim()) return
              const r = await resolveLocation({ query: place.trim() }).catch(() => null)
              if (r) {
                setCoords({ lat: r.lat, lng: r.lng })
                if (r.place) setPlace(r.place)
              }
            }}
          />
        </SyField>
      </div>
      {err || mutation.isError ? (
        <p className="mt-2 text-sm text-red-500">{err || (hi ? 'राशिफल नहीं बन पाया।' : 'Could not generate horoscope.')}</p>
      ) : null}
      <GoldButton
        type="button"
        className="mt-4"
        disabled={mutation.isPending}
        onClick={() => {
          setErr(null)
          mutation.mutate(undefined, {
            onError: (e) => setErr(e instanceof Error ? e.message : String(e)),
          })
        }}
      >
        {mutation.isPending ?
          hi ?
            'बना रहे हैं…'
          : 'Generating…'
        : hi ?
          'व्यक्तिगत राशिफल बनाएं'
        : 'Generate personal horoscope'}
      </GoldButton>
      {mutation.isPending ? (
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {hi ? 'कुंडली और पंचांग से गणना हो रही है…' : 'Calculating from chart and panchang…'}
        </p>
      ) : null}
      {result ? <OtherResult name={name} data={result} hi={hi} /> : null}
    </section>
  )
}

function OtherResult({ name, data, hi }: { name: string; data: DailyPrediction; hi: boolean }) {
  const basis = data.basis as { moonSign?: string; ascendant?: string } | undefined
  return (
    <div className="rashifal-advice-box mt-4 rounded-2xl border p-4">
      <p className="text-xs font-bold uppercase text-[var(--sy-accent)]">{name.trim() || (hi ? 'व्यक्ति' : 'Person')}</p>
      <p className="font-display mt-1 text-lg font-semibold">{data.headline || (hi ? 'व्यक्तिगत मार्गदर्शन' : 'Personal guidance')}</p>
      <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{data.overall}</p>
      {data.detailedSummary ? <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{data.detailedSummary}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {basis?.moonSign ? <span className="rounded-full border px-2 py-1">{hi ? 'चंद्र' : 'Moon'}: {basis.moonSign}</span> : null}
        {basis?.ascendant ? <span className="rounded-full border px-2 py-1">{hi ? 'लग्न' : 'Lagna'}: {basis.ascendant}</span> : null}
        {data.luckyColour ? <span className="rounded-full border px-2 py-1">{data.luckyColour}</span> : null}
      </div>
      {data.advice ? (
        <p className="mt-3 flex gap-2 rounded-lg bg-emerald-500/10 p-2 text-sm">
          <span className="text-emerald-600">✓</span>
          {data.advice}
        </p>
      ) : null}
    </div>
  )
}
