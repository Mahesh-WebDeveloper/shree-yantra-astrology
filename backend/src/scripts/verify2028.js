// 2028 — another year the engine has never been tested on. Run at BOTH cities: Drik's
// answer must not move with longitude, and that is exactly where the last bug hid.
const { observancesForDate } = require('../services/observance.service');
const CITIES = { Jodhpur: [26.2389, 73.0243], Kanpur: [26.4499, 80.3319] };

const drik = {  // drikpanchang.com, Jodhpur (geoname 1268865), 2028
  'sankranti-makara': '15/01', 'maha-shivaratri': '23/02', 'holika-dahan': '10/03', 'holi': '11/03',
  'gudi-padwa': '27/03', 'ram-navami': '03/04', 'hanuman-jayanti': '09/04', 'akshaya-tritiya': '27/04',
  'buddha-purnima': '08/05', 'guru-purnima': '06/07', 'raksha-bandhan': '05/08', 'krishna-janmashtami': '13/08',
  'ganesh-chaturthi': '23/08', 'navratri-start': '19/09', 'vijayadashami': '27/09', 'karwa-chauth': '07/10',
  'dhanteras': '15/10', 'diwali': '17/10', 'govardhan-puja': '18/10', 'bhai-dooj': '19/10',
  'chhath-puja': '23/10', 'kartik-purnima': '02/11',
};

const scan = (lat, lng) => {
  const got = {};
  for (let m = 0; m < 12; m++)
    for (let d = 1, n = new Date(2028, m + 1, 0).getDate(); d <= n; d++)
      for (const o of observancesForDate({ dateObj: new Date(2028, m, d), lat, lng, tz: '+05:30' }) || [])
        if (drik[o.key] && !got[o.key]) got[o.key] = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`;
  return got;
};

const res = Object.fromEntries(Object.entries(CITIES).map(([c, [lat, lng]]) => [c, scan(lat, lng)]));
let pass = 0, fail = 0;
console.log('=== 2028 · engine vs Drik (Jodhpur ground truth) ===\n');
for (const [k, exp] of Object.entries(drik)) {
  const j = res.Jodhpur[k] || '(none)', kp = res.Kanpur[k] || '(none)';
  const ok = j === exp && kp === exp;                       // must match AND agree across cities
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(22)} drik=${exp}  jodhpur=${j}  kanpur=${kp}${j !== kp ? '   <-- CITIES DISAGREE' : ''}`);
}
console.log(`\n  ${pass}/${pass + fail} matched (${(pass / (pass + fail) * 100).toFixed(1)}%)`);
