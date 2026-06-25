const { getPanchang } = require('../services/vedastro.service');
const asyncHandler = require('../middleware/asyncHandler');
const { callAI } = require('../services/ai.service');
const {
  searchFestivalCatalog,
  catalogToObservance,
  matchFestivalRule,
  candidateWindows,
  enrichFestivalDetail,
} = require('../services/festival.service');

// POST /api/panchang  { place, date?:'DD/MM/YYYY' } ya { lat, lng, date? }
exports.createPanchang = asyncHandler(async (req, res) => {
  const { lat, lng, place, date, tz } = req.body;
  if (place == null && (lat == null || lng == null)) {
    return res.status(400).json({ error: 'Chahiye: place YA lat+lng' });
  }
  res.json(await getPanchang({ lat, lng, place, date, tz }));
});

const pad2 = (n) => (n < 10 ? '0' : '') + n;
const toDMY = (d) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const fromDMY = (value) => {
  if (!value) return new Date();
  const [dd, mm, yy] = String(value).split('/').map(Number);
  return new Date(yy, mm - 1, dd);
};
const weekdayName = (dateObj) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
const weekdayNameHi = (dateObj) => ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'][dateObj.getDay()];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function festivalItemFromDate({ festival, dmy, lat, lng, place, tz }) {
  const fallbackDate = fromDMY(dmy);
  try {
    const panchang = await getPanchang({
      lat,
      lng,
      place,
      date: dmy,
      tz,
      includeTransitions: false,
      includeMoonTimes: false,
    });
    return {
      date: panchang.date,
      weekday: panchang.weekday,
      weekdayHi: panchang.weekdayHi,
      tithi: panchang.tithi,
      nakshatra: panchang.nakshatra,
      masa: panchang.masa,
      sunrise: panchang.sunrise,
      sunset: panchang.sunset,
      observances: [catalogToObservance(festival)],
      catalog: {
        key: festival.key,
        name: festival.name,
        guidance: festival.guidance,
        why: festival.why,
        aarti: festival.aarti,
      },
    };
  } catch (_) {
    return {
      date: dmy,
      weekday: weekdayName(fallbackDate),
      weekdayHi: weekdayNameHi(fallbackDate),
      tithi: null,
      nakshatra: null,
      masa: null,
      sunrise: null,
      sunset: null,
      observances: [catalogToObservance(festival)],
      catalog: {
        key: festival.key,
        name: festival.name,
        guidance: festival.guidance,
        why: festival.why,
        aarti: festival.aarti,
        dateConfidence: 'catalog-date',
      },
    };
  }
}
const minToHM = (min) => {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h < 12 ? 'AM' : 'PM';
  h %= 12;
  if (h === 0) h = 12;
  return `${h}:${m < 10 ? '0' : ''}${m} ${ap}`;
};
const includesText = (value, query) => String(value || '').toLowerCase().includes(query);
const localText = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return lang === 'hi' ? (value.hi || value.en || '') : (value.en || value.hi || '');
};
const periodFromMinutes = (name, start, end, quality, advice, source) => ({
  name,
  start: minToHM(start),
  end: minToHM(end),
  quality,
  advice,
  source,
});
const buildFestivalDetail = ({ panchang, observance, lang }) => {
  const L = lang === 'hi' ? 'hi' : 'en';
  const sunrise = panchang.timings && panchang.timings.sunrise;
  const sunset = panchang.timings && panchang.timings.sunset;
  const moonrise = panchang.timings && panchang.timings.moonrise;
  const startDay = sunrise ? sunrise.minutesFromMidnight : null;
  const evening = sunset ? sunset.minutesFromMidnight : null;
  const key = observance.key || '';
  const name = localText(observance.name, L);
  const recommendedMuhurat = [];
  const addAuspicious = () => {
    (panchang.auspicious || []).forEach((p) => recommendedMuhurat.push({
      name: p.name,
      start: p.start,
      end: p.end,
      quality: 'auspicious',
      advice: L === 'hi'
        ? (p.name === 'Abhijit Muhurat' ? 'किसी भी सामान्य शुभ कार्य के लिए श्रेष्ठ मध्याह्न समय।' : p.name === 'Brahma Muhurat' ? 'प्रार्थना, ध्यान, जप और अध्ययन के लिए उत्तम।' : p.note)
        : p.note,
      source: 'daily-panchang',
    }));
  };

  if (key.includes('pradosh') && evening != null) {
    recommendedMuhurat.push(periodFromMinutes(L === 'hi' ? 'प्रदोष पूजा समय' : 'Pradosh Puja Window', evening, evening + 144, 'festival', L === 'hi' ? 'सूर्यास्त के बाद शिव पूजा के लिए श्रेष्ठ।' : 'Best for Shiva puja after sunset.', 'sunset-based pradosh window'));
  } else if (key.includes('diwali') && evening != null) {
    recommendedMuhurat.push(periodFromMinutes(L === 'hi' ? 'लक्ष्मी पूजा आधार मुहूर्त' : 'Lakshmi Puja Base Window', evening, evening + 144, 'festival', L === 'hi' ? 'यह प्रदोष आधार समय है; सटीक दीवाली मुहूर्त में अमावस्या और स्थिर लग्न भी देखना चाहिए।' : 'Use this Pradosh base window; exact Diwali muhurat should also check Amavasya overlap and Sthir Lagna.', 'pradosh-base'));
  } else if (key.includes('holika') && evening != null) {
    recommendedMuhurat.push(periodFromMinutes(L === 'hi' ? 'होलिका दहन आधार मुहूर्त' : 'Holika Dahan Base Window', evening, evening + 144, 'festival', L === 'hi' ? 'भद्रा देखकर ही उपयोग करें। भद्रा सक्रिय हो तो इस समय से बचें।' : 'Use only after checking Bhadra. If Bhadra is active, avoid this period.', 'post-sunset-base'));
  } else if (key.includes('sankashti')) {
    if (moonrise) {
      recommendedMuhurat.push(periodFromMinutes(L === 'hi' ? 'चन्द्रोदय व्रत पारण' : 'Moonrise Vrat Opening', moonrise.minutesFromMidnight, moonrise.minutesFromMidnight + 45, 'vrat', L === 'hi' ? 'चन्द्र दर्शन के बाद परंपरागत रूप से उपयोग होता है।' : 'Traditionally used after moon darshan.', 'moonrise'));
    }
    addAuspicious();
  } else if (key.includes('ekadashi')) {
    if (startDay != null) recommendedMuhurat.push(periodFromMinutes(L === 'hi' ? 'व्रत संकल्प' : 'Vrat Sankalp', startDay, startDay + 90, 'vrat', L === 'hi' ? 'संकल्प, विष्णु पूजा और मंत्र-जप के लिए शुभ।' : 'Good for sankalp, Vishnu puja and mantra japa.', 'sunrise'));
    addAuspicious();
  } else if (key.includes('amavasya')) {
    if (startDay != null) recommendedMuhurat.push(periodFromMinutes(L === 'hi' ? 'पितृ तर्पण समय' : 'Pitru Tarpan Window', startDay + 60, startDay + 180, 'ritual', L === 'hi' ? 'तर्पण, दान और शांत साधना के लिए शुभ।' : 'Good for tarpan, daan and quiet spiritual practice.', 'morning-window'));
    addAuspicious();
  } else {
    addAuspicious();
  }

  const doList = L === 'hi'
    ? ['पूजा और संकल्प शांत मन से करें।', 'राहुकाल/यमगण्ड में नया शुभ कार्य शुरू न करें।', 'तिथि और नक्षत्र के अंत समय को देखकर मुख्य अनुष्ठान रखें।']
    : ['Perform puja and sankalp with a calm mind.', 'Do not start major auspicious work during Rahu Kaal or Yamaganda.', 'Check tithi and nakshatra end-times before the main ritual.'];
  const avoidList = L === 'hi'
    ? ['जल्दबाजी में मुहूर्त तय न करें।', 'भद्रा/विष्टि करण हो तो मांगलिक कार्य टालें।', 'जगह बदलने पर समय फिर से गणना करें।']
    : ['Do not choose a muhurat in a hurry.', 'Avoid auspicious ceremonies during Bhadra/Vishti Karana.', 'Recalculate timings if the location changes.'];

  return {
    date: panchang.date,
    location: panchang.location,
    observance,
    title: name,
    panchang: {
      weekday: L === 'hi' ? panchang.weekdayHi : panchang.weekday,
      tithi: L === 'hi' ? panchang.tithi && panchang.tithi.hi : panchang.tithi && panchang.tithi.name,
      paksha: L === 'hi' ? panchang.tithi && panchang.tithi.pakshaHi : panchang.tithi && panchang.tithi.paksha,
      nakshatra: L === 'hi' ? panchang.nakshatra && panchang.nakshatra.hi : panchang.nakshatra && panchang.nakshatra.name,
      sunrise: panchang.sunrise,
      sunset: panchang.sunset,
      moonrise: panchang.moonrise || null,
      moonset: panchang.moonset || null,
    },
    recommendedMuhurat,
    avoidMuhurat: panchang.inauspicious || [],
    doList,
    avoidList,
    note: L === 'hi'
      ? 'यह विवरण पंचांग गणना पर आधारित है। विवाह, गृह-प्रवेश और बड़े संस्कारों के लिए अलग मुहूर्त-नियम जोड़ना जरूरी है।'
      : 'This detail is based on Panchang data. Major ceremonies and exact festival-specific muhurat need dedicated muhurat rules.',
  };
};

