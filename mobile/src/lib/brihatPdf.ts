// Builds a Vedic-themed Brihat Kundli (बृहत कुंडली) HTML for expo-print → PDF.
// Pure string builder — fed by the /api/brihat-kundli aggregator response.
import { BrihatKundliResponse } from './api';

export interface BrihatPdfPerson { name?: string; gender?: string; dob: string; tob: string; place: string; lang?: 'en' | 'hi' }

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
const hnum = (h?: any) => { const m = String(h ?? '').match(/\d+/); return m ? m[0] : '—'; };
const nak = (n: any) => (n && typeof n === 'object' ? (n.Name || n.name || '') : (n || ''));
const deg = (d: any) => { const n = String(d ?? '').match(/\d+/g); return n && n.length >= 2 ? `${n[0]}°${n[1]}'` : (n && n[0] ? `${n[0]}°` : '—'); };
const yr = (s?: string) => { const m = String(s ?? '').match(/(\d{4})/); return m ? m[1] : ''; };

function section(title: string, body: string, cls = ''): string {
  if (!body) return '';
  return `<section class="pdf-section ${cls}"><h2>${title}</h2>${body}</section>`;
}
function table(head: string, rows: string[], cls = ''): string {
  if (!rows.length) return '';
  return `<table class="${cls}">${head ? `<thead>${head}</thead>` : ''}<tbody>${rows.join('')}</tbody></table>`;
}
function chunks<T>(a: T[], n: number): T[][] { const o: T[][] = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }

