'use strict';
/**
 * gunMilan.js — Vedic 36-Guna Ashtakoot Kundli matching (Gun Milan / Melapak)
 * North-Indian Parashari standard. Pure, dependency-free, CommonJS.
 *
 * Lookup tables verified (June 2026) against the following authoritative sources:
 *   - Saravali (classical, BPHS-derived) Yoni / Varna / Nadi / Vashya koota pages:
 *       https://saravali.github.io/astrology/koota_yoni.html
 *       https://saravali.github.io/astrology/koota_varna.html
 *       https://saravali.github.io/astrology/koota_nadi.html
 *       https://saravali.github.io/astrology/koota_vashya.html
 *   - Sanatanveda — Natural (Naisargika) planetary friendship table (BPHS):
 *       https://www.sanatanveda.com/astrology/friendship-and-enmity-of-planets-in-vedic-astrology/
 *   - AstroSight / Jagannath Hora / AnytimeAstro — Gana, Graha Maitri, Vashya, Bhakoot rules:
 *       https://astrosight.ai/kundli/gana-koota-matching-rules
 *       https://jagannathhora.com/graha-maitri-koot-planetary-friendship/
 *       https://jagannathhora.com/vashya-koot-mutual-attraction/
 *   - AstroYogi / AnytimeAstro / mohitmrinal — published Vashya 5x5 matrix (consensus variant):
 *       https://www.astroyogi.com/blog/vasya-koota-in-kundli-matching.aspx
 *       https://www.anytimeastro.com/blog/astrology/vasya-koota/
 *
 * Source disagreements & resolutions (see SUMMARY at bottom of this header):
 *   - VASHYA matrix: classical Saravali treats Leo/Scorpio as standalone, while the modern
 *     5-group software standard (DrikPanchang/AstroSage style) maps Leo->Vanachara and
 *     Scorpio->Keeta. We adopt the modern 5-group system per the contract. Among the modern
 *     published 5x5 grids, three variants circulate; we use the one that appears verbatim and
 *     identically across AstroYogi, AnytimeAstro and mohitmrinal (the AstroSage-derived
 *     consensus), which uses 1.5 for the Chatushpada<->Vanachara and Manava<->Jalachara
 *     "control/food" relationships.
 *   - GANA matrix: Manushya(boy) + Rakshasa(girl) = 1, Rakshasa(boy) + Manushya(girl) = 0
 *     per the standard asymmetric rule (some texts use 3/0; we use the DrikPanchang/AstroSage 1/0).
 *   - YONI deadly-enemy pairs: confirmed 7 pairs from Saravali (classical):
 *     Horse-Buffalo, Elephant-Lion, Sheep-Monkey, Serpent-Mongoose, Dog-Deer, Cat-Rat, Cow-Tiger.
 */

/* ------------------------------------------------------------------ */
/* Public constants                                                    */
/* ------------------------------------------------------------------ */

// 27 nakshatras, index 0 = Ashwini ... 26 = Revati
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// 12 rashis, index 0 = Aries/Mesha ... 11 = Pisces/Meena
const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Normalize 1-based input into 0-based index, clamped to [0, n-1].
function idx(v, n) {
  let i = Math.floor(Number(v)) - 1;
  if (!Number.isFinite(i)) i = 0;
  if (i < 0) i = 0;
  if (i >= n) i = i % n;
  return i;
}

function round(n) { return Math.round(n); }

/* ------------------------------------------------------------------ */
/* 1. VARNA (max 1)                                                    */
/*    rashi -> varna. Brahmin > Kshatriya > Vaishya > Shudra (rank).   */
/*    Water=Brahmin, Fire=Kshatriya, Earth=Vaishya, Air=Shudra.        */
/*    Score 1 if groom rank >= bride rank, else 0.                     */
/* ------------------------------------------------------------------ */

