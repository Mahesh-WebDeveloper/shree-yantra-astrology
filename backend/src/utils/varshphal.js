'use strict';
/**
 * varshphal.js — Muntha-based annual indicator (Tajika), 5-year.
 * 100% deterministic: Muntha sits on the Lagna sign at birth and advances exactly
 * ONE sign per completed year of life. Year-N Muntha = (LagnaSign + N) mod 12.
 * Muntha's sign-lord and the house it occupies (from Lagna) flag the year's theme.
 *
 * (Full Tajika Varshesh/Mudda-dasha point system is NOT included here — only the
 * deterministic Muntha progression, which is exact.)
 */
const gm = require('./gunMilan');

const PLANET_HI = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि' };
// House (Muntha from Lagna) -> broad classical indication.
const HOUSE_NOTE = {
  1: { en: 'Self, health, new initiative', hi: 'स्वयं, स्वास्थ्य, नई शुरुआत' },
  2: { en: 'Wealth, family, speech', hi: 'धन, परिवार, वाणी' },
  3: { en: 'Courage, efforts, siblings', hi: 'साहस, प्रयास, भाई-बहन' },
  4: { en: 'Home, mother, property', hi: 'घर, माता, संपत्ति' },
  5: { en: 'Education, children, creativity', hi: 'शिक्षा, संतान, रचनात्मकता' },
  6: { en: 'Competition, debts, health care', hi: 'प्रतिस्पर्धा, ऋण, स्वास्थ्य' },
  7: { en: 'Partnership, marriage, travel', hi: 'साझेदारी, विवाह, यात्रा' },
  8: { en: 'Change, caution, hidden matters', hi: 'परिवर्तन, सावधानी, गुप्त विषय' },
  9: { en: 'Fortune, dharma, long journeys', hi: 'भाग्य, धर्म, लंबी यात्रा' },
  10: { en: 'Career, status, recognition', hi: 'करियर, प्रतिष्ठा, मान-सम्मान' },
  11: { en: 'Gains, fulfilment of desires', hi: 'लाभ, इच्छापूर्ति' },
  12: { en: 'Expense, spirituality, foreign', hi: 'व्यय, अध्यात्म, विदेश' },
};
const GOOD_HOUSES = [1, 2, 3, 5, 9, 10, 11];

/**
 * @param {Object} p { lagnaSignIdx 0..11, birthYear, fromYear, count=5 }
 * @returns {{ years: Array }}
 */
function computeVarshphal({ lagnaSignIdx, birthYear, fromYear, count = 5 }) {
  if (lagnaSignIdx == null || !birthYear || !fromYear) return { years: [] };
  const years = [];
  for (let i = 0; i < count; i++) {
    const year = fromYear + i;
    const age = year - birthYear;
    if (age < 0) continue;
    const signIdx = (((lagnaSignIdx + age) % 12) + 12) % 12;
    const house = (age % 12) + 1;
    years.push({
      year,
      age,
      munthaSign: gm.RASHIS[signIdx],
      munthaSignIdx: signIdx,
      munthaLord: gm.PLANET_NAME[gm.RASHI_LORD[signIdx]],
      munthaLordHi: PLANET_HI[gm.PLANET_NAME[gm.RASHI_LORD[signIdx]]],
      houseFromLagna: house,
      theme: HOUSE_NOTE[house],
      kind: GOOD_HOUSES.includes(house) ? 'good' : 'neutral',
    });
  }
  return { years, note: 'Muntha progression (Tajika) — one sign per year from natal Lagna.' };
}

module.exports = { computeVarshphal };

/* ------------------------------------------------------------------ */
if (require.main === module) {
  let ok = true;
  // Lagna Virgo (5), born 1990, 2026..2030.
  const r = computeVarshphal({ lagnaSignIdx: 5, birthYear: 1990, fromYear: 2026, count: 5 });
  r.years.forEach((y) => console.log(`  ${y.year} (age ${y.age}): Muntha ${y.munthaSign} [H${y.houseFromLagna}] lord ${y.munthaLord} — ${y.theme.en}`));
  // age 36 in 2026 -> Muntha = Virgo(5)+36 = 41 %12 = 5 -> Virgo, house (36%12)+1 = 1
  if (r.years[0].munthaSignIdx !== 5 || r.years[0].houseFromLagna !== 1) { ok = false; console.log('FAIL: 2026 Muntha should be Virgo H1'); }
  // 2027 age 37 -> Virgo+37=42%12=6 Libra, house 2
  if (r.years[1].munthaSignIdx !== 6 || r.years[1].houseFromLagna !== 2) { ok = false; console.log('FAIL: 2027 Muntha should be Libra H2'); }
  console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
  process.exit(ok ? 0 : 1);
}
