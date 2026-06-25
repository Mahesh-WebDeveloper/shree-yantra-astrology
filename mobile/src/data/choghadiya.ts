/**
 * Choghadiya engine — ported 1:1 from the web prototype
 * (pages/choghadiya/index.html). Day (sunrise→sunset) and night
 * (sunset→next sunrise) are each split into 8 periods, sequenced by weekday.
 */

export type Nature = 'good' | 'neutral' | 'bad';
export type ColorKey = 'green' | 'blue' | 'orange' | 'red';

export interface Meta {
  nature: Nature;
  tag: string;
  color: ColorKey;
  desc: string;
}

export interface Period {
  name: string;
  phase: 'day' | 'night';
  start: Date;
  end: Date;
  meta: Meta;
}

// Sunrise / sunset for the locale shown (Jaipur ~ demo values).
const SUNRISE = { h: 5, m: 28 };
const SUNSET = { h: 18, m: 54 };

const DAY_ORDER = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'];
const NIGHT_ORDER = ['Shubh', 'Amrit', 'Char', 'Rog', 'Kaal', 'Labh', 'Udveg'];
const DAY_START = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal'];
const NIGHT_START = ['Shubh', 'Char', 'Kaal', 'Udveg', 'Amrit', 'Rog', 'Labh'];

export const META: Record<string, Meta> = {
  Amrit: { nature: 'good', tag: 'Auspicious', color: 'green', desc: 'The most auspicious time — ideal for any sacred or important work.' },
  Shubh: { nature: 'good', tag: 'Auspicious', color: 'green', desc: 'Excellent for ceremonies, new beginnings and auspicious tasks.' },
  Labh: { nature: 'good', tag: 'Auspicious', color: 'blue', desc: 'Good time for business, financial transactions, deals and purchases.' },
  Char: { nature: 'neutral', tag: 'Neutral', color: 'orange', desc: 'Movable time — favourable for travel, journeys and quick errands.' },
  Udveg: { nature: 'bad', tag: 'Inauspicious', color: 'red', desc: 'Best avoided for new work — suited only to routine tasks.' },
  Kaal: { nature: 'bad', tag: 'Inauspicious', color: 'red', desc: 'Inauspicious period — postpone important beginnings.' },
  Rog: { nature: 'bad', tag: 'Inauspicious', color: 'red', desc: 'Linked to conflict & illness — avoid key activities.' },
};

const at = (date: Date, t: { h: number; m: number }) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), t.h, t.m, 0, 0);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const pad2 = (n: number) => (n < 10 ? '0' : '') + n;

export function fmtTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? 'AM' : 'PM';
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${pad2(hh)}:${pad2(m)} ${ap}`;
}

const WDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${WDAYS[d.getDay()]}`;

export interface SunTimes { sunrise: { h: number; m: number }; sunset: { h: number; m: number }; }

/** All 16 periods (8 day + 8 night) for a given date.
 *  `sun` = real sunrise/sunset (VedAstro); na ho to demo constants. */
export function buildPeriods(date: Date, sun?: SunTimes): Period[] {
  const dow = date.getDay();
  const SR = sun?.sunrise || SUNRISE;
  const SS = sun?.sunset || SUNSET;
  const sr = at(date, SR);
  const ss = at(date, SS);
  const nsr = at(addDays(date, 1), SR);
  const dayLen = (ss.getTime() - sr.getTime()) / 8;
  const nightLen = (nsr.getTime() - ss.getTime()) / 8;
  const list: Period[] = [];

  const di = DAY_ORDER.indexOf(DAY_START[dow]);
  for (let i = 0; i < 8; i++) {
    const name = DAY_ORDER[(di + i) % 7];
    list.push({
      name,
      phase: 'day',
      start: new Date(sr.getTime() + i * dayLen),
      end: new Date(sr.getTime() + (i + 1) * dayLen),
      meta: META[name],
    });
  }
  const ni = NIGHT_ORDER.indexOf(NIGHT_START[dow]);
  for (let j = 0; j < 8; j++) {
    const name = NIGHT_ORDER[(ni + j) % 7];
    list.push({
      name,
      phase: 'night',
      start: new Date(ss.getTime() + j * nightLen),
      end: new Date(ss.getTime() + (j + 1) * nightLen),
      meta: META[name],
    });
  }
  return list;
}

export const findActive = (periods: Period[], now: Date): Period | undefined =>
  periods.find((p) => now >= p.start && now < p.end);

/** Next up-to-3 auspicious (good) periods from `now`. */
export function upcomingGood(periods: Period[], now: Date): Period[] {
  let pool = periods.filter((p) => p.meta.nature === 'good' && p.end > now);
  if (!pool.length) pool = periods.filter((p) => p.meta.nature === 'good');
  return pool.slice(0, 3);
}

export const UPCOMING_BLURB: Record<string, string> = {
  Amrit: 'VERY AUSPICIOUS TIME',
  Shubh: 'GOOD FOR IMPORTANT TASKS',
  Labh: 'GOOD FOR MONEY RELATED WORK',
};
