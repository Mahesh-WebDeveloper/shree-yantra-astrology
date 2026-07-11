/**
 * Shubh Avsar — major Hindu occasions shown as large one-tap cards on the Library screen.
 * Each opens OccasionScreen, which loads an authentic, bilingual, AI-assisted ritual guide
 * (grounded in traditional practice, with a "regional variations may differ" disclaimer).
 *
 * Metadata here is the curated anchor (name, presiding deity, one-line purpose); the full
 * guide (significance, muhurat, samagri, step-by-step vidhi, mantras, do's/don'ts, FAQ) is
 * generated + cached per occasion + language on the backend.
 */
export interface Occasion {
  id: string;
  emoji: string;
  hi: string;         // short label (Hindi)
  en: string;         // short label (English)
  subHi: string;      // one-line purpose (Hindi)
  subEn: string;      // one-line purpose (English)
  deityHi: string;    // presiding deity — anchors the guide
  deityEn: string;
  accent: string;     // subtle per-card glow tint
}

export const OCCASIONS: Occasion[] = [
  { id: 'vivah',        emoji: '💍', hi: 'विवाह',         en: 'Vivah',          subHi: 'शादी की पूजा व विधि',        subEn: 'Marriage rituals',        deityHi: 'श्री गणेश व लक्ष्मी-नारायण', deityEn: 'Ganesha & Lakshmi-Narayana', accent: '#e0736f' },
  { id: 'grah-pravesh', emoji: '🏠', hi: 'गृह प्रवेश',    en: 'Grah Pravesh',   subHi: 'नए घर में प्रवेश पूजा',      subEn: 'Housewarming puja',       deityHi: 'श्री गणेश व वास्तु देव',      deityEn: 'Ganesha & Vastu Purusha',   accent: '#e9b850' },
  { id: 'naamkaran',    emoji: '👶', hi: 'नामकरण',        en: 'Naamkaran',      subHi: 'शिशु का नाम संस्कार',        subEn: 'Baby naming ceremony',    deityHi: 'श्री गणेश',                  deityEn: 'Lord Ganesha',               accent: '#e2a0c8' },
  { id: 'business',     emoji: '🪔', hi: 'नया व्यापार',   en: 'New Business',   subHi: 'दुकान/व्यवसाय आरंभ पूजा',   subEn: 'Shop / venture opening',   deityHi: 'श्री गणेश, लक्ष्मी व कुबेर',  deityEn: 'Ganesha, Lakshmi & Kubera',  accent: '#d9b34a' },
  { id: 'vehicle',      emoji: '🚗', hi: 'वाहन पूजा',     en: 'Vehicle Puja',   subHi: 'नई गाड़ी की पूजा',           subEn: 'New vehicle blessing',     deityHi: 'श्री गणेश',                  deityEn: 'Lord Ganesha',               accent: '#6fa8dc' },
  { id: 'bhoomi-pujan', emoji: '🏡', hi: 'भूमि पूजन',     en: 'Bhoomi Pujan',   subHi: 'निर्माण आरंभ की पूजा',       subEn: 'Ground-breaking puja',     deityHi: 'भूमि देवी, वास्तु व नाग देव', deityEn: 'Bhumi, Vastu & Naga Devta',  accent: '#8fbf7f' },
  { id: 'birthday',     emoji: '🎂', hi: 'जन्मदिन',       en: 'Birthday',       subHi: 'आयुष्य व मंगल कामना',        subEn: 'Long-life blessings',      deityHi: 'आयुष्य देवता व सत्यनारायण',   deityEn: 'Ayushya Devata',             accent: '#e08a5a' },
  { id: 'daily-puja',   emoji: '🙏', hi: 'नित्य पूजा',    en: 'Daily Puja',     subHi: 'रोज़ की घर की पूजा',         subEn: 'Everyday home worship',    deityHi: 'पंचदेव',                     deityEn: 'The five household deities',  accent: '#e9b850' },
  { id: 'festival',     emoji: '🌸', hi: 'त्योहार',        en: 'Festival',       subHi: 'पर्व की पूजा विधि',          subEn: 'Festival rituals',         deityHi: 'पर्व अनुसार देवता',           deityEn: 'Deity of the festival',      accent: '#e0736f' },
  { id: 'vrat',         emoji: '📿', hi: 'व्रत',           en: 'Vrat',           subHi: 'उपवास की विधि व कथा',        subEn: 'Fasting rituals',          deityHi: 'व्रत अनुसार देवता',           deityEn: 'Deity of the vrat',          accent: '#d9b34a' },
  { id: 'dosh-nivaran', emoji: '🧿', hi: 'दोष निवारण',    en: 'Dosh Nivaran',   subHi: 'ग्रह दोष शांति उपाय',        subEn: 'Planetary remedies',       deityHi: 'नवग्रह व महामृत्युंजय',       deityEn: 'Navagraha & Mahamrityunjaya', accent: '#7fb0d9' },
];

export const occasionById = (id: string) => OCCASIONS.find((o) => o.id === id);
