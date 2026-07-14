// 2034 — another year the engine has never been tested on. Run at BOTH cities: Drik's
// answer must not move with longitude, and that is exactly where the last bug hid.
const { observancesForDate } = require('../services/observance.service');
const CITIES = { Jodhpur: [26.2389, 73.0243], Kanpur: [26.4499, 80.3319] };

const drik = {  // drikpanchang.com, Jodhpur (geoname 1268865), 2034
  'sankranti-makara': '14/01', 'maha-shivaratri': '17/02', 'holika-dahan': '04/03', 'holi': '05/03',
  'gudi-padwa': '21/03', 'ram-navami': '28/03', 'hanuman-jayanti': '03/04', 'akshaya-tritiya': '21/04',
  'buddha-purnima': '03/05', 'guru-purnima': '31/07', 'raksha-bandhan': '29/08', 'krishna-janmashtami': '05/09',
  'ganesh-chaturthi': '16/09', 'navratri-start': '13/10', 'vijayadashami': '22/10', 'karwa-chauth': '30/10',
  'dhanteras': '08/11', 'diwali': '10/11', 'govardhan-puja': '11/11', 'bhai-dooj': '12/11',
  'chhath-puja': '17/11', 'kartik-purnima': '25/11',
};

const scan = (lat, lng) => {
  const got = {};
  for (let m = 0; m < 12; m++)
    for (let d = 1, n = new Date(2034, m + 1, 0).getDate(); d <= n; d++)
      for (const o of observancesForDate({ dateObj: new Date(2034, m, d), lat, lng, tz: '+05:30' }) || [])
        if (drik[o.key] && !got[o.key]) got[o.key] = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`;
  return got;
};

const res = Object.fromEntries(Object.entries(CITIES).map(([c, [lat, lng]]) => [c, scan(lat, lng)]));
let pass = 0, fail = 0;
console.log('=== 2034 · engine vs Drik (Jodhpur ground truth) ===\n');
for (const [k, exp] of Object.entries(drik)) {
  const j = res.Jodhpur[k] || '(none)', kp = res.Kanpur[k] || '(none)';
  const ok = j === exp && kp === exp;                       // must match AND agree across cities
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(22)} drik=${exp}  jodhpur=${j}  kanpur=${kp}${j !== kp ? '   <-- CITIES DISAGREE' : ''}`);
}
console.log(`\n  ${pass}/${pass + fail} matched (${(pass / (pass + fail) * 100).toFixed(1)}%)`);
