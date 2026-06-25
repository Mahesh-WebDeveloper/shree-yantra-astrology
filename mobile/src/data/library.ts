/**
 * Divine Library content — normalized, API-ready model.
 *
 * One content entity (`LibraryItem`) covers mantra | music | scripture, with
 * optional `trackId` (playable) and `bookId` (readable) blocks. This mirrors
 * the future backend contract (GET /library/items → LibraryItem[]), so wiring
 * real APIs later is a drop-in: replace these arrays with fetched data of the
 * same shape. Reading content lives in `BOOKS` (keyed by bookId, with chapters).
 *
 * Audio is a set of seamless-looping drones synthesised by scripts/gen-drones.js
 * (no third-party assets); expo-audio loops them for an endless ambient feel.
 */

export type TrackColor = 'gold' | 'purple' | 'green' | 'blue' | 'rose';
export type ContentType = 'mantra' | 'music' | 'scripture';

/* ── Audio playlist (the transport prev/next walks this) ─────────────── */
export interface Track {
  id: string;
  title: string;
  sub: string;
  color: TrackColor;
  source: number | string; // bundled asset or direct remote audio URL
  loop?: boolean;          // ambient drones loop (default); long-form audio (chapters/bhajans) => false
}

const OM = require('../../assets/audio/om-drone.wav');
const TANPURA = require('../../assets/audio/tanpura.wav');
const FLUTE = require('../../assets/audio/flute-calm.wav');
const BELLS = require('../../assets/audio/temple-bells.wav');

export const TRACKS: Track[] = [
  { id: 'gayatri', title: 'Gayatri Mantra', sub: 'Rigveda · 108 cycles', color: 'gold', source: OM },
  { id: 'mahamrityunjaya', title: 'Mahamrityunjaya', sub: 'Healing · Lord Shiva', color: 'purple', source: TANPURA },
  { id: 'om-namah', title: 'Om Namah Shivaya', sub: 'Panchakshara · 21 min', color: 'blue', source: FLUTE },
  { id: 'gita-ch2', title: 'Bhagavad Gita · Chapter 2', sub: 'Shloka 47 – 72', color: 'gold', source: OM },
  { id: 'meditation', title: 'Deep Meditation', sub: 'Theta drone · 432 Hz', color: 'purple', source: TANPURA },
  { id: 'temple-bells', title: 'Temple Bells', sub: 'Morning aarti ambience', color: 'gold', source: BELLS },
  { id: 'flute', title: 'Krishna Flute', sub: 'Calm · nature blend', color: 'green', source: FLUTE },
  { id: 'tanpura', title: 'Tanpura Sruti', sub: 'Sa–Pa drone · practice', color: 'blue', source: TANPURA },
];
export const byId = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0];

/** "Continue Listening" featured track. */
export const CONTINUE = 'gita-ch2';

/* ── Unified content entity (API-ready) ──────────────────────────────── */
export interface LibraryItem {
  id: string;
  type: ContentType;
  title: string;
  subtitle?: string;       // count for mantra, description for music
  color: TrackColor;
  hindi?: string;          // Devanagari name (scriptures) shown on the cover
  trackId?: string;        // present → playable
  bookId?: string;         // present → readable (opens reader)
  glyph?: 'sun' | 'target' | 'star' | 'om' | 'bells' | 'flute' | 'rain' | 'mix';
}

/* Mantras (tap → play). */
export const MANTRAS: LibraryItem[] = [
  { id: 'maha',    type: 'mantra', title: 'Mahamrityunjaya Mantra', subtitle: '108 Times', color: 'purple', trackId: 'mahamrityunjaya', glyph: 'sun' },
  { id: 'gayatri', type: 'mantra', title: 'Gayatri Mantra',         subtitle: '108 Times', color: 'gold',   trackId: 'gayatri',         glyph: 'target' },
  { id: 'hanuman', type: 'mantra', title: 'Hanuman Chalisa',        subtitle: '1 Path',    color: 'gold',   trackId: 'temple-bells',    glyph: 'star' },
  { id: 'shiva',   type: 'mantra', title: 'Om Namah Shivaya',       subtitle: '108 Times', color: 'blue',   trackId: 'om-namah',        glyph: 'sun' },
  { id: 'lakshmi', type: 'mantra', title: 'Mahalakshmi Mantra',     subtitle: '108 Times', color: 'gold',   trackId: 'gita-ch2',        glyph: 'target' },
  { id: 'durga',   type: 'mantra', title: 'Durga Mantra',           subtitle: '108 Times', color: 'rose',   trackId: 'meditation',      glyph: 'sun' },
  { id: 'saras',   type: 'mantra', title: 'Saraswati Mantra',       subtitle: '108 Times', color: 'green',  trackId: 'flute',           glyph: 'target' },
];

