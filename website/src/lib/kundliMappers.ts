import type { ApiPlanet } from '@/lib/api'
import type { KundliRow } from '@/data/kundliDemo'
import {
  aAstroText,
  aDosha,
  aNakshatra,
  aPhrase,
  aPlanet,
  aSign,
  aTag,
  aYoga,
  aYogaDetail,
  type AstroLang,
} from '@/lib/astroLabels'

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

const SIGN_GLYPH: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस']

export function parseStd(std: string): number | null {
  const p = String(std).trim().split(/\s+/)
  const dmy = (p[1] || '').split('/')
  if (dmy.length !== 3) return null
  const [hh, mm] = (p[0] || '00:00').split(':').map(Number)
  const t = new Date(Number(dmy[2]), (Number(dmy[1]) || 1) - 1, Number(dmy[0]) || 1, hh || 0, mm || 0).getTime()
  return Number.isFinite(t) ? t : null
}

export function fmtDob(ddmmyyyy: string, lang: AstroLang) {
  const [d, m, y] = ddmmyyyy.split('-')
  const mon = lang === 'hi' ? MON_HI[(Number(m) || 1) - 1] : MON[(Number(m) || 1) - 1]
  return `${d} ${mon} ${y}`
}

export function fmtMonYr(std: string, lang: AstroLang) {
  const p = String(std).split(' ')
  const dmy = (p[1] || '').split('/')
  if (dmy.length !== 3) return lang === 'hi' ? aAstroText(std, lang) : std
  const mon = lang === 'hi' ? MON_HI[(Number(dmy[1]) || 1) - 1] : MON[(Number(dmy[1]) || 1) - 1]
  return `${mon} ${dmy[2]}`
}

const prettyName = (n: string) => n.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\d+[A-Z]?$/, '').trim()

export function dashaToRows(
  dasha: { lord: string; start: string; end: string; durationText: string }[],
  lang: AstroLang,
): KundliRow[] {
  const hi = lang === 'hi'
  return dasha.map((d, i) => ({
    glyph: GLYPH[d.lord] || '✦',
    name: hi ? aPlanet(d.lord, lang) : d.lord.toUpperCase(),
    detail: `${fmtMonYr(d.start, lang)} – ${fmtMonYr(d.end, lang)} · ${hi ? aAstroText(d.durationText.replace(/years?/i, 'वर्ष').replace(/months?/i, 'माह'), lang) : d.durationText}`,
    tag: i === 0 ? (hi ? 'अभी' : 'Now') : aTag('Upcoming', lang),
    strength: i === 0 ? 'solid' : 'plain',
    highlight: i === 0,
  }))
}

export function yogaToRows(yogas: { name: string; description: string }[], lang: AstroLang): KundliRow[] {
  const hi = lang === 'hi'
  return yogas.map((y) => ({
    glyph: '✦',
    name: hi ? aYoga(prettyName(y.name), lang) : prettyName(y.name),
    detail: hi
      ? aAstroText(aYogaDetail(y.description || 'Beneficial yoga present in your chart', lang), lang)
      : aAstroText(y.description || 'Beneficial yoga present in your chart', lang),
    tag: aTag('Present', lang),
    strength: 'soft',
  }))
}

export function doshaToRows(
  doshas: { name: string; present: boolean; detail: string; tag: string }[],
  lang: AstroLang,
): KundliRow[] {
  const hi = lang === 'hi'
  const G: Record<string, string> = { 'Mangal Dosha': '♂', 'Kaal Sarp Dosha': '☊', 'Sade Sati': '♄' }
  return doshas.map((d) => ({
    glyph: G[d.name] || '☉',
    name: hi ? aDosha(d.name, lang) : d.name,
    detail: hi ? aAstroText(aPhrase(d.detail, lang), lang) : aAstroText(d.detail, lang),
    tag: aTag(d.tag || (d.present ? 'Present' : 'Clear'), lang),
    strength: d.present ? 'plain' : 'solid',
  }))
}

export function toPlanetRows(planets: ApiPlanet[], lang: AstroLang): KundliRow[] {
  const hi = lang === 'hi'
  return planets
    .filter((p) => p.sign)
    .map((p) => {
      const rawNakshatra = (p.nakshatra || '').split(' - ')[0]
      const house = hi ? aAstroText((p.house || '').replace(/House/i, 'House '), lang) : (p.house || '').replace('House', 'House ')
      return {
        signGlyph: p.sign ? SIGN_GLYPH[p.sign] : undefined,
        glyph: GLYPH[p.planet] || '✦',
        name: hi ? aPlanet(p.planet, lang) : p.planet.toUpperCase(),
        detail: `${house} · ${hi ? aSign(p.sign, lang) : p.sign} · ${(p.degreeInSign || '').split("'")[0]}`,
        tag:
          p.isRetrograde === 'True'
            ? hi
              ? 'वक्री'
              : 'Retrograde'
            : p.isCombust === 'True'
              ? hi
                ? 'अस्त'
                : 'Combust'
              : rawNakshatra
                ? aNakshatra(rawNakshatra, lang)
                : hi
                  ? 'मार्गी'
                  : 'Direct',
        strength: p.isRetrograde === 'True' ? 'soft' : 'plain',
      }
    })
}

export function currentDashaFromApi(
  dasha: { lord: string; start: string; end: string }[] | undefined,
  lang: AstroLang,
) {
  if (!dasha?.length) return null
  const d0 = dasha[0]
  const s0 = parseStd(d0.start)
  const e0 = parseStd(d0.end)
  const progress = s0 != null && e0 != null && e0 > s0 ? Math.min(1, Math.max(0, (Date.now() - s0) / (e0 - s0))) : null
  const hi = lang === 'hi'
  return {
    title: `${hi ? aPlanet(d0.lord, lang) : d0.lord} ${hi ? 'महादशा' : 'Mahadasha'}`,
    range: `${fmtMonYr(d0.start, lang)} – ${fmtMonYr(d0.end, lang)}`,
    lord: d0.lord,
    progress,
  }
}

export function localizeDemoRows(rows: KundliRow[], lang: AstroLang, kind: 'planet' | 'dasha' | 'yoga' | 'dosha'): KundliRow[] {
  const hi = lang === 'hi'
  if (!hi) return rows
  return rows.map((r) => ({
    ...r,
    name:
      kind === 'dosha'
        ? aDosha(r.name, lang)
        : kind === 'yoga'
          ? aYoga(r.name, lang)
          : kind === 'dasha'
            ? aPlanet(r.name.replace(/\s.*/, ''), lang) || r.name
            : aPlanet(r.name, lang) || r.name,
    detail: aAstroText(r.detail, lang),
    tag: aTag(r.tag, lang),
  }))
}
