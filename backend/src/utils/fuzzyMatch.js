'use strict';

/**
 * fuzzyMatch.js — CANONICAL bilingual fuzzy scorer for the observance catalog.
 *
 * The app has a verbatim port at `mobile/src/lib/fuzzyMatch.ts`. The two MUST stay
 * identical: the phone ranks the catalog locally (instant, offline) while this file
 * ranks it on the server to decide WHICH observances get a computed date, and if the
 * two rankings disagree the user sees a card whose date never arrives. A physically
 * shared file is not possible here — the backend is deployed as `backend/` alone and
 * the RN app is copied out as `mobile/` alone for gradle builds, so neither can reach
 * a sibling directory at runtime/bundle time. Change one, change the other.
 *
 * WHY the pipeline is transliterate → canonicalise → score, in that order:
 *
 *  1. TRANSLITERATE Devanagari to Latin. A user in Hindi mode types "दीवाली" and a user
 *     in English mode types "diwali" — they must reach the same festival, and the catalog
 *     stores both scripts. Mapping Devanagari INTO Latin (rather than keeping two search
 *     spaces) means one comparison covers both directions. This is a matching-only
 *     transliteration: it is never displayed, so a pragmatic consonant+matra table with
 *     the implicit schwa is enough.
 *
 *  2. CANONICALISE the spelling variants Indic names collect in Latin script — w/v,
 *     sh/s, ph/f, ee/i, oo/u, doubled letters. These are applied to BOTH sides, so they
 *     can only merge spellings, never invent a match: "dipawali", "deepawali", "divali"
 *     and "diwaali" all collapse onto the single form "divali". This is what does most of
 *     the real work; edit distance alone would not connect "deepavali" to "diwali".
 *
 *  3. SCORE with bounded Levenshtein (not trigram/Dice). Festival names are short tokens
 *     (4-12 chars) and the errors are keystroke errors — a dropped vowel, a swapped
 *     letter. Levenshtein models exactly that and its threshold can be scaled to the token
 *     length (1 edit up to 5 chars, 2 up to 8, 3 beyond) so short words stay strict.
 *     Dice/trigram overlap is length-biased and would happily rank "Holi" (2 trigrams)
 *     against anything short. The cost is O(n·m) per pair, which is nothing at ~130 rows.
 *
 * Matching is done per TOKEN as well as whole-string, which is what produces the "family"
 * of related results the user expects: "holika" hits the token "holika" in Holika Dahan
 * (exact) AND lifts "Holi", because "holi" is a prefix of "holika".
 */

// ── Devanagari → Latin (matching only) ────────────────────────────────────────
const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'ळ': 'l',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'ड़': 'r', 'ढ़': 'rh', 'क़': 'k', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'j', 'फ़': 'f',
};
const MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o', 'ॅ': 'e',
};
const VOWELS = {
  'अ': 'a', 'आ': 'a', 'इ': 'i', 'ई': 'i', 'उ': 'u', 'ऊ': 'u',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};
const DIGITS = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
const VIRAMA = '्';
const NUKTA = '़';
const ANUSVARA = ['ं', 'ँ', 'ः'];

// Latin diacritics used in IAST spellings (Śiva, Kṛṣṇa…) — folded to plain ASCII.
const DIACRITICS = {
  'ā': 'a', 'á': 'a', 'à': 'a', 'ä': 'a', 'ī': 'i', 'í': 'i', 'ū': 'u', 'ú': 'u',
  'ṛ': 'r', 'ṟ': 'r', 'ś': 's', 'ṣ': 's', 'ṇ': 'n', 'ñ': 'n', 'ṅ': 'n', 'ṃ': 'm',
  'ṭ': 't', 'ḍ': 'd', 'ḥ': 'h', 'ē': 'e', 'é': 'e', 'ō': 'o', 'ó': 'o', 'ç': 'c',
};

