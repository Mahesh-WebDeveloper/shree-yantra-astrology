// Builds a Vedic-themed Janam Patri (जन्म पत्रिका) HTML for expo-print → PDF.
// Pure string builder — fed by kundli + vedic-reading + name-suggestions + life-timeline data.
import { KundliResponse, VedicReadingResponse, NameSuggestionsResponse, LifeTimelineResponse, RemediesResponse, GocharResponse, VargaResponse, TransitForecastResponse, ApiPlanet } from './api';

export interface JanamPatriData {
  person: { name?: string; gender?: string; dob: string; tob: string; place: string; lang?: 'en' | 'hi'; chartStyle?: 'north' | 'south' | 'east' };
  kundli?: KundliResponse | null;
  reading?: VedicReadingResponse | null;
  names?: NameSuggestionsResponse | null;
  timeline?: LifeTimelineResponse | null;
  remedies?: RemediesResponse | null;
  gochar?: GocharResponse | null;
  varga?: VargaResponse | null;
  transitForecast?: TransitForecastResponse | null;
}

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
const DASH = '—';
const hnum = (h?: string | null) => { const m = String(h || '').match(/\d+/); return m ? m[0] : DASH; };

const PLANET_HI: Record<string, string> = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु', Ascendant: 'लग्न', Lagna: 'लग्न' };
const PLANET_ABBR: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const PLANET_ABBR_HI: Record<string, string> = { Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु', Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के' };
const SIGN_HI: Record<string, string> = { Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन' };
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_ABBR_HI = ['मे', 'वृ', 'मि', 'क', 'सिं', 'कन', 'तु', 'वृश', 'ध', 'मक', 'कुं', 'मी'];
const SIGN_LIST = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const CELL: Record<number, [number, number]> = { 11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0] };
const HPOS: Record<number, [number, number]> = {
  1: [100, 40], 2: [52, 24], 3: [26, 54], 4: [54, 100], 5: [26, 150], 6: [52, 176],
  7: [100, 150], 8: [148, 176], 9: [174, 150], 10: [148, 100], 11: [174, 54], 12: [148, 24],
};

const pickLang = (hi: boolean, en: string, hiText: string) => (hi ? hiText : en);
const planetName = (name: string | null | undefined, hi: boolean) => hi && name ? (PLANET_HI[name] || name) : (name || '');
const signName = (name: string | null | undefined, hi: boolean) => hi && name ? (SIGN_HI[name] || name) : (name || '');
const planetAbbr = (p: string, hi: boolean) => (hi ? PLANET_ABBR_HI[p] : PLANET_ABBR[p]) || p.slice(0, 2);
const translatedText = (value: any, hi: boolean) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return hi ? (value.hi || value.nameHi || value.Hindi || value.en || value.name || value.Name || '') : (value.en || value.name || value.Name || value.hi || value.nameHi || '');
};
const retroText = (hi: boolean) => (hi ? 'वक्री' : 'Retrograde');
const noText = (hi: boolean) => (hi ? 'नहीं' : 'No');
const yesText = (hi: boolean) => (hi ? 'हाँ' : 'Yes');
const currentText = (hi: boolean) => (hi ? 'वर्तमान' : 'Current');
const fromMoonText = (hi: boolean, house: any) => hi ? `चंद्र से ${house}` : `${house} from Moon`;
function section(title: string, body: string, className = ''): string {
  if (!body) return '';
  return `<section class="pdf-section ${className}"><h2>${title}</h2>${body}</section>`;
}