const asText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const normalizeMuhuratAdvice = (value, lang) => {
  const direct = asText(value);
  if (direct) return direct;
  if (!value || typeof value !== 'object') return '';
  const recommended = Array.isArray(value.recommended) ? value.recommended : (Array.isArray(value.auspicious) ? value.auspicious : []);
  const avoid = Array.isArray(value.avoid) ? value.avoid : (Array.isArray(value.inauspicious) ? value.inauspicious : []);
  const lines = [];
  if (recommended.length) {
    const label = lang === 'hi' ? 'शुभ समय' : 'Recommended';
    lines.push(`${label}: ${recommended.map((m) => [m.name, [m.start, m.end].filter(Boolean).join(' - '), m.advice].filter(Boolean).join(' | ')).filter(Boolean).join('; ')}`);
  }
  if (avoid.length) {
    const label = lang === 'hi' ? 'सावधानी' : 'Avoid';
    lines.push(`${label}: ${avoid.map((m) => [m.name, [m.start, m.end].filter(Boolean).join(' - '), m.note].filter(Boolean).join(' | ')).filter(Boolean).join('; ')}`);
  }
  return lines.join('\n');
};

const normalizeFestivalAI = (ai, lang) => {
  if (!ai || typeof ai !== 'object') return null;
  const ritualSteps = Array.isArray(ai.ritualSteps)
    ? ai.ritualSteps.map(asText).filter(Boolean)
    : asText(ai.ritualSteps) ? [asText(ai.ritualSteps)] : [];
  const caution = Array.isArray(ai.caution)
    ? ai.caution.map(asText).filter(Boolean).join('\n')
    : asText(ai.caution);
  return {
    summary: asText(ai.summary),
    ritualSteps,
    muhuratAdvice: normalizeMuhuratAdvice(ai.muhuratAdvice, lang),
    caution,
  };
};

