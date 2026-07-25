import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BirthDetailsForm, SyField, SyInput } from '@/components/feature/BirthDetailsForm'
import { GoldButton } from '@/components/ui/GoldButton'
import { GradientText } from '@/components/ui/GradientText'
import { ErrorState } from '@/components/ui/ErrorState'
import { findMuhurat, resolveLocation, type MuhuratItem, type MuhuratResult } from '@/lib/api'
import { DEFAULT_BIRTH_FORM, htmlDateToDob, type BirthFormState } from '@/lib/birthForm'
import { aSign, type AstroLang } from '@/lib/astroLabels'
import { naamRashi } from '@/lib/naamRashi'
import { muhuratCatByKey } from '@/data/muhuratCategories'
import { useBirthProfile } from '@/hooks/useBirthProfile'
import { useLang } from '@/i18n/LangProvider'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस']

type PeriodSel = 'r3' | 'r6' | 'year' | number

function fmtDobHtml(html: string) {
  const [y, m, d] = html.split('-')
  if (!y || !m || !d) return html
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
}

function birthPayload(form: BirthFormState) {
  if (!form.dobHtml?.trim()) return null
  const lat = form.lat.trim() ? Number(form.lat) : undefined
  const lng = form.lng.trim() ? Number(form.lng) : undefined
  return {
    date: htmlDateToDob(form.dobHtml).replace(/-/g, '/'),
    time: form.tob || undefined,
    place: form.place || undefined,
    lat,
    lng,
    tz: form.tz || '+05:30',
  }
}