function tableHtml(head: string, rows: string[], className = ''): string {
  if (!rows.length) return '';
  return `<table class="${className}"><thead>${head}</thead><tbody>${rows.join('')}</tbody></table>`;
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function tableSections(title: string, head: string, rows: string[], chunkSize: number, className = ''): string {
  const continued = /[\u0900-\u097F]/.test(title) ? 'जारी' : 'Continued';
  return chunks(rows, chunkSize).map((chunk, i) => section(
    i === 0 ? title : `${title} · ${continued}`,
    tableHtml(head, chunk, className),
    'table-section',
  )).join('');
}

function easyBlock(hi: boolean, en: string, hiText: string, exampleEn?: string, exampleHi?: string): string {
  const example = exampleEn || exampleHi
    ? '<p class="easy-example"><b>' + esc(pickLang(hi, 'Example', 'उदाहरण')) + ':</b> ' + esc(pickLang(hi, exampleEn || '', exampleHi || exampleEn || '')) + '</p>'
    : '';
  return '<div class="easy-block"><div class="easy-title">' + esc(pickLang(hi, 'Understand in simple words', 'सरल भाषा में समझें')) + '</div><p>' + esc(pickLang(hi, en, hiText)) + '</p>' + example + '</div>';
}

function easyMini(hi: boolean, en: string, hiText: string, exampleEn?: string, exampleHi?: string): string {
  return '<div class="easy-mini"><b>' + esc(pickLang(hi, 'Simple meaning', 'सरल अर्थ')) + ':</b> ' + esc(pickLang(hi, en, hiText)) + (exampleEn || exampleHi ? '<br/><span><b>' + esc(pickLang(hi, 'Example', 'उदाहरण')) + ':</b> ' + esc(pickLang(hi, exampleEn || '', exampleHi || exampleEn || '')) + '</span>' : '') + '</div>';
}
function predictionSimple(hi: boolean, title: string, text: string): string {
  const hay = (title + ' ' + text).toLowerCase();
  if (/career|profession|job|work|karma|karier|naukri|vyavsay|करियर|नौकरी|व्यवसाय/.test(hay)) {
    return easyMini(hi, 'This point talks about work direction. It shows where effort, discipline and timing may give better results.', 'यह बात काम और करियर की दिशा समझाती है। मेहनत, अनुशासन और सही समय से बेहतर परिणाम मिल सकते हैं।', 'If the 10th house is strong, steady growth is usually better than shortcuts.', 'यदि दशम भाव मजबूत हो, तो शॉर्टकट के बजाय नियमित और स्थिर प्रयास अधिक लाभ देते हैं।');
  }
  if (/marriage|relationship|partner|vivah|sambandh|विवाह|संबंध|रिश्त/.test(hay)) {
    return easyMini(hi, 'This point is about relationship behavior. Patience, communication and family support matter here.', 'यह बात रिश्तों के स्वभाव को समझाती है। यहां धैर्य, साफ बातचीत और परिवार का सहयोग महत्वपूर्ण रहता है।', 'A difficult Venus or Mars signal means avoid decisions in anger.', 'यदि शुक्र या मंगल चुनौती दे रहे हों, तो क्रोध में निर्णय लेने से बचना चाहिए।');
  }
  if (/health|body|disease|swasthya|rog|sehat|स्वास्थ्य|रोग|सेहत/.test(hay)) {
    return easyMini(hi, 'This is a caution area, not a medical diagnosis. Use it as a reminder for routine, sleep and checkups.', 'यह सावधानी का संकेत है, चिकित्सा निदान नहीं। इसे दिनचर्या, नींद और स्वास्थ्य जांच की याद दिलाने वाली बात की तरह लें।', 'If Moon looks stressed, emotional rest and regular sleep become more important.', 'यदि चंद्र कमजोर या तनावग्रस्त दिखे, तो भावनात्मक आराम और नियमित नींद अधिक जरूरी हो जाती है।');
  }
  if (/money|finance|wealth|dhan|vitt|labh|धन|लाभ|वित्त/.test(hay)) {
    return easyMini(hi, 'This explains money flow and saving style. Plan expenses and avoid risky decisions in weak periods.', 'यह धन के प्रवाह और बचत की शैली को समझाता है। कमजोर समय में खर्च और जोखिम को सोच-समझकर संभालना चाहिए।', 'A strong 2nd or 11th house supports gains, but dasha timing shows when results become visible.', 'यदि द्वितीय या एकादश भाव मजबूत हों तो लाभ का समर्थन मिलता है, पर परिणाम कब दिखेंगे यह दशा बताती है।');
  }
  return easyMini(hi, 'Read this as a tendency shown by the chart. The result improves when choices, effort and timing support it.', 'इसे कुंडली में दिखने वाली प्रवृत्ति की तरह पढ़ें। सही चुनाव, प्रयास और समय साथ दें तो परिणाम बेहतर हो सकता है।', 'A yoga gives potential; daily action decides how much of that potential becomes real.', 'योग क्षमता दिखाता है; रोज के कर्म तय करते हैं कि वह क्षमता कितनी वास्तविक बनती है।');
}
// SVG chart string for any style (north/south/east) — for the PDF
function svgChart(title: string, planets: ApiPlanet[], ascendant: string | null | undefined, style: 'north' | 'south' | 'east', hi = false): string {
  const bySign: Record<number, string[]> = {}; const byHouse: Record<number, string[]> = {};
  (planets || []).forEach((p) => {
    const si = SIGN_LIST.indexOf(p.sign || ''); if (si >= 0) (bySign[si] = bySign[si] || []).push(planetAbbr(p.planet, hi));
    const h = hnum(p.house); if (h && h !== DASH) (byHouse[Number(h)] = byHouse[Number(h)] || []).push(planetAbbr(p.planet, hi));
  });
  const lag = ascendant != null ? SIGN_LIST.indexOf(ascendant) : -1;
  const abbrs = hi ? SIGN_ABBR_HI : SIGN_ABBR;
  const T = (x: number, y: number, t: string, sz = 8, col = '#7a1f1f', w = '700') => `<text x="${x}" y="${y}" font-size="${sz}" fill="${col}" font-weight="${w}" text-anchor="middle" font-family="Georgia,serif">${esc(t)}</text>`;
  const toks = (arr: string[], x: number, y: number) => (arr || []).map((a, i) => T(x + ((i % 2) * 16 - (arr.length > 1 ? 8 : 0)), y + 9 + Math.floor(i / 2) * 8, a, 7.5, '#1f4ea1')).join('');
  let body = '';
  if (style === 'south') {
    body += `<rect x="10" y="10" width="180" height="180" fill="none" stroke="#7a1f1f" stroke-width="1.4"/>`;
    for (let i = 1; i <= 3; i++) body += `<line x1="${10 + i * 45}" y1="10" x2="${10 + i * 45}" y2="190" stroke="#c9a64a"/><line x1="10" y1="${10 + i * 45}" x2="190" y2="${10 + i * 45}" stroke="#c9a64a"/>`;
    Object.keys(CELL).forEach((si) => {
      const idx = Number(si); const [r, c] = CELL[idx]; const x0 = 10 + c * 45; const y0 = 10 + r * 45; const lg = idx === lag;
      body += T(x0 + 9, y0 + 11, abbrs[idx] + (lg ? '*' : ''), 7.5, lg ? '#b8860b' : '#9a7a2a');
      body += toks(bySign[idx] || [], x0 + 22, y0 + 14);
    });
  } else {
    body += `<rect x="10" y="10" width="180" height="180" fill="none" stroke="#7a1f1f" stroke-width="1.4"/>
      <line x1="10" y1="10" x2="190" y2="190" stroke="#c9a64a"/><line x1="190" y1="10" x2="10" y2="190" stroke="#c9a64a"/>
      <line x1="100" y1="10" x2="190" y2="100" stroke="#c9a64a"/><line x1="190" y1="100" x2="100" y2="190" stroke="#c9a64a"/>
      <line x1="100" y1="190" x2="10" y2="100" stroke="#c9a64a"/><line x1="10" y1="100" x2="100" y2="10" stroke="#c9a64a"/>`;
    for (let h = 1; h <= 12; h++) {
      const [x, y] = HPOS[h];
      if (style === 'east') { const si = h - 1; const lg = si === lag; body += T(x, y, abbrs[si] + (lg ? '*' : ''), 8, lg ? '#b8860b' : '#9a7a2a'); body += toks(bySign[si] || [], x, y); }
      else { const rashi = lag >= 0 ? ((lag + h - 1) % 12) + 1 : h; body += T(x, y, String(rashi), 9, '#b07a16'); body += toks(byHouse[h] || [], x, y); }
    }
  }
  return `<div class="chartbox"><div class="ctitle">${esc(title)}</div><svg viewBox="0 0 200 200" width="215" height="215">${body}</svg></div>`;
}
export function buildJanamPatriHtml(d: JanamPatriData): string {
  const p = d.person;
  const k = d.kundli?.data;
  const r = d.reading;
  const planets = (k?.planets || []).filter((x) => x.sign);
  const bp = r?.birthPanchang;
  const j = r?.janma;
  const nm = r?.naamakshar || d.names?.naamakshar;
  const bal = d.timeline?.balance;
  const cur = (d.timeline?.periods || []).find((x) => x.current);
  const hi = d.person.lang === 'hi';

  const planetRows = planets.map((x) => `
    <tr>
      <td class="pl">${esc(planetName(x.planet, hi))}</td>
      <td>${esc(signName(x.sign, hi))}</td>
      <td>${esc(x.degreeInSign || '')}</td>
      <td>${esc(translatedText(x.nakshatra, hi))}</td>
      <td>${hnum(x.house)}</td>
      <td>${x.isRetrograde === 'True' ? retroText(hi) : DASH}</td>
    </tr>`);

  const panchangRows = bp ? [
    `<tr><td>${pickLang(hi, 'Tithi', 'तिथि')}</td><td>${esc(translatedText(bp.tithi, hi))} (${esc(hi ? (bp.tithi.pakshaHi || bp.tithi.paksha) : (bp.tithi.paksha || bp.tithi.pakshaHi))})</td></tr>`,
    `<tr><td>${pickLang(hi, 'Nakshatra', 'नक्षत्र')}</td><td>${esc(translatedText(bp.nakshatra, hi))} ${pickLang(hi, 'Pada', 'चरण')} ${esc(bp.nakshatra.pada)}</td></tr>`,
    `<tr><td>${pickLang(hi, 'Yoga', 'योग')}</td><td>${esc(translatedText(bp.yoga, hi))}</td></tr>`,
    `<tr><td>${pickLang(hi, 'Karana', 'करण')}</td><td>${esc(translatedText(bp.karana, hi))}</td></tr>`,
    `<tr><td>${pickLang(hi, 'Masa', 'मास')}</td><td>${esc(translatedText(bp.masa?.amanta, hi))}</td></tr>`,
    `<tr><td>${pickLang(hi, 'Vikram Samvat', 'विक्रम संवत्')}</td><td>${esc(bp.samvat?.vikram || '')} ${esc(bp.samvatsara || '')}</td></tr>`,
  ] : [];

  const janmaRows = j ? [
    `<tr><td>${pickLang(hi, 'Gana', 'गण')}</td><td>${esc(translatedText(j.gana, hi))}</td><td>${pickLang(hi, 'Yoni', 'योनि')}</td><td>${esc(translatedText(j.yoni, hi))}</td></tr>`,
    `<tr><td>${pickLang(hi, 'Nadi', 'नाड़ी')}</td><td>${esc(translatedText(j.nadi, hi))}</td><td>${pickLang(hi, 'Varna', 'वर्ण')}</td><td>${esc(translatedText(j.varna, hi))}</td></tr>`,
    `<tr><td>${pickLang(hi, 'Naamakshar', 'नामाक्षर')}</td><td class="big">${esc(nm?.syllable || '')}</td><td>${pickLang(hi, 'Gandmool', 'गण्डमूल')}</td><td>${j.gandmool?.present ? yesText(hi) + ' (' + esc(j.gandmool.nakshatra) + ')' : noText(hi)}</td></tr>`,
  ] : [];

  const names = (d.names?.names || []).slice(0, 12).map((n) => `<span class="nchip"><b>${esc(hi ? (n.nameHi || n.name) : n.name)}</b> — ${esc(hi ? (n.meaningHi || n.meaning) : n.meaning)}</span>`).join('');

  const predItems = (r?.predictions || []).slice(0, 12).map((x) => {
    const title = hi ? (x.title.hi || x.title.en) : (x.title.en || x.title.hi);
    const text = hi ? (x.text.hi || x.text.en) : (x.text.en || x.text.hi);
    return `<li><div><b>${esc(title)}:</b> ${esc(text)} <i>(${esc(x.source || '')})</i></div>${predictionSimple(hi, title, text)}</li>`;
  });

  const cs = d.person.chartStyle || 'north';
  const styleLabel = cs === 'north' ? pickLang(hi, 'North Indian', 'उत्तर भारतीय') : cs === 'south' ? pickLang(hi, 'South Indian', 'दक्षिण भारतीय') : pickLang(hi, 'East Indian', 'पूर्व भारतीय');
  const d9 = (d.varga?.data?.charts || []).find((c: any) => c.code === 'D9');
  const chartsHtml = planets.length ? section(
    pickLang(hi, `Charts (${styleLabel} · Lahiri)`, `कुंडली चक्र (${styleLabel} · लाहिड़ी)`),
    `<div class="charts">${svgChart(pickLang(hi, 'D1 Lagna', 'D1 लग्न'), planets, k?.ascendant, cs, hi)}${d9 ? svgChart(pickLang(hi, 'D9 Navamsa', 'D9 नवांश'), d9.planets, d9.ascendantSign, cs, hi) : ''}</div>`,
    'chart-section',
  ) : '';

  const vlist = (d.varga?.data?.charts || []);
  const vargaRows = vlist.map((c: any) => `<tr><td class="pl">${esc(c.code)}</td><td>${esc(hi ? (c.nameHi || c.name || '') : (c.name || c.nameHi || ''))}</td><td>${esc(signName(c.ascendantSign || '', hi) || DASH)}</td></tr>`);
  const vargaHtml = tableSections(
    pickLang(hi, '16 Divisional Charts', '16 विभाजन चक्र'),
    pickLang(hi, '<tr><th>Varga</th><th>Name</th><th>Ascendant</th></tr>', '<tr><th>वर्ग</th><th>नाम</th><th>लग्न</th></tr>'),
    vargaRows,
    9,
  );

  const dperiods = (d.timeline?.periods || []);
  const dashaRows = dperiods.map((p) => {
    const phal = [p.phala?.effect, p.phala?.good, p.phala?.caution, p.phala?.remedy].filter(Boolean).join(' ');
    return `<tr class="${p.current ? 'current-row' : ''}"><td class="pl">${esc(planetName(p.lord, hi))}${p.current ? ` · ${currentText(hi)}` : ''}</td><td>${Math.round(p.fromAge)}–${Math.round(p.toAge)}</td><td>${p.fromYear}–${p.toYear}</td><td>${esc(phal || DASH)}</td></tr>`;
  });
  const dashaHtml = tableSections(
    pickLang(hi, 'Vimshottari Dasha Periods', 'विंशोत्तरी दशा-काल'),
    pickLang(hi, '<tr><th>Planet</th><th>Age</th><th>Years</th><th>Result</th></tr>', '<tr><th>ग्रह</th><th>आयु</th><th>वर्ष</th><th>फल</th></tr>'),
    dashaRows,
    5,
    'wide-table',
  );

  const gc = d.gochar;
  const gocharRows = (gc?.transits || []).map((tn) => `<tr><td class="pl">${esc(planetName(tn.planet, hi))}</td><td>${esc(signName(tn.sign, hi))}</td><td>${tn.houseFromMoon || DASH}</td></tr>`);
  const sadeText = gc?.sadeSati?.active ? (hi ? (gc.sadeSati.phaseHi || gc.sadeSati.phase || 'सक्रिय') : (gc.sadeSati.phase || 'Active')) : gc?.sadeSati?.dhaiya ? (hi ? 'ढैय्या' : 'Dhaiya') : noText(hi);
  const gocharHtml = gc ? section(
    pickLang(hi, 'Current Transits', 'वर्तमान गोचर'),
    `<div class="detailbox"><div><b>${pickLang(hi, 'Sade Sati', 'साढ़े साती')}:</b> ${esc(sadeText)}</div></div>${tableHtml(pickLang(hi, '<tr><th>Planet</th><th>Sign</th><th>House from Moon</th></tr>', '<tr><th>ग्रह</th><th>राशि</th><th>चंद्र से भाव</th></tr>'), gocharRows)}`,
    'table-section',
  ) : '';

  const tf = d.transitForecast;
  const forecastRows = (tf?.years || []).map((y) => `<tr class="${y.current ? 'current-row' : ''}">
      <td class="pl">${esc(y.year)}${y.current ? ` · ${currentText(hi)}` : ''}</td>
      <td>${esc(hi ? (y.shani.signHi || signName(y.shani.sign, true) || DASH) : (y.shani.sign || DASH))}${y.shani.houseFromMoon ? ` · ${fromMoonText(hi, y.shani.houseFromMoon)}` : ''}${y.shani.eventHi || y.shani.event ? `<br/><small>${esc(hi ? (y.shani.eventHi || y.shani.event) : (y.shani.event || y.shani.eventHi))}</small>` : ''}</td>
      <td>${esc(hi ? (y.guru.signHi || signName(y.guru.sign, true) || DASH) : (y.guru.sign || DASH))}${y.guru.houseFromMoon ? ` · ${fromMoonText(hi, y.guru.houseFromMoon)}` : ''}${y.guru.eventHi || y.guru.event ? `<br/><small>${esc(hi ? (y.guru.eventHi || y.guru.event) : (y.guru.event || y.guru.eventHi))}</small>` : ''}</td>
      <td>${esc(y.note || '')}</td>
    </tr>`);
  const forecastHead = pickLang(hi, '<tr><th>Year</th><th>Saturn</th><th>Jupiter</th><th>Note</th></tr>', '<tr><th>वर्ष</th><th>शनि</th><th>गुरु</th><th>नोट</th></tr>');
  const forecastHtml = forecastRows.length ? chunks(forecastRows, 5).map((chunk, i) => section(
    i === 0 ? pickLang(hi, 'Year-by-Year Forecast', 'साल-दर-साल गोचर') : pickLang(hi, 'Year-by-Year Forecast · Continued', 'साल-दर-साल गोचर · जारी'),
    `${i === 0 && tf?.summary ? `<div class="summary">${esc(tf.summary)}</div>` : ''}${tableHtml(forecastHead, chunk, 'wide-table')}`,
    'table-section',
  )).join('') : '';

  const rem = d.remedies?.remedies;
  const gem = rem?.lifeGem;
  const remHtml = rem ? section(
    pickLang(hi, 'Remedies', 'उपाय'),
    `
    ${gem ? `<div class="detailbox"><div><b>${pickLang(hi, 'Life Gem', 'भाग्य रत्न')}:</b> ${esc(hi ? (gem.gemstoneHi || gem.gemstone) : gem.gemstone)} (${esc(planetName(gem.planet, hi))}) · ${esc(hi ? (gem.metalHi || gem.metal || '') : (gem.metal || ''))} · ${esc(hi ? (gem.fingerHi || gem.finger || '') : (gem.finger || ''))} · ${esc(hi ? (gem.dayHi || gem.day || '') : (gem.day || ''))}</div></div>` : ''}
    ${gem?.mantra ? `<p class="mantra">${esc(gem.mantra)}</p>` : ''}
    <ul>${(rem.doshaRemedies || []).filter((x) => x.present).map((x) => `<li><b>${esc(hi ? (x.nameHi || x.name) : x.name)}:</b> ${esc(hi ? (x.mantraHi || x.mantra || '') : (x.mantra || ''))} ${(x.remedies || []).slice(0, 2).map((y) => esc(hi ? (y.titleHi || y.title) : y.title)).join('; ')}</li>`).join('')}</ul>`,
  ) : '';

  const reportItems = [
    [pickLang(hi, 'D1 Lagna Chart', 'D1 लग्न चक्र'), planets.length],
    [pickLang(hi, 'D9 Navamsa', 'D9 नवांश'), !!d9],
    [pickLang(hi, '16 Varga Summary', '16 वर्ग सारांश'), vlist.length],
    [pickLang(hi, 'Birth Panchang', 'जन्म पंचांग'), !!bp],
    [pickLang(hi, 'Planetary Positions', 'ग्रह स्थिति'), planetRows.length],
    [pickLang(hi, 'Vimshottari Dasha', 'विंशोत्तरी दशा'), dperiods.length],
    [pickLang(hi, 'Current Transits', 'वर्तमान गोचर'), !!gc],
    [pickLang(hi, 'Year Forecast', 'वार्षिक गोचर'), (tf?.years || []).length],
    [pickLang(hi, 'Vedic Predictions', 'वैदिक फलादेश'), predItems.length],
    [pickLang(hi, 'Remedies', 'उपाय'), !!rem],
    [pickLang(hi, 'Naamkaran', 'नामकरण'), !!names],
  ].filter(([, ok]) => !!ok);
  const reportScopeHtml = section(pickLang(hi, 'Report Includes', 'रिपोर्ट में शामिल'), `<div class="reportgrid">${reportItems.map(([label]) => `<div class="reportitem">${esc(label)}</div>`).join('')}</div>`, 'compact-section');

  const readingGuideHtml = section(pickLang(hi, 'How to read this report', 'इस रिपोर्ट को कैसे पढ़ें'), easyBlock(hi, 'Every calculation is first shown as data, then explained in simple words. Use the simple notes for meaning and the tables for verification.', 'हर गणना पहले डेटा के रूप में दी गई है, फिर सरल भाषा में समझाई गई है। अर्थ समझने के लिए सरल नोट पढ़ें और सत्यापन के लिए तालिकाएं देखें।', 'If a section says Moon sign, the table lets you check the exact Moon placement used for it.', 'यदि किसी भाग में चंद्र राशि लिखी है, तो तालिका में उसी चंद्र स्थिति को जांच सकते हैं।'), 'compact-section explain-only');
  const panchangExplainHtml = panchangRows.length ? section(pickLang(hi, 'Birth Panchang in simple words', 'जन्म पंचांग सरल भाषा में'), easyBlock(hi, 'Birth panchang describes the quality of the birth moment: tithi, nakshatra, yoga and karana.', 'जन्म पंचांग जन्म के क्षण की प्रकृति बताता है: तिथि, नक्षत्र, योग और करण।', 'Nakshatra is used for naamakshar, dasha balance and many personality indications.', 'नक्षत्र से नामाक्षर, जन्म दशा और स्वभाव के कई संकेत निकाले जाते हैं।'), 'compact-section explain-only') : '';
  const planetExplainHtml = planetRows.length ? section(pickLang(hi, 'Planet positions in simple words', 'ग्रह स्थिति सरल भाषा में'), easyBlock(hi, 'This table tells where each planet was placed at birth. Sign shows style, house shows life area, and nakshatra gives finer behavior.', 'यह तालिका बताती है कि जन्म के समय हर ग्रह कहां स्थित था। राशि ग्रह की शैली बताती है, भाव जीवन का क्षेत्र बताता है और नक्षत्र सूक्ष्म स्वभाव दिखाता है।', 'Mars in the 10th house affects work and ambition; Venus in the 7th affects relationships.', 'जैसे मंगल दशम भाव में हो तो काम और महत्वाकांक्षा पर प्रभाव देता है; शुक्र सप्तम भाव में हो तो रिश्तों पर प्रभाव देता है।'), 'compact-section explain-only') : '';
  const janmaExplainHtml = janmaRows.length ? section(pickLang(hi, 'Janma details in simple words', 'जन्म विवरण सरल भाषा में'), easyBlock(hi, 'These details are used in naamkaran, compatibility and basic nature reading.', 'ये विवरण नामकरण, कुंडली मिलान और मूल स्वभाव समझने में उपयोग होते हैं।', 'Gana and Nadi are often checked during kundli milan.', 'कुंडली मिलान में गण और नाड़ी को अक्सर महत्वपूर्ण माना जाता है।'), 'compact-section explain-only') : '';
  const dashaExplainHtml = dperiods.length || bal ? section(pickLang(hi, 'Dasha in simple words', 'दशा सरल भाषा में'), easyBlock(hi, 'Dasha is the timing system. It shows which planet is currently more active in life events.', 'दशा समय बताने वाली पद्धति है। इससे पता चलता है कि जीवन की घटनाओं में अभी कौन सा ग्रह अधिक सक्रिय है।', 'A good career yoga may show stronger results when a supportive dasha runs.', 'अच्छा करियर योग भी तब अधिक परिणाम देता है जब अनुकूल दशा चल रही हो।'), 'compact-section explain-only') : '';
  const gocharExplainHtml = gc ? section(pickLang(hi, 'Transits in simple words', 'गोचर सरल भाषा में'), easyBlock(hi, 'Transits compare moving planets with the birth chart, especially from the Moon sign.', 'गोचर वर्तमान ग्रहों को जन्म कुंडली, विशेषकर चंद्र राशि से तुलना करके समझता है।', 'Saturn from Moon may show responsibility, delay or pressure depending on the house.', 'चंद्र से शनि जिस भाव में हो, उसके अनुसार जिम्मेदारी, देरी या दबाव दिखा सकता है।'), 'compact-section explain-only') : '';
  const forecastExplainHtml = forecastRows.length ? section(pickLang(hi, 'Year forecast in simple words', 'वार्षिक गोचर सरल भाषा में'), easyBlock(hi, 'This section gives a practical year-wise view using slow planets like Saturn and Jupiter.', 'यह भाग शनि और गुरु जैसे धीमी गति वाले ग्रहों से साल-दर-साल व्यावहारिक संकेत देता है।', 'Jupiter support can open learning, guidance or growth; Saturn can ask for discipline.', 'गुरु सीखने, मार्गदर्शन और वृद्धि में सहायता दे सकता है; शनि अनुशासन मांगता है।'), 'compact-section explain-only') : '';
  const remExplainHtml = rem ? section(pickLang(hi, 'Remedies in simple words', 'उपाय सरल भाषा में'), easyBlock(hi, 'Remedies are supportive practices. They should be simple, respectful and done with consistency, not fear.', 'उपाय सहायक अभ्यास हैं। इन्हें डर से नहीं, श्रद्धा और नियमितता से करना चाहिए।', 'A mantra works best when repeated calmly at a fixed time.', 'मंत्र का अभ्यास शांत मन से निश्चित समय पर नियमित करने से अधिक लाभदायक होता है।'), 'compact-section explain-only') : '';
  const namesExplainHtml = names ? section(pickLang(hi, 'Naamkaran in simple words', 'नामकरण सरल भाषा में'), easyBlock(hi, 'Suggested names are based on the birth nakshatra syllable and meaning. Prefer a name that is easy to pronounce and has a positive meaning.', 'सुझाए गए नाम जन्म नक्षत्र के अक्षर और अर्थ के आधार पर हैं। ऐसा नाम चुनें जिसका उच्चारण आसान हो और अर्थ शुभ हो।', 'If the syllable is Ma, names like Madhav or Manav may fit depending on meaning and family preference.', 'यदि अक्षर “म” हो, तो अर्थ और परिवार की पसंद के अनुसार माधव या मानव जैसे नाम उपयुक्त हो सकते हैं।'), 'compact-section explain-only') : '';  const ayanamsa = k?.ayanamsa || d.varga?.data?.ayanamsa || 'Lahiri';
  const calcNote = `<div class="calcnote"><b>${pickLang(hi, 'Calculation Basis', 'गणना का आधार')}:</b> ${pickLang(
    hi,
    `Birth date, exact birth time, timezone and place are used for real astronomical sidereal calculations of the grahas and nakshatras. Ayanamsa: ${esc(ayanamsa)}. AI text only explains the calculated kundli, dasha and transit data; it is not used to invent planetary positions or dates.`,
    `जन्म तिथि, सही जन्म समय, समय-क्षेत्र और जन्म स्थान से ग्रहों व नक्षत्रों की वास्तविक निरयन गणना की जाती है। अयनांश: ${esc(ayanamsa)}। AI पाठ केवल निकली हुई कुंडली, दशा और गोचर डेटा को सरल भाषा में समझाता है; ग्रह स्थिति या तिथि कल्पना से नहीं बनाता।`,
  )}</div>`;
  const panchangHtml = panchangRows.length ? section(pickLang(hi, 'Birth Panchang', 'जन्म पंचांग'), tableHtml('', panchangRows), 'table-section') : '';
  const planetHtml = planetRows.length ? tableSections(
    pickLang(hi, 'Planetary Positions', 'ग्रह स्थिति'),
    pickLang(hi, '<tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>House</th><th>Status</th></tr>', '<tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>नक्षत्र</th><th>भाव</th><th>स्थिति</th></tr>'),
    planetRows,
    9,
  ) : '';
  const janmaHtml = janmaRows.length ? section(pickLang(hi, 'Janma Details', 'जन्म विवरण'), tableHtml('', janmaRows), 'table-section') : '';
  const dashaSummaryHtml = bal ? section(
    pickLang(hi, 'Vimshottari Dasha', 'विंशोत्तरी दशा'),
    `<div class="detailbox">
      <div><b>${pickLang(hi, 'Birth dasha', 'जन्म दशा')}:</b> ${esc(planetName(bal.lord, hi))} (${esc(bal.bhuktaYears)} ${pickLang(hi, 'years spent', 'वर्ष भुक्त')}, ${esc(bal.bhogyaYears)} ${pickLang(hi, 'years left', 'वर्ष भोग्य')})</div>
      ${cur ? `<div><b>${pickLang(hi, 'Current dasha', 'वर्तमान दशा')}:</b> ${esc(planetName(cur.lord, hi))} (${pickLang(hi, 'age', 'आयु')} ${Math.round(cur.fromAge)}–${Math.round(cur.toAge)})</div>` : ''}
    </div>`,
    'compact-section',
  ) : '';
  const namesHtml = names ? section(pickLang(hi, 'Suggested Names', 'शुभ नाम'), `<div class="name-lead">${pickLang(hi, 'Naamakshar', 'नामाक्षर')}: <b>${esc(nm?.syllable || '')}</b></div><div>${names}</div>`, 'compact-section') : '';
  const predsHtml = predItems.length ? chunks(predItems, 6).map((chunk, i) => section(
    i === 0 ? pickLang(hi, 'Key Predictions', 'मुख्य फलादेश') : pickLang(hi, 'Key Predictions · Continued', 'मुख्य फलादेश · जारी'),
    `<ul>${chunk.join('')}</ul>`,
  )).join('') : '';
  const summaryText = hi ? ((r?.explanation as any)?.summaryHi || r?.explanation?.summary) : r?.explanation?.summary;
  const summaryHtml = summaryText ? section(pickLang(hi, 'Summary', 'सार'), `<div class="summary">${esc(summaryText)}</div>`) : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4 portrait; margin: 13mm 11mm 15mm; }
  * { box-sizing: border-box; }
  html, body { min-height:100%; }
  body { font-family: 'Noto Serif Devanagari','Georgia',serif; color:#33200d; margin:0; padding:0; font-size:12.6px; line-height:1.5;
    background:#f3e5bd; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page-border { position:fixed; top:6mm; right:6mm; bottom:6mm; left:6mm; border:2px solid #8b211f;
    box-shadow:inset 0 0 0 3px #f0d48d, inset 0 0 0 5px #9f6b16; pointer-events:none; z-index:0; }
  .page-border:before, .page-border:after { content:'ॐ'; position:absolute; top:-4.6mm; width:26px; height:18px; line-height:18px;
    text-align:center; color:#8b211f; background:#f3e5bd; font-size:13px; font-weight:bold; }
  .page-border:before { left:11mm; }
  .page-border:after { right:11mm; }
  .patri { position:relative; z-index:1; }
  .pdf-section { margin:0 0 12px; padding:14px 16px 15px; border:3px double #9f6b16; border-radius:9px;
    background:linear-gradient(180deg, #fffaf0 0%, #fff4dc 100%); break-inside:avoid; page-break-inside:avoid; }
  .compact-section { padding-top:12px; padding-bottom:12px; }
  .cover { text-align:center; padding:18px 18px 20px; background:
    radial-gradient(circle at 50% 18%, rgba(184,33,31,0.08), transparent 31%),
    linear-gradient(180deg, #fff8e7 0%, #f8e6b7 100%); }
  .cover-rule { display:flex; align-items:center; justify-content:center; gap:12px; color:#9f6b16; margin:7px 0 8px; }
  .cover-rule:before, .cover-rule:after { content:''; height:1px; width:88px; background:#c89d32; }
  .om { text-align:center; color:#7a1f1f; font-size:17px; letter-spacing:1px; margin:0 0 2px; }
  h1 { text-align:center; color:#7a1f1f; font-size:30px; margin:4px 0 3px; letter-spacing:0.8px; }
  .sub { text-align:center; color:#7a5a1e; font-size:13px; margin:0 0 13px; }
  h2 { color:#7a1f1f; font-size:16px; border:1px solid #d1aa45; border-left:6px solid #8b211f; border-radius:6px;
    background:#fff4d3; padding:7px 10px; margin:0 0 10px; break-after:avoid; page-break-after:avoid; }
  table { width:100%; border-collapse:collapse; font-size:12.2px; margin:0; background:#fffaf0; break-inside:avoid; page-break-inside:avoid; }
  thead { display:table-header-group; }
  th,td { border:1px solid #c89d32; padding:6px 8px; text-align:left; vertical-align:top; }
  th { background:#ead083; color:#4d330a; font-size:13px; }
  small { color:#745827; font-size:10.8px; line-height:1.4; }
  tr, td, th { break-inside:avoid; page-break-inside:avoid; }
  tr:nth-child(even) td { background:rgba(255,246,221,0.78); }
  tr.current-row td { background:#fdebc8 !important; font-weight:bold; }
  td.pl { font-weight:bold; color:#7a1f1f; }
  td.big { font-size:19px; font-weight:bold; color:#a8750c; }
  .detailbox { display:flex; flex-wrap:wrap; gap:8px 10px; font-size:12.7px; margin:4px 0 8px; break-inside:avoid; page-break-inside:avoid; }
  .detailbox div { border:1px solid #dfc06a; border-radius:7px; background:#fff8e6; padding:7px 10px; min-width:31%; flex:1 1 30%; }
  .detailbox div b { color:#7a1f1f; }
  .calcnote { margin:10px 0 0; border:1px solid #c89d32; background:#fff7de; border-left:6px solid #7a1f1f; border-radius:7px; padding:9px 12px; font-size:12px; line-height:1.48; text-align:left; }
  .reportgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin:0; break-inside:avoid; page-break-inside:avoid; }
  .reportitem { border:1px solid #d3af55; border-radius:7px; background:#fff7de; color:#4d330a; padding:7px 9px; font-size:12px; font-weight:bold; text-align:center; }
  .name-lead { text-align:center; color:#7a1f1f; margin:0 0 8px; font-size:13px; }
  .nchip { display:inline-block; background:#fff7de; border:1px solid #d3af55; border-radius:7px; padding:5px 9px; margin:3px; font-size:12.2px; break-inside:avoid; page-break-inside:avoid; }
  ul { margin:0; padding-left:20px; font-size:12.5px; line-height:1.56; }
  li { margin-bottom:4px; break-inside:avoid; page-break-inside:avoid; }
  .summary { background:#fff7de; border:1px solid #d8b85a; border-left:6px solid #9f6b16; padding:10px 12px; font-size:12.6px; line-height:1.55; border-radius:7px; break-inside:avoid; page-break-inside:avoid; }
  .charts { display:flex; gap:15px; flex-wrap:wrap; justify-content:center; margin:2px 0 0; break-inside:avoid; page-break-inside:avoid; }
  .chartbox { text-align:center; border:1px solid #d3af55; border-radius:8px; background:#fff7de; padding:8px 10px 10px; break-inside:avoid; page-break-inside:avoid; }
  .chartbox svg { border:2px solid #7a1f1f; background:#fffaf0; border-radius:5px; padding:5px; }
  .ctitle { font-size:12.5px; color:#7a1f1f; font-weight:bold; margin-bottom:6px; }
  table.chart { width:248px; height:248px; table-layout:fixed; border:2.4px solid #7a1f1f; margin:8px auto; background:#fffaf0; }
  table.chart td { border:1.2px solid #c89d32; vertical-align:top; font-size:11px; padding:5px 6px; height:62px; }
  table.chart td.hc { background:#fffaf0; }
  table.chart td.ctr { background:#ead083; text-align:center; font-weight:bold; color:#7a1f1f; font-size:13px; padding:14px; }
  table.chart .sgn { color:#a8750c; font-size:10px; font-weight:bold; }
  table.chart b { color:#7a1f1f; font-size:11px; }
  .mantra { font-size:12.5px; color:#7a1f1f; background:#fff7de; border:1px solid #d8b85a; padding:8px 11px; border-radius:7px; margin:8px 0; }
  .wide-table { font-size:11.8px; }
  .easy-block { margin:10px 0 0; border:1px solid #d8b85a; border-left:6px solid #7a1f1f; border-radius:8px; background:linear-gradient(180deg,#fffaf0,#fff0cf); padding:9px 11px; break-inside:avoid; page-break-inside:avoid; }
  .easy-title { display:inline-block; color:#7a1f1f; background:#f1d88d; border:1px solid #c89d32; border-radius:999px; padding:2px 9px; font-size:11.4px; font-weight:bold; margin-bottom:5px; }
  .easy-block p { margin:3px 0 0; font-size:12px; line-height:1.5; color:#3d2a11; }
  .easy-example { color:#6c4a14 !important; }
  .easy-mini { margin:5px 0 2px; padding:7px 9px; border:1px dashed #c89d32; border-radius:7px; background:#fff9e8; font-size:11.6px; line-height:1.45; color:#4d3513; break-inside:avoid; page-break-inside:avoid; }
  .easy-mini span { color:#715019; }
  .explain-only { border-style:solid; background:#fff8e6; }
  .table-section { overflow:visible; }
  .foot { text-align:center; color:#7a5a1e; font-size:10.5px; margin:0; border-top:1px dashed #c89d32; padding-top:10px; line-height:1.45; }
</style></head>
<body><div class="page-border" aria-hidden="true"></div><main class="patri">
<section class="pdf-section cover">
  <p class="om">${pickLang(hi, 'Shree Ganeshaya Namah', '॥ श्री गणेशाय नमः ॥')}</p>
  <div class="cover-rule"><span>${pickLang(hi, 'Om', 'ॐ')}</span></div>
  <h1>${pickLang(hi, 'Janam Patri', 'जन्म पत्रिका')}</h1>
  <p class="sub">${pickLang(hi, 'Vedic Birth Chart and Naming Report', 'वैदिक जन्म कुंडली और नामकरण रिपोर्ट')}</p>

  <div class="detailbox">
    <div><b>${pickLang(hi, 'Name', 'नाम')}:</b> ${esc(p.name || DASH)}</div>
    <div><b>${pickLang(hi, 'Gender', 'लिंग')}:</b> ${esc(p.gender || DASH)}</div>
    <div><b>${pickLang(hi, 'Date of birth', 'जन्म तिथि')}:</b> ${esc(p.dob)}</div>
    <div><b>${pickLang(hi, 'Birth time', 'जन्म समय')}:</b> ${esc(p.tob)}</div>
    <div><b>${pickLang(hi, 'Birth place', 'जन्म स्थान')}:</b> ${esc(p.place)}</div>
    <div><b>${pickLang(hi, 'Ascendant', 'लग्न')}:</b> ${esc(signName(k?.ascendant || '', hi) || DASH)}</div>
    <div><b>${pickLang(hi, 'Moon sign', 'चंद्र राशि')}:</b> ${esc(signName(k?.moonSign || '', hi) || DASH)}</div>
  </div>

  ${calcNote}
</section>

  ${reportScopeHtml}
  ${readingGuideHtml}

  ${panchangHtml}
  ${panchangExplainHtml}

  ${planetHtml}
  ${planetExplainHtml}
  ${chartsHtml}
  ${janmaHtml}
  ${janmaExplainHtml}
  ${dashaSummaryHtml}
  ${dashaHtml}
  ${dashaExplainHtml}

  ${gocharHtml}
  ${gocharExplainHtml}

  ${forecastHtml}
  ${forecastExplainHtml}

  ${remHtml}
  ${remExplainHtml}

  ${namesHtml}
  ${namesExplainHtml}
  ${predsHtml}

  ${vargaHtml}

  ${summaryHtml}

  <section class="pdf-section compact-section"><p class="foot">${pickLang(hi, 'Computed from real astronomical planetary positions, grahas and nakshatras, Lahiri Ayanamsa, with classical Jyotish interpretation · Generated by Shree Yantra App', 'वास्तविक खगोलीय ग्रह-स्थिति, ग्रह, नक्षत्र और लाहिड़ी अयनांश के आधार पर शास्त्रीय ज्योतिषीय व्याख्या · श्री यंत्र ऐप द्वारा निर्मित')}</p></section>
</main></body></html>`;
}
