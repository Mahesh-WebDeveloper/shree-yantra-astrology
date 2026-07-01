// Client-side mirror of the backend muhurat catalog — drives the instant category
// grid and the dynamic form (which inputs to show). The auspicious-day CALCULATION
// always runs on the backend engine.

export type Bi = { en: string; hi: string };
export type FieldReq = 'none' | 'optional' | 'required';
export interface MuhuratReq { name: FieldReq; birth: FieldReq; couple: boolean }
export interface MuhuratCat {
  key: string;
  emoji: string;
  name: Bi;
  blurb: Bi;
  nameBased: boolean;
  req: MuhuratReq;
  colors: [string, string];
}
export interface MuhuratGroup {
  key: string;
  title: Bi;
  items: MuhuratCat[];
}

const b = (en: string, hi: string): Bi => ({ en, hi });
const R = (name: FieldReq, birth: FieldReq, couple = false): MuhuratReq => ({ name, birth, couple });

export const MUHURAT_GROUPS: MuhuratGroup[] = [
  {
    key: 'property', title: b('Property & Home', 'संपत्ति व घर'),
    items: [
      { key: 'griha-pravesh', emoji: '🏠', name: b('Griha Pravesh', 'गृह प्रवेश'), blurb: b('Entering a new home', 'नए घर में प्रवेश'), nameBased: true, req: R('optional', 'optional'), colors: ['#eab94f', '#9f6b16'] },
      { key: 'bhoomi-pujan', emoji: '🧱', name: b('Bhoomi Pujan', 'भूमि पूजन'), blurb: b('Foundation / construction', 'नींव / निर्माण'), nameBased: true, req: R('optional', 'optional'), colors: ['#d9a25a', '#8a5a1e'] },
      { key: 'property-buy', emoji: '📜', name: b('Property / Registry', 'संपत्ति / रजिस्ट्री'), blurb: b('Buying land or property', 'ज़मीन/संपत्ति खरीद'), nameBased: true, req: R('optional', 'optional'), colors: ['#cf9f5a', '#7a531c'] },
      { key: 'vehicle', emoji: '🚗', name: b('Vehicle Purchase', 'वाहन खरीद'), blurb: b('New car / bike', 'नई कार / बाइक'), nameBased: true, req: R('optional', 'optional'), colors: ['#7fb1e0', '#2f5f8f'] },
    ],
  },
  {
    key: 'family', title: b('Marriage & Family', 'विवाह व परिवार'),
    items: [
      { key: 'vivah', emoji: '💍', name: b('Marriage', 'विवाह'), blurb: b('Needs both birth details', 'दोनों के जन्म विवरण'), nameBased: false, req: R('none', 'required', true), colors: ['#e88aa0', '#a83f5c'] },
      { key: 'sagai', emoji: '💐', name: b('Engagement', 'सगाई / रोका'), blurb: b('Fixing the alliance', 'रिश्ता तय करना'), nameBased: false, req: R('optional', 'optional', true), colors: ['#e0a0c0', '#8a4070'] },
      { key: 'namkaran', emoji: '👶', name: b('Naamkaran', 'नामकरण'), blurb: b('Uses baby’s birth details', 'शिशु के जन्म विवरण से'), nameBased: false, req: R('none', 'required'), colors: ['#eac86f', '#9a7016'] },
      { key: 'mundan', emoji: '✂️', name: b('Mundan', 'मुंडन'), blurb: b('First hair-cutting', 'पहला मुंडन'), nameBased: false, req: R('none', 'required'), colors: ['#d6b06a', '#86601e'] },
      { key: 'annaprashan', emoji: '🥣', name: b('Annaprashan', 'अन्नप्राशन'), blurb: b('First solid food', 'पहला अन्न'), nameBased: false, req: R('none', 'required'), colors: ['#e6b96a', '#8a6018'] },
    ],
  },
  {
    key: 'career', title: b('Business & Career', 'व्यापार व करियर'),
    items: [
      { key: 'vyapar', emoji: '🏪', name: b('Shop Opening', 'दुकान आरंभ'), blurb: b('Open a shop / launch', 'दुकान / आरंभ'), nameBased: true, req: R('optional', 'optional'), colors: ['#eab94f', '#9f6b16'] },
      { key: 'office', emoji: '🏢', name: b('Office Opening', 'ऑफिस आरंभ'), blurb: b('New office inauguration', 'कार्यालय उद्घाटन'), nameBased: true, req: R('optional', 'optional'), colors: ['#cf9f5a', '#7a531c'] },
      { key: 'new-business', emoji: '🚀', name: b('New Business', 'नया व्यवसाय'), blurb: b('Launch a new venture', 'नया व्यवसाय आरंभ'), nameBased: true, req: R('optional', 'optional'), colors: ['#8fce9f', '#2f7a4a'] },
      { key: 'naukari', emoji: '💼', name: b('New Job', 'नई नौकरी'), blurb: b('Joining a new job', 'नौकरी ज्वॉइन'), nameBased: true, req: R('optional', 'optional'), colors: ['#9ac0e0', '#3a6a96'] },
    ],
  },
  {
    key: 'finance', title: b('Finance', 'धन व निवेश'),
    items: [
      { key: 'dhan-nivesh', emoji: '💰', name: b('Gold / Investment', 'सोना / निवेश'), blurb: b('Valuables & investing', 'मूल्यवान वस्तु व निवेश'), nameBased: true, req: R('optional', 'optional'), colors: ['#e7c44a', '#9a7410'] },
      { key: 'electronics', emoji: '📱', name: b('Electronics / Gadget', 'इलेक्ट्रॉनिक्स / गैजेट'), blurb: b('Mobile, laptop, TV', 'मोबाइल, लैपटॉप, टीवी'), nameBased: true, req: R('optional', 'optional'), colors: ['#7fb1e0', '#2f5f8f'] },
    ],
  },
  {
    key: 'spiritual', title: b('Religious', 'धार्मिक'),
    items: [
      { key: 'puja', emoji: '🪔', name: b('Puja / Anushthan', 'पूजा / अनुष्ठान'), blurb: b('Satyanarayan, griha-shanti', 'सत्यनारायण, गृह-शांति'), nameBased: true, req: R('optional', 'optional'), colors: ['#e0a050', '#8a5310'] },
      { key: 'murti-sthapana', emoji: '🛕', name: b('Murti Sthapana', 'मूर्ति स्थापना'), blurb: b('Pran pratishtha', 'प्राण प्रतिष्ठा'), nameBased: true, req: R('optional', 'optional'), colors: ['#d6a85a', '#7a531c'] },
      { key: 'yagya', emoji: '🔥', name: b('Yagya / Havan', 'यज्ञ / हवन'), blurb: b('Fire ritual, havan', 'हवन, यज्ञ'), nameBased: true, req: R('optional', 'optional'), colors: ['#e09a50', '#8a4d10'] },
    ],
  },
];

export const ALL_MUHURAT_CATS: MuhuratCat[] = MUHURAT_GROUPS.flatMap((g) => g.items);
export const muhuratCatByKey = (key: string) => ALL_MUHURAT_CATS.find((c) => c.key === key) || null;