// rank: higher = "higher" varna. Brahmin=4, Kshatriya=3, Vaishya=2, Shudra=1.
const VARNA_NAME = { 4: 'Brahmin', 3: 'Kshatriya', 2: 'Vaishya', 1: 'Shudra' };
const VARNA_NAME_HI = { 4: 'ब्राह्मण', 3: 'क्षत्रिय', 2: 'वैश्य', 1: 'शूद्र' };
// index = rashi (0-based)
const RASHI_VARNA = [
  3, // Aries (fire)        -> Kshatriya
  2, // Taurus (earth)      -> Vaishya
  1, // Gemini (air)        -> Shudra
  4, // Cancer (water)      -> Brahmin
  3, // Leo (fire)          -> Kshatriya
  2, // Virgo (earth)       -> Vaishya
  1, // Libra (air)         -> Shudra
  4, // Scorpio (water)     -> Brahmin
  3, // Sagittarius (fire)  -> Kshatriya
  2, // Capricorn (earth)   -> Vaishya
  1, // Aquarius (air)      -> Shudra
  4, // Pisces (water)      -> Brahmin
];

function computeVarna(boyR, girlR) {
  const b = RASHI_VARNA[boyR];
  const g = RASHI_VARNA[girlR];
  const got = b >= g ? 1 : 0;
  return {
    got,
    boy: VARNA_NAME[b], girl: VARNA_NAME[g],
    boyHi: VARNA_NAME_HI[b], girlHi: VARNA_NAME_HI[g],
    note: got
      ? "Groom's varna is equal or higher — favourable."
      : "Bride's varna is higher — not favourable.",
    noteHi: got
      ? 'वर का वर्ण समान या उच्च है — शुभ।'
      : 'वधू का वर्ण उच्च है — अशुभ।',
  };
}

/* ------------------------------------------------------------------ */
/* 2. VASHYA (max 2)                                                   */
/*    Groups: 0 Chatushpada, 1 Manava, 2 Jalachara, 3 Vanachara, 4 Keeta */
/*    Half-sign rule: Sagittarius first half -> Manava, second half ->  */
/*    Vanachara; Capricorn first half -> Jalachara, second half ->      */
/*    Chatushpada. We default to the dominant/whole-sign mapping used   */
/*    when only the rashi (not exact degree) is known:                  */
/*      Sagittarius -> Manava (first half), Capricorn -> Jalachara      */
/*    (the conventional default for rashi-only input).                  */
/* ------------------------------------------------------------------ */

const VASHYA_NAME = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'];
const VASHYA_NAME_HI = ['चतुष्पद', 'मानव', 'जलचर', 'वनचर', 'कीट'];
// index = rashi (0-based)
const RASHI_VASHYA = [
  0, // Aries        -> Chatushpada
  0, // Taurus       -> Chatushpada
  1, // Gemini       -> Manava
  2, // Cancer       -> Jalachara
  3, // Leo          -> Vanachara
  1, // Virgo        -> Manava
  1, // Libra        -> Manava
  4, // Scorpio      -> Keeta
  1, // Sagittarius  -> Manava (first half; default for rashi-only)
  2, // Capricorn    -> Jalachara (first half; default for rashi-only)
  1, // Aquarius     -> Manava
  2, // Pisces       -> Jalachara
];

// rows = groom group, cols = bride group. Consensus AstroSage/AstroYogi matrix.
//            Chatu  Manava  Jala  Vana  Keeta
const VASHYA_MATRIX = [
  [2,   1,   1,   1.5, 1  ], // Chatushpada (groom)
  [1,   2,   1.5, 0,   1  ], // Manava
  [1,   1.5, 2,   1,   1  ], // Jalachara
  [0,   0,   0,   2,   0  ], // Vanachara
  [1,   1,   1,   0,   2  ], // Keeta
];

function computeVashya(boyR, girlR) {
  const b = RASHI_VASHYA[boyR];
  const g = RASHI_VASHYA[girlR];
  const got = VASHYA_MATRIX[b][g];
  const fav = got >= 1.5;
  return {
    got,
    boy: VASHYA_NAME[b], girl: VASHYA_NAME[g],
    boyHi: VASHYA_NAME_HI[b], girlHi: VASHYA_NAME_HI[g],
    note: got === 2
      ? 'Same vashya group — strong mutual attraction.'
      : fav
        ? 'Good mutual control/attraction.'
        : got > 0
          ? 'Limited mutual attraction.'
          : 'No mutual attraction (opposing groups).',
    noteHi: got === 2
      ? 'समान वश्य वर्ग — प्रबल पारस्परिक आकर्षण।'
      : fav
        ? 'अच्छा पारस्परिक नियंत्रण/आकर्षण।'
        : got > 0
          ? 'सीमित आकर्षण।'
          : 'कोई आकर्षण नहीं (विरोधी वर्ग)।',
  };
}

