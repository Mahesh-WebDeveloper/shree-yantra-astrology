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
  "puran-brahma": { key: "puran-brahma", title: { en: "Brahma Purana", hi: "ब्रह्म पुराण" }, subtitle: { en: "Sanskrit · 246 chapters", hi: "संस्कृत · 246 अध्याय" }, bookLabel: { en: "Purana", hi: "पुराण" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: true },
  "puran-padma": { key: "puran-padma", title: { en: "Padma Purana", hi: "पद्म पुराण" }, subtitle: { en: "Sanskrit & English · 6 chapters", hi: "संस्कृत व हिन्दी · 6 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  // Complete text (Sanskrit Wikisource): 6 amshas, 126 adhyayas — the canonical count.
  "puran-vishnu": { key: "puran-vishnu", title: { en: "Vishnu Purana", hi: "विष्णु पुराण" }, subtitle: { en: "Sanskrit · 6 Amsha · 126 chapters", hi: "संस्कृत · 6 अंश · 126 अध्याय" }, bookLabel: { en: "Amsha", hi: "अंश" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Shloka", hi: "श्लोक" }, hasSections: true },
  // Complete text (Sanskrit Wikisource): 12 skandhas, 335 adhyayas — the canonical count.
  "puran-bhagavata": { key: "puran-bhagavata", title: { en: "Shrimad Bhagavatam", hi: "श्रीमद् भागवत" }, subtitle: { en: "Sanskrit · 12 Skandha · 335 chapters", hi: "संस्कृत · 12 स्कन्ध · 335 अध्याय" }, bookLabel: { en: "Skandha", hi: "स्कन्ध" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Shloka", hi: "श्लोक" }, hasSections: true },
  // Complete text (Sanskrit Wikisource / Venkatesvara Press edition): 7 samhitas, 458 adhyayas.
  // Rudra's 5 khandas and Vayaviya's 2 bhagas are separate `book`s in the store, hence 12 parts.
  "puran-shiva": { key: "puran-shiva", title: { en: "Shiva Purana", hi: "शिव पुराण" }, subtitle: { en: "Sanskrit · 7 Samhita · 458 chapters", hi: "संस्कृत · 7 संहिता · 458 अध्याय" }, bookLabel: { en: "Samhita", hi: "संहिता" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Shloka", hi: "श्लोक" }, hasSections: true },
  "puran-skanda": { key: "puran-skanda", title: { en: "Skanda Purana", hi: "स्कन्द पुराण" }, subtitle: { en: "Sanskrit & English · 8 chapters", hi: "संस्कृत व हिन्दी · 8 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-linga": { key: "puran-linga", title: { en: "Linga Purana", hi: "लिङ्ग पुराण" }, subtitle: { en: "Sanskrit & English · 7 chapters", hi: "संस्कृत व हिन्दी · 7 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-markandeya": { key: "puran-markandeya", title: { en: "Markandeya Purana", hi: "मार्कण्डेय पुराण" }, subtitle: { en: "Sanskrit & English · 7 chapters", hi: "संस्कृत व हिन्दी · 7 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-narada": { key: "puran-narada", title: { en: "Narada Purana", hi: "नारद पुराण" }, subtitle: { en: "Sanskrit & English · 7 chapters", hi: "संस्कृत व हिन्दी · 7 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-agni": { key: "puran-agni", title: { en: "Agni Purana", hi: "अग्नि पुराण" }, subtitle: { en: "Sanskrit · 383 chapters", hi: "संस्कृत · 383 अध्याय" }, bookLabel: { en: "Purana", hi: "पुराण" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: true },
  "puran-bhavishya": { key: "puran-bhavishya", title: { en: "Bhavishya Purana", hi: "भविष्य पुराण" }, subtitle: { en: "Sanskrit & English · 7 chapters", hi: "संस्कृत व हिन्दी · 7 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-brahmavaivarta": { key: "puran-brahmavaivarta", title: { en: "Brahmavaivarta Purana", hi: "ब्रह्मवैवर्त पुराण" }, subtitle: { en: "Sanskrit · 4 Khanda · 275 chapters", hi: "संस्कृत · 4 खण्ड · 275 अध्याय" }, bookLabel: { en: "Khanda", hi: "खण्ड" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: true },
  "puran-varaha": { key: "puran-varaha", title: { en: "Varaha Purana", hi: "वराह पुराण" }, subtitle: { en: "Sanskrit · 218 chapters", hi: "संस्कृत · 218 अध्याय" }, bookLabel: { en: "Purana", hi: "पुराण" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: true },
  "puran-vamana": { key: "puran-vamana", title: { en: "Vamana Purana", hi: "वामन पुराण" }, subtitle: { en: "Sanskrit & English · 6 chapters", hi: "संस्कृत व हिन्दी · 6 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-kurma": { key: "puran-kurma", title: { en: "Kurma Purana", hi: "कूर्म पुराण" }, subtitle: { en: "Sanskrit & English · 6 chapters", hi: "संस्कृत व हिन्दी · 6 अध्याय" }, bookLabel: { en: "Chapter", hi: "अध्याय" }, sectionLabel: { en: "Chapter", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: false },
  "puran-matsya": { key: "puran-matsya", title: { en: "Matsya Purana", hi: "मत्स्य पुराण" }, subtitle: { en: "Sanskrit · 291 chapters", hi: "संस्कृत · 291 अध्याय" }, bookLabel: { en: "Purana", hi: "पुराण" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Shloka", hi: "श्लोक" }, hasSections: true },
  // Complete text (Sanskrit Wikisource): Achara 240 + Preta 49 + Brahma 29 = 318 adhyayas.
  "puran-garuda": { key: "puran-garuda", title: { en: "Garuda Purana", hi: "गरुड़ पुराण" }, subtitle: { en: "Sanskrit · 3 Kanda · 318 chapters", hi: "संस्कृत · 3 काण्ड · 318 अध्याय" }, bookLabel: { en: "Kanda", hi: "काण्ड" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Shloka", hi: "श्लोक" }, hasSections: true },
  "puran-brahmanda": { key: "puran-brahmanda", title: { en: "Brahmanda Purana", hi: "ब्रह्माण्ड पुराण" }, subtitle: { en: "Sanskrit · 3 Bhaga · 156 chapters", hi: "संस्कृत · 3 भाग · 156 अध्याय" }, bookLabel: { en: "Bhaga", hi: "भाग" }, sectionLabel: { en: "Adhyaya", hi: "अध्याय" }, verseLabel: { en: "Verse", hi: "श्लोक" }, hasSections: true },
};

export const vedaCfg = (key: string): VedaConfig => VEDA_CONFIG[key] || VEDA_CONFIG.atharvaveda;
