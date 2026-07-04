// panchak.service.js — 100% deterministic Panchak (a.k.a. Bichhuda / Vinchhudo) calculator.
//
// Panchak = the Moon transiting the last five nakshatras (Dhanishtha 2nd half, Shatabhisha,
// Purva-Bhadrapada, Uttara-Bhadrapada, Revati) i.e. the Moon's SIDEREAL longitude lies in
// [300°, 360°) — the Kumbha (Aquarius) + Meena (Pisces) rashis. It lasts ~5 days and recurs
// every ~27 days. The TYPE is fixed by the weekday on which the Panchak BEGINS (classical):
//   Sun→Rog, Mon→Raj (auspicious), Tue→Agni, Fri→Chor, Sat→Mrityu, Wed/Thu→ordinary.
//
// Computed purely from the local Lahiri ephemeris (astronomy-engine) — no hardcoding.

const eph = require('../utils/localEphemeris');

const moonLon = (d) => eph.siderealLon('Moon', d);            // 0..360 sidereal
const inPanchak = (d) => { const l = moonLon(d); return l >= 300 && l < 360; };

const TYPES = {
  0: { key: 'rog',    en: 'Rog Panchak',    hi: 'रोग पंचक',    ok: false, effect: { en: 'Begins on Sunday — a spell that can affect health. Avoid taking new health risks; rest and care are advised.', hi: 'रविवार से आरंभ — स्वास्थ्य पर असर डाल सकता है। नए स्वास्थ्य-जोखिम से बचें; आराम व सावधानी रखें।' } },
  1: { key: 'raj',    en: 'Raj Panchak',    hi: 'राज पंचक',    ok: true,  effect: { en: 'Begins on Monday — considered AUSPICIOUS. Favourable for property, authority, government and administrative work.', hi: 'सोमवार से आरंभ — शुभ माना जाता है। संपत्ति, पद, सरकारी व प्रशासनिक कार्य के लिए अनुकूल।' } },
  2: { key: 'agni',   en: 'Agni Panchak',   hi: 'अग्नि पंचक',   ok: false, effect: { en: 'Begins on Tuesday — risk of fire & accidents. Avoid fire, machinery, sharp tools, court cases and disputes.', hi: 'मंगलवार से आरंभ — अग्नि व दुर्घटना का योग। आग, मशीनरी, धारदार औज़ार, मुकदमे व विवाद से बचें।' } },
  3: { key: 'sadharan', en: 'Panchak',      hi: 'पंचक',        ok: true,  effect: { en: 'Begins on Wednesday — no special dosha. An ordinary Panchak; the general cautions still apply lightly.', hi: 'बुधवार से आरंभ — कोई विशेष दोष नहीं। सामान्य पंचक; साधारण सावधानियाँ हल्के रूप में लागू रहती हैं।' } },
  4: { key: 'sadharan', en: 'Panchak',      hi: 'पंचक',        ok: true,  effect: { en: 'Begins on Thursday — no special dosha. An ordinary Panchak; the general cautions still apply lightly.', hi: 'गुरुवार से आरंभ — कोई विशेष दोष नहीं। सामान्य पंचक; साधारण सावधानियाँ हल्के रूप में लागू रहती हैं।' } },
  5: { key: 'chor',   en: 'Chor Panchak',   hi: 'चोर पंचक',    ok: false, effect: { en: 'Begins on Friday — risk of theft & loss. Avoid travel, big deals, lending money and large purchases.', hi: 'शुक्रवार से आरंभ — चोरी व हानि का योग। यात्रा, बड़े सौदे, उधार व बड़ी खरीद से बचें।' } },
  6: { key: 'mrityu', en: 'Mrityu Panchak', hi: 'मृत्यु पंचक', ok: false, effect: { en: 'Begins on Saturday — risk of danger & accidents. Be extra careful; postpone risky work and long journeys.', hi: 'शनिवार से आरंभ — मृत्युतुल्य कष्ट व दुर्घटना का योग। अत्यधिक सावधानी रखें; जोखिम भरे कार्य व लंबी यात्रा टालें।' } },
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtLocal(ms, tzMin) {
  const d = new Date(ms + tzMin * 60000);
  let h = d.getUTCHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  const mm = d.getUTCMinutes();
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${h}:${mm < 10 ? '0' : ''}${mm} ${ap}`;
}
const weekdayInTz = (ms, tzMin) => new Date(ms + tzMin * 60000).getUTCDay();

const DAY = 86400000;
// bisect where inPanchak flips between a (false-side) and b (true-side) → returns the true-side edge
function edge(aMs, bMs) {
  // invariant: inPanchak(a) !== inPanchak(b). Return the boundary time (~30s precision).
  const aIn = inPanchak(new Date(aMs));
  for (let i = 0; i < 46 && bMs - aMs > 30000; i += 1) {
    const m = (aMs + bMs) / 2;
    if (inPanchak(new Date(m)) === aIn) aMs = m; else bMs = m;
  }
  return bMs;
}

// scan forward from `fromMs` to the next moment Panchak starts (up to ~32 days)
function nextEntry(fromMs) {
  let a = fromMs;
  for (let t = fromMs + 6 * 3600000; t < fromMs + 33 * DAY; t += 6 * 3600000) {
    if (inPanchak(new Date(t))) return edge(a, t);
    a = t;
  }
  return null;
}

/** Compute Panchak status for a reference instant. Returns null on any ephemeris error. */
function computePanchak(refDate, tzMin) {
  try {
    const now = refDate.getTime();
    let active, startMs, endMs;
    if (inPanchak(refDate)) {
      active = true;
      startMs = edge(now - 7 * DAY, now);   // false(-7d) → true(now): boundary = start
      endMs = exitForward(now);             // true(now) → false(fwd): boundary = end
    } else {
      active = false;
      startMs = nextEntry(now);
      if (startMs == null) return null;
      endMs = exitForward(startMs + 60000);
    }
    const wd = weekdayInTz(startMs, tzMin);
    const type = TYPES[wd];
    return {
      active,
      type: { key: type.key, en: type.en, hi: type.hi, auspicious: type.ok, effect: type.effect },
      startAt: startMs, endAt: endMs,
      startLabel: fmtLocal(startMs, tzMin), endLabel: fmtLocal(endMs, tzMin),
    };
  } catch { return null; }
}

// find the moment Panchak ENDS at or after tMs (true→false forward). tMs must be in Panchak.
function exitForward(tMs) {
  let a = tMs;
  for (let t = tMs + 3 * 3600000; t < tMs + 8 * DAY; t += 3 * 3600000) {
    if (!inPanchak(new Date(t))) return edge(a, t); // a(true) < t(false) → boundary = end
    a = t;
  }
  return tMs + 5 * DAY; // safety
}

module.exports = { computePanchak, inPanchak };
