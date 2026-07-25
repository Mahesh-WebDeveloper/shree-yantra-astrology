import type { GocharResponse } from '@/lib/api'
import { aPlanet, aSign } from '@/lib/astroLabels'
import { AppSection, SaralVivaranBlock } from '@/components/feature/BirthDetailsCollapsible'
import { useLang } from '@/i18n/LangProvider'

const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

const MAJOR = ['Saturn', 'Jupiter', 'Rahu', 'Ketu']

function TransitRow({
  t,
  note,
}: {
  t: GocharResponse['transits'][number]
  note?: string
}) {
  const { hi, lang } = useLang()
  const retro = t.isRetrograde === 'True'
  return (
    <div className="gochar-t-row">
      <span className="gochar-t-glyph">{GLYPH[t.planet] || '✦'}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {aPlanet(t.planet, lang)}
          {retro ? <span className="text-amber-600"> ℞ {hi ? 'वक्री' : 'Retro'}</span> : null}
        </p>
        <p className="text-sm text-[var(--sy-accent)]">
          {hi ? `अभी ${aSign(t.sign, lang)} में` : `now in ${aSign(t.sign, lang)}`}
        </p>
        {note ? <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{note}</p> : null}
      </div>
      {t.houseFromMoon != null ? (
        <div className="gochar-house-chip">
          <span className="gochar-house-num">{t.houseFromMoon}</span>
          <span className="gochar-house-lbl">{hi ? 'भाव' : 'house'}</span>
        </div>
      ) : null}
    </div>
  )
}

export function GocharAppView({ data }: { data: GocharResponse }) {
  const { hi, lang } = useLang()
  const ss = data.sadeSati
  const ssColor = ss?.active ? '#e06a5a' : ss?.dhaiya ? '#e0a92e' : '#3ec77a'
  const major = (data.transits || []).filter((x) => MAJOR.includes(x.planet))
  const ex = data.explanation
  const exText = (planet: string) => (ex?.highlights || []).find((h) => h.planet === planet)?.text

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'आज का गोचर' : "Today's Transits"}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {data.date}
          {data.natalMoonSign ? ` · ${hi ? 'चंद्र राशि' : 'Moon'}: ${aSign(data.natalMoonSign, lang)}` : ''}
        </p>
      </div>

      <div className="gochar-ss-card" style={{ borderColor: `${ssColor}77`, backgroundColor: `${ssColor}14` }}>
        <p className="gochar-ss-label" style={{ color: ssColor }}>
          {hi ? 'शनि साढ़े साती' : 'Shani Sade Sati'}
        </p>
        <p className="font-medium">
          {ss?.active
            ? hi
              ? `सक्रिय — ${ss.phaseHi || ss.phase}`
              : `Active — ${ss.phase}`
            : ss?.dhaiya
              ? hi
                ? ss.phaseHi || 'ढैय्या (छोटी पनौती)'
                : ss.phase || 'Dhaiya (Small Panoti)'
              : hi
                ? 'अभी साढ़े साती नहीं — शनि अनुकूल'
                : 'No Sade Sati right now — Saturn is clear'}
        </p>
      </div>

      {ex?.summary ? (
        <AppSection title={hi ? 'अभी आपके लिए' : 'For you right now'}>
          <p className="text-sm leading-relaxed">{ex.summary}</p>
        </AppSection>
      ) : null}

      {major.length ? (
        <AppSection title={hi ? 'मुख्य गोचर' : 'Major Transits'}>
          <div className="space-y-3">
            {major.map((tp) => (
              <TransitRow key={tp.planet} t={tp} note={exText(tp.planet)} />
            ))}
          </div>
        </AppSection>
      ) : null}

      <AppSection title={hi ? 'सभी ग्रह अभी' : 'All Planets Now'}>
        <p className="text-xs text-[var(--sy-text-muted)]">
          {hi ? 'भाव = आपकी चंद्र राशि से गिनती' : 'house = counted from your Moon sign'}
        </p>
        <div className="mt-3 space-y-2">
          {(data.transits || []).map((tp) => (
            <TransitRow key={tp.planet} t={tp} />
          ))}
        </div>
      </AppSection>

      {ex?.advice ? (
        <div className="sy-stat-tile border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm leading-relaxed">💛 {ex.advice}</p>
        </div>
      ) : null}

      <SaralVivaranBlock text={ex?.saralVivaran} />

      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        🔒{' '}
        {hi
          ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) · चंद्र-गोचर विधि।'
          : 'Calculated from real planetary positions (Lahiri ayanamsa) · Moon-based gochar.'}
      </p>
    </div>
  )
}