/* Spiritual music modes (tap → play; 'mix' is a placeholder builder). */
export const MUSIC: LibraryItem[] = [
  { id: 'om-mode', type: 'music', title: 'OM CHANTING',   subtitle: 'Deep Om chanting for peace & healing',    color: 'purple', trackId: 'meditation',   glyph: 'om' },
  { id: 'bells',   type: 'music', title: 'TEMPLE BELLS',  subtitle: 'Sacred temple bells for positive energy', color: 'gold',   trackId: 'temple-bells', glyph: 'bells' },
  { id: 'flute-m', type: 'music', title: 'FLUTE MUSIC',   subtitle: "Lord Krishna's flute for relaxation",     color: 'green',  trackId: 'flute',        glyph: 'flute' },
  { id: 'rain',    type: 'music', title: 'RAIN + MANTRA', subtitle: 'Rain sounds with mantra chanting',        color: 'blue',   trackId: 'tanpura',      glyph: 'rain' },
  { id: 'mix',     type: 'music', title: 'MIX & MATCH',   subtitle: 'Create your own spiritual ambience',      color: 'gold',   glyph: 'mix' },
];

/* ── Reading content: books with chapters (the reader reads from here) ── */
export interface ReaderVerse { ref: string; sa: string; en: string }
export interface BookChapter { title: string; verses: ReaderVerse[] }
export interface BookDoc {
  id: string;
  eyebrow: string;     // small label above the title
  title: string;       // book title (English)
  hindi: string;       // Devanagari name shown on the cover
  cover: TrackColor;
  language: string[];  // ['Hindi','English']
  trackId: string;     // "Listen" audio
  intro: string;
  chapters: BookChapter[];
}

