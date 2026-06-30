// Builds a Vedic-themed Brihat Kundli (बृहत कुंडली) HTML for expo-print → PDF.
// Pure string builder — fed by the /api/brihat-kundli aggregator response.
import { BrihatKundliResponse } from './api';

export interface BrihatPdfPerson { name?: string; gender?: string; dob: string; tob: string; place: string; lang?: 'en' | 'hi' }

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
const DASH = '—';
const hnum = (h?: any) => { const m = String(h ?? '').match(/\d+/); return m ? m[0] : DASH; };
const deg = (d: any) => { const n = String(d ?? '').match(/\d+/g); return n && n.length >= 2 ? `${n[0]}°${n[1]}'` : (n && n[0] ? `${n[0]}°` : DASH); };
const yr = (s?: string) => { const m = String(s ?? '').match(/(\d{4})/); return m ? m[1] : ''; };

const PLANET_HI: Record<string, string> = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु', Ascendant: 'लग्न', Lagna: 'लग्न', Sarva: 'सर्व' };
const SIGN_HI: Record<string, string> = { Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन' };
const pickLang = (hi: boolean, en: string, hiText: string) => (hi ? hiText : en);
const planetName = (name: string | null | undefined, hi: boolean) => hi && name ? (PLANET_HI[name] || name) : (name || '');
const signName = (name: string | null | undefined, hi: boolean) => hi && name ? (SIGN_HI[name] || name) : (name || '');
const translatedText = (value: any, hi: boolean) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return hi ? (value.hi || value.nameHi || value.Hindi || value.en || value.name || value.Name || '') : (value.en || value.name || value.Name || value.hi || value.nameHi || '');
};
const nak = (n: any, hi = false) => translatedText(n, hi);
const statusText = (hi: boolean, present: boolean) => present ? pickLang(hi, 'Present', 'है') : pickLang(hi, 'Clear', 'नहीं');
const currentText = (hi: boolean) => pickLang(hi, 'Current', 'वर्तमान');

function section(title: string, body: string, cls = ''): string {
  if (!body) return '';
  return `<section class="pdf-section ${cls}"><h2>${title}</h2>${body}</section>`;
}
function table(head: string, rows: string[], cls = ''): string {
  if (!rows.length) return '';
  return `<table class="${cls}">${head ? `<thead>${head}</thead>` : ''}<tbody>${rows.join('')}</tbody></table>`;
}
function chunks<T>(a: T[], n: number): T[][] { const o: T[][] = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }

