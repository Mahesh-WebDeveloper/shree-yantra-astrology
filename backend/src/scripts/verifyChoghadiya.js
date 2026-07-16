// Verify the app's choghadiya engine against Drik (Jodhpur, Thu 16 Jul 2026).
// Sun times come from OUR ephemeris; the sequencing is a 1:1 copy of mobile's choghadiya.ts.
const eph = require('../utils/localEphemeris');
const tz = eph.parseTzMin('+05:30');
const LAT = 26.2389, LNG = 73.0243;

const sunFor = (d) => ({
  sr: eph.riseSetMinutes('Sun', d, LAT, LNG, tz, +1),
  ss: eph.riseSetMinutes('Sun', d, LAT, LNG, tz, -1),
});
const hm = (min) => {
  let h = Math.floor(min / 60) % 24, m = Math.round(min % 60);
  if (m === 60) { m = 0; h = (h + 1) % 24; }
  const ap = h < 12 ? 'AM' : 'PM'; let hh = h % 12; if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
};

const DAY_ORDER = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
const NIGHT_ORDER = ['Shubh', 'Amrit', 'Char', 'Rog', 'Kaal', 'Labh', 'Udveg'];
const DAY_START = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal'];
const NIGHT_START = ['Shubh', 'Char', 'Kaal', 'Udveg', 'Amrit', 'Rog', 'Labh'];

const date = new Date(2026, 6, 16);            // Thursday
const next = new Date(2026, 6, 17);
const today = sunFor(date), tomorrow = sunFor(next);
console.log(`sunrise ${hm(today.sr)} · sunset ${hm(today.ss)} · next sunrise ${hm(tomorrow.sr)}`);

const dow = date.getDay();
const dayLen = (today.ss - today.sr) / 8;
const nightLen = (tomorrow.sr + 1440 - today.ss) / 8;

// Drik's tables (fetched from drikpanchang.com just now)
const DRIK_DAY = [['Shubh','05:55 AM','07:38 AM'],['Rog','07:38 AM','09:20 AM'],['Udveg','09:20 AM','11:02 AM'],['Char','11:02 AM','12:44 PM'],['Labh','12:44 PM','02:26 PM'],['Amrit','02:26 PM','04:08 PM'],['Kaal','04:08 PM','05:50 PM'],['Shubh','05:50 PM','07:33 PM']];
const DRIK_NIGHT = [['Amrit','07:33 PM','08:50 PM'],['Char','08:50 PM','10:08 PM'],['Rog','10:08 PM','11:26 PM'],['Kaal','11:26 PM','12:44 AM'],['Labh','12:44 AM','02:02 AM'],['Udveg','02:02 AM','03:20 AM'],['Shubh','03:20 AM','04:38 AM'],['Amrit','04:38 AM','05:56 AM']];

const toMin = (s) => { const [t, ap] = s.split(' '); let [h, m] = t.split(':').map(Number); if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0; return h * 60 + m; };

let pass = 0, total = 0;
console.log('\nDAY   (ours vs Drik)');
const di = DAY_ORDER.indexOf(DAY_START[dow]);
for (let i = 0; i < 8; i++) {
  const name = DAY_ORDER[(di + i) % 7];
  const s = today.sr + i * dayLen, e = today.sr + (i + 1) * dayLen;
  const [dn, dsS, deS] = DRIK_DAY[i];
  const dS = Math.abs(Math.round(s) - toMin(dsS)), dE = Math.abs(Math.round(e) - toMin(deS));
  const ok = name === dn && dS <= 1 && dE <= 1;
  total++; if (ok) pass++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(6)} ${hm(s)}-${hm(e)}   drik: ${dn.padEnd(6)} ${dsS}-${deS}`);
}
console.log('NIGHT (ours vs Drik)');
const ni = NIGHT_ORDER.indexOf(NIGHT_START[dow]);
for (let j = 0; j < 8; j++) {
  const name = NIGHT_ORDER[(ni + j) % 7];
  const s = today.ss + j * nightLen, e = today.ss + (j + 1) * nightLen;
  const [dn, dsS, deS] = DRIK_NIGHT[j];
  const dsM = toMin(dsS) + (toMin(dsS) < 720 ? 1440 : 0);   // past-midnight rows
  const deM = toMin(deS) + (toMin(deS) < 720 ? 1440 : 0);
  const dS = Math.abs(Math.round(s) - dsM), dE = Math.abs(Math.round(e) - deM);
  const ok = name === dn && dS <= 1 && dE <= 1;
  total++; if (ok) pass++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(6)} ${hm(s)}-${hm(e)}   drik: ${dn.padEnd(6)} ${dsS}-${deS}`);
}
console.log(`\n${pass}/${total} matched (±1 min)`);
