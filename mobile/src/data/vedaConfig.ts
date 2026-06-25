// Display config for generic Veda readers (Yajur/Sama/Atharva).
// labels EN/HI; hasSections=false => book opens straight to verses (Yajurveda).
export interface VedaConfig {
  key: string;
  title: { en: string; hi: string };
  subtitle: { en: string; hi: string };
  bookLabel: { en: string; hi: string };   // Kanda / Adhyaya / Part
  sectionLabel: { en: string; hi: string }; // Sukta
  verseLabel: { en: string; hi: string };   // Mantra
  hasSections: boolean;
}

export const VEDA_CONFIG: Record<string, VedaConfig> = {
  atharvaveda: {
    key: 'atharvaveda',
    title: { en: 'Atharvaveda', hi: 'अथर्ववेद' },
    subtitle: { en: 'Sanskrit & English · 20 Kanda', hi: 'संस्कृत व अंग्रेज़ी · 20 कांड' },
    bookLabel: { en: 'Kanda', hi: 'कांड' },
    sectionLabel: { en: 'Sukta', hi: 'सूक्त' },
    verseLabel: { en: 'Mantra', hi: 'मंत्र' },
    hasSections: true,
  },
  yajurveda: {
    key: 'yajurveda',
    title: { en: 'Yajurveda', hi: 'यजुर्वेद' },
    subtitle: { en: 'Sanskrit & English · 40 Adhyaya', hi: 'संस्कृत व अंग्रेज़ी · 40 अध्याय' },
    bookLabel: { en: 'Adhyaya', hi: 'अध्याय' },
    sectionLabel: { en: 'Section', hi: 'खंड' },
    verseLabel: { en: 'Mantra', hi: 'मंत्र' },
    hasSections: false,
  },
  samaveda: {
    key: 'samaveda',
    title: { en: 'Samaveda', hi: 'सामवेद' },
    subtitle: { en: 'Sanskrit & English', hi: 'संस्कृत व अंग्रेज़ी' },
    bookLabel: { en: 'Part', hi: 'भाग' },
    sectionLabel: { en: 'Chapter', hi: 'अध्याय' },
    verseLabel: { en: 'Mantra', hi: 'मंत्र' },
    hasSections: true,
  },
  upanishads: {
    key: 'upanishads',
    title: { en: 'Upanishads', hi: 'उपनिषद्' },
    subtitle: { en: 'Sanskrit & English', hi: 'संस्कृत व अंग्रेज़ी' },
    bookLabel: { en: 'Upanishad', hi: 'उपनिषद्' },
    sectionLabel: { en: 'Valli', hi: 'वल्ली' },
    verseLabel: { en: 'Mantra', hi: 'मंत्र' },
    hasSections: true,
  },
  mahabharata: {
    key: 'mahabharata',
    title: { en: 'Mahabharata', hi: 'महाभारत' },
    subtitle: { en: 'Sanskrit · 18 Parva', hi: 'संस्कृत · 18 पर्व' },
    bookLabel: { en: 'Parva', hi: 'पर्व' },
    sectionLabel: { en: 'Adhyaya', hi: 'अध्याय' },
    verseLabel: { en: 'Shloka', hi: 'श्लोक' },
    hasSections: true,
  },
};

export const vedaCfg = (key: string): VedaConfig => VEDA_CONFIG[key] || VEDA_CONFIG.atharvaveda;
