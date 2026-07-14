// 2030 — another year the engine has never been tested on. Run at BOTH cities: Drik's
// answer must not move with longitude, and that is exactly where the last bug hid.
const { observancesForDate } = require('../services/observance.service');
const CITIES = { Jodhpur: [26.2389, 73.0243], Kanpur: [26.4499, 80.3319] };

const drik = {  // drikpanchang.com, Jodhpur (geoname 1268865), 2030
  'sankranti-makara': '14/01', 'maha-shivaratri': '02/03', 'holika-dahan': '19/03', 'holi': '20/03',
  'gudi-padwa': '03/04', 'ram-navami': '12/04', 'hanuman-jayanti': '18/04', 'akshaya-tritiya': '05/05',
  'buddha-purnima': '17/05', 'guru-purnima': '15/07', 'raksha-bandhan': '13/08', 'krishna-janmashtami': '21/08',
  'ganesh-chaturthi': '01/09', 'navratri-start': '28/09', 'vijayadashami': '06/10', 'karwa-chauth': '15/10',
  'dhanteras': '24/10', 'diwali': '26/10', 'govardhan-puja': '27/10', 'bhai-dooj': '28/10',
  'chhath-puja': '01/11', 'kartik-purnima': '10/11',
};

const scan = (lat, lng) => {
  const got = {};
  for (let m = 0; m < 12; m++)
    for (let d = 1, n = new Date(2030, m + 1, 0).getDate(); d <= n; d++)
      for (const o of observancesForDate({ dateObj: new Date(2030, m, d), lat, lng, tz: '+05:30' }) || [])
        if (drik[o.key] && !got[o.key]) got[o.key] = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`;
  return got;
};

const res = Object.fromEntries(Object.entries(CITIES).map(([c, [lat, lng]]) => [c, scan(lat, lng)]));
let pass = 0, fail = 0;
console.log('=== 2030 · engine vs Drik (Jodhpur ground truth) ===\n');
for (const [k, exp] of Object.entries(drik)) {
  const j = res.Jodhpur[k] || '(none)', kp = res.Kanpur[k] || '(none)';
  const ok = j === exp && kp === exp;                       // must match AND agree across cities
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(22)} drik=${exp}  jodhpur=${j}  kanpur=${kp}${j !== kp ? '   <-- CITIES DISAGREE' : ''}`);
}
console.log(`\n  ${pass}/${pass + fail} matched (${(pass / (pass + fail) * 100).toFixed(1)}%)`);