/** Devanagari → Latin with the implicit schwa ("करवा" → "karava", "दीवाली" → "divali"). */
function transliterate(input) {
  const s = String(input || '');
  let out = '';
  let pendingA = false; // a bare consonant is waiting for its inherent 'a'
  const flush = () => { if (pendingA) { out += 'a'; pendingA = false; } };
  for (let i = 0; i < s.length; i += 1) {
    let ch = s[i];
    if (ch === NUKTA) continue;
    // a consonant + nukta is one letter (ड़, ज़) — look it up as a pair first
    const pair = ch + s[i + 1];
    if (CONSONANTS[pair]) { ch = pair; i += 1; }
    if (CONSONANTS[ch]) { flush(); out += CONSONANTS[ch]; pendingA = true; continue; }
    if (MATRAS[ch]) { pendingA = false; out += MATRAS[ch]; continue; }
    if (ch === VIRAMA) { pendingA = false; continue; }
    if (VOWELS[ch]) { flush(); out += VOWELS[ch]; continue; }
    if (ANUSVARA.indexOf(ch) >= 0) { flush(); out += ch === 'ः' ? 'h' : 'n'; continue; }
    if (DIGITS[ch]) { flush(); out += DIGITS[ch]; continue; }
    flush();
    out += ch;
  }
  flush();
  return out;
}

/**
 * One spelling space. Every rule here is applied to the QUERY and to the CATALOG alike,
 * so it can only fold two spellings together — it can never conjure a false match.
 */
function canonical(input) {
  let s = transliterate(input).toLowerCase();
  s = s.replace(/[^a-z0-9 ]/g, (c) => DIACRITICS[c] || ' '); // IAST diacritics fold; anything else → space
  s = s.replace(/\s+/g, ' ').trim();
  s = s
    .replace(/chh/g, 'ch')   // chhath / chath
    .replace(/sh/g, 's')     // shivratri / sivratri, janmashtami / janmastami
    .replace(/ph/g, 'f')     // phalguna / falguna
    .replace(/w/g, 'v')      // diwali / divali
    .replace(/z/g, 'j')      // puja / pooza
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/ee/g, 'i')     // deepavali / dipavali  (before the doubled-letter squash,
    .replace(/oo/g, 'u')     // pooja / puja           which would otherwise give 'e'/'o')
    .replace(/(.)\1+/g, '$1'); // diwaali / diwali, lakshmii / lakshmi
  return s.trim();
}

/**
 * Canonicalising is regex-heavy and the SAME strings are canonicalised over and over — every
 * catalog field is re-derived on every keystroke. Memoised, a ~230-row catalog is normalised
 * once and each later query is pure comparison, which is what keeps the app's local search
 * inside a frame budget (measured: ~14 ms → ~1 ms per query on the same catalog).
 */
const CANON_CACHE = new Map();
const CANON_CACHE_MAX = 4000;
function canonCached(s) {
  const key = String(s || '');
  const hit = CANON_CACHE.get(key);
  if (hit !== undefined) return hit;
  const value = canonical(key);
  if (CANON_CACHE.size >= CANON_CACHE_MAX) CANON_CACHE.clear();
  CANON_CACHE.set(key, value);
  return value;
}

const compact = (s) => canonCached(s).replace(/ /g, '');
const tokens = (s) => canonCached(s).split(' ').filter(Boolean);

/** Levenshtein, abandoned as soon as the best possible result exceeds `max`. */
function levenshtein(a, b, max) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j += 1) prev[j] = cur[j];
  }
  return prev[b.length];
}

// A typo budget that scales with the word: short names must stay strict, or "holi"
// would reach "hori", "hoti" and half the catalog.
const budget = (len) => (len <= 5 ? 1 : len <= 8 ? 2 : 3);

const commonPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
};

