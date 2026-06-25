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
const hnum = (h?: string | null) => { const m = String(h || '').match(/\d+/); return m ? m[0] : '—'; };
const ABBR: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_LIST = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// South-Indian fixed 4x4 layout: signIndex → [row,col]
const CELL: Record<number, [number, number]> = { 11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0] };
// North-Indian 12-house anchor positions (viewBox 200)
const HPOS: Record<number, [number, number]> = {
  1: [100, 40], 2: [52, 24], 3: [26, 54], 4: [54, 100], 5: [26, 150], 6: [52, 176],
  7: [100, 150], 8: [148, 176], 9: [174, 150], 10: [148, 100], 11: [174, 54], 12: [148, 24],
};
const pabbr = (p: string) => ABBR[p] || p.slice(0, 2);

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
  return chunks(rows, chunkSize).map((chunk, i) => section(
    i === 0 ? title : `${title} · Continued`,
    tableHtml(head, chunk, className),
    'table-section',
  )).join('');
}

// SVG chart string for any style (north/south/east) — for the PDF
function svgChart(title: string, planets: ApiPlanet[], ascendant: string | null | undefined, style: 'north' | 'south' | 'east'): string {
  const bySign: Record<number, string[]> = {}; const byHouse: Record<number, string[]> = {};
  (planets || []).forEach((p) => {
    const si = SIGN_LIST.indexOf(p.sign || ''); if (si >= 0) (bySign[si] = bySign[si] || []).push(pabbr(p.planet));
    const h = hnum(p.house); if (h && h !== '—') (byHouse[Number(h)] = byHouse[Number(h)] || []).push(pabbr(p.planet));
  });
  const lag = ascendant != null ? SIGN_LIST.indexOf(ascendant) : -1;
  const T = (x: number, y: number, t: string, sz = 8, col = '#7a1f1f', w = '700') => `<text x="${x}" y="${y}" font-size="${sz}" fill="${col}" font-weight="${w}" text-anchor="middle" font-family="Georgia,serif">${t}</text>`;
  const toks = (arr: string[], x: number, y: number) => (arr || []).map((a, i) => T(x + ((i % 2) * 16 - (arr.length > 1 ? 8 : 0)), y + 9 + Math.floor(i / 2) * 8, a, 7.5, '#1f4ea1')).join('');
  let body = '';
  if (style === 'south') {
    body += `<rect x="10" y="10" width="180" height="180" fill="none" stroke="#7a1f1f" stroke-width="1.4"/>`;
    for (let i = 1; i <= 3; i++) body += `<line x1="${10 + i * 45}" y1="10" x2="${10 + i * 45}" y2="190" stroke="#c9a64a"/><line x1="10" y1="${10 + i * 45}" x2="190" y2="${10 + i * 45}" stroke="#c9a64a"/>`;
    Object.keys(CELL).forEach((si) => {
      const idx = Number(si); const [r, c] = CELL[idx]; const x0 = 10 + c * 45; const y0 = 10 + r * 45; const lg = idx === lag;
      body += T(x0 + 9, y0 + 11, SIGN_ABBR[idx] + (lg ? '*' : ''), 7.5, lg ? '#b8860b' : '#9a7a2a');
      body += toks(bySign[idx] || [], x0 + 22, y0 + 14);
    });
  } else {
    body += `<rect x="10" y="10" width="180" height="180" fill="none" stroke="#7a1f1f" stroke-width="1.4"/>
      <line x1="10" y1="10" x2="190" y2="190" stroke="#c9a64a"/><line x1="190" y1="10" x2="10" y2="190" stroke="#c9a64a"/>
      <line x1="100" y1="10" x2="190" y2="100" stroke="#c9a64a"/><line x1="190" y1="100" x2="100" y2="190" stroke="#c9a64a"/>
      <line x1="100" y1="190" x2="10" y2="100" stroke="#c9a64a"/><line x1="10" y1="100" x2="100" y2="10" stroke="#c9a64a"/>`;
    for (let h = 1; h <= 12; h++) {
      const [x, y] = HPOS[h];
      if (style === 'east') { const si = h - 1; const lg = si === lag; body += T(x, y, SIGN_ABBR[si] + (lg ? '*' : ''), 8, lg ? '#b8860b' : '#9a7a2a'); body += toks(bySign[si] || [], x, y); }
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

  const planetRows = planets.map((x) => `
    <tr>
      <td class="pl">${esc(x.planet)}</td>
      <td>${esc(x.sign)}</td>
      <td>${esc(x.degreeInSign || '')}</td>
      <td>${esc(typeof x.nakshatra === 'object' && x.nakshatra ? ((x.nakshatra as any).Name || (x.nakshatra as any).name || '') : (x.nakshatra || ''))}</td>
      <td>${hnum(x.house)}</td>
      <td>${x.isRetrograde === 'True' ? 'वक्री R' : '—'}</td>
    </tr>`);

  const panchangRows = bp ? [
    `<tr><td>तिथि / Tithi</td><td>${esc(bp.tithi.hi || bp.tithi.name)} (${esc(bp.tithi.pakshaHi || bp.tithi.paksha)})</td></tr>`,
    `<tr><td>नक्षत्र / Nakshatra</td><td>${esc(bp.nakshatra.hi || bp.nakshatra.name)} — चरण ${esc(bp.nakshatra.pada)}</td></tr>`,
    `<tr><td>योग / Yoga</td><td>${esc(bp.yoga.hi || bp.yoga.name)}</td></tr>`,
    `<tr><td>करण / Karana</td><td>${esc(bp.karana.hi || bp.karana.name)}</td></tr>`,
    `<tr><td>मास / Masa</td><td>${esc(bp.masa ? bp.masa.amanta.hi : '')}</td></tr>`,
    `<tr><td>विक्रम संवत् / Samvat</td><td>${esc(bp.samvat?.vikram || '')} ${esc(bp.samvatsara || '')}</td></tr>`,
  ] : [];

  const janmaRows = j ? [
    `<tr><td>गण / Gana</td><td>${esc(j.gana.hi)}</td><td>योनि / Yoni</td><td>${esc(j.yoni.hi)}</td></tr>`,
    `<tr><td>नाड़ी / Nadi</td><td>${esc(j.nadi.hi)}</td><td>वर्ण / Varna</td><td>${esc(j.varna.hi)}</td></tr>`,
    `<tr><td>नामाक्षर / Naamakshar</td><td class="big">${esc(nm?.syllable || '')}</td><td>गण्डमूल</td><td>${j.gandmool?.present ? 'हाँ (' + esc(j.gandmool.nakshatra) + ')' : 'नहीं'}</td></tr>`,
  ] : [];

  const names = (d.names?.names || []).slice(0, 12).map((n) => `<span class="nchip"><b>${esc(n.name)}</b> — ${esc(n.meaning)}</span>`).join('');

  const predItems = (r?.predictions || []).slice(0, 12).map((x) => `<li><b>${esc(x.title.hi || x.title.en)}:</b> ${esc(x.text.hi || x.text.en)} <i>(${esc(x.source || '')})</i></li>`);

  // ── Charts: D1 (Lagna) from kundli, D9 (Navamsa) from varga ──
  const cs = d.person.chartStyle || 'north';
  const styleLabel = cs === 'north' ? 'North Indian' : cs === 'south' ? 'South Indian' : 'East Indian';
  const d9 = (d.varga?.data?.charts || []).find((c: any) => c.code === 'D9');
  const chartsHtml = planets.length ? section(
    `कुंडली चक्र · Charts (${styleLabel} · Lahiri)`,
    `<div class="charts">${svgChart('D1 लग्न / Lagna', planets, k?.ascendant, cs)}${d9 ? svgChart('D9 नवांश / Navamsa', d9.planets, d9.ascendantSign, cs) : ''}</div>`,
    'chart-section',
  ) : '';

  // ── Divisional charts summary (16 varga) ──
  const vlist = (d.varga?.data?.charts || []);
  const vargaRows = vlist.map((c: any) => `<tr><td class="pl">${esc(c.code)}</td><td>${esc(c.name || '')}</td><td>${esc(c.ascendantSign || '—')}</td></tr>`);
  const vargaHtml = tableSections(
    'विभाजन चक्र · 16 Divisional Charts',
    '<tr><th>Varga</th><th>Name</th><th>Ascendant</th></tr>',
    vargaRows,
    9,
  );

  // ── Full Dasha periods ──
  const dperiods = (d.timeline?.periods || []);
  const dashaRows = dperiods.map((p) => {
    const phal = [p.phala?.effect, p.phala?.good, p.phala?.caution, p.phala?.remedy].filter(Boolean).join(' ');
    return `<tr class="${p.current ? 'current-row' : ''}"><td class="pl">${esc(p.lord)}${p.current ? ' ◀ अभी' : ''}</td><td>${Math.round(p.fromAge)}–${Math.round(p.toAge)}</td><td>${p.fromYear}–${p.toYear}</td><td>${esc(phal || '—')}</td></tr>`;
  });
  const dashaHtml = tableSections(
    'विंशोत्तरी दशा-काल · Dasha Periods',
    '<tr><th>ग्रह</th><th>आयु / Age</th><th>वर्ष / Years</th><th>फल / Phal</th></tr>',
    dashaRows,
    5,
    'wide-table',
  );

  // ── Gochar (current transits + Sade Sati) ──
  const gc = d.gochar;
  const gocharRows = (gc?.transits || []).map((tn) => `<tr><td class="pl">${esc(tn.planet)}</td><td>${esc(tn.sign)}</td><td>${tn.houseFromMoon || '—'}</td></tr>`);
  const gocharHtml = gc ? section(
    'गोचर · Current Transits',
    `<div class="detailbox"><div><b>साढ़े साती / Sade Sati:</b> ${gc.sadeSati?.active ? esc(gc.sadeSati.phase || 'Active') : gc.sadeSati?.dhaiya ? 'Dhaiya' : 'No'}</div></div>${tableHtml('<tr><th>ग्रह</th><th>राशि</th><th>चंद्र से भाव</th></tr>', gocharRows)}`,
    'table-section',
  ) : '';

  // ── Year-by-year Saturn/Jupiter gochar forecast ──
  const tf = d.transitForecast;
  const forecastRows = (tf?.years || []).map((y) => `<tr class="${y.current ? 'current-row' : ''}">
      <td class="pl">${esc(y.year)}${y.current ? ' · Current' : ''}</td>
      <td>${esc(y.shani.signHi || y.shani.sign || '—')}${y.shani.houseFromMoon ? ` · ${y.shani.houseFromMoon} from Moon` : ''}${y.shani.eventHi || y.shani.event ? `<br/><small>${esc(y.shani.eventHi || y.shani.event)}</small>` : ''}</td>
      <td>${esc(y.guru.signHi || y.guru.sign || '—')}${y.guru.houseFromMoon ? ` · ${y.guru.houseFromMoon} from Moon` : ''}${y.guru.eventHi || y.guru.event ? `<br/><small>${esc(y.guru.eventHi || y.guru.event)}</small>` : ''}</td>
      <td>${esc(y.note || '')}</td>
    </tr>`);
  const forecastHead = '<tr><th>वर्ष / Year</th><th>शनि / Saturn</th><th>गुरु / Jupiter</th><th>नोट / Note</th></tr>';
  const forecastHtml = forecastRows.length ? chunks(forecastRows, 5).map((chunk, i) => section(
    i === 0 ? 'साल-दर-साल गोचर · Year-by-Year Forecast' : 'साल-दर-साल गोचर · Continued',
    `${i === 0 && tf?.summary ? `<div class="summary">${esc(tf.summary)}</div>` : ''}${tableHtml(forecastHead, chunk, 'wide-table')}`,
    'table-section',
  )).join('') : '';

  // ── Remedies (Upay) ──
  const rem = d.remedies?.remedies;
  const gem = rem?.lifeGem;
  const remHtml = rem ? section(
    'उपाय · Remedies',
    `
    ${gem ? `<div class="detailbox"><div><b>भाग्य रत्न / Life Gem:</b> ${esc(gem.gemstone)} (${esc(gem.planet)}) · ${esc(gem.metal || '')} · ${esc(gem.finger || '')} · ${esc(gem.day || '')}</div></div>` : ''}
    ${gem?.mantra ? `<p class="mantra">🕉 ${esc(gem.mantra)}</p>` : ''}
    <ul>${(rem.doshaRemedies || []).filter((x) => x.present).map((x) => `<li><b>${esc(x.nameHi || x.name)}:</b> ${esc(x.mantraHi || x.mantra || '')} ${(x.remedies || []).slice(0, 2).map((y) => esc(y.titleHi || y.title)).join('; ')}</li>`).join('')}</ul>`,
  ) : '';

  const reportItems = [
    ['D1 Lagna Chart', planets.length],
    ['D9 Navamsa', !!d9],
    ['16 Varga Summary', vlist.length],
    ['Birth Panchang', !!bp],
    ['Planetary Positions', planetRows.length],
    ['Vimshottari Dasha', dperiods.length],
    ['Current Gochar', !!gc],
    ['Year Forecast', (tf?.years || []).length],
    ['Vedic Phaladesh', predItems.length],
    ['Remedies', !!rem],
    ['Naamkaran', !!names],
  ].filter(([, ok]) => !!ok);
  const reportScopeHtml = section('रिपोर्ट में शामिल · Report Includes', `<div class="reportgrid">${reportItems.map(([label]) => `<div class="reportitem">${esc(label)}</div>`).join('')}</div>`, 'compact-section');
  const ayanamsa = k?.ayanamsa || d.varga?.data?.ayanamsa || 'Lahiri';
  const calcNote = `<div class="calcnote"><b>Calculation Basis:</b> Birth date, exact birth time, timezone and place are used for real astronomical sidereal calculations of the grahas &amp; nakshatras. Ayanamsa: ${esc(ayanamsa)}. AI text only explains the calculated Kundli, dasha and transit data; it is not used to invent planetary positions or dates.</div>`;
  const panchangHtml = panchangRows.length ? section('पंचांग · Birth Panchang', tableHtml('', panchangRows), 'table-section') : '';
  const planetHtml = planetRows.length ? tableSections(
    'ग्रह स्थिति · Planetary Positions',
    '<tr><th>ग्रह</th><th>राशि</th><th>अंश</th><th>नक्षत्र</th><th>भाव</th><th>—</th></tr>',
    planetRows,
    9,
  ) : '';
  const janmaHtml = janmaRows.length ? section('जन्म विवरण · Janma Details', tableHtml('', janmaRows), 'table-section') : '';
  const dashaSummaryHtml = bal ? section(
    'विंशोत्तरी दशा · Dasha',
    `<div class="detailbox">
      <div><b>जन्म दशा:</b> ${esc(bal.lord)} (${esc(bal.bhuktaYears)} वर्ष भुक्त, ${esc(bal.bhogyaYears)} वर्ष भोग्य)</div>
      ${cur ? `<div><b>वर्तमान दशा:</b> ${esc(cur.lord)} (आयु ${Math.round(cur.fromAge)}–${Math.round(cur.toAge)})</div>` : ''}
    </div>`,
    'compact-section',
  ) : '';
  const namesHtml = names ? section('शुभ नाम · Suggested Names', `<div class="name-lead">नामाक्षर: <b>${esc(nm?.syllable || '')}</b></div><div>${names}</div>`, 'compact-section') : '';
  const predsHtml = predItems.length ? chunks(predItems, 6).map((chunk, i) => section(
    i === 0 ? 'फलादेश · Key Predictions' : 'फलादेश · Continued',
    `<ul>${chunk.join('')}</ul>`,
  )).join('') : '';
  const summaryHtml = r?.explanation?.summary ? section('सार · Summary', `<div class="summary">${esc(r.explanation.summary)}</div>`) : '';

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
  .foot { text-align:center; color:#7a5a1e; font-size:10.5px; margin:0; border-top:1px dashed #c89d32; padding-top:10px; line-height:1.45; }
</style></head>
<body><div class="page-border" aria-hidden="true"></div><main class="patri">
<section class="pdf-section cover">
  <p class="om">॥ श्री गणेशाय नमः ॥</p>
  <div class="cover-rule"><span>ॐ</span></div>
  <h1>जन्म पत्रिका</h1>
  <p class="sub">Janam Kundli · Vedic Birth Chart &amp; Naming Report</p>

  <div class="detailbox">
    <div><b>नाम / Name:</b> ${esc(p.name || '—')}</div>
    <div><b>लिंग / Gender:</b> ${esc(p.gender || '—')}</div>
    <div><b>जन्म तिथि / DOB:</b> ${esc(p.dob)}</div>
    <div><b>जन्म समय / Time:</b> ${esc(p.tob)}</div>
    <div><b>जन्म स्थान / Place:</b> ${esc(p.place)}</div>
    <div><b>लग्न / Ascendant:</b> ${esc(k?.ascendant || '—')}</div>
    <div><b>चंद्र राशि / Moon:</b> ${esc(k?.moonSign || '—')}</div>
  </div>

  ${calcNote}
</section>

  ${reportScopeHtml}

  ${panchangHtml}

  ${planetHtml}
  ${chartsHtml}
  ${janmaHtml}
  ${dashaSummaryHtml}
  ${dashaHtml}

  ${gocharHtml}

  ${forecastHtml}

  ${remHtml}

  ${namesHtml}
  ${predsHtml}

  ${vargaHtml}

  ${summaryHtml}

  <section class="pdf-section compact-section"><p class="foot">Computed from real astronomical planetary positions (grahas &amp; nakshatras, Lahiri Ayanamsa) + classical Jyotish · Generated by Shree Yantra App<br/>
  This is a computer-generated Vedic report for guidance.</p></section>
</main></body></html>`;
}
