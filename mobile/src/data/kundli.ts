/**
 * Kundli (birth-chart) data — ported 1:1 from the web prototype
 * (pages/kundli/index.html). Deterministic demo values; a real build
 * would swap these for an ephemeris/astrology API response.
 */

export type Strength = 'solid' | 'soft' | 'plain';

export interface ChartPlanet {
  /** short label drawn inside the diamond chart (Su, Mo, …) */
  abbr: string;
  /** chart-space coords in the 0–200 viewBox */
  x: number;
  y: number;
}

export interface HouseLabel {
  n: number;
  x: number;
  y: number;
}

export interface PlanetRow {
  glyph: string;
  name: string;
  detail: string;
  tag: string;
  strength: Strength;
}

export interface Insight {
  title: string;
  body: string;
}

export interface Tab {
  key: string;
  label: string;
}

export const PROFILE = {
  name: 'Raj Kumar',
  ascendant: 'Leo Ascendant · Moon in Cancer',
  dob: '01 Jan 2000',
  time: '06:42 AM',
  place: 'Jaipur',
};

export const TABS: Tab[] = [
  { key: 'charts', label: 'CHARTS' },
  { key: 'overview', label: 'OVERVIEW' },
  { key: 'planets', label: 'PLANETS' },
  { key: 'dasha', label: 'DASHA' },
  { key: 'yoga', label: 'YOGA' },
  { key: 'dosha', label: 'DOSHA' },
];

/** House numbers 1–12, positioned exactly as the web SVG. */
export const HOUSES: HouseLabel[] = [
  { n: 1, x: 100, y: 48 },
  { n: 2, x: 55, y: 58 },
  { n: 3, x: 45, y: 100 },
  { n: 4, x: 55, y: 142 },
  { n: 5, x: 100, y: 155 },
  { n: 6, x: 145, y: 142 },
  { n: 7, x: 155, y: 100 },
  { n: 8, x: 145, y: 58 },
  { n: 9, x: 100, y: 100 },
  { n: 10, x: 80, y: 86 },
  { n: 11, x: 120, y: 86 },
  { n: 12, x: 100, y: 120 },
];

/** Planet glyphs placed within the chart. */
export const CHART_PLANETS: ChartPlanet[] = [
  { abbr: 'Su', x: 100, y: 58 },
  { abbr: 'Mo', x: 55, y: 68 },
  { abbr: 'Ma', x: 45, y: 110 },
  { abbr: 'Me', x: 80, y: 96 },
  { abbr: 'Ve', x: 155, y: 110 },
  { abbr: 'Ju', x: 145, y: 68 },
  { abbr: 'Sa', x: 120, y: 96 },
];

export const KEY_INSIGHT =
  'With Sun rising in your 1st house, you radiate natural leadership. Jupiter in the 8th brings deep wisdom but warns against speculation. Saturn’s aspect on your 10th house suggests slow but solid career growth — especially after 28.';

export const PLANETS: PlanetRow[] = [
  { glyph: '☉', name: 'SUN', detail: '1st House · Leo · 12°', tag: 'Exalted', strength: 'plain' },
  { glyph: '☽', name: 'MOON', detail: '12th House · Cancer · 04°', tag: 'Own Sign', strength: 'plain' },
  { glyph: '♂', name: 'MARS', detail: '3rd House · Libra · 22°', tag: 'Debilitated', strength: 'plain' },
  { glyph: '♃', name: 'JUPITER', detail: '8th House · Pisces · 18°', tag: 'Own Sign', strength: 'plain' },
  { glyph: '♄', name: 'SATURN', detail: '10th House · Taurus · 09°', tag: 'Friendly', strength: 'plain' },
];

export const CURRENT_DASHA = {
  title: 'Jupiter Mahadasha',
  range: 'Mar 2024 – Feb 2040 · 16 yr cycle',
  tag: 'Favourable',
};

export const DASHA_TIMELINE: PlanetRow[] = [
  { glyph: '♃', name: 'JUPITER', detail: 'Mar 2024 – Feb 2040 · running now', tag: 'Active', strength: 'solid' },
  { glyph: '♄', name: 'SATURN', detail: 'Feb 2040 – Feb 2059', tag: 'Upcoming', strength: 'plain' },
  { glyph: '☿', name: 'MERCURY', detail: 'Feb 2059 – Feb 2076', tag: 'Upcoming', strength: 'plain' },
  { glyph: '☵', name: 'KETU', detail: 'Feb 2076 – Feb 2083', tag: 'Upcoming', strength: 'plain' },
];

export const YOGAS: PlanetRow[] = [
  { glyph: '✦', name: 'Gajakesari Yoga', detail: 'Jupiter–Moon angle · wisdom & respect', tag: 'Strong', strength: 'solid' },
  { glyph: '☀', name: 'Budhaditya Yoga', detail: 'Sun–Mercury · sharp intellect', tag: 'Present', strength: 'plain' },
  { glyph: '♚', name: 'Raja Yoga', detail: '5th–9th lords · rise in status', tag: 'Forming', strength: 'plain' },
];

export const DOSHAS: PlanetRow[] = [
  { glyph: '♂', name: 'Mangal Dosha', detail: 'Mars in 3rd · mild effect', tag: 'Low', strength: 'plain' },
  { glyph: '☊', name: 'Kaal Sarp Dosha', detail: 'Not formed in your chart', tag: 'Clear', strength: 'solid' },
  { glyph: '♄', name: 'Sade Sati', detail: 'Begins ~2027 · prepare remedies', tag: 'Watch', strength: 'plain' },
];