/** Score one already-canonical query token against one already-canonical candidate token. */
function tokenScore(q, c) {
  if (!q || !c) return 0;
  if (q === c) return 100;
  const short = q.length < c.length ? q : c;
  const long = q.length < c.length ? c : q;
  // One token contains the other — this is what lifts "Holi" for the query "holika".
  if (short.length >= 3 && long.indexOf(short) === 0) return 82 - Math.min(20, (long.length - short.length) * 3);
  if (short.length >= 4 && long.indexOf(short) > 0) return 62;
  const max = budget(Math.min(q.length, c.length));
  const d = levenshtein(q, c, max);
  if (d <= max) return 80 - d * 12;
  // Shared STEM: neither contains the other and it is too far for the typo budget, but they
  // grow from the same root ("hola" / "holika"). The stem must be most (3/4) of the shorter
  // token, otherwise a long name would befriend anything that starts alike ("janmashtami"
  // and "janmotsav" share four letters and nothing else). Scored just above the floor, so
  // the family shows up UNDER the real hits rather than instead of them.
  const cp = commonPrefix(q, c);
  if (cp >= 3 && short.length >= 4 && cp >= short.length * 0.75) return Math.min(78, 66 + (cp - 3) * 4);
  return 0;
}

/** Score a query against ONE field (a key, a name or an alias). */
function fieldScore(query, field) {
  const cq = compact(query);
  const cf = compact(field);
  if (!cq || !cf) return 0;

  let best = 0;
  if (cq === cf) best = 100;
  else if (cf.indexOf(cq) === 0) best = 90;                 // prefix   ("holi" → "holika dahan")
  else if (cq.length >= 3 && cf.indexOf(cq) > 0) best = 76; // substring ("chauth" → "karwa chauth")
  else if (cq.length >= 4 && cq.indexOf(cf) === 0) best = 74; // the field is a prefix of the query
  else {
    const max = budget(Math.min(cq.length, cf.length));
    const d = levenshtein(cq, cf, max);
    if (d <= max) best = 88 - d * 16;                        // whole-string fuzzy
  }

  // Per-token pass: each query token takes its best candidate token, and the query is
  // scored on its WEAKEST token, so "karwa chauth" cannot be carried by "chauth" alone.
  const qt = tokens(query);
  const ct = tokens(field);
  if (qt.length && ct.length) {
    let worst = 100;
    for (const q of qt) {
      let bestForToken = 0;
      for (const c of ct) bestForToken = Math.max(bestForToken, tokenScore(q, c));
      worst = Math.min(worst, bestForToken);
    }
    // Token agreement is weaker evidence than a whole-string hit, hence the discount.
    best = Math.max(best, worst * 0.92);
  }
  return best;
}

/**
 * Score a query against a catalog row, taking the best of key / name.en / name.hi / aliases.
 * A `major` observance gets a hair's nudge so that on equal spelling evidence the festival
 * people actually mean (Diwali) outranks its namesakes (Dev Deepawali).
 */
function scoreObservance(query, item) {
  if (!item) return 0;
  const fields = [item.key, item.name && item.name.en, item.name && item.name.hi].concat(item.aliases || []);
  let best = 0;
  for (const f of fields) {
    if (!f) continue;
    const s = fieldScore(query, f);
    if (s > best) best = s;
  }
  if (!best) return 0;
  return best + (item.importance === 'major' ? 1.5 : 0);
}

// Below this a hit is noise. 60 keeps prefix/substring/1-edit matches and drops the rest,
// so a nonsense query ("qwerty") returns an empty list instead of the whole catalog.
const SCORE_FLOOR = 60;

/** Rank a catalog. Returns the items themselves (score attached), best first. */
function rankObservances(query, catalog, options) {
  const opts = options || {};
  const floor = opts.floor == null ? SCORE_FLOOR : opts.floor;
  const q = String(query || '').trim();
  if (!q) return [];
  const scored = [];
  for (const item of catalog || []) {
    const score = scoreObservance(q, item);
    if (score >= floor) scored.push({ item, score });
  }
  scored.sort((a, b) => (b.score - a.score) || String(a.item.key).localeCompare(String(b.item.key)));
  const out = scored.map((s) => Object.assign({}, s.item, { score: s.score }));
  return opts.limit ? out.slice(0, opts.limit) : out;
}

module.exports = {
  transliterate,
  canonical,
  levenshtein,
  scoreObservance,
  rankObservances,
  SCORE_FLOOR,
};
