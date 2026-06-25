/**
 * Predictions engine — ported 1:1 from the web prototype
 * (pages/predictions/index.html). Composes a deterministic, unique
 * prediction for each sign × period that stays stable through the day.
 */

export type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Sign {
  key: string;
  name: string;
  glyph: string;
  el: 'Fire' | 'Earth' | 'Air' | 'Water';
  house: string;
  dates: string;
}

export const SIGNS: Sign[] = [
  { key: 'aries', name: 'Aries', glyph: '♈', el: 'Fire', house: '1st', dates: 'Mar 21 – Apr 19' },
  { key: 'taurus', name: 'Taurus', glyph: '♉', el: 'Earth', house: '2nd', dates: 'Apr 20 – May 20' },
  { key: 'gemini', name: 'Gemini', glyph: '♊', el: 'Air', house: '3rd', dates: 'May 21 – Jun 20' },
  { key: 'cancer', name: 'Cancer', glyph: '♋', el: 'Water', house: '4th', dates: 'Jun 21 – Jul 22' },
  { key: 'leo', name: 'Leo', glyph: '♌', el: 'Fire', house: '5th', dates: 'Jul 23 – Aug 22' },
  { key: 'virgo', name: 'Virgo', glyph: '♍', el: 'Earth', house: '6th', dates: 'Aug 23 – Sep 22' },
  { key: 'libra', name: 'Libra', glyph: '♎', el: 'Air', house: '7th', dates: 'Sep 23 – Oct 22' },
  { key: 'scorpio', name: 'Scorpio', glyph: '♏', el: 'Water', house: '8th', dates: 'Oct 23 – Nov 21' },
  { key: 'sagittarius', name: 'Sagittarius', glyph: '♐', el: 'Fire', house: '9th', dates: 'Nov 22 – Dec 21' },
  { key: 'capricorn', name: 'Capricorn', glyph: '♑', el: 'Earth', house: '10th', dates: 'Dec 22 – Jan 19' },
  { key: 'aquarius', name: 'Aquarius', glyph: '♒', el: 'Air', house: '11th', dates: 'Jan 20 – Feb 18' },
  { key: 'pisces', name: 'Pisces', glyph: '♓', el: 'Water', house: '12th', dates: 'Feb 19 – Mar 20' },
];

const OPEN = [
  'The Sun’s placement in your {house} house favours creativity.',
  'A harmonious Moon lifts your mood and softens old tensions.',
  'Mercury sharpens your words — communication flows with ease.',
  'Venus blesses relationships and matters of comfort and beauty.',
  'Mars fuels your drive; channel the energy into focused work.',
  'Jupiter widens your horizons — a fortunate window opens.',
  'Saturn rewards patience; steady effort pays off now.',
  'A grounding {el} energy keeps you centred through the day.',
];
const MID = [
  'Avoid arguments with elders before noon.',
  'A pending matter at work finally moves forward.',
  'Health stays strong — but do not skip rest.',
  'An old friend or contact reaches out with good news.',
  'Money decisions taken now bear long-term fruit.',
  'Travel or a short journey brings unexpected joy.',
  'Trust your intuition over others’ opinions today.',
  'A creative idea deserves to be written down.',
];
const CLOSE = [
  'Evening brings positive financial news.',
  'Family time restores your inner balance.',
  'A small act of charity multiplies your fortune.',
  'Chanting or meditation amplifies today’s good energy.',
  'Wear your lucky colour for an added edge.',
  'Conclude the day with gratitude for steady wins.',
];
const COLORS = ['Gold', 'Saffron', 'Emerald Green', 'Royal Blue', 'Crimson', 'Ivory White', 'Deep Maroon', 'Turquoise'];
const MOODS = ['Energetic', 'Calm', 'Focused', 'Joyful', 'Reflective', 'Confident'];

export const PERIOD_LABEL: Record<Period, string> = { DAILY: 'TODAY', WEEKLY: 'THIS WEEK', MONTHLY: 'THIS MONTH', YEARLY: 'THIS YEAR' };
export const PERIOD_UPDATED: Record<Period, string> = { DAILY: 'Today', WEEKLY: 'This week', MONTHLY: 'This month', YEARLY: 'This year' };
const PERIOD_IDX: Record<Period, number> = { DAILY: 0, WEEKLY: 1, MONTHLY: 2, YEARLY: 3 };

const dayOfYear = (d: Date) => Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];

export interface Prediction { text: string; lucky: number; color: string; mood: string; }

export function predictionFor(sign: Sign, period: Period, now: Date = new Date()): Prediction {
  const doy = dayOfYear(now);
  const si = SIGNS.indexOf(sign);
  const pi = PERIOD_IDX[period];
  const base = si * 13 + doy + pi * 31;
  const text =
    pick(OPEN, base).replace('{house}', sign.house).replace('{el}', sign.el) +
    ' ' + pick(MID, base + 5) +
    ' ' + pick(CLOSE, base + 11);
  const lucky = (Math.abs(base * 7 + 3) % 9) + 1;
  const color = pick(COLORS, base + 2);
  const mood = pick(MOODS, base + 4);
  return { text, lucky, color, mood };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