function googleCalendarUrl(item: MuhuratItem, title: string) {
  const win = item.time.abhijit || item.time.windows?.[0]
  if (!win?.start || !item.date) return null
  const base = item.date.includes('/') ? item.date.split('/') : item.dmy?.split('/') || []
  let y = ''
  let m = ''
  let d = ''
  if (base.length === 3) {
    if (base[0].length === 4) {
      ;[y, m, d] = base
    } else {
      ;[d, m, y] = base
    }
  }
  if (!y || !m || !d) return null
  const pad = (s: string) => s.padStart(2, '0')
  const startParts = win.start.match(/(\d+):(\d+)/)
  if (!startParts) return null
  const endParts = (win.end || win.start).match(/(\d+):(\d+)/)
  const sh = pad(startParts[1])
  const sm = pad(startParts[2])
  const eh = endParts ? pad(endParts[1]) : sh
  const em = endParts ? pad(endParts[2]) : sm
  const start = `${y}${pad(m)}${pad(d)}T${sh}${sm}00`
  const end = `${y}${pad(m)}${pad(d)}T${eh}${em}00`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function MuhuratItemCard({ item, hi, highlight, calTitle }: { item: MuhuratItem; hi: boolean; highlight?: boolean; calTitle?: string }) {
  const label = item.dmy || item.date
  return (
    <div className={`sy-stat-tile ${highlight ? 'choghadiya-row--current' : ''}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-[var(--sy-accent)]">
          {item.score} · {hi ? item.rating.hi : item.rating.en}
        </p>
      </div>
      <p className="text-sm text-[var(--sy-text-soft)]">
        {hi ? item.weekdayHi || item.weekday : item.weekday} · ☀ {item.sunrise} · 🌙 {item.sunset}
      </p>
      {item.tithi ?
        <p className="mt-1 text-xs text-[var(--sy-text-muted)]">
          {hi ? item.tithi.hi || item.tithi.name : item.tithi.name}
          {item.nakshatra ? ` · ${hi ? item.nakshatra.hi || item.nakshatra.name : item.nakshatra.name}` : ''}
        </p>
      : null}
      {item.time.abhijit ?
        <p className="mt-2 text-sm font-medium">
          Abhijit: {item.time.abhijit.start} – {item.time.abhijit.end}
        </p>
      : null}
      {item.time.windows?.length ?
        <ul className="mt-2 text-sm text-[var(--sy-text-soft)]">
          {item.time.windows.slice(0, 4).map((w, i) => (
            <li key={i}>
              {w.name ? `${w.name}: ` : ''}
              {w.start} – {w.end}
            </li>
          ))}
        </ul>
      : null}
      {item.ok === false && item.reject ?
        <p className="mt-2 text-sm text-amber-700">{hi ? item.reject.hi : item.reject.en}</p>
      : null}
      {calTitle && item.ok !== false ? (() => {
        const href = googleCalendarUrl(item, calTitle)
        return href ?
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-semibold text-[var(--sy-accent)] hover:underline"
            >
              {hi ? '📅 Google Calendar में जोड़ें' : '📅 Add to Google Calendar'}
            </a>
          : null
      })() : null}
    </div>
  )
}

export function MuhuratFinderAppView({ categoryKey }: { categoryKey: string }) {
  const { hi } = useLang()
  const lang: AstroLang = hi ? 'hi' : 'en'
  const cat = muhuratCatByKey(categoryKey)
  const req = cat?.req || { name: 'optional' as const, birth: 'optional' as const, couple: false }
  const { form: profile } = useBirthProfile()

  const [placeText, setPlaceText] = useState('')
  const [loc, setLoc] = useState<{ place?: string; lat?: number; lng?: number } | null>(null)
  const [sel, setSel] = useState<PeriodSel>('r3')
  const [pickedHtml, setPickedHtml] = useState('')
  const [name, setName] = useState('')
  const [birth1, setBirth1] = useState<BirthFormState>({ ...DEFAULT_BIRTH_FORM })
  const [birth2, setBirth2] = useState<BirthFormState>({ ...DEFAULT_BIRTH_FORM, name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MuhuratResult | null>(null)

  useEffect(() => {
    if (profile.place?.trim()) {
      setPlaceText(profile.place)
      const lat = profile.lat.trim() ? Number(profile.lat) : undefined
      const lng = profile.lng.trim() ? Number(profile.lng) : undefined
      setLoc({ place: profile.place, lat, lng })
    }
    if (profile.dobHtml && profile.place) {
      setBirth1((b) => ({ ...b, ...profile }))
    }
    if (profile.name) setName(profile.name)
  }, [profile.place, profile.dobHtml, profile.lat, profile.lng, profile.tob, profile.name])

  const rashi = useMemo(() => naamRashi(name), [name])
  const months = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 9 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      return { idx: i, month: d.getMonth() + 1, year: d.getFullYear(), label: `${(hi ? MON_HI : MON)[d.getMonth()]} ${d.getFullYear()}` }
    })
  }, [hi])

  const accuracy =
    (birth1.dobHtml && birth1.place) || (req.name !== 'none' && rashi) ? 100 : 96

  const catTitle = hi ? cat?.name.hi || 'मुहूर्त' : cat?.name.en || 'Muhurat'

  const onFind = async () => {
    setError(null)
    if (!(loc?.place || placeText.trim())) {
      setError(hi ? 'कृपया पहले स्थान चुनें।' : 'Please choose a location first.')
      return
    }
    if (pickedHtml) {
      const p = new Date(pickedHtml)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (p < today) {
        setError(hi ? 'कृपया आज या आगे की तारीख चुनें।' : 'Please pick today or a future date.')
        return
      }
    }
    setLoading(true)
    setResult(null)
    try {
      let place = loc?.place || placeText.trim()
      let lat = loc?.lat
      let lng = loc?.lng
      if (lat == null || lng == null) {
        const r = await resolveLocation({ query: place }).catch(() => null)
        if (r) {
          place = r.place || r.label || place
          lat = r.lat
          lng = r.lng
          setLoc({ place, lat, lng })
        }
      }

      let windowPayload: Record<string, string | number> = {}
      if (pickedHtml) {
        const td = fmtDobHtml(pickedHtml)
        windowPayload = { targetDate: td, toDate: td }
      } else if (sel === 'r3' || sel === 'r6') {
        const end = new Date()
        end.setMonth(end.getMonth() + (sel === 'r3' ? 3 : 6))
        const dd = String(end.getDate()).padStart(2, '0')
        const mm = String(end.getMonth() + 1).padStart(2, '0')
        windowPayload = { toDate: `${dd}/${mm}/${end.getFullYear()}` }
      } else if (sel === 'year') {
        const y = new Date().getFullYear()
        windowPayload = { toDate: `31/12/${y}` }
      } else {
        const mo = months[sel as number]
        const last = new Date(mo.year, mo.month, 0).getDate()
        windowPayload = {
          month: mo.month,
          year: mo.year,
          toDate: `${String(last).padStart(2, '0')}/${String(mo.month).padStart(2, '0')}/${mo.year}`,
        }
      }

      const res = await findMuhurat({
        category: categoryKey,
        ...windowPayload,
        place,
        lat,
        lng,
        tz: '+05:30',
        nameRashi: req.name !== 'none' ? rashi : null,
        birth: birthPayload(birth1),
        birth2: req.couple ? birthPayload(birth2) : null,
      })
      setResult(res)
      if (!res.items.length && !res.target) {
        setError(hi ? 'इस अवधि में कोई शुभ मुहूर्त नहीं मिला — आगे का महीना चुनें।' : 'No auspicious muhurat here — try a later month.')
      }
    } catch {
      setError(hi ? 'मुहूर्त गणना नहीं हो पाई — इंटरनेट जाँचें।' : 'Could not compute — check internet.')
    } finally {
      setLoading(false)
    }
  }

  if (!cat) {
    return (
      <ErrorState
        message={hi ? 'श्रेणी नहीं मिली।' : 'Category not found.'}
        onRetry={() => {}}
      />
    )
  }

  const askQ =
    result?.best ?
      hi ?
        `${catTitle} के लिए ${placeText} में मुहूर्त — सर्वश्रेष्ठ ${result.best.dmy || result.best.date}। क्या यह सही है और क्या ध्यान रखूँ?`
      : `Muhurat for ${catTitle} in ${placeText} — best ${result.best.dmy || result.best.date}. Is this right and what should I note?`
    : ''

  return (
    <div className="muhurat-finder max-w-lg mx-auto">
      <div className="muhurat-cat-hero" style={{ background: `linear-gradient(90deg, ${cat.colors[0]}, ${cat.colors[1]})` }}>
        <span className="text-2xl">{cat.emoji}</span>
        <div>
          <p className="font-display font-bold text-[#1a1206]">{catTitle}</p>
          <p className="text-xs text-[#1a1206]/80">{hi ? cat.blurb.hi : cat.blurb.en}</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <SyField label={hi ? 'स्थान (कहाँ कार्य होगा) *' : 'Location (where the event is) *'}>
          <SyInput
            value={placeText}
            onChange={(e) => {
              setPlaceText(e.target.value)
              setLoc(null)
            }}
            placeholder={hi ? 'शहर / गाँव' : 'City / village'}
          />
        </SyField>

        <div>
          <p className="sy-field-label mb-2">{hi ? 'कब का मुहूर्त *' : 'When *'}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['r3', hi ? 'अगले 3 महीने' : 'Next 3 months'],
                ['r6', hi ? 'अगले 6 महीने' : 'Next 6 months'],
                ['year', hi ? '⭐ पूरे साल' : '⭐ Entire Year'],
              ] as const
            ).map(([v, lbl]) => (
              <button
                key={v}
                type="button"
                className={`kundli-tab-pill text-xs ${!pickedHtml && sel === v ? 'kundli-tab-pill--on' : ''}`}
                onClick={() => {
                  setPickedHtml('')
                  setSel(v)
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
          <p className="my-2 text-center text-xs text-[var(--sy-text-muted)]">
            {hi ? '— या कोई खास तारीख —' : '— or a specific date —'}
          </p>
          <SyInput type="date" value={pickedHtml} onChange={(e) => setPickedHtml(e.target.value)} />
          <p className="my-2 text-center text-xs text-[var(--sy-text-muted)]">
            {hi ? '— या कोई एक महीना —' : '— or a single month —'}
          </p>
          <div className="flex flex-wrap gap-2">
            {months.map((mo) => (
              <button
                key={mo.idx}
                type="button"
                className={`kundli-tab-pill text-xs ${!pickedHtml && sel === mo.idx ? 'kundli-tab-pill--on' : ''}`}
                onClick={() => {
                  setPickedHtml('')
                  setSel(mo.idx)
                }}
              >
                {mo.label}
              </button>
            ))}
          </div>
        </div>

        {(req.name !== 'none' || req.birth !== 'none') && (
          <div className="sy-stat-tile space-y-3">
            <GradientText className="text-sm font-bold">
              {req.name !== 'none' ?
                hi ?
                  '🙏 नाम से मुहूर्त देखें'
                : '🙏 See Muhurat by Name'
              : hi ?
                '🙏 जन्म विवरण से मुहूर्त'
              : '🙏 See Muhurat by Birth Details'}
            </GradientText>
            <div className="match-bar-track">
              <div className="match-bar-fill" style={{ width: `${accuracy}%`, backgroundColor: 'var(--sy-accent)' }} />
            </div>
            <p className="text-xs text-[var(--sy-text-muted)]">
              {hi ? 'सटीकता' : 'Accuracy'}: {accuracy}%
            </p>
            {req.name !== 'none' ?
              <>
                <SyField label={hi ? 'नाम (चंद्रबल हेतु)' : 'Name (for Chandrabal)'}>
                  <SyInput value={name} onChange={(e) => setName(e.target.value)} />
                </SyField>
                {name.trim() ?
                  <p className="text-xs text-[var(--sy-accent)]">
                    {rashi ?
                      `${hi ? 'नाम राशि' : 'Naam Rashi'}: ${aSign(rashi, lang)} 🌙`
                    : hi ?
                      'इस अक्षर की राशि नहीं मिली'
                    : 'Could not map this letter'}
                  </p>
                : null}
              </>
            : null}
            {req.birth !== 'none' ?
              <>
                <p className="text-sm font-semibold">{req.couple ? (hi ? 'वर का जन्म' : 'Groom birth') : hi ? 'जन्म विवरण' : 'Birth details'}</p>
                <BirthDetailsForm form={birth1} onChange={(p) => setBirth1((f) => ({ ...f, ...p }))} />
                {req.couple ?
                  <>
                    <p className="text-sm font-semibold">{hi ? 'वधू का जन्म' : 'Bride birth'}</p>
                    <BirthDetailsForm form={birth2} onChange={(p) => setBirth2((f) => ({ ...f, ...p }))} showName />
                  </>
                : null}
              </>
            : null}
          </div>
        )}

        {error ?
          <p className="text-sm text-red-600">{error}</p>
        : null}

        <GoldButton type="button" className="w-full" disabled={loading} onClick={onFind}>
          {loading ? (hi ? 'गणना…' : 'Calculating…') : hi ? 'शुभ मुहूर्त खोजें' : 'Find Shubh Muhurat'}
        </GoldButton>
      </div>

      {result ?
        <div className="mt-8 space-y-4">
          {result.target ?
            <>
              <p className="text-sm font-bold text-[var(--sy-accent)]">{hi ? 'आपकी चुनी तारीख' : 'Your chosen date'}</p>
              <MuhuratItemCard item={result.target} hi={hi} highlight={!!result.target.ok} calTitle={catTitle} />
            </>
          : null}
          {result.best ?
            <>
              <p className="text-sm font-bold text-[var(--sy-accent)]">{hi ? 'सर्वश्रेष्ठ मुहूर्त' : 'Best muhurat'}</p>
              <MuhuratItemCard item={result.best} hi={hi} highlight calTitle={catTitle} />
            </>
          : null}
          {result.scanned ? (
            <p className="text-center text-xs text-[var(--sy-text-muted)]">
              {hi ? `${result.scanned} दिन स्कैन · ` : `${result.scanned} days scanned · `}
              {result.items.length} {hi ? 'विकल्प' : 'options'}
            </p>
          ) : null}
          {result.items.slice(0, 6).map((item) => (
            <MuhuratItemCard key={item.dmy || item.date} item={item} hi={hi} calTitle={catTitle} />
          ))}
          {askQ ?
            <Link to={`/ai-astrologer?q=${encodeURIComponent(askQ)}`}>
              <GoldButton type="button" className="w-full">
                {hi ? 'ज्योतिषी से पूछें' : 'Ask the astrologer'}
              </GoldButton>
            </Link>
          : null}
          <p className="text-center text-xs text-[var(--sy-text-muted)]">
            🔒 {hi ? 'Lahiri अयनांश · वास्तविक पंचांग इंजन' : 'Lahiri ayanamsa · real panchang engine'}
          </p>
        </div>
      : null}
    </div>
  )
}
