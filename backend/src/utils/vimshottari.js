// Vimshottari Dasha timeline — balance at birth (bhukta/bhogya) + full life sequence with age ranges.
// 100% classical: 120-year cycle, nakshatra-lord start, balance from Moon's traversal of its nakshatra.
// Pure/deterministic — Moon longitude (from VedAstro) is the only input that matters for accuracy.

// Mahadasha order + years (total = 120)
const SEQ = [
  ['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7],
  ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17],
];
const MS_YEAR = 365.2425 * 86400000;
const r2 = (n) => Math.round(n * 100) / 100;
const r1 = (n) => Math.round(n * 10) / 10;

// moonNakshatra: 1..27 ; fraction: 0..1 (portion of the nakshatra already traversed at birth)
// birthDate, now: Date objects
function computeVimshottari(moonNakshatra, fraction, birthDate, now) {
  const startIdx = (Number(moonNakshatra) - 1) % 9; // nakshatra-lord cycle repeats every 9
  const first = SEQ[startIdx];
  const f = Math.max(0, Math.min(1, Number(fraction) || 0));
  const bhukta = first[1] * f;          // consumed before birth
  const bhogya = first[1] * (1 - f);    // remaining at birth

  const nowAge = (now.getTime() - birthDate.getTime()) / MS_YEAR;

  // antardashas (sub-periods) within a mahadasha — proportional, Vimshottari order starting from M
  const idxOf = (lord) => SEQ.findIndex((s) => s[0] === lord);
  function antardashas(mLord, mYears, mTrueStartAge) {
    const out = [];
    let a = mTrueStartAge;
    const s0 = idxOf(mLord);
    for (let n = 0; n < 9; n++) {
      const A = SEQ[(s0 + n) % 9];
      const dur = (A[1] / 120) * mYears; // years
      const fromAge = a; const toAge = a + dur;
      a = toAge;
      if (toAge <= 0) continue; // pura antardasha janm se pehle → chhodo
      out.push({
        lord: A[0],
        fromAge: r2(Math.max(0, fromAge)),
        toAge: r2(toAge),
        fromYear: new Date(birthDate.getTime() + Math.max(0, fromAge) * MS_YEAR).getFullYear(),
        toYear: new Date(birthDate.getTime() + toAge * MS_YEAR).getFullYear(),
        current: nowAge >= fromAge && nowAge < toAge,
      });
    }
    return out;
  }

  const periods = [];
  // first (partial) mahadasha — true start is bhukta years BEFORE birth
  periods.push({ lord: first[0], years: r2(bhogya), fullYears: first[1], fromAge: 0, toAge: r2(bhogya), partial: true, trueStartAge: -bhukta });
  let age = bhogya;
  let i = (startIdx + 1) % 9;
  while (age < 100) {
    const L = SEQ[i];
    periods.push({ lord: L[0], years: L[1], fullYears: L[1], fromAge: r2(age), toAge: r2(age + L[1]), partial: false, trueStartAge: age });
    age += L[1];
    i = (i + 1) % 9;
  }

  periods.forEach((p) => {
    const fromD = new Date(birthDate.getTime() + p.fromAge * MS_YEAR);
    const toD = new Date(birthDate.getTime() + p.toAge * MS_YEAR);
    p.fromYear = fromD.getFullYear();
    p.toYear = toD.getFullYear();
    p.current = nowAge >= p.fromAge && nowAge < p.toAge;
    p.past = nowAge >= p.toAge;
    p.antardashas = antardashas(p.lord, p.fullYears, p.trueStartAge);
    delete p.trueStartAge; delete p.fullYears;
  });

  return {
    balance: { lord: first[0], totalYears: first[1], bhuktaYears: r2(bhukta), bhogyaYears: r2(bhogya) },
    currentAge: r1(nowAge),
    periods,
  };
}

module.exports = { computeVimshottari, SEQ };