/* ------------------------------------------------------------------ */
/* 3. TARA / DINA (max 3)                                              */
/*    Count from boy's nakshatra to girl's and divide by 9 -> remainder;*/
/*    likewise girl to boy. Remainders 3,5,7 (and 0 i.e. multiple of 9) */
/*    are inauspicious. Both favourable=3, one favourable=1.5, none=0.  */
/* ------------------------------------------------------------------ */

// count is 1-based forward count (inclusive) then taken mod 9; remainder 0 == divisible.
function taraFavourable(fromN, toN) {
  // forward count from 'fromN' to 'toN', inclusive of destination (1-based)
  let count = ((toN - fromN + 27) % 27) + 1;
  const rem = count % 9;
  // inauspicious remainders: 3, 5, 7 and 0 (i.e. exact multiple of 9)
  return !(rem === 0 || rem === 3 || rem === 5 || rem === 7);
}

function computeTara(boyN, girlN) {
  const boyOk = taraFavourable(boyN, girlN);   // count from boy to girl
  const girlOk = taraFavourable(girlN, boyN);  // count from girl to boy
  let got = 0;
  if (boyOk && girlOk) got = 3;
  else if (boyOk || girlOk) got = 1.5;
  const cBoy = ((girlN - boyN + 27) % 27) + 1;
  const cGirl = ((boyN - girlN + 27) % 27) + 1;
  return {
    got,
    boy: String(cBoy), girl: String(cGirl),
    boyHi: String(cBoy), girlHi: String(cGirl),
    note: got === 3
      ? 'Both Taras favourable — auspicious.'
      : got === 1.5
        ? 'One Tara favourable — partly auspicious.'
        : 'Both Taras inauspicious.',
    noteHi: got === 3
      ? 'दोनों तारा शुभ — मंगलकारी।'
      : got === 1.5
        ? 'एक तारा शुभ — आंशिक शुभ।'
        : 'दोनों तारा अशुभ।',
  };
}

/* ------------------------------------------------------------------ */
/* 4. YONI (max 4)                                                     */
/*    nakshatra -> animal yoni (14 animals). Matrix derived from the    */
/*    classical relationships: same=4, friend=3, neutral=2, enemy=1,    */
/*    deadly-enemy (vaira)=0. 7 deadly pairs per Saravali.              */
/* ------------------------------------------------------------------ */

// 14 yoni animals
const YONI_NAME = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
  'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion',
];
const YONI_NAME_HI = [
  'अश्व', 'गज', 'मेष', 'सर्प', 'श्वान', 'मार्जार', 'मूषक',
  'गौ', 'महिष', 'व्याघ्र', 'मृग', 'वानर', 'नकुल', 'सिंह',
];
const Y = {
  HORSE: 0, ELEPHANT: 1, SHEEP: 2, SERPENT: 3, DOG: 4, CAT: 5, RAT: 6,
  COW: 7, BUFFALO: 8, TIGER: 9, DEER: 10, MONKEY: 11, MONGOOSE: 12, LION: 13,
};

// nakshatra (0-based) -> yoni animal index (verified vs Saravali)
const NAK_YONI = [
  Y.HORSE,    // 0  Ashwini
  Y.ELEPHANT, // 1  Bharani
  Y.SHEEP,    // 2  Krittika
  Y.SERPENT,  // 3  Rohini
  Y.SERPENT,  // 4  Mrigashira
  Y.DOG,      // 5  Ardra
  Y.CAT,      // 6  Punarvasu
  Y.SHEEP,    // 7  Pushya
  Y.CAT,      // 8  Ashlesha
  Y.RAT,      // 9  Magha
  Y.RAT,      // 10 Purva Phalguni
  Y.COW,      // 11 Uttara Phalguni
  Y.BUFFALO,  // 12 Hasta
  Y.TIGER,    // 13 Chitra
  Y.BUFFALO,  // 14 Swati
  Y.TIGER,    // 15 Vishakha
  Y.DEER,     // 16 Anuradha
  Y.DEER,     // 17 Jyeshtha
  Y.DOG,      // 18 Mula
  Y.MONKEY,   // 19 Purva Ashadha
  Y.MONGOOSE, // 20 Uttara Ashadha
  Y.MONKEY,   // 21 Shravana
  Y.LION,     // 22 Dhanishta
  Y.HORSE,    // 23 Shatabhisha
  Y.LION,     // 24 Purva Bhadrapada
  Y.COW,      // 25 Uttara Bhadrapada
  Y.ELEPHANT, // 26 Revati
];

