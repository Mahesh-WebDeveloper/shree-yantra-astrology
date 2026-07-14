// 2029 — another year the engine has never been tested on. Run at BOTH cities: Drik's
// answer must not move with longitude, and that is exactly where the last bug hid.
const { observancesForDate } = require('../services/observance.service');
const CITIES = { Jodhpur: [26.2389, 73.0243], Kanpur: [26.4499, 80.3319] };

const drik = {  // drikpanchang.com, Jodhpur (geoname 1268865), 2029
  'sankranti-makara': '14/01', 'maha-shivaratri': '11/02', 'holika-dahan': '28/02', 'holi': '01/03',
  'gudi-padwa': '14/04', 'ram-navami': '22/04', 'hanuman-jayanti': '28/04', 'akshaya-tritiya': '16/05',
  'buddha-purnima': '27/05', 'guru-purnima': '25/07', 'raksha-bandhan': '23/08', 'krishna-janmashtami': '01/09',
  'ganesh-chaturthi': '11/09', 'navratri-start': '08/10', 'vijayadashami': '16/10', 'karwa-chauth': '26/10',
  'dhanteras': '04/11', 'diwali': '05/11', 'govardhan-puja': '06/11', 'bhai-dooj': '07/11',
  'chhath-puja': '11/11', 'kartik-purnima': '21/11',
};

const scan = (lat, lng) => {
  const got = {};
  for (let m = 0; m < 12; m++)
    for (let d = 1, n = new Date(2029, m + 1, 0).getDate(); d <= n; d++)
      for (const o of observancesForDate({ dateObj: new Date(2029, m, d), lat, lng, tz: '+05:30' }) || [])
        if (drik[o.key] && !got[o.key]) got[o.key] = `${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`;
  return got;
};

const res = Object.fromEntries(Object.entries(CITIES).map(([c, [lat, lng]]) => [c, scan(lat, lng)]));
let pass = 0, fail = 0;
console.log('=== 2029 · engine vs Drik (Jodhpur ground truth) ===\n');
for (const [k, exp] of Object.entries(drik)) {
  const j = res.Jodhpur[k] || '(none)', kp = res.Kanpur[k] || '(none)';
  const ok = j === exp && kp === exp;                       // must match AND agree across cities
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(22)} drik=${exp}  jodhpur=${j}  kanpur=${kp}${j !== kp ? '   <-- CITIES DISAGREE' : ''}`);
}
console.log(`\n  ${pass}/${pass + fail} matched (${(pass / (pass + fail) * 100).toFixed(1)}%)`);