// POST /api/panchang/festivals { place|lat+lng, date?:'DD/MM/YYYY', days?:1..45 }
exports.listPanchangFestivals = asyncHandler(async (req, res) => {
  const { lat, lng, place, date, tz } = req.body;
  if (place == null && (lat == null || lng == null)) {
    return res.status(400).json({ error: 'Chahiye: place YA lat+lng' });
  }
  const days = Math.max(1, Math.min(45, Number(req.body.days || 21)));
  const start = fromDMY(date);
  const items = [];
  const errors = [];

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dmy = toDMY(d);
    try {
      const panchang = await getPanchang({
        lat,
        lng,
        place,
        date: dmy,
        tz,
        includeTransitions: false,
        includeMoonTimes: false,
      });
      if ((panchang.observances || []).length) {
        items.push({
          date: panchang.date,
          weekday: panchang.weekday,
          weekdayHi: panchang.weekdayHi,
          tithi: panchang.tithi,
          nakshatra: panchang.nakshatra,
          masa: panchang.masa,
          sunrise: panchang.sunrise,
          sunset: panchang.sunset,
          observances: panchang.observances,
        });
      }
    } catch (err) {
      errors.push({ date: dmy, error: err.message || 'Panchang unavailable' });
    }
    if (i < days - 1) await wait(15); // local ephemeris needs no rate-limit throttle
  }

  res.json({ from: toDMY(start), days, location: place || `${lat},${lng}`, items, errors });
});