// Deadly-enemy (vaira) pairs -> 0 points (classical 7 pairs, Saravali)
const YONI_DEADLY = [
  [Y.HORSE, Y.BUFFALO],
  [Y.ELEPHANT, Y.LION],
  [Y.SHEEP, Y.MONKEY],
  [Y.SERPENT, Y.MONGOOSE],
  [Y.DOG, Y.DEER],
  [Y.CAT, Y.RAT],
  [Y.COW, Y.TIGER],
];
// Friendly pairs -> 3 points (classical Yoni-Maitri friends)
const YONI_FRIEND = [
  [Y.HORSE, Y.SHEEP],
  [Y.ELEPHANT, Y.RAT],
  [Y.SHEEP, Y.COW],     // (Sheep/Goat friendly with Cow)
  [Y.SERPENT, Y.DEER],
  [Y.DOG, Y.MONKEY],
  [Y.CAT, Y.DOG],
  [Y.RAT, Y.HORSE],
  [Y.COW, Y.BUFFALO],
  [Y.BUFFALO, Y.DEER],
  [Y.TIGER, Y.LION],
  [Y.LION, Y.MONGOOSE],
];
// Build a 14x14 symmetric matrix.
const YONI_MATRIX = (function buildYoniMatrix() {
  const n = 14;
  const m = [];
  for (let i = 0; i < n; i++) { m.push(new Array(n).fill(2)); } // default neutral = 2
  for (let i = 0; i < n; i++) m[i][i] = 4; // same yoni = 4
  for (const [a, b] of YONI_DEADLY) { m[a][b] = 0; m[b][a] = 0; }
  for (const [a, b] of YONI_FRIEND) { m[a][b] = 3; m[b][a] = 3; }
  // Mongoose (Uttara Ashadha) has no natural prey/predator counterpart and is
  // conventionally neutral (2) with everything except its lion friendship; leave as built.
  return m;
})();

function computeYoni(boyN, girlN) {
  const b = NAK_YONI[boyN];
  const g = NAK_YONI[girlN];
  const got = YONI_MATRIX[b][g];
  return {
    got,
    boy: YONI_NAME[b], girl: YONI_NAME[g],
    boyHi: YONI_NAME_HI[b], girlHi: YONI_NAME_HI[g],
    note: got === 4
      ? 'Same yoni — best sexual/instinctual compatibility.'
      : got === 3
        ? 'Friendly yonis — good compatibility.'
        : got === 2
          ? 'Neutral yonis — average compatibility.'
          : got === 1
            ? 'Enemy yonis — poor compatibility.'
            : 'Deadly-enemy yonis — very poor compatibility.',
    noteHi: got === 4
      ? 'समान योनि — सर्वोत्तम अनुकूलता।'
      : got === 3
        ? 'मित्र योनि — अच्छी अनुकूलता।'
        : got === 2
          ? 'सम योनि — सामान्य अनुकूलता।'
          : got === 1
            ? 'शत्रु योनि — कमजोर अनुकूलता।'
            : 'महाशत्रु योनि — अत्यंत प्रतिकूल।',
  };
}

/* ------------------------------------------------------------------ */
/* 5. GRAHA MAITRI (max 5)                                             */
/*    rashi lord friendship. Natural friendship table per BPHS.        */
/*    Scoring (standard): same lord=5; mutual friends=5; one friend/   */
/*    one neutral=4; both neutral=3; one friend/one enemy=1; one       */
/*    neutral/one enemy=0.5; both enemies=0.                            */
/* ------------------------------------------------------------------ */

