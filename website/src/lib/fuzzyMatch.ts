/**
 * Bilingual fuzzy scorer for observance catalog — verbatim port of mobile/src/lib/fuzzyMatch.ts
 * (must stay in sync with backend/src/utils/fuzzyMatch.js).
 */
const CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'ळ': 'l',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'ड़': 'r', 'ढ़': 'rh', 'क़': 'k', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'j', 'फ़': 'f',
}
const MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o', 'ॅ': 'e',
}
const VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
}
const DIGITS: Record<string, string> = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' }
const VIRAMA = '्'
const NUKTA = '़'
const ANUSVARA = ['ं', 'ँ', 'ः']
const DIACRITICS: Record<string, string> = {
  'ā': 'a', 'á': 'a', 'à': 'a', 'ä': 'a', 'ī': 'i', 'í': 'i', 'ū': 'u', 'ú': 'u',
  'ṛ': 'r', 'ṟ': 'r', 'ś': 's', 'ṣ': 's', 'ṇ': 'n', 'ñ': 'n', 'ṅ': 'n', 'ṃ': 'm',
  'ṭ': 't', 'ḍ': 'd', 'ḥ': 'h', 'ē': 'e', 'é': 'e', 'ō': 'o', 'ó': 'o', 'ç': 'c',
}

export function transliterate(input: string): string {
  const s = String(input || '')
  let out = ''
  let pendingA = false
  const flush = () => { if (pendingA) { out += 'a'; pendingA = false } }
  for (let i = 0; i < s.length; i += 1) {
    let ch = s[i]
    if (ch === NUKTA) continue
    const pair = ch + s[i + 1]
    if (CONSONANTS[pair]) { ch = pair; i += 1 }
    if (CONSONANTS[ch]) { flush(); out += CONSONANTS[ch]; pendingA = true; continue }
    if (MATRAS[ch]) { pendingA = false; out += MATRAS[ch]; continue }
    if (ch === VIRAMA) { pendingA = false; continue }
    if (VOWELS[ch]) { flush(); out += VOWELS[ch]; continue }
    if (ANUSVARA.indexOf(ch) >= 0) { flush(); out += ch === 'ः' ? 'h' : 'n'; continue }
    if (DIGITS[ch]) { flush(); out += DIGITS[ch]; continue }
    flush()
    out += ch
  }
  flush()
  return out
}

export function canonical(input: string): string {
  let s = transliterate(input).toLowerCase()
  s = s.replace(/[^a-z0-9 ]/g, (c) => DIACRITICS[c] || ' ')
  s = s.replace(/\s+/g, ' ').trim()
  s = s
    .replace(/chh/g, 'ch')
    .replace(/sh/g, 's')
    .replace(/ph/g, 'f')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/(.)\1+/g, '$1')
  return s.trim()
}

const CANON_CACHE = new Map<string, string>()
const CANON_CACHE_MAX = 4000
function canonCached(s: string): string {
  const key = String(s || '')
  const hit = CANON_CACHE.get(key)
  if (hit !== undefined) return hit
  const value = canonical(key)
  if (CANON_CACHE.size >= CANON_CACHE_MAX) CANON_CACHE.clear()
  CANON_CACHE.set(key, value)
  return value
}

const compact = (s: string) => canonCached(s).replace(/ /g, '')
const tokens = (s: string) => canonCached(s).split(' ').filter(Boolean)

export function levenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev: number[] = new Array(b.length + 1)
  const cur: number[] = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j += 1) prev[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i
    let rowMin = cur[0]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j += 1) prev[j] = cur[j]
  }
  return prev[b.length]
}

const budget = (len: number) => (len <= 5 ? 1 : len <= 8 ? 2 : 3)

const commonPrefix = (a: string, b: string) => {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1
  return i
}

function tokenScore(q: string, c: string): number {
  if (!q || !c) return 0
  if (q === c) return 100
  const short = q.length < c.length ? q : c
  const long = q.length < c.length ? c : q
  if (short.length >= 3 && long.indexOf(short) === 0) return 82 - Math.min(20, (long.length - short.length) * 3)
  if (short.length >= 4 && long.indexOf(short) > 0) return 62
  const max = budget(Math.min(q.length, c.length))
  const d = levenshtein(q, c, max)
  if (d <= max) return 80 - d * 12
  const cp = commonPrefix(q, c)
  if (cp >= 3 && short.length >= 4 && cp >= short.length * 0.75) return Math.min(78, 66 + (cp - 3) * 4)
  return 0
}

function fieldScore(query: string, field: string): number {
  const cq = compact(query)
  const cf = compact(field)
  if (!cq || !cf) return 0
  let best = 0
  if (cq === cf) best = 100
  else if (cf.indexOf(cq) === 0) best = 90
  else if (cq.length >= 3 && cf.indexOf(cq) > 0) best = 76
  else if (cq.length >= 4 && cq.indexOf(cf) === 0) best = 74
  else {
    const max = budget(Math.min(cq.length, cf.length))
    const d = levenshtein(cq, cf, max)
    if (d <= max) best = 88 - d * 16
  }
  const qt = tokens(query)
  const ct = tokens(field)
  if (qt.length && ct.length) {
    let worst = 100
    for (const q of qt) {
      let bestForToken = 0
      for (const c of ct) bestForToken = Math.max(bestForToken, tokenScore(q, c))
      worst = Math.min(worst, bestForToken)
    }
    best = Math.max(best, worst * 0.92)
  }
  return best
}

export interface FuzzyItem {
  key: string
  name: { en: string; hi: string }
  aliases?: string[]
  importance?: string
  type?: string
}

export function scoreObservance(query: string, item: FuzzyItem): number {
  if (!item) return 0
  const fields = [item.key, item.name?.en, item.name?.hi].concat(item.aliases || [])
  let best = 0
  for (const f of fields) {
    if (!f) continue
    const s = fieldScore(query, f)
    if (s > best) best = s
  }
  if (!best) return 0
  return best + (item.importance === 'major' ? 1.5 : 0)
}

export const SCORE_FLOOR = 60

export function rankObservances<T extends FuzzyItem>(
  query: string,
  catalog: T[],
  options?: { limit?: number; floor?: number },
): (T & { score: number })[] {
  const opts = options || {}
  const floor = opts.floor == null ? SCORE_FLOOR : opts.floor
  const q = String(query || '').trim()
  if (!q) return []
  const scored: { item: T; score: number }[] = []
  for (const item of catalog || []) {
    const score = scoreObservance(q, item)
    if (score >= floor) scored.push({ item, score })
  }
  scored.sort((a, b) => (b.score - a.score) || String(a.item.key).localeCompare(String(b.item.key)))
  const out = scored.map((s) => ({ ...s.item, score: s.score }))
  return opts.limit ? out.slice(0, opts.limit) : out
}