function easyBlock(hi: boolean, en: string, hiText: string, exampleEn?: string, exampleHi?: string): string {
  const example = exampleEn || exampleHi
    ? '<p class="easy-example"><b>' + esc(pickLang(hi, 'Example', 'उदाहरण')) + ':</b> ' + esc(pickLang(hi, exampleEn || '', exampleHi || exampleEn || '')) + '</p>'
    : '';
  return '<div class="easy-block"><div class="easy-title">' + esc(pickLang(hi, 'Understand in simple words', 'सरल भाषा में समझें')) + '</div><p>' + esc(pickLang(hi, en, hiText)) + '</p>' + example + '</div>';
}
export function buildBrihatHtml(person: BrihatPdfPerson, report: BrihatKundliResponse): string {
  const hi = person.lang === 'hi';
  const tr = (p?: { en: string; hi: string } | null) => (p ? (hi ? p.hi : p.en) : '');
  const s = report.summary || {};
  const planets = (report.data?.kundli?.data?.planets || []).filter((x) => x.sign);

  // ── Avakhada Chakra ──
  const a = report.avakhada;
  const avRows = a ? [
    [pickLang(hi, 'Varna', 'वर्ण'), tr(a.varna)], [pickLang(hi, 'Vashya', 'वश्य'), tr(a.vashya)], [pickLang(hi, 'Yoni', 'योनि'), tr(a.yoni)], [pickLang(hi, 'Gana', 'गण'), tr(a.gana)],
    [pickLang(hi, 'Nadi', 'नाड़ी'), tr(a.nadi)], [pickLang(hi, 'Tatva', 'तत्व'), tr(a.tatva)], [pickLang(hi, 'Paya', 'पाया'), a.paya ? tr(a.paya) : DASH],
    [pickLang(hi, 'Nakshatra', 'नक्षत्र'), `${hi ? ((a.nakshatra as any).hi || a.nakshatra.name) : a.nakshatra.name}${a.nakshatra.pada ? ' - ' + a.nakshatra.pada : ''}`],
    [pickLang(hi, 'Nakshatra Lord', 'नक्षत्र स्वामी'), tr(a.nakshatra.lord)], [pickLang(hi, 'Rashi', 'राशि'), signName(a.rashi.name, hi)], [pickLang(hi, 'Rashi Lord', 'राशि स्वामी'), tr(a.rashi.lord)],
    [pickLang(hi, 'Lagna', 'लग्न'), a.lagna ? signName(a.lagna.name, hi) : DASH], [pickLang(hi, 'Lagna Lord', 'लग्न स्वामी'), a.lagna ? tr(a.lagna.lord) : DASH],
    [pickLang(hi, 'Dasha Balance', 'दशा शेष'), esc(a.dashaBalance || DASH)],
  ] : [];
  const avHtml = avRows.length ? section(pickLang(hi, 'Avakhada Chakra', 'अवकहड़ा चक्र'),
    `<div class="kv">${avRows.map(([k, v]) => `<div class="kvi"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`, 'compact-section') : '';

  const plRows = planets.map((x) => `<tr><td class="pl">${esc(planetName(x.planet, hi))}</td><td>${esc(signName(x.sign, hi))}</td><td>${deg(x.degreeInSign)}</td><td>${esc(nak(x.nakshatra, hi))}</td><td>${hnum(x.house)}</td><td>${String(x.isRetrograde).toLowerCase() === 'true' ? pickLang(hi, 'Retrograde', 'वक्री') : DASH}</td></tr>`);
  const plHtml = plRows.length ? section(pickLang(hi, 'Planetary Positions', 'ग्रह स्थिति'),
    table(pickLang(hi, '<tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>House</th><th>Status</th></tr>', '<tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>नक्षत्र</th><th>भाव</th><th>स्थिति</th></tr>'), plRows), 'table-section') : '';

  const periods = report.data?.timeline?.periods?.filter((p) => !p.past) || [];
  let dashaRows: string[] = [];
  if (periods.length) dashaRows = periods.slice(0, 12).map((p) => `<tr class="${p.current ? 'current-row' : ''}"><td class="pl">${esc(planetName(p.lord, hi))}${p.current ? ` · ${currentText(hi)}` : ''}</td><td>${Math.round(p.fromAge)}–${Math.round(p.toAge)}</td><td>${p.fromYear}–${p.toYear}</td></tr>`);
  else dashaRows = (report.data?.dasha?.dasha || []).slice(0, 12).map((d) => `<tr><td class="pl">${esc(planetName(d.lord, hi))}</td><td>${DASH}</td><td>${yr(d.start)}–${yr(d.end)}</td></tr>`);
  const dashaHtml = dashaRows.length ? section(pickLang(hi, 'Vimshottari Dasha', 'विंशोत्तरी दशा'),
    table(pickLang(hi, '<tr><th>Mahadasha</th><th>Age</th><th>Years</th></tr>', '<tr><th>महादशा</th><th>आयु</th><th>वर्ष</th></tr>'), dashaRows), 'table-section') : '';

  const yogas = report.data?.yoga?.yogas || [];
  const doshas = s.doshas || [];
  const ydBody = `${doshas.length ? `<div class="detailbox">${doshas.map((d: any) => `<div><b>${esc(hi ? (d.nameHi || d.name) : d.name)}:</b> ${statusText(hi, !!d.present)}</div>`).join('')}</div>` : ''}${yogas.length ? `<ul>${yogas.slice(0, 14).map((y) => {
    const yn = hi ? ((y as any).nameHi || String(y.name || '').replace(/Yoga$/i, 'योग')) : y.name;
    const yd = hi ? ((y as any).descriptionHi || y.description || '') : (y.description || '');
    return `<li><b>${esc(yn)}</b>${yd ? ' — ' + esc(yd) : ''}</li>`;
  }).join('')}</ul>` : ''}`;
  const ydHtml = (yogas.length || doshas.length) ? section(pickLang(hi, 'Yogas and Doshas', 'योग व दोष'), ydBody) : '';

  const av = report.ashtakavarga;
  let avgHtml = '';
  if (av) {
    const sav = `<tr><td class="pl">${pickLang(hi, 'Sarva', 'सर्व')}</td>${av.sarva.map((v) => `<td>${v}</td>`).join('')}<td>${av.sarvaTotal}</td></tr>`;
    const bav = Object.entries(av.bhinna).map(([p, o]: any) => `<tr><td class="pl">${esc(planetName(p, hi))}</td>${o.bindus.map((v: number) => `<td>${v}</td>`).join('')}<td>${o.total}</td></tr>`);
    const head = `<tr><th>${pickLang(hi, 'Planet', 'ग्रह')}</th>${av.signs.map((sg) => `<th>${esc(signName(sg, hi).slice(0, 3))}</th>`).join('')}<th>${pickLang(hi, 'Total', 'कुल')}</th></tr>`;
    avgHtml = section(pickLang(hi, 'Ashtakavarga', 'अष्टकवर्ग'), `<p class="small">${pickLang(hi, `Sarvashtakavarga total = ${av.sarvaTotal} (BPHS bindu tables).`, `सर्वाष्टकवर्ग कुल = ${av.sarvaTotal} (BPHS बिंदु तालिका)।`)}</p>${table(head, [...bav, sav], 'wide-table av-table')}`, 'table-section');
  }

  const nu = report.numerology;
  const numCard = (label: string, c: any) => `<div><b>${esc(label)} ${c.number}</b> · ${hi ? c.planetHi : c.planet} · ${hi ? c.dayHi : c.day} · ${hi ? c.stoneHi : c.stone}</div>`;
  const numHtml = nu ? section(pickLang(hi, 'Numerology', 'अंक ज्योतिष'), `<div class="detailbox">${numCard(hi ? 'मूलांक' : 'Moolank', nu.psychic)}${numCard(hi ? 'भाग्यांक' : 'Bhagyank', nu.destiny)}</div>`, 'compact-section') : '';

  const j = report.jaimini;
  const jHtml = j && j.charaKarakas?.length ? section(pickLang(hi, 'Jaimini Chara Karakas', 'जैमिनी चर कारक'),
    `${j.arudhaLagna ? `<div class="detailbox"><div><b>${pickLang(hi, 'Arudha Lagna', 'आरूढ़ लग्न')}:</b> ${esc(signName(j.arudhaLagna.sign, hi))}</div></div>` : ''}${table(pickLang(hi, '<tr><th>Karaka</th><th>Planet</th><th>Sign</th><th>Degree</th><th>Signifies</th></tr>', '<tr><th>कारक</th><th>ग्रह</th><th>राशि</th><th>अंश</th><th>संकेत</th></tr>'), j.charaKarakas.map((k) => `<tr><td class="pl">${esc(k.key)} ${esc(hi ? k.hi : k.en)}</td><td>${esc(planetName(k.planet, hi))}</td><td>${esc(signName(k.sign, hi))}</td><td>${k.degree}°</td><td>${esc(k.sig)}</td></tr>`))}`, 'table-section') : '';

  const v = report.varshphal;
  const vHtml = v && v.years?.length ? section(pickLang(hi, 'Varshphal: 5-Year Muntha', 'वर्षफल: 5 वर्ष मुन्था'),
    table(pickLang(hi, '<tr><th>Year</th><th>Muntha Sign</th><th>House</th><th>Theme</th></tr>', '<tr><th>वर्ष</th><th>मुन्था राशि</th><th>भाव</th><th>विषय</th></tr>'), v.years.map((y) => `<tr><td class="pl">${y.year}</td><td>${esc(signName(y.munthaSign, hi))}</td><td>${y.houseFromLagna}</td><td>${esc(tr(y.theme))}</td></tr>`)), 'table-section') : '';

  const rem = report.data?.remedies?.remedies;
  const gem = rem?.lifeGem;
  const mantras = rem?.planetMantras || [];
  const remHtml = rem ? section(pickLang(hi, 'Gemstone and Remedies', 'रत्न व उपाय'),
    `${gem ? `<div class="detailbox"><div><b>${pickLang(hi, 'Life Gem', 'जीवन रत्न')}:</b> ${esc(hi ? (gem.gemstoneHi || gem.gemstone) : gem.gemstone)}${gem.metal ? ' · ' + esc(hi ? (gem.metalHi || gem.metal) : gem.metal) : ''}${gem.finger ? ' · ' + esc(hi ? (gem.fingerHi || gem.finger) : gem.finger) : ''}${gem.day ? ' · ' + esc(hi ? (gem.dayHi || gem.day) : gem.day) : ''}</div></div>` : ''}${mantras.length ? `<ul>${mantras.slice(0, 6).map((m) => `<li><b>${esc(planetName(m.planet, hi))}:</b> ${esc(m.mantra)}</li>`).join('')}</ul>` : ''}`, 'compact-section') : '';

  const kp = report.kp;
  const kpHtml = kp && kp.planets?.length ? section(pickLang(hi, 'KP Significators', 'KP कारक'),
    table(pickLang(hi, '<tr><th>Body</th><th>Sign Lord</th><th>Star Lord</th><th>Sub Lord</th></tr>', '<tr><th>पिंड</th><th>राशि स्वामी</th><th>नक्षत्र स्वामी</th><th>उप-स्वामी</th></tr>'),
      [...(kp.ascendant ? [{ ...kp.ascendant, planet: 'Ascendant' }] : []), ...kp.planets].map((r) =>
        `<tr><td class="pl">${esc(planetName(r.planet, hi))}</td><td>${esc(planetName(hi ? (r.signLordHi || r.signLord) : r.signLord, false))}</td><td>${esc(hi ? (r.starLordHi || r.starLord) : r.starLord)}</td><td>${esc(hi ? (r.subLordHi || r.subLord) : r.subLord)}</td></tr>`)),
    'table-section') : '';

  const sb = report.shadbala;
  const sbHtml = sb && sb.planets && Object.keys(sb.planets).length ? section(pickLang(hi, 'Shadbala: Planetary Strength', 'षड्बल: ग्रह बल'),
    `<p class="small">${pickLang(hi, 'Six-fold strength per classical BPHS. Req = required minimum; values may vary slightly across software.', 'शास्त्रीय BPHS के अनुसार छह प्रकार का ग्रह बल। आवश्यक = न्यूनतम अपेक्षित बल; अलग-अलग सॉफ्टवेयर में थोड़ा अंतर हो सकता है।')}</p>${table(pickLang(hi, '<tr><th>Planet</th><th>Sthana</th><th>Dig</th><th>Kala</th><th>Cheshta</th><th>Naisarg.</th><th>Drik</th><th>Total</th><th>Rupas</th><th>Req</th></tr>', '<tr><th>ग्रह</th><th>स्थान</th><th>दिग</th><th>काल</th><th>चेष्टा</th><th>नैसर्गिक</th><th>दृक्</th><th>कुल</th><th>रूप</th><th>आवश्यक</th></tr>'),
      Object.entries(sb.planets).sort((a, b) => a[1].rank - b[1].rank).map(([pl, v]) =>
        `<tr><td class="pl">${esc(planetName(pl, hi))}${v.strong ? ' ✓' : ''}</td><td>${v.sthana}</td><td>${v.dig}</td><td>${v.kala}</td><td>${v.cheshta}</td><td>${v.naisargika}</td><td>${v.drik}</td><td>${v.total}</td><td><b>${v.rupas}</b></td><td>${v.required}</td></tr>`),
      'wide-table av-table')}`, 'table-section') : '';

  const lk = report.lalKitab;
  const lkHtml = lk && lk.houses?.length ? section(pickLang(hi, 'Lal Kitab Chart', 'लाल किताब चक्र'),
    `<p class="small">${pickLang(hi, `House-wise placement (Teva). Lagna: ${esc(signName(lk.lagna || '', hi) || DASH)}.`, `भाव अनुसार ग्रह स्थिति (टेवा)। लग्न: ${esc(signName(lk.lagna || '', hi) || DASH)}।`)}</p>${table(pickLang(hi, '<tr><th>House</th><th>Sign</th><th>Planets</th></tr>', '<tr><th>भाव</th><th>राशि</th><th>ग्रह</th></tr>'),
      lk.houses.map((h) => `<tr><td class="pl">${h.house}</td><td>${esc(signName(h.sign, hi))}</td><td>${h.planets.length ? h.planets.map((p) => esc(hi ? p.hi : p.en)).join(', ') : DASH}</td></tr>`))}`, 'table-section') : '';

  const eng = report.accuracy?.engine || 'Real planetary positions (Lahiri ayanamsa) + classical Jyotish';

  const scopeItems = (report.sections || []).filter((x) => x.status === 'ready').slice(0, 12);
  const reportScopeHtml = scopeItems.length ? section(pickLang(hi, 'Report Includes', 'रिपोर्ट में शामिल'), '<div class="reportgrid">' + scopeItems.map((x) => '<div class="reportitem"><b>' + esc(tr(x.title) || x.key) + '</b>' + (x.count != null ? '<span>' + esc(x.count) + '</span>' : '') + '</div>').join('') + '</div>', 'compact-section') : '';
  const readingGuideHtml = section(pickLang(hi, 'How to read this Brihat Kundli', 'इस बृहत कुंडली को कैसे पढ़ें'), easyBlock(hi, 'This PDF keeps calculated data and interpretation separate. Use tables for exact values and the simple notes for practical meaning.', 'इस PDF में गणना और व्याख्या अलग-अलग रखी गई है। सटीक मानों के लिए तालिकाएं देखें और व्यावहारिक अर्थ के लिए सरल नोट पढ़ें।', 'If a dasha says Saturn, check the dasha table first, then read the simple note for how to use that period.', 'यदि दशा में शनि लिखा है, तो पहले दशा तालिका देखें, फिर सरल नोट से समझें कि उस अवधि को कैसे संभालना है।'), 'compact-section explain-only');
  const avExplainHtml = avRows.length ? section(pickLang(hi, 'Avakhada in simple words', 'अवकहड़ा सरल भाषा में'), easyBlock(hi, 'Avakhada is a compact birth identity card used in traditional Jyotish: varna, gana, nadi, yoni, rashi and nakshatra.', 'अवकहड़ा पारंपरिक ज्योतिष का संक्षिप्त जन्म-पहचान पत्र है, जिसमें वर्ण, गण, नाड़ी, योनि, राशि और नक्षत्र आते हैं।', 'During kundli milan, Nadi and Gana are often checked from this data.', 'कुंडली मिलान में नाड़ी और गण इसी डेटा से देखे जाते हैं।'), 'compact-section explain-only') : '';
  const plExplainHtml = plRows.length ? section(pickLang(hi, 'Planet positions in simple words', 'ग्रह स्थिति सरल भाषा में'), easyBlock(hi, 'Planet position is the base data. Sign shows how a planet behaves; house shows where it affects life.', 'ग्रह स्थिति मूल डेटा है। राशि बताती है कि ग्रह किस शैली से फल देगा और भाव बताता है कि जीवन के किस क्षेत्र में असर होगा।', 'Jupiter in 2nd house may connect wisdom with family, speech or savings depending on strength and dasha.', 'जैसे गुरु द्वितीय भाव में हो तो बल और दशा के अनुसार परिवार, वाणी या बचत से ज्ञान जुड़ सकता है।'), 'compact-section explain-only') : '';
  const dashaExplainHtml = dashaRows.length ? section(pickLang(hi, 'Dasha in simple words', 'दशा सरल भाषा में'), easyBlock(hi, 'Dasha tells timing. It does not replace effort; it shows which planet theme is more active in a period.', 'दशा समय का संकेत देती है। यह प्रयास को बदलती नहीं, बल्कि बताती है कि किस अवधि में कौन सा ग्रह-विषय अधिक सक्रिय है।', 'A supportive Jupiter period can help study, guidance or growth; a Saturn period asks discipline and patience.', 'अनुकूल गुरु दशा अध्ययन, मार्गदर्शन या वृद्धि में सहायता कर सकती है; शनि दशा अनुशासन और धैर्य मांगती है।'), 'compact-section explain-only') : '';
  const ydExplainHtml = (yogas.length || doshas.length) ? section(pickLang(hi, 'Yogas and doshas in simple words', 'योग और दोष सरल भाषा में'), easyBlock(hi, 'Yoga means potential and pattern. Dosha means an area needing awareness or remedy. Both should be judged with strength and dasha.', 'योग क्षमता और पैटर्न दिखाता है। दोष ऐसे क्षेत्र को दिखाता है जहां जागरूकता या उपाय की जरूरत हो सकती है। दोनों को बल और दशा के साथ देखना चाहिए।', 'A rajyoga gives potential, but it becomes visible more strongly in supportive dasha and right effort.', 'राजयोग क्षमता देता है, पर अनुकूल दशा और सही प्रयास में उसका प्रभाव अधिक दिखता है।'), 'compact-section explain-only') : '';
  const avgExplainHtml = av ? section(pickLang(hi, 'Ashtakavarga in simple words', 'अष्टकवर्ग सरल भाषा में'), easyBlock(hi, 'Ashtakavarga uses bindu points to judge relative support in signs and houses.', 'अष्टकवर्ग बिंदुओं से राशि और भावों का सापेक्ष समर्थन देखता है।', 'A higher bindu area usually supports smoother results; a low bindu area needs more planning.', 'जहां बिंदु अधिक हों वहां परिणाम अपेक्षाकृत सहज हो सकते हैं; कम बिंदु वाले क्षेत्र में अधिक योजना चाहिए।'), 'compact-section explain-only') : '';
  const numExplainHtml = nu ? section(pickLang(hi, 'Numerology in simple words', 'अंक ज्योतिष सरल भाषा में'), easyBlock(hi, 'Numerology gives a supportive personality layer from date of birth. It should be read as secondary to the birth chart.', 'अंक ज्योतिष जन्म तिथि से व्यक्तित्व की सहायक परत बताता है। इसे जन्म कुंडली के बाद द्वितीय संकेत की तरह पढ़ें।', 'Moolank shows day-number nature; Bhagyank shows life-path number.', 'मूलांक दिनांक का स्वभाव दिखाता है; भाग्यांक जीवन-पथ का अंक दिखाता है।'), 'compact-section explain-only') : '';
  const jExplainHtml = j && j.charaKarakas?.length ? section(pickLang(hi, 'Jaimini in simple words', 'जैमिनी सरल भाषा में'), easyBlock(hi, 'Jaimini karakas show soul-level roles: self, career, relationships, learning and family themes.', 'जैमिनी कारक आत्म-स्तर के विषय दिखाते हैं: स्वयं, करियर, रिश्ते, सीख और परिवार।', 'Atmakaraka is often read for the main lesson of life.', 'आत्मकारक को जीवन की मुख्य सीख समझने के लिए पढ़ा जाता है।'), 'compact-section explain-only') : '';
  const vExplainHtml = v && v.years?.length ? section(pickLang(hi, 'Varshphal in simple words', 'वर्षफल सरल भाषा में'), easyBlock(hi, 'Varshphal gives a year-wise theme. It is useful for planning, not for fear-based decisions.', 'वर्षफल साल-दर-साल मुख्य विषय बताता है। यह योजना बनाने के लिए उपयोगी है, डर पर आधारित निर्णयों के लिए नहीं।', 'A property-focused year means handle home, land or comfort matters carefully.', 'संपत्ति-केंद्रित वर्ष का अर्थ है कि घर, जमीन या सुविधा से जुड़े विषयों पर सावधानी से ध्यान दें।'), 'compact-section explain-only') : '';
  const kpExplainHtml = kp && kp.planets?.length ? section(pickLang(hi, 'KP significators in simple words', 'KP कारक सरल भाषा में'), easyBlock(hi, 'KP shows sign lord, star lord and sub lord layers for finer event judgement.', 'KP राशि स्वामी, नक्षत्र स्वामी और उप-स्वामी की परतें दिखाता है, जिससे घटना-निर्णय सूक्ष्म स्तर पर किया जाता है।', 'For a career question, astrologers check significators connected with 2nd, 6th, 10th and 11th houses.', 'करियर प्रश्न में द्वितीय, षष्ठ, दशम और एकादश भाव से जुड़े कारक देखे जाते हैं।'), 'compact-section explain-only') : '';
  const sbExplainHtml = sb && sb.planets && Object.keys(sb.planets).length ? section(pickLang(hi, 'Shadbala in simple words', 'षड्बल सरल भाषा में'), easyBlock(hi, 'Shadbala estimates planetary strength using six kinds of strength. Strong planets can deliver their promise more clearly.', 'षड्बल छह प्रकार के बल से ग्रह की शक्ति का अनुमान करता है। मजबूत ग्रह अपने संकेत अधिक स्पष्ट रूप से दे सकते हैं।', 'A strong Sun may support authority or confidence when the chart and dasha agree.', 'जब कुंडली और दशा साथ दें तो मजबूत सूर्य अधिकार या आत्मविश्वास का समर्थन कर सकता है।'), 'compact-section explain-only') : '';
  const lkExplainHtml = lk && lk.houses?.length ? section(pickLang(hi, 'Lal Kitab in simple words', 'लाल किताब सरल भाषा में'), easyBlock(hi, 'Lal Kitab reads planets through house-wise placement and practical remedies. Treat it as a separate traditional lens.', 'लाल किताब ग्रहों को भाव अनुसार स्थिति और व्यावहारिक उपायों से पढ़ती है। इसे एक अलग पारंपरिक दृष्टि की तरह देखें।', 'A planet in a sensitive house may suggest simple discipline or charity-based remedies.', 'संवेदनशील भाव में ग्रह हो तो सरल अनुशासन या दान-आधारित उपाय सुझाए जा सकते हैं।'), 'compact-section explain-only') : '';
  const remExplainHtml = rem ? section(pickLang(hi, 'Remedies in simple words', 'उपाय सरल भाषा में'), easyBlock(hi, 'Remedies are meant to support discipline, faith and mental steadiness. They should be practical and consistent.', 'उपाय अनुशासन, श्रद्धा और मानसिक स्थिरता को सहारा देने के लिए होते हैं। इन्हें सरल और नियमित रखें।', 'A short daily mantra is usually better than a difficult remedy done once.', 'रोज किया गया छोटा मंत्र अक्सर एक बार किए गए कठिन उपाय से बेहतर होता है।'), 'compact-section explain-only') : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  @page { size: A4 portrait; margin: 13mm 11mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Serif Devanagari','Georgia',serif; color:#33200d; margin:0; padding:0; font-size:12.6px; line-height:1.5; background:#f3e5bd; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page-border { position:fixed; top:6mm; right:6mm; bottom:6mm; left:6mm; border:2px solid #8b211f; box-shadow:inset 0 0 0 3px #f0d48d, inset 0 0 0 5px #9f6b16; pointer-events:none; z-index:0; }
  .patri { position:relative; z-index:1; }
  .pdf-section { margin:0 0 12px; padding:14px 16px 15px; border:3px double #9f6b16; border-radius:9px; background:linear-gradient(180deg, #fffaf0 0%, #fff4dc 100%); break-inside:avoid; page-break-inside:avoid; }
  .compact-section { padding-top:12px; padding-bottom:12px; }
  .cover { text-align:center; padding:18px 18px 20px; background: radial-gradient(circle at 50% 18%, rgba(184,33,31,0.08), transparent 31%), linear-gradient(180deg, #fff8e7 0%, #f8e6b7 100%); }
  .om { text-align:center; color:#7a1f1f; font-size:17px; letter-spacing:1px; margin:0 0 2px; }
  h1 { text-align:center; color:#7a1f1f; font-size:30px; margin:4px 0 3px; letter-spacing:0.8px; }
  .sub { text-align:center; color:#7a5a1e; font-size:13px; margin:0 0 13px; }
  h2 { color:#7a1f1f; font-size:16px; border:1px solid #d1aa45; border-left:6px solid #8b211f; border-radius:6px; background:#fff4d3; padding:7px 10px; margin:0 0 10px; break-after:avoid; page-break-after:avoid; }
  table { width:100%; border-collapse:collapse; font-size:12.2px; margin:0; background:#fffaf0; break-inside:avoid; page-break-inside:avoid; }
  thead { display:table-header-group; }
  th,td { border:1px solid #c89d32; padding:6px 8px; text-align:left; vertical-align:top; }
  th { background:#ead083; color:#4d330a; font-size:13px; }
  tr, td, th { break-inside:avoid; page-break-inside:avoid; }
  tr:nth-child(even) td { background:rgba(255,246,221,0.78); }
  tr.current-row td { background:#fdebc8 !important; font-weight:bold; }
  td.pl { font-weight:bold; color:#7a1f1f; }
  .small { color:#745827; font-size:11px; margin:0 0 7px; }
  .detailbox { display:flex; flex-wrap:wrap; gap:8px 10px; font-size:12.7px; margin:4px 0 8px; }
  .detailbox div { border:1px solid #dfc06a; border-radius:7px; background:#fff8e6; padding:7px 10px; min-width:31%; flex:1 1 30%; }
  .detailbox div b { color:#7a1f1f; }
  .kv { display:grid; grid-template-columns:repeat(2,1fr); gap:7px; }
  .kvi { display:flex; align-items:center; justify-content:space-between; gap:8px; border:1px solid #dfc06a; border-radius:7px; background:#fff8e6; padding:7px 11px; }
  .kvi span { color:#745827; font-size:11.5px; }
  .kvi b { color:#7a1f1f; font-size:12.8px; }
  ul { margin:0; padding-left:20px; font-size:12.5px; line-height:1.56; }
  li { margin-bottom:4px; break-inside:avoid; page-break-inside:avoid; }
  .av-table th, .av-table td { padding:4px 5px; font-size:10.8px; text-align:center; }
  .av-table td.pl { text-align:left; }
  .wide-table { font-size:11.4px; }
  .calcnote { margin:0; border:1px solid #c89d32; background:#fff7de; border-left:6px solid #7a1f1f; border-radius:7px; padding:9px 12px; font-size:12px; line-height:1.48; }
  .reportgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin:0; break-inside:avoid; page-break-inside:avoid; }
  .reportitem { border:1px solid #d3af55; border-radius:7px; background:#fff7de; color:#4d330a; padding:7px 9px; font-size:12px; font-weight:bold; text-align:center; }
  .reportitem span { display:block; color:#7a5a1e; font-size:10.6px; margin-top:2px; }
  .easy-block { margin:10px 0 0; border:1px solid #d8b85a; border-left:6px solid #7a1f1f; border-radius:8px; background:linear-gradient(180deg,#fffaf0,#fff0cf); padding:9px 11px; break-inside:avoid; page-break-inside:avoid; }
  .easy-title { display:inline-block; color:#7a1f1f; background:#f1d88d; border:1px solid #c89d32; border-radius:999px; padding:2px 9px; font-size:11.4px; font-weight:bold; margin-bottom:5px; }
  .easy-block p { margin:3px 0 0; font-size:12px; line-height:1.5; color:#3d2a11; }
  .easy-example { color:#6c4a14 !important; }
  .explain-only { border-style:solid; background:#fff8e6; }
  .table-section { overflow:visible; }
  .foot { text-align:center; color:#7a5a1e; font-size:10.5px; margin:0; border-top:1px dashed #c89d32; padding-top:10px; line-height:1.45; }
</style></head>
<body><div class="page-border" aria-hidden="true"></div><main class="patri">
<section class="pdf-section cover">
  <p class="om">${pickLang(hi, 'Shree Ganeshaya Namah', '॥ श्री गणेशाय नमः ॥')}</p>
  <h1>${pickLang(hi, 'Brihat Kundli', 'बृहत कुंडली')}</h1>
  <p class="sub">${pickLang(hi, 'Detailed Vedic Astrology Report', 'विस्तृत वैदिक ज्योतिष रिपोर्ट')}</p>
  <div class="detailbox">
    ${person.name ? `<div><b>${pickLang(hi, 'Name', 'नाम')}:</b> ${esc(person.name)}</div>` : ''}
    <div><b>${pickLang(hi, 'Date of birth', 'जन्म तिथि')}:</b> ${esc(person.dob)}</div>
    <div><b>${pickLang(hi, 'Birth time', 'जन्म समय')}:</b> ${esc(person.tob)}</div>
    <div><b>${pickLang(hi, 'Birth place', 'जन्म स्थान')}:</b> ${esc(person.place)}</div>
    <div><b>${pickLang(hi, 'Ascendant', 'लग्न')}:</b> ${esc(signName(s.ascendant || '', hi) || DASH)}</div>
    <div><b>${pickLang(hi, 'Moon sign', 'चंद्र राशि')}:</b> ${esc(signName(s.moonSign || '', hi) || DASH)}</div>
    <div><b>${pickLang(hi, 'Sun sign', 'सूर्य राशि')}:</b> ${esc(signName(s.sunSign || '', hi) || DASH)}</div>
  </div>
  <div class="calcnote"><b>${pickLang(hi, 'Calculation Basis', 'गणना का आधार')}:</b> ${hi ? 'वास्तविक ग्रह-स्थितियां, लाहिड़ी अयनांश और शास्त्रीय ज्योतिषीय संकेत। व्याख्याएं पारंपरिक संकेत हैं, निश्चित परिणाम नहीं।' : esc(eng) + '. ' + esc(report.accuracy?.note || 'Astronomical values are computed; interpretations are traditional indications, not guaranteed outcomes.')}</div>
</section>
  ${reportScopeHtml}
  ${readingGuideHtml}
  ${avHtml}
  ${avExplainHtml}
  ${plHtml}
  ${plExplainHtml}
  ${dashaHtml}
  ${dashaExplainHtml}
  ${ydHtml}
  ${ydExplainHtml}
  ${avgHtml}
  ${avgExplainHtml}
  ${numHtml}
  ${numExplainHtml}
  ${jHtml}
  ${jExplainHtml}
  ${vHtml}
  ${vExplainHtml}
  ${kpHtml}
  ${kpExplainHtml}
  ${sbHtml}
  ${sbExplainHtml}
  ${lkHtml}
  ${lkExplainHtml}
  ${remHtml}
  ${remExplainHtml}
  <section class="pdf-section compact-section"><p class="foot">${pickLang(hi, 'Computed from real astronomical planetary positions, grahas and nakshatras, Lahiri Ayanamsa, with classical Jyotish interpretation · Generated by Shree Yantra App', 'वास्तविक खगोलीय ग्रह-स्थिति, ग्रह, नक्षत्र और लाहिड़ी अयनांश के आधार पर शास्त्रीय ज्योतिषीय व्याख्या · श्री यंत्र ऐप द्वारा निर्मित')}</p></section>
</main></body></html>`;
}