export function buildBrihatHtml(person: BrihatPdfPerson, report: BrihatKundliResponse): string {
  const hi = person.lang === 'hi';
  const tr = (p?: { en: string; hi: string } | null) => (p ? (hi ? p.hi : p.en) : '');
  const s = report.summary || {};
  const planets = (report.data?.kundli?.data?.planets || []).filter((x) => x.sign);

  // ── Avakhada Chakra ──
  const a = report.avakhada;
  const avRows = a ? [
    ['Varna', tr(a.varna)], ['Vashya', tr(a.vashya)], ['Yoni', tr(a.yoni)], ['Gana', tr(a.gana)],
    ['Nadi', tr(a.nadi)], ['Tatva', tr(a.tatva)], ['Paya', a.paya ? tr(a.paya) : '—'],
    ['Nakshatra', `${a.nakshatra.name}${a.nakshatra.pada ? ' - ' + a.nakshatra.pada : ''}`],
    ['Nakshatra Lord', tr(a.nakshatra.lord)], ['Rashi', esc(a.rashi.name)], ['Rashi Lord', tr(a.rashi.lord)],
    ['Lagna', a.lagna ? esc(a.lagna.name) : '—'], ['Lagna Lord', a.lagna ? tr(a.lagna.lord) : '—'],
    ['Dasha Balance', esc(a.dashaBalance || '—')],
  ] : [];
  const avHtml = avRows.length ? section('अवकहड़ा चक्र · Avakhada Chakra',
    `<div class="kv">${avRows.map(([k, v]) => `<div class="kvi"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`, 'compact-section') : '';

  // ── Planetary Positions ──
  const plRows = planets.map((x) => `<tr><td class="pl">${esc(x.planet)}</td><td>${esc(x.sign)}</td><td>${deg(x.degreeInSign)}</td><td>${esc(nak(x.nakshatra))}</td><td>${hnum(x.house)}</td><td>${String(x.isRetrograde).toLowerCase() === 'true' ? 'R' : '—'}</td></tr>`);
  const plHtml = plRows.length ? section('ग्रह स्थिति · Planetary Positions',
    table('<tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>House</th><th>—</th></tr>', plRows), 'table-section') : '';

  // ── Vimshottari Dasha ──
  const periods = report.data?.timeline?.periods?.filter((p) => !p.past) || [];
  let dashaRows: string[] = [];
  if (periods.length) dashaRows = periods.slice(0, 12).map((p) => `<tr class="${p.current ? 'current-row' : ''}"><td class="pl">${esc(p.lord)}${p.current ? ' ◀' : ''}</td><td>${Math.round(p.fromAge)}–${Math.round(p.toAge)}</td><td>${p.fromYear}–${p.toYear}</td></tr>`);
  else dashaRows = (report.data?.dasha?.dasha || []).slice(0, 12).map((d) => `<tr><td class="pl">${esc(d.lord)}</td><td>—</td><td>${yr(d.start)}–${yr(d.end)}</td></tr>`);
  const dashaHtml = dashaRows.length ? section('विंशोत्तरी दशा · Vimshottari Dasha',
    table('<tr><th>Mahadasha</th><th>Age</th><th>Years</th></tr>', dashaRows), 'table-section') : '';

  // ── Yogas & Doshas ──
  const yogas = report.data?.yoga?.yogas || [];
  const doshas = s.doshas || [];
  const ydBody = `${doshas.length ? `<div class="detailbox">${doshas.map((d: any) => `<div><b>${esc(d.name)}:</b> ${d.present ? (hi ? 'है' : 'Present') : (hi ? 'नहीं' : 'Clear')}</div>`).join('')}</div>` : ''}${yogas.length ? `<ul>${yogas.slice(0, 14).map((y) => `<li><b>${esc(y.name)}</b>${y.description ? ' — ' + esc(y.description) : ''}</li>`).join('')}</ul>` : ''}`;
  const ydHtml = (yogas.length || doshas.length) ? section('योग व दोष · Yogas &amp; Doshas', ydBody) : '';

  // ── Ashtakavarga ──
  const av = report.ashtakavarga;
  let avgHtml = '';
  if (av) {
    const sav = `<tr><td class="pl">Sarva</td>${av.sarva.map((v) => `<td>${v}</td>`).join('')}<td>${av.sarvaTotal}</td></tr>`;
    const bav = Object.entries(av.bhinna).map(([p, o]: any) => `<tr><td class="pl">${esc(p)}</td>${o.bindus.map((v: number) => `<td>${v}</td>`).join('')}<td>${o.total}</td></tr>`);
    const head = `<tr><th>Planet</th>${av.signs.map((sg) => `<th>${esc(sg.slice(0, 3))}</th>`).join('')}<th>Tot</th></tr>`;
    avgHtml = section('अष्टकवर्ग · Ashtakavarga', `<p class="small">Sarvashtakavarga total = ${av.sarvaTotal} (BPHS bindu tables).</p>${table(head, [...bav, sav], 'wide-table av-table')}`, 'table-section');
  }

  // ── Numerology ──
  const nu = report.numerology;
  const numCard = (label: string, c: any) => `<div><b>${esc(label)} ${c.number}</b> · ${hi ? c.planetHi : c.planet} · ${hi ? c.dayHi : c.day} · ${hi ? c.stoneHi : c.stone}</div>`;
  const numHtml = nu ? section('अंक ज्योतिष · Numerology', `<div class="detailbox">${numCard(hi ? 'मूलांक' : 'Moolank', nu.psychic)}${numCard(hi ? 'भाग्यांक' : 'Bhagyank', nu.destiny)}</div>`, 'compact-section') : '';

  // ── Jaimini ──
  const j = report.jaimini;
  const jHtml = j && j.charaKarakas?.length ? section('जैमिनी कारक · Jaimini Chara Karakas',
    `${j.arudhaLagna ? `<div class="detailbox"><div><b>Arudha Lagna:</b> ${esc(j.arudhaLagna.sign)}</div></div>` : ''}${table('<tr><th>Karaka</th><th>Planet</th><th>Sign</th><th>Degree</th><th>Signifies</th></tr>', j.charaKarakas.map((k) => `<tr><td class="pl">${esc(k.key)} ${esc(hi ? k.hi : k.en)}</td><td>${esc(hi ? (k.planetHi || k.planet) : k.planet)}</td><td>${esc(k.sign)}</td><td>${k.degree}°</td><td>${esc(k.sig)}</td></tr>`))}`, 'table-section') : '';

  // ── Varshphal ──
  const v = report.varshphal;
  const vHtml = v && v.years?.length ? section('वर्षफल · Varshphal (5-Year Muntha)',
    table('<tr><th>Year</th><th>Muntha Sign</th><th>House</th><th>Theme</th></tr>', v.years.map((y) => `<tr><td class="pl">${y.year}</td><td>${esc(y.munthaSign)}</td><td>${y.houseFromLagna}</td><td>${esc(tr(y.theme))}</td></tr>`)), 'table-section') : '';

  // ── Remedies ──
  const rem = report.data?.remedies?.remedies;
  const gem = rem?.lifeGem;
  const mantras = rem?.planetMantras || [];
  const remHtml = rem ? section('रत्न व उपाय · Gemstone &amp; Remedies',
    `${gem ? `<div class="detailbox"><div><b>Life Gem:</b> ${esc(hi ? (gem.gemstoneHi || gem.gemstone) : gem.gemstone)}${gem.metal ? ' · ' + esc(hi ? (gem.metalHi || gem.metal) : gem.metal) : ''}${gem.finger ? ' · ' + esc(hi ? (gem.fingerHi || gem.finger) : gem.finger) : ''}${gem.day ? ' · ' + esc(hi ? (gem.dayHi || gem.day) : gem.day) : ''}</div></div>` : ''}${mantras.length ? `<ul>${mantras.slice(0, 6).map((m) => `<li><b>${esc(hi ? (m.planetHi || m.planet) : m.planet)}:</b> ${esc(m.mantra)}</li>`).join('')}</ul>` : ''}`, 'compact-section') : '';

  // ── KP Significators ──
  const kp = report.kp;
  const kpHtml = kp && kp.planets?.length ? section('KP कारक · KP Significators',
    table('<tr><th>Body</th><th>Sign Lord</th><th>Star Lord</th><th>Sub Lord</th></tr>',
      [...(kp.ascendant ? [{ ...kp.ascendant, planet: 'Ascendant' }] : []), ...kp.planets].map((r) =>
        `<tr><td class="pl">${esc(r.planet)}</td><td>${esc(hi ? r.signLordHi : r.signLord)}</td><td>${esc(hi ? r.starLordHi : r.starLord)}</td><td>${esc(hi ? r.subLordHi : r.subLord)}</td></tr>`)),
    'table-section') : '';

  // ── Shadbala ──
  const sb = report.shadbala;
  const sbHtml = sb && sb.planets && Object.keys(sb.planets).length ? section('षड्बल · Shadbala (Rupas)',
    `<p class="small">Six-fold strength per classical BPHS. "Req" = required minimum; values may vary slightly across software.</p>${table('<tr><th>Planet</th><th>Sthana</th><th>Dig</th><th>Kala</th><th>Cheshta</th><th>Naisarg.</th><th>Drik</th><th>Total</th><th>Rupas</th><th>Req</th></tr>',
      Object.entries(sb.planets).sort((a, b) => a[1].rank - b[1].rank).map(([pl, v]) =>
        `<tr><td class="pl">${esc(pl)}${v.strong ? ' ✓' : ''}</td><td>${v.sthana}</td><td>${v.dig}</td><td>${v.kala}</td><td>${v.cheshta}</td><td>${v.naisargika}</td><td>${v.drik}</td><td>${v.total}</td><td><b>${v.rupas}</b></td><td>${v.required}</td></tr>`),
      'wide-table av-table')}`, 'table-section') : '';

  // ── Lal Kitab chart ──
  const lk = report.lalKitab;
  const lkHtml = lk && lk.houses?.length ? section('लाल किताब · Lal Kitab Chart',
    `<p class="small">House-wise placement (Teva). Lagna: ${esc(lk.lagna || '—')}.</p>${table('<tr><th>House</th><th>Sign</th><th>Planets</th></tr>',
      lk.houses.map((h) => `<tr><td class="pl">${h.house}</td><td>${esc(h.sign)}</td><td>${h.planets.length ? h.planets.map((p) => esc(hi ? p.hi : p.en)).join(', ') : '—'}</td></tr>`))}`, 'table-section') : '';

  const eng = report.accuracy?.engine || 'VedAstro (Lahiri) + classical Jyotish';

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
  .foot { text-align:center; color:#7a5a1e; font-size:10.5px; margin:0; border-top:1px dashed #c89d32; padding-top:10px; line-height:1.45; }
</style></head>
<body><div class="page-border" aria-hidden="true"></div><main class="patri">
<section class="pdf-section cover">
  <p class="om">॥ श्री गणेशाय नमः ॥</p>
  <h1>बृहत कुंडली</h1>
  <p class="sub">Brihat Kundli · Detailed Vedic Astrology Report</p>
  <div class="detailbox">
    ${person.name ? `<div><b>नाम / Name:</b> ${esc(person.name)}</div>` : ''}
    <div><b>जन्म तिथि / DOB:</b> ${esc(person.dob)}</div>
    <div><b>जन्म समय / Time:</b> ${esc(person.tob)}</div>
    <div><b>जन्म स्थान / Place:</b> ${esc(person.place)}</div>
    <div><b>लग्न / Ascendant:</b> ${esc(s.ascendant || '—')}</div>
    <div><b>चंद्र राशि / Moon:</b> ${esc(s.moonSign || '—')}</div>
    <div><b>सूर्य / Sun:</b> ${esc(s.sunSign || '—')}</div>
  </div>
  <div class="calcnote"><b>Calculation Basis:</b> ${esc(eng)}. ${esc(report.accuracy?.note || 'Astronomical values are computed; interpretations are traditional indications, not guaranteed outcomes.')}</div>
</section>
  ${avHtml}
  ${plHtml}
  ${dashaHtml}
  ${ydHtml}
  ${avgHtml}
  ${numHtml}
  ${jHtml}
  ${vHtml}
  ${kpHtml}
  ${sbHtml}
  ${lkHtml}
  ${remHtml}
  <section class="pdf-section compact-section"><p class="foot">Computed via VedAstro (Lahiri Ayanamsa) + classical Jyotish &amp; local ephemeris · Generated by Shree Yantra App<br/>This is a computer-generated Vedic report for guidance.</p></section>
</main></body></html>`;
}