export const BOOKS: Record<string, BookDoc> = {
  gita: {
    id: 'gita', eyebrow: 'Bhagavad Gita', title: 'Bhagavad Gita', hindi: 'श्रीमद्\nभगवद्गीता', cover: 'purple',
    language: ['Hindi', 'English'], trackId: 'gita-ch2',
    intro: 'The eternal dialogue between Arjuna and Krishna on the battlefield of Kurukshetra — on duty, the eternal soul, and steadiness of mind.',
    chapters: [
      { title: 'Ch 1 · Arjuna Vishada Yoga', verses: [
        { ref: '1.1', sa: 'धृतराष्ट्र उवाच ।\nधर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।', en: 'Dhritarashtra said: On the sacred field of Kurukshetra, gathered eager to fight, what did my sons and the Pandavas do?' },
        { ref: '1.47', sa: 'एवमुक्त्वार्जुनः सङ्ख्ये रथोपस्थ उपाविशत् ।', en: 'Having spoken thus, Arjuna cast aside his bow and arrows and sat down on the chariot, his mind overwhelmed with grief.' },
      ] },
      { title: 'Ch 2 · Sankhya Yoga', verses: [
        { ref: '2.47', sa: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥', en: 'You have a right to your action alone, never to its fruits. Let not the fruits be your motive, nor your attachment be to inaction.' },
        { ref: '2.48', sa: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय ।', en: 'Established in yoga, perform your actions, abandoning attachment and remaining even-minded in success and failure.' },
      ] },
    ],
  },
  ramayan: {
    id: 'ramayan', eyebrow: 'Valmiki Ramayana', title: 'Ramayana', hindi: 'रामायण', cover: 'gold',
    language: ['Hindi', 'English'], trackId: 'temple-bells',
    intro: 'The journey of Lord Rama — devotion, dharma, and the triumph of good over evil — told across seven kandas (books).',
    chapters: [
      { title: 'Bala Kanda · The Birth', verses: [
        { ref: '1.1.1', sa: 'तपःस्वाध्यायनिरतं तपस्वी वाग्विदां वरम् ।', en: 'To Narada, ever devoted to penance and study, best among the eloquent, the sage Valmiki put his question.' },
        { ref: '1.1.2', sa: 'कोन्वस्मिन् साम्प्रतं लोके गुणवान् कश्च वीर्यवान् ।', en: 'Who in this world today is virtuous and valiant, knowing of duty, true of speech and firm in vows?' },
      ] },
      { title: 'Ayodhya Kanda · The Exile', verses: [
        { ref: '2.18', sa: 'राजा सत्यं च धर्मं च राजा कुलवतां कुलम् ।', en: 'For the sake of his father’s word, Rama accepts the forest exile with serene acceptance — the very embodiment of dharma.' },
      ] },
    ],
  },
  ramcharitmanas: {
    id: 'ramcharitmanas', eyebrow: 'Tulsidas · Awadhi', title: 'Ramcharitmanas', hindi: 'श्रीराम\nचरितमानस', cover: 'rose',
    language: ['Hindi'], trackId: 'temple-bells',
    intro: 'Goswami Tulsidas ka Ramayan — saat kand me Bhagwan Ram ki katha, sahaj Awadhi/Hindi me. Chaupai, doha aur sortha ke roop me.',
    chapters: [
      { title: 'बालकांड', verses: [
        { ref: 'चौपाई 1.1', sa: 'बंदउ गुरु पद पदुम परागा। सुरुचि सुबास सरस अनुरागा।।', en: '' },
      ] },
    ],
  },
  mahabharat: {
    id: 'mahabharat', eyebrow: 'Veda Vyasa · Gita Press', title: 'Mahabharata', hindi: 'महाभारत', cover: 'blue',
    language: ['Sanskrit', 'Hindi', 'English'], trackId: 'meditation',
    intro: 'Vyasa’s epic of dharma — the great story of the Bharata dynasty. Volume 1 (Gita Press, Gorakhpur) covers the Adi Parva and Sabha Parva. The verses below are the canonical opening invocations.',
    chapters: [
      { title: 'आदिपर्व · मंगलाचरण (Invocation)', verses: [
        { ref: '1.1', sa: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम् ।\nदेवीं सरस्वतीं व्यासं ततो जयमुदीरयेत् ॥', en: 'Having bowed to Narayana and to Nara, the most exalted of men, and to the goddess Sarasvati, and to Vyasa — then let one proclaim "Jaya" (the Mahabharata, the song of victory).' },
      ] },
      { title: 'आदिपर्व · ग्रन्थ की महिमा (The Glory of the Epic)', verses: [
        { ref: '1.56.33', sa: 'धर्मे चार्थे च कामे च मोक्षे च भरतर्षभ ।\nयदिहास्ति तदन्यत्र यन्नेहास्ति न तत्क्वचित् ॥', en: 'O best of the Bharatas — whatever is here, concerning dharma, artha, kama and moksha, may be found elsewhere; but what is not found here exists nowhere.' },
        { ref: '1.1.272', sa: 'महत्त्वाद्भारवत्त्वाच्च महाभारतमुच्यते ।\nनिरुक्तमस्य यो वेद सर्वपापैः प्रमुच्यते ॥', en: 'Because of its greatness (mahattva) and its weight (bharavattva), it is called the Mahabharata. Whoever knows this meaning is freed from all sins.' },
      ] },
    ],
  },
  rigveda: {
    id: 'rigveda', eyebrow: 'The Vedas · Rigveda', title: 'Rigveda', hindi: 'ऋग्वेद', cover: 'gold',
    language: ['Hindi', 'English'], trackId: 'gayatri',
    intro: 'The oldest of the four Vedas — hymns to the cosmic powers, opening with an invocation to Agni, the sacred fire.',
    chapters: [
      { title: 'Mandala 1 · Agni Sukta', verses: [
        { ref: '1.1.1', sa: 'अग्निमीळे पुरोहितं यज्ञस्य देवमृत्विजम् ।', en: 'I praise Agni, the priest of the sacrifice — the divine who carries our offerings and kindles wisdom.' },
        { ref: '1.1.2', sa: 'अग्निः पूर्वेभिर्ऋषिभिरीड्यो नूतनैरुत ।', en: 'Agni, worthy of praise by ancient sages and by the new — may he bring the gods here.' },
      ] },
    ],
  },
  samaveda: {
    id: 'samaveda', eyebrow: 'The Vedas · Samaveda', title: 'Samaveda', hindi: 'सामवेद', cover: 'green',
    language: ['Hindi', 'English'], trackId: 'flute',
    intro: 'The Veda of song — it sets the hymns of the Rigveda to sacred melody, the root of all Indian classical music.',
    chapters: [
      { title: 'Purvarchika · The Chant', verses: [
        { ref: '1.1', sa: 'अग्न आ याहि वीतये गृणानो हव्यदातये ।', en: 'Come, O Agni, to the chant and the offering — be seated upon the sacred grass.' },
      ] },
    ],
  },
  yajurveda: {
    id: 'yajurveda', eyebrow: 'The Vedas · Yajurveda', title: 'Yajurveda', hindi: 'यजुर्वेद', cover: 'rose',
    language: ['Hindi', 'English'], trackId: 'tanpura',
    intro: 'The Veda of ritual formulas — guiding the performance of sacrifice and the inner meaning of devotion.',
    chapters: [
      { title: 'Chapter 40 · Ishavasya', verses: [
        { ref: '40.1', sa: 'ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत् ।', en: 'All this — whatever moves in the universe — is pervaded by the Divine. Renounce, and rejoice.' },
      ] },
    ],
  },
  atharvaveda: {
    id: 'atharvaveda', eyebrow: 'The Vedas · Atharvaveda', title: 'Atharvaveda', hindi: 'अथर्ववेद', cover: 'purple',
    language: ['Hindi', 'English'], trackId: 'meditation',
    intro: 'The Veda of everyday wisdom — hymns for health, harmony, prosperity and peace in daily living.',
    chapters: [
      { title: 'Book 3 · Hymn of Unity', verses: [
        { ref: '3.30.1', sa: 'सं गच्छध्वं सं वदध्वं सं वो मनांसि जानताम् ।', en: 'Walk together, speak together, let your minds be of one accord — the hymn of unity and harmony.' },
      ] },
    ],
  },
  upanishads: {
    id: 'upanishads', eyebrow: 'Vedanta · Upanishads', title: 'Upanishads', hindi: 'उपनिषद्', cover: 'blue',
    language: ['Sanskrit', 'English'], trackId: 'meditation',
    intro: 'The philosophical essence of the Vedas — Isha, Katha and Mandukya Upanishads, on the Self, the eternal, and liberation.',
    chapters: [
      { title: 'Ishavasya · Mantra 1', verses: [
        { ref: '1.1', sa: 'ॐ ईशा वास्यमिदम् सर्वं यत्किञ्च जगत्यां जगत् ।', en: 'All this — whatsoever moves in the universe — is pervaded by the Lord.' },
      ] },
    ],
  },
};

export const BOOK_LIST: BookDoc[] = Object.values(BOOKS);

/** Scriptures as unified items (for grids / the "Scriptures" filter).
    subtitle advertises the chapter count so the card clearly reads as a book. */
export const SCRIPTURES: LibraryItem[] = BOOK_LIST.map((b) => ({
  id: b.id, type: 'scripture', title: b.title, hindi: b.hindi,
  // Gita + Ramayana ab dynamic reader (DB) se — poora content; baaki books static chapter count
  subtitle: b.id === 'gita' ? '18 Chapters · 700 Verses'
    : b.id === 'ramayan' ? 'Sanskrit & English · 7 Kanda'
    : b.id === 'ramcharitmanas' ? 'Hindi · 7 Kand · 1074 Verses'
    : b.id === 'rigveda' ? 'Sanskrit & English · 10 Mandala'
    : b.id === 'atharvaveda' ? 'Sanskrit & English · 20 Kanda'
    : b.id === 'yajurveda' ? 'Sanskrit & English · 40 Adhyaya'
    : b.id === 'samaveda' ? 'Sanskrit & English'
    : b.id === 'upanishads' ? 'Sanskrit & English · 3 Upanishads'
    : b.id === 'mahabharat' ? 'Sanskrit · 18 Parva'
    : `${b.chapters.length} ${b.chapters.length === 1 ? 'chapter' : 'chapters'}`,
  color: b.cover, bookId: b.id, trackId: b.trackId, glyph: 'om',
}));

/* ── Top filter chips — clean content-type filters (not a mix of books). ── */
export type FilterKey = 'all' | 'mantras' | 'scriptures' | 'music' | 'bhajans' | 'saved';
export interface LibFilter { key: FilterKey; label: string; icon: 'sparkle' | 'mantra' | 'book' | 'music' | 'bookmark' }
export const LIB_FILTERS: LibFilter[] = [
  { key: 'all',        label: 'ALL',        icon: 'sparkle' },
  { key: 'mantras',    label: 'MANTRAS',    icon: 'mantra' },
  { key: 'scriptures', label: 'SCRIPTURES', icon: 'book' },
  { key: 'music',      label: 'MUSIC',      icon: 'music' },
  { key: 'bhajans',    label: 'BHAJANS',    icon: 'music' },
  { key: 'saved',      label: 'SAVED',      icon: 'bookmark' },
];

/** All saveable items (books + mantras + music) — for resolving the Saved tab. */
export const ALL_ITEMS: LibraryItem[] = [...SCRIPTURES, ...MANTRAS, ...MUSIC];
export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id);