// POST /api/panchang/festival-search { place|lat+lng, query, date?:'DD/MM/YYYY', years?:1..3 }
exports.searchPanchangFestivalDates = asyncHandler(async (req, res) => {
  const { lat, lng, place, date, tz, query } = req.body;
  if (place == null && (lat == null || lng == null)) {
    return res.status(400).json({ error: 'Chahiye: place YA lat+lng' });
  }
  const start = fromDMY(date);
  const years = Math.max(1, Math.min(3, Number(req.body.years || 2)));
  const catalog = searchFestivalCatalog(query).slice(0, 8);
  const items = [];
  const errors = [];

  for (const festival of catalog) {
    let found = false;
    const knownDates = Object.values(festival.knownDates || {})
      .filter((dmy) => fromDMY(dmy) >= start)
      .sort((a, b) => fromDMY(a) - fromDMY(b));
    if (knownDates.length) {
      items.push(await festivalItemFromDate({ festival, dmy: knownDates[0], lat, lng, place, tz }));
      found = true;
    }
    const windows = candidateWindows(start, festival, years);
    for (const w of windows) {
      if (found) break;
      const cur = new Date(Math.max(w.from.getTime(), start.getTime()));
      while (cur <= w.to && !found) {
        const dmy = toDMY(cur);
        try {
          const panchang = await getPanchang({
            lat,
            lng,
            place,
            date: dmy,
            tz,
            includeTransitions: false,
            includeMoonTimes: false,
          });
          if (matchFestivalRule(festival, panchang)) {
            items.push({
              date: panchang.date,
              weekday: panchang.weekday,
              weekdayHi: panchang.weekdayHi,
              tithi: panchang.tithi,
              nakshatra: panchang.nakshatra,
              masa: panchang.masa,
              sunrise: panchang.sunrise,
              sunset: panchang.sunset,
              observances: [catalogToObservance(festival)],
              catalog: {
                key: festival.key,
                name: festival.name,
                guidance: festival.guidance,
                why: festival.why,
                aarti: festival.aarti,
              },
            });
            found = true;
          }
        } catch (err) {
          if (errors.length < 12) errors.push({ date: dmy, festival: festival.key, error: err.message || 'Panchang unavailable' });
        }
        cur.setDate(cur.getDate() + 1);
        if (!found) await wait(10);
      }
    }
  }

  res.json({ query: query || '', from: toDMY(start), years, location: place || `${lat},${lng}`, items, errors });
});

// POST /api/panchang/festival-detail { place|lat+lng, date, key?, query?, lang?, ai?:boolean }
exports.getPanchangFestivalDetail = asyncHandler(async (req, res) => {
  const { lat, lng, place, date, tz, key, query, lang } = req.body;
  if (place == null && (lat == null || lng == null)) {
    return res.status(400).json({ error: 'Chahiye: place YA lat+lng' });
  }
  if (!date) return res.status(400).json({ error: 'date chahiye DD/MM/YYYY' });

  const q = String(query || '').trim().toLowerCase();
  const catalogMatch = searchFestivalCatalog(key || query).find((f) => !key || f.key === key) || null;
  let panchang;
  try {
    panchang = await getPanchang({ lat, lng, place, date, tz });
  } catch (err) {
    if (!catalogMatch) throw err;
    const d = fromDMY(date);
    panchang = {
      date,
      weekday: weekdayName(d),
      weekdayHi: weekdayNameHi(d),
      location: place || `${lat},${lng}`,
      tithi: null,
      nakshatra: null,
      yoga: null,
      karana: null,
      masa: null,
      sunrise: null,
      sunset: null,
      moonrise: null,
      moonset: null,
      timings: null,
      auspicious: [],
      inauspicious: [],
      observances: [],
    };
  }
  const observance = (panchang.observances || []).find((o) => (
    (key && o.key === key)
    || (q && (includesText(o.key, q) || includesText(o.name && o.name.en, q) || includesText(o.name && o.name.hi, q)))
  )) || (catalogMatch ? catalogToObservance(catalogMatch) : null) || (panchang.observances || [])[0] || {
    key: 'daily-panchang',
    name: { en: 'Daily Panchang', hi: 'दैनिक पंचांग' },
    type: 'panchang',
    importance: 'regular',
    guidance: { en: 'Use the daily Panchang timings for planning.', hi: 'योजना के लिए दैनिक पंचांग समय देखें।' },
  };

  const detail = enrichFestivalDetail(buildFestivalDetail({ panchang, observance, lang }), catalogMatch, lang);
  let ai = null;
  let aiError = null;
  if (req.body.ai !== false) {
    try {
      ai = await callAI(`You are a careful Vedic Panchang assistant.
Return STRICT JSON with keys: summary, ritualSteps, muhuratAdvice, caution.
Do not invent astronomical data. Use only the provided Panchang and deterministic detail.
Language: ${lang === 'hi' ? 'Hindi Devanagari' : 'simple English'}.
Panchang/detail JSON:
${JSON.stringify(detail)}`, { json: true });
      ai = normalizeFestivalAI(ai, lang);
    } catch (err) {
      aiError = err.message || 'AI guide unavailable';
    }
  }

  res.json({ ...detail, ai, aiError });
});
