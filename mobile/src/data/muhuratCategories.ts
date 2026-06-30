// Client-side mirror of the backend muhurat catalog — drives the instant category
// grid (the actual auspicious-day CALCULATION always runs on the backend engine).

export type Bi = { en: string; hi: string };
export interface MuhuratCat {
  key: string;
  emoji: string;
  name: Bi;
  blurb: Bi;
  nameBased: boolean;
  colors: [string, string];
}
export interface MuhuratGroup {
  key: string;
  title: Bi;
  items: MuhuratCat[];
}

const b = (en: string, hi: string): Bi => ({ en, hi });

export const MUHURAT_GROUPS: MuhuratGroup[] = [
  {
    key: 'property', title: b('Property & Home', 'संपत्ति व घर'),
    items: [
      { key: 'griha-pravesh', emoji: '🏠', name: b('Griha Pravesh', 'गृह प्रवेश'), blurb: b('Entering a new home', 'नए घर में प्रवेश'), nameBased: true, colors: ['#eab94f', '#9f6b16'] },
      { key: 'bhoomi-pujan', emoji: '🧱', name: b('Bhoomi Pujan', 'भूमि पूजन'), blurb: b('Foundation / construction', 'नींव / निर्माण आरंभ'), nameBased: true, colors: ['#d9a25a', '#8a5a1e'] },
      { key: 'property-buy', emoji: '📜', name: b('Property / Registry', 'संपत्ति / रजिस्ट्री'), blurb: b('Buying land or property', 'ज़मीन/संपत्ति खरीद'), nameBased: true, colors: ['#cf9f5a', '#7a531c'] },
      { key: 'vehicle', emoji: '🚗', name: b('Vehicle Purchase', 'वाहन खरीद'), blurb: b('New car / bike', 'नई कार / बाइक'), nameBased: true, colors: ['#7fb1e0', '#2f5f8f'] },
    ],
  },
  {
    key: 'family', title: b('Family & Samskara', 'परिवार व संस्कार'),
    items: [
      { key: 'vivah', emoji: '💍', name: b('Marriage', 'विवाह'), blurb: b('Wedding muhurat', 'विवाह मुहूर्त'), nameBased: true, colors: ['#e88aa0', '#a83f5c'] },
      { key: 'sagai', emoji: '💐', name: b('Engagement', 'सगाई / रोका'), blurb: b('Fixing the alliance', 'रिश्ता तय करना'), nameBased: true, colors: ['#e0a0c0', '#8a4070'] },
      { key: 'namkaran', emoji: '👶', name: b('Naamkaran', 'नामकरण'), blurb: b('Naming a newborn', 'नवजात का नामकरण'), nameBased: true, colors: ['#eac86f', '#9a7016'] },
      { key: 'mundan', emoji: '✂️', name: b('Mundan', 'मुंडन'), blurb: b('First hair-cutting', 'पहला मुंडन'), nameBased: true, colors: ['#d6b06a', '#86601e'] },
    ],
  },
  {
    key: 'career', title: b('Education & Career', 'शिक्षा व करियर'),
    items: [
      { key: 'vidyarambh', emoji: '📖', name: b('Vidyarambh', 'विद्यारंभ'), blurb: b('Start of education', 'शिक्षा शुभारंभ'), nameBased: true, colors: ['#8fce9f', '#347a4a'] },
      { key: 'naukari', emoji: '💼', name: b('New Job', 'नई नौकरी'), blurb: b('Joining a new job', 'नौकरी ज्वॉइन'), nameBased: true, colors: ['#9ac0e0', '#3a6a96'] },
      { key: 'vyapar', emoji: '🏪', name: b('Business / Shop', 'व्यापार / दुकान'), blurb: b('Opening / launch', 'आरंभ / उद्घाटन'), nameBased: true, colors: ['#eab94f', '#9f6b16'] },
    ],
  },
  {
    key: 'finance', title: b('Finance', 'धन व निवेश'),
    items: [
      { key: 'dhan-nivesh', emoji: '💰', name: b('Gold / Investment', 'सोना / निवेश'), blurb: b('Valuables & investing', 'मूल्यवान वस्तु व निवेश'), nameBased: true, colors: ['#e7c44a', '#9a7410'] },
    ],
  },
  {
    key: 'spiritual', title: b('Spiritual', 'धार्मिक'),
    items: [
      { key: 'puja', emoji: '🪔', name: b('Puja / Anushthan', 'पूजा / अनुष्ठान'), blurb: b('Havan, Satyanarayan', 'हवन, सत्यनारायण'), nameBased: true, colors: ['#e0a050', '#8a5310'] },
    ],
  },
];

export const ALL_MUHURAT_CATS: MuhuratCat[] = MUHURAT_GROUPS.flatMap((g) => g.items);
export const muhuratCatByKey = (key: string) => ALL_MUHURAT_CATS.find((c) => c.key === key) || null;