// planets
const P = { SUN: 0, MOON: 1, MARS: 2, MERCURY: 3, JUPITER: 4, VENUS: 5, SATURN: 6 };
const PLANET_NAME = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const PLANET_NAME_HI = ['सूर्य', 'चंद्र', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

// rashi (0-based) -> ruling planet
const RASHI_LORD = [
  P.MARS,    // Aries
  P.VENUS,   // Taurus
  P.MERCURY, // Gemini
  P.MOON,    // Cancer
  P.SUN,     // Leo
  P.MERCURY, // Virgo
  P.VENUS,   // Libra
  P.MARS,    // Scorpio
  P.JUPITER, // Sagittarius
  P.SATURN,  // Capricorn
  P.SATURN,  // Aquarius
  P.JUPITER, // Pisces
];

// Natural friendship: relation[a][b] = +1 friend, 0 neutral, -1 enemy (BPHS / Sanatanveda)
const FRIEND_TABLE = (function buildFriendTable() {
  const n = 7;
  const t = [];
  for (let i = 0; i < n; i++) t.push(new Array(n).fill(0));
  const setF = (p, arr) => arr.forEach((q) => { t[p][q] = 1; });
  const setE = (p, arr) => arr.forEach((q) => { t[p][q] = -1; });
  // Sun
  setF(P.SUN, [P.MOON, P.MARS, P.JUPITER]); setE(P.SUN, [P.VENUS, P.SATURN]); // neutral: Mercury
  // Moon
  setF(P.MOON, [P.SUN, P.MERCURY]); // enemies: none; neutral: rest
  // Mars
  setF(P.MARS, [P.SUN, P.MOON, P.JUPITER]); setE(P.MARS, [P.MERCURY]); // neutral: Venus, Saturn
  // Mercury
  setF(P.MERCURY, [P.SUN, P.VENUS]); setE(P.MERCURY, [P.MOON]); // neutral: Mars, Jupiter, Saturn
  // Jupiter
  setF(P.JUPITER, [P.SUN, P.MOON, P.MARS]); setE(P.JUPITER, [P.MERCURY, P.VENUS]); // neutral: Saturn
  // Venus
  setF(P.VENUS, [P.MERCURY, P.SATURN]); setE(P.VENUS, [P.SUN, P.MOON]); // neutral: Mars, Jupiter
  // Saturn
  setF(P.SATURN, [P.MERCURY, P.VENUS]); setE(P.SATURN, [P.SUN, P.MOON, P.MARS]); // neutral: Jupiter
  for (let i = 0; i < n; i++) t[i][i] = 1; // a planet is friendly with itself
  return t;
})();

function relWord(r) { return r === 1 ? 'friend' : r === 0 ? 'neutral' : 'enemy'; }

function grahaMaitriScore(lp, lg) {
  if (lp === lg) return 5; // same lord
  const a = FRIEND_TABLE[lp][lg]; // how groom-lord sees girl-lord
  const b = FRIEND_TABLE[lg][lp]; // how girl-lord sees groom-lord
  // mutual friend
  if (a === 1 && b === 1) return 5;
  // friend + neutral
  if ((a === 1 && b === 0) || (a === 0 && b === 1)) return 4;
  // both neutral
  if (a === 0 && b === 0) return 3;
  // friend + enemy
  if ((a === 1 && b === -1) || (a === -1 && b === 1)) return 1;
  // neutral + enemy
  if ((a === 0 && b === -1) || (a === -1 && b === 0)) return 0.5;
  // both enemies
  return 0;
}

function computeGrahaMaitri(boyR, girlR) {
  const lp = RASHI_LORD[boyR];
  const lg = RASHI_LORD[girlR];
  const got = grahaMaitriScore(lp, lg);
  const rel = lp === lg ? 'same lord' :
    `${relWord(FRIEND_TABLE[lp][lg])}/${relWord(FRIEND_TABLE[lg][lp])}`;
  return {
    got,
    boy: PLANET_NAME[lp], girl: PLANET_NAME[lg],
    boyHi: PLANET_NAME_HI[lp], girlHi: PLANET_NAME_HI[lg],
    note: `Lords: ${PLANET_NAME[lp]} & ${PLANET_NAME[lg]} (${rel}).`,
    noteHi: `स्वामी: ${PLANET_NAME_HI[lp]} व ${PLANET_NAME_HI[lg]}।`,
  };
}

/* ------------------------------------------------------------------ */
/* 6. GANA (max 6)                                                     */
/*    nakshatra -> gana (0 Deva, 1 Manushya, 2 Rakshasa).              */
/*    Asymmetric matrix [groom][bride].                                 */
/* ------------------------------------------------------------------ */

const GANA_NAME = ['Deva', 'Manushya', 'Rakshasa'];
const GANA_NAME_HI = ['देव', 'मनुष्य', 'राक्षस'];
// nakshatra (0-based) -> gana (verified vs AstroSight)
const NAK_GANA = [
  0, // 0  Ashwini           Deva
  1, // 1  Bharani           Manushya
  2, // 2  Krittika          Rakshasa
  1, // 3  Rohini            Manushya
  0, // 4  Mrigashira        Deva
  1, // 5  Ardra             Manushya
  0, // 6  Punarvasu         Deva
  0, // 7  Pushya            Deva
  2, // 8  Ashlesha          Rakshasa
  2, // 9  Magha             Rakshasa
  1, // 10 Purva Phalguni    Manushya
  1, // 11 Uttara Phalguni   Manushya
  0, // 12 Hasta             Deva
  2, // 13 Chitra            Rakshasa
  0, // 14 Swati             Deva
  2, // 15 Vishakha          Rakshasa
  0, // 16 Anuradha          Deva
  2, // 17 Jyeshtha          Rakshasa
  2, // 18 Mula              Rakshasa
  1, // 19 Purva Ashadha     Manushya
  1, // 20 Uttara Ashadha    Manushya
  0, // 21 Shravana          Deva
  2, // 22 Dhanishta         Rakshasa
  2, // 23 Shatabhisha       Rakshasa
  1, // 24 Purva Bhadrapada  Manushya
  1, // 25 Uttara Bhadrapada Manushya
  0, // 26 Revati            Deva
];

// rows = groom gana, cols = bride gana (asymmetric)
//                Deva  Manushya  Rakshasa
const GANA_MATRIX = [
  [6, 5, 0], // groom Deva
  [5, 6, 1], // groom Manushya
  [0, 0, 6], // groom Rakshasa
];

function computeGana(boyN, girlN) {
  const b = NAK_GANA[boyN];
  const g = NAK_GANA[girlN];
  const got = GANA_MATRIX[b][g];
  return {
    got,
    boy: GANA_NAME[b], girl: GANA_NAME[g],
    boyHi: GANA_NAME_HI[b], girlHi: GANA_NAME_HI[g],
    note: got === 6
      ? 'Excellent temperamental compatibility.'
      : got >= 5
        ? 'Good temperamental compatibility.'
        : got >= 1
          ? 'Some temperamental friction.'
          : 'Significant temperamental mismatch (Gana dosha).',
    noteHi: got === 6
      ? 'उत्तम स्वभाव अनुकूलता।'
      : got >= 5
        ? 'अच्छी स्वभाव अनुकूलता।'
        : got >= 1
          ? 'कुछ स्वभाव-भेद।'
          : 'गण दोष — स्वभाव में बड़ा अंतर।',
  };
}

/* ------------------------------------------------------------------ */
/* 7. BHAKOOT (max 7)                                                  */
/*    rashi distance both ways. Inauspicious sets (Bhakoot dosha):     */
/*    2-12 (1/2 & 2/1), 5-9 (5/9 & 9/5), 6-8 (6/8 & 8/6) -> 0, else 7. */
/* ------------------------------------------------------------------ */

function computeBhakoot(boyR, girlR) {
  // count from boy to girl (1-based) and girl to boy
  const d1 = ((girlR - boyR + 12) % 12) + 1; // 1..12
  const d2 = ((boyR - girlR + 12) % 12) + 1;
  const bad =
    (d1 === 2 && d2 === 12) || (d1 === 12 && d2 === 2) ||
    (d1 === 5 && d2 === 9) || (d1 === 9 && d2 === 5) ||
    (d1 === 6 && d2 === 8) || (d1 === 8 && d2 === 6);
  const got = bad ? 0 : 7;
  return {
    got,
    boy: RASHIS[boyR], girl: RASHIS[girlR],
    boyHi: RASHIS[boyR], girlHi: RASHIS[girlR],
    note: got === 7
      ? 'No Bhakoot dosha — favourable for health/prosperity.'
      : `Bhakoot dosha (${d1}-${d2} relation) — inauspicious.`,
    noteHi: got === 7
      ? 'भकूट दोष नहीं — स्वास्थ्य/समृद्धि हेतु शुभ।'
      : `भकूट दोष (${d1}-${d2}) — अशुभ।`,
  };
}

/* ------------------------------------------------------------------ */
/* 8. NADI (max 8)                                                     */
/*    nakshatra -> nadi (0 Aadi/Vata, 1 Madhya/Pitta, 2 Antya/Kapha).  */
/*    Same nadi = 0 (Nadi dosha), different = 8.                        */
/* ------------------------------------------------------------------ */

const NADI_NAME = ['Aadi', 'Madhya', 'Antya'];
const NADI_NAME_HI = ['आदि', 'मध्य', 'अन्त्य'];
// nakshatra (0-based) -> nadi (verified vs Saravali)
const NAK_NADI = [
  0, // 0  Ashwini           Aadi
  1, // 1  Bharani           Madhya
  2, // 2  Krittika          Antya
  2, // 3  Rohini            Antya
  1, // 4  Mrigashira        Madhya
  0, // 5  Ardra             Aadi
  0, // 6  Punarvasu         Aadi
  1, // 7  Pushya            Madhya
  2, // 8  Ashlesha          Antya
  2, // 9  Magha             Antya
  1, // 10 Purva Phalguni    Madhya
  0, // 11 Uttara Phalguni   Aadi
  0, // 12 Hasta             Aadi
  1, // 13 Chitra            Madhya
  2, // 14 Swati             Antya
  2, // 15 Vishakha          Antya
  1, // 16 Anuradha          Madhya
  0, // 17 Jyeshtha          Aadi
  0, // 18 Mula              Aadi
  1, // 19 Purva Ashadha     Madhya
  2, // 20 Uttara Ashadha    Antya
  2, // 21 Shravana          Antya
  1, // 22 Dhanishta         Madhya
  0, // 23 Shatabhisha       Aadi
  0, // 24 Purva Bhadrapada  Aadi
  1, // 25 Uttara Bhadrapada Madhya
  2, // 26 Revati            Antya
];

function computeNadi(boyN, girlN) {
  const b = NAK_NADI[boyN];
  const g = NAK_NADI[girlN];
  const got = b === g ? 0 : 8;
  return {
    got,
    boy: NADI_NAME[b], girl: NADI_NAME[g],
    boyHi: NADI_NAME_HI[b], girlHi: NADI_NAME_HI[g],
    note: got === 8
      ? 'Different Nadi — no Nadi dosha (best).'
      : 'Same Nadi — Nadi dosha present (most serious).',
    noteHi: got === 8
      ? 'भिन्न नाड़ी — नाड़ी दोष नहीं (सर्वोत्तम)।'
      : 'समान नाड़ी — नाड़ी दोष (सर्वाधिक गंभीर)।',
  };
}

/* ------------------------------------------------------------------ */
/* Main aggregate                                                      */
/* ------------------------------------------------------------------ */

function computeGunMilan(boy, girl) {
  const bN = idx(boy && boy.nakshatra, 27);
  const gN = idx(girl && girl.nakshatra, 27);
  const bR = idx(boy && boy.rashi, 12);
  const gR = idx(girl && girl.rashi, 12);

  const varna = computeVarna(bR, gR);
  const vashya = computeVashya(bR, gR);
  const tara = computeTara(bN, gN);
  const yoni = computeYoni(bN, gN);
  const grahaMaitri = computeGrahaMaitri(bR, gR);
  const gana = computeGana(bN, gN);
  const bhakoot = computeBhakoot(bR, gR);
  const nadi = computeNadi(bN, gN);

  const def = [
    ['varna', 'Varna', 'वर्ण', 1, varna],
    ['vashya', 'Vashya', 'वश्य', 2, vashya],
    ['tara', 'Tara', 'तारा', 3, tara],
    ['yoni', 'Yoni', 'योनि', 4, yoni],
    ['grahaMaitri', 'Graha Maitri', 'ग्रह मैत्री', 5, grahaMaitri],
    ['gana', 'Gana', 'गण', 6, gana],
    ['bhakoot', 'Bhakoot', 'भकूट', 7, bhakoot],
    ['nadi', 'Nadi', 'नाड़ी', 8, nadi],
  ];

  const kootas = def.map(([key, label, labelHi, max, r]) => ({
    key, label, labelHi,
    got: r.got, max,
    boy: r.boy, girl: r.girl,
    boyHi: r.boyHi, girlHi: r.girlHi,
    note: r.note, noteHi: r.noteHi,
  }));

  const total = kootas.reduce((s, k) => s + k.got, 0);
  const max = 36;
  const percent = round((total / max) * 100);

  let verdict;
  if (total >= 32) verdict = 'excellent';
  else if (total >= 24) verdict = 'good';
  else if (total >= 18) verdict = 'average';
  else verdict = 'poor';

  return { total, max, percent, verdict, kootas };
}

/* ------------------------------------------------------------------ */
/* Mangal (Manglik) dosha compatibility                                */
/* ------------------------------------------------------------------ */

function computeMangalCompat(boyMangal, girlMangal) {
  const boy = !!boyMangal;
  const girl = !!girlMangal;
  const compatible = boy === girl; // both manglik OR neither manglik
  let severity, note, noteHi;
  if (!boy && !girl) {
    severity = 'none';
    note = 'Neither partner is Manglik — no Mangal dosha.';
    noteHi = 'दोनों में से कोई मांगलिक नहीं — मंगल दोष नहीं।';
  } else if (boy && girl) {
    severity = 'cancelled';
    note = 'Both partners are Manglik — the dosha is mutually cancelled.';
    noteHi = 'दोनों मांगलिक हैं — दोष परस्पर निष्प्रभावी।';
  } else {
    severity = 'present';
    note = 'Only one partner is Manglik — Mangal dosha present; remedies advised.';
    noteHi = 'केवल एक मांगलिक है — मंगल दोष विद्यमान; उपाय सुझाए जाते हैं।';
  }
  return { boy, girl, compatible, severity, note, noteHi };
}

module.exports = {
  computeGunMilan, computeMangalCompat, NAKSHATRAS, RASHIS,
  // verified lookup tables (re-exported for Avakhada Chakra reuse — single source of truth)
  NAK_YONI, NAK_GANA, NAK_NADI, RASHI_VARNA, RASHI_VASHYA, RASHI_LORD,
  YONI_NAME, YONI_NAME_HI, GANA_NAME, GANA_NAME_HI, NADI_NAME, NADI_NAME_HI,
  VARNA_NAME, VARNA_NAME_HI, VASHYA_NAME, VASHYA_NAME_HI, PLANET_NAME, PLANET_NAME_HI,
};

/* ------------------------------------------------------------------ */
/* Self-test                                                           */
/* ------------------------------------------------------------------ */

if (require.main === module) {
  const examples = [
    {
      title: 'Example 1 — Boy: Rohini/Taurus, Girl: Hasta/Virgo',
      boy: { nakshatra: 4, rashi: 2 },   // Rohini, Taurus
      girl: { nakshatra: 13, rashi: 6 }, // Hasta, Virgo
    },
    {
      title: 'Example 2 — Boy: Ashwini/Aries, Girl: Bharani/Aries',
      boy: { nakshatra: 1, rashi: 1 },   // Ashwini, Aries
      girl: { nakshatra: 2, rashi: 1 },  // Bharani, Aries
    },
    {
      title: 'Example 3 — Boy: Magha/Leo, Girl: Mula/Sagittarius',
      boy: { nakshatra: 10, rashi: 5 },  // Magha, Leo
      girl: { nakshatra: 19, rashi: 9 }, // Mula, Sagittarius
    },
  ];

  for (const ex of examples) {
    const res = computeGunMilan(ex.boy, ex.girl);
    console.log('\n=== ' + ex.title + ' ===');
    for (const k of res.kootas) {
      console.log(
        '  ' + k.label.padEnd(13) +
        ('(' + k.boy + ' / ' + k.girl + ')').padEnd(34) +
        k.got + '/' + k.max
      );
    }
    console.log('  TOTAL: ' + res.total + '/' + res.max +
      '  (' + res.percent + '%)  verdict=' + res.verdict);
    if (res.total < 0 || res.total > 36) {
      throw new Error('TOTAL OUT OF RANGE: ' + res.total);
    }
  }

  console.log('\n--- Mangal compatibility checks ---');
  console.log(computeMangalCompat(false, false));
  console.log(computeMangalCompat(true, true));
  console.log(computeMangalCompat(true, false));

  console.log('\nSelf-test completed: all totals within 0..36.');
}
