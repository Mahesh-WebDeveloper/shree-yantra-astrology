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
  subtitle?: string;   // optional card subtitle override (e.g. Mahapurana verse count)
}


/* Four of the 18 Mahapuranas as BookDoc entries — plain object literals.
   Sanskrit (`sa`) verses are authentic, well-known invocations / famous shlokas
   that genuinely belong to each Purana. Where a section has no single canonical
   verse to quote, `sa` carries the section's Sanskrit name/theme and `en` gives
   a factual summary — no verse text is invented. */

const PURAN_BRAHMA: BookDoc = {
  id: 'puran-brahma', eyebrow: '18 महापुराण · Brahma', title: 'Brahma Purana', hindi: 'ब्रह्म\nपुराण', cover: 'gold',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'gayatri',
  subtitle: 'महापुराण · Brahma · ~10,000 श्लोक',
  intro: 'Traditionally counted first among the eighteen Mahapuranas — hence its title Adi Purana (the First Purana). Classed as a rajasic Purana associated with Brahma, it holds about 10,000 verses across a Purvabhaga (former part) and Uttarabhaga (latter part), narrated by the Suta Lomaharshana to the sages at Naimisharanya. It is famous as a pilgrim\'s guide to the sacred sites of the Godavari region and Odisha — including the Konark Sun Temple and the Jagannath shrine of Purushottama Kshetra (Puri).',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: 'Mangalacharana', sa: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम् ।\nदेवीं सरस्वतीं व्यासं ततो जयमुदीरयेत् ॥', en: 'Having bowed to Narayana, to Nara the most exalted of men, to the goddess Sarasvati and to Vyasa — then let one proclaim the sacred narration. This is the benedictory opening with which the First Purana begins at Naimisha forest.' },
    ] },
    { title: 'पूर्वभाग · Srishti (Creation)', verses: [
      { ref: 'Purvabhaga · Creation', sa: 'ब्रह्मणः सृष्टिवर्णनम्', en: 'The sages of Naimisha question the Suta Lomaharshana, who recounts the origin of the cosmos from Brahma — the manvantaras, the lineages of gods and sages, and the ordering of the worlds. This opens the former part of the Purana.' },
    ] },
    { title: 'सूर्य-माहात्म्य · Surya & Konark', verses: [
      { ref: 'Sun worship · Konark', sa: 'सूर्योपासना · कोणार्क-क्षेत्रम्', en: 'A celebrated section on the worship of Surya, the Sun, describing the greatness of the solar deity and the sacred region of Konark in Odisha with its famed Sun temple — a hallmark of this non-sectarian Purana.' },
    ] },
    { title: 'पुरुषोत्तम-क्षेत्र · Jagannath Puri', verses: [
      { ref: 'Purushottama Kshetra', sa: 'पुरुषोत्तम-क्षेत्र-माहात्म्यम्', en: 'The glory of Purushottama Kshetra (Puri) and the worship of Lord Jagannath (Krishna) — one of the most extensively described pilgrimage sites in the Purana, reflecting its Vaishnava devotional heart.' },
    ] },
    { title: 'गौतमी-माहात्म्य · The Godavari', verses: [
      { ref: 'Gautami / Godavari Mahatmya', sa: 'गौतमी-माहात्म्यम् (गोदावरी-तीर्थानि)', en: 'The extensive Gautami-Mahatmya — a travel guide to the holy tirthas along the Godavari (Gautami) river, its bathing places, temples and legends. It circulated separately and forms a major portion of the text.' },
    ] },
    { title: 'उत्तरभाग · Dharma & Moksha', verses: [
      { ref: 'Uttarabhaga · Liberation', sa: 'धर्म · योग · मोक्ष', en: 'The latter part turns to dharma, right conduct for the four varnas and ashramas, ancestral rites, yoga and the paths to liberation — closing the Purana with its teaching on release from rebirth.' },
    ] },
  ],
};

const PURAN_PADMA: BookDoc = {
  id: 'puran-padma', eyebrow: '18 महापुराण · Vaishnava', title: 'Padma Purana', hindi: 'पद्म\nपुराण', cover: 'rose',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'flute',
  subtitle: 'महापुराण · Vaishnava · ~55,000 श्लोक',
  intro: 'A sattvic Vaishnava Mahapurana and, at roughly 55,000 verses, the second largest of the eighteen. It is named after the padma — the cosmic lotus that rises from the navel of Vishnu, upon which Brahma is seated to begin creation. Arranged in five khandas (Srishti, Bhumi, Svarga, Patala/Brahma and Uttara), it is renowned for the Bhagavad Gita Mahatmya, the Bhagavata Mahatmya, glorification of Rama and the holy Tulasi.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: 'Mangalacharana', sa: 'मङ्गलं भगवान् विष्णुर्मङ्गलं गरुडध्वजः ।\nमङ्गलं पुण्डरीकाक्षो मङ्गलायतनो हरिः ॥', en: 'Auspicious is the Lord Vishnu, auspicious is He whose banner bears Garuda; auspicious is the lotus-eyed one, and Hari, the very abode of all auspiciousness. A Vaishnava invocation opening this Purana of Goodness (sattva).' },
    ] },
    { title: 'सृष्टि-खण्ड · Creation', verses: [
      { ref: 'Srishti Khanda', sa: 'सृष्टि-खण्ड · पद्म-सम्भवः', en: 'The Book of Creation — cosmology, genealogy, geography, rivers and seasons, framed by the image of Brahma born on the lotus that springs from Vishnu\'s navel, from which the Purana takes its name.' },
    ] },
    { title: 'भूमि-खण्ड · Earth', verses: [
      { ref: 'Bhumi Khanda', sa: 'भूमि-खण्ड · तीर्थ-कथाः', en: 'The Book of the Earth — a pilgrimage guide interwoven with legends and moral tales, describing the sacred places of the land and the merit of visiting them.' },
    ] },
    { title: 'स्वर्ग-खण्ड · Heaven', verses: [
      { ref: 'Svarga Khanda', sa: 'स्वर्ग-खण्ड · लोक-वर्णनम्', en: 'The Book of Heaven — the cosmology and sacred geography of the worlds and of Bharatavarsha, its holy regions, mountains and the ordering of the heavens.' },
    ] },
    { title: 'पाताल / ब्रह्म-खण्ड · Rama & Tulasi', verses: [
      { ref: 'Patala / Brahma Khanda', sa: 'पाताल-खण्ड · राम-कथा · तुलसी', en: 'This khanda glorifies Vishnu — recounting an alternative telling of the story of Rama and Sita, the festivals and rites of devotion, and the sanctity of the Tulasi plant beloved of the Lord.' },
    ] },
    { title: 'उत्तर-खण्ड · Gita & Bhagavata Mahatmya', verses: [
      { ref: 'Uttara Khanda', sa: 'उत्तर-खण्ड · गीता-माहात्म्य · भागवत-माहात्म्य', en: 'The final and largest book — famed for the Bhagavad Gita Mahatmya (praising each of the Gita\'s chapters), the Bhagavata Mahatmya, and discourses on festivals, bhakti, yoga and Vedanta.' },
    ] },
  ],
};

const PURAN_VISHNU: BookDoc = {
  id: 'puran-vishnu', eyebrow: '18 महापुराण · Vaishnava', title: 'Vishnu Purana', hindi: 'विष्णु\nपुराण', cover: 'blue',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'meditation',
  subtitle: 'महापुराण · Vaishnava · ~23,000 श्लोक',
  intro: 'A sattvic Vaishnava Mahapurana revered as the Purana-ratna, the very gem of the Puranas, for its clear and concentrated doctrine. Traditionally of about 23,000 verses, it is arranged in six amshas (parts) and unfolds as a dialogue in which the sage Parashara answers his disciple Maitreya on the nature of the universe. It centres wholly on Vishnu — from whom all arises, in whom all abides, and into whom all returns — and includes the beloved tales of Dhruva, Prahlada and the life of Krishna.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: 'Vishnu Purana 1.1', sa: 'जितं ते पुण्डरीकाक्ष नमस्ते विश्वभावन ।\nनमस्तेऽस्तु हृषीकेश महापुरुष पूर्वज ॥', en: 'Victory is Thine, O lotus-eyed one; salutation to Thee, source of the universe. Salutation to Thee, O Hrishikesha, master of the senses, the Great Being (Mahapurusha), first-born before all. With this salutation to Vishnu the Purana opens.' },
    ] },
    { title: 'प्रथम अंश · Creation', verses: [
      { ref: 'Amsha 1 · Srishti', sa: 'विष्णोः सकाशादुद्भूतं जगत्तत्रैव च स्थितम् ।', en: 'From Vishnu the world arises, in Vishnu it abides, and into Vishnu it dissolves. The first part sets out creation, the manvantaras, and the loved stories of Dhruva\'s steadfast devotion and of Prahlada saved by Narasimha.' },
    ] },
    { title: 'द्वितीय अंश · The Earth', verses: [
      { ref: 'Amsha 2 · Bhugola', sa: 'द्वितीयांश · भूगोल · भरत-चरितम्', en: 'A cosmography of the seven continents and oceans, Mount Meru, the motions of Sun and planets, and the geography of Bharatavarsha — including the story of King Bharata and his rebirth as a deer.' },
    ] },
    { title: 'तृतीय अंश · Time & Duty', verses: [
      { ref: 'Amsha 3 · Kala', sa: 'तृतीयांश · मन्वन्तर · वर्णाश्रम-धर्म', en: 'The measures of time and the manvantaras, the arrangement of the Vedas by Vyasa, and the duties (dharma) of the four varnas and four ashramas, together with the rites owed to the ancestors.' },
    ] },
    { title: 'चतुर्थ अंश · The Dynasties', verses: [
      { ref: 'Amsha 4 · Vamsha', sa: 'चतुर्थांश · सूर्य-वंश · चन्द्र-वंश', en: 'The royal genealogies — the Solar and Lunar dynasties and the lines of kings across the ages, tracing the descent that leads toward Krishna.' },
    ] },
    { title: 'पञ्चम अंश · Krishna', verses: [
      { ref: 'Amsha 5 · Krishna-charita', sa: 'पञ्चमांश · कृष्ण-जन्म · वृन्दावन-लीला', en: 'The longest part — the birth of Krishna, his childhood in Gokula and Vrindavan, the lifting of Govardhana, the slaying of Kamsa, and his deeds as the incarnation of Vishnu.' },
    ] },
    { title: 'षष्ठ अंश · Liberation', verses: [
      { ref: 'Amsha 6 · Moksha', sa: 'षष्ठांश · कलि-युग · प्रलय · मोक्ष', en: 'The concluding part — the evils of the Kali age, the dissolution of the worlds, and the yoga of meditation on Vishnu by which the soul attains union with Brahman and final release.' },
    ] },
  ],
};

const PURAN_BHAGAVATA: BookDoc = {
  id: 'puran-bhagavata', eyebrow: '18 महापुराण · Vaishnava', title: 'Shrimad Bhagavatam', hindi: 'श्रीमद्\nभागवत', cover: 'gold',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'flute',
  subtitle: 'महापुराण · Vaishnava · ~18,000 श्लोक',
  intro: 'The Bhagavata Purana — the crown jewel of the sattvic Vaishnava Puranas and the most beloved scripture of bhakti. In some 18,000 verses across twelve skandhas (books), it is narrated by Shuka to King Parikshit in his last seven days of life. It moves from creation to liberation and reaches its heart in the tenth Skandha, the full life-story (lila) of Krishna — including such treasured episodes as the deliverance of Gajendra the elephant-king.',
  chapters: [
    { title: 'मंगलाचरण · Invocation (1.1.1)', verses: [
      { ref: '1.1.1', sa: 'जन्माद्यस्य यतोऽन्वयादितरतश्चार्थेष्वभिज्ञः स्वराट्\nतेने ब्रह्म हृदा य आदिकवये मुह्यन्ति यत्सूरयः ।\nतेजोवारिमृदां यथा विनिमयो यत्र त्रिसर्गोऽमृषा\nधाम्ना स्वेन सदा निरस्तकुहकं सत्यं परं धीमहि ॥', en: 'I meditate upon the Supreme Truth, from whom the creation, sustenance and dissolution of this universe proceed; who is conscious of all, self-luminous; who revealed the Veda in the heart of the first sage Brahma; about whom even the gods are bewildered; in whom the threefold creation appears real as a mirage of fire, water and earth; who by His own splendour is ever free of illusion. The famed opening verse of the Bhagavatam.' },
    ] },
    { title: 'स्कन्ध 1–2 · The Question', verses: [
      { ref: 'Skandha 1–2 · Prashna', sa: 'प्रथम-द्वितीय स्कन्ध · परीक्षित-प्रश्नः', en: 'King Parikshit, cursed to die in seven days, sits fasting on the Ganga\'s bank; the sage Shuka arrives and, asked what a dying man should do, begins the Bhagavatam. These skandhas set the frame and teach that hearing and remembering the Lord is the highest duty.' },
    ] },
    { title: 'स्कन्ध 3–4 · Cosmology', verses: [
      { ref: 'Skandha 3–4 · Srishti', sa: 'तृतीय-चतुर्थ स्कन्ध · कपिल-सांख्य · ध्रुव', en: 'Creation unfolds through the dialogue of Vidura and Maitreya; Kapila teaches the Sankhya of devotion to his mother Devahuti; and the boy Dhruva wins by penance an undying place among the stars.' },
    ] },
    { title: 'स्कन्ध 5–6 · Worlds & Ajamila', verses: [
      { ref: 'Skandha 5–6 · Loka', sa: 'पञ्चम-षष्ठ स्कन्ध · जम्बूद्वीप · अजामिल-मोक्ष', en: 'The cosmography of the worlds — the continents, planetary systems, heavens and hells — and the redemption of the fallen Ajamila, saved at death merely by calling the name of Narayana, showing the power of the Holy Name.' },
    ] },
    { title: 'स्कन्ध 7–8 · Prahlada & Gajendra', verses: [
      { ref: 'Skandha 7–8 · Bhakti', sa: 'सप्तम-अष्टम स्कन्ध · प्रह्लाद · गजेन्द्र-मोक्ष', en: 'The child-devotee Prahlada is protected by Narasimha from his demon father; the ocean of milk is churned; Vamana reclaims the worlds; and Gajendra, the elephant-king seized by a crocodile, is delivered the instant he surrenders to the Lord — the celebrated Gajendra Moksha.' },
    ] },
    { title: 'स्कन्ध 9–10 · Krishna-lila', verses: [
      { ref: 'Skandha 10 · The Life of Krishna', sa: 'दशम स्कन्ध · कृष्ण-लीला', en: 'The heart of the Bhagavatam — the birth of Krishna in Mathura, his childhood in Vrindavan, the raslila with the gopis, the lifting of Govardhana, the slaying of Kamsa and his royal deeds. The ninth skandha traces the dynasties leading to him.' },
      { ref: '1.3.28', sa: 'एते चांशकलाः पुंसः कृष्णस्तु भगवान्स्वयम् ।\nइन्द्रारिव्याकुलं लोकं मृडयन्ति युगे युगे ॥', en: 'All these are portions and parts of the Supreme Person, but Krishna is the Lord, Bhagavan, Himself; in every age they protect the world when it is troubled by the enemies of the gods. A famous verse declaring Krishna the source of all avataras.' },
    ] },
    { title: 'स्कन्ध 11–12 · Uddhava Gita & Kali', verses: [
      { ref: 'Skandha 11–12 · Nirvana', sa: 'एकादश-द्वादश स्कन्ध · उद्धव-गीता · कलि-युग', en: 'Krishna gives his last teaching to Uddhava (the Uddhava Gita) and departs the world; the failings of the Kali age are foretold; and the Purana closes by extolling the chanting of the divine name (nama-sankirtana) as the one refuge of the age.' },
    ] },
  ],
};

/* register:
   'puran-brahma': PURAN_BRAHMA,
   'puran-padma': PURAN_PADMA,
   'puran-vishnu': PURAN_VISHNU,
   'puran-bhagavata': PURAN_BHAGAVATA, */

/* ── 4 of the 18 Mahapuranas — Shaiva & Shakta ──────────────────────────
   BookDoc-shaped plain object literals (no type annotation, no imports).
   Sanskrit (`sa`) uses only real, verifiable shlokas; where no verified
   verse exists for a section, `sa` carries the section\'s Sanskrit name/theme
   and `en` the factual summary — no verse text is invented. */

const PURAN_SHIVA: BookDoc = {
  id: 'puran-shiva', eyebrow: '18 महापुराण · Shaiva', title: 'Shiva Purana', hindi: 'शिव\nपुराण', cover: 'purple',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'mahamrityunjaya',
  subtitle: 'महापुराण · शैव · ~24,000 श्लोक',
  intro: 'The great Shaiva Mahapurana, presided over by Lord Shiva and narrated by the sage Vyasa through Suta to the sages of Naimisharanya. It celebrates Shiva as the supreme reality worshipped through the Linga, the Panchakshara mantra "Om Namah Shivaya", and the twelve Jyotirlingas. The surviving text runs to about 24,000 verses arranged in seven Samhitas (books) — Vidyeshvara, Rudra, Shatarudra, Kotirudra, Uma, Kailasa and Vayaviya.',
  chapters: [
    { title: 'विद्येश्वर संहिता · मंगलाचरण (Invocation)', verses: [
      { ref: 'महामृत्युंजय मंत्र', sa: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् ।\nउर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात् ॥', en: 'The Mahamrityunjaya Mantra (Rigveda 7.59.12), the great life-giving invocation to Shiva Tryambaka (the three-eyed one) that opens Shaiva worship: "We worship the fragrant three-eyed Lord who nourishes all beings. As the ripe cucumber is freed from its stalk, may He free us from death — not from immortality."' },
    ] },
    { title: 'विद्येश्वर संहिता (Vidyeshvara Samhita)', verses: [
      { ref: 'पञ्चाक्षर · Om Namah Shivaya', sa: 'ॐ नमः शिवाय', en: 'The first book establishes the supremacy of Shiva and the worship of the Linga. It expounds the Panchakshara ("five-syllable") mantra Om Namah Shivaya, the merit of Shiva devotion, and the framing dialogue in which Suta answers the sages\' questions about the highest path.' },
    ] },
    { title: 'रुद्र संहिता (Rudra Samhita)', verses: [
      { ref: 'सृष्टि · सती · पार्वती · कुमार · युद्ध', sa: 'रुद्रसंहिता — शिवलीला', en: 'The largest and most beloved book, in five sections (Srishti, Sati, Parvati, Kumara, Yuddha). It narrates creation, the story of Sati and Daksha\'s sacrifice, Parvati\'s penance and marriage to Shiva, and the births of Ganesha and Kartikeya.' },
    ] },
    { title: 'शतरुद्र संहिता (Shatarudra Samhita)', verses: [
      { ref: 'शिव के अवतार', sa: 'शतरुद्रसंहिता — रुद्रावतार', en: 'Describes the many manifestations and incarnations of Shiva — including Nataraja, the Rudra-avataras, and the tradition that Hanuman is an avatar of Rudra — together with the glory of Shiva\'s sacred forms.' },
    ] },
    { title: 'कोटिरुद्र संहिता · द्वादश ज्योतिर्लिंग (Kotirudra Samhita)', verses: [
      { ref: 'द्वादश ज्योतिर्लिंग स्तोत्र', sa: 'सौराष्ट्रे सोमनाथं च श्रीशैले मल्लिकार्जुनम् ।\nउज्जयिन्यां महाकालमोङ्कारममलेश्वरम् ॥', en: 'This book recounts the origins and glories of the twelve Jyotirlingas — Somnath, Mallikarjuna, Mahakala, Omkareshwar and the rest — the twelve luminous self-manifest shrines of Shiva sung in the famous Dwadasha Jyotirlinga Stotra.' },
    ] },
    { title: 'उमा संहिता (Uma Samhita)', verses: [
      { ref: 'शक्ति · देवी महिमा', sa: 'उमासंहिता — शक्तितत्त्व', en: 'Centred on the Goddess Uma (Parvati) as the Shakti of Shiva — her greatness, the nature of the divine feminine, and teachings on virtue, sin, and the fruits of action.' },
    ] },
    { title: 'कैलास संहिता (Kailasa Samhita)', verses: [
      { ref: 'प्रणव · ॐकार उपासना', sa: 'ॐ', en: 'The esoteric book of Mount Kailasa — the inner meaning of the Pranava (Om), Shaiva initiation, sannyasa and yoga, revealing the subtle philosophy behind Shiva worship.' },
    ] },
    { title: 'वायवीय संहिता (Vayaviya Samhita)', verses: [
      { ref: 'सृष्टि · शैव दर्शन', sa: 'वायवीयसंहिता — शिवतत्त्व', en: 'Narrated by Vayu, the wind-god — cosmology, the process of creation and dissolution, Shaiva philosophy, and the paths of devotion and knowledge that lead to Shiva.' },
    ] },
  ],
};

const PURAN_SKANDA: BookDoc = {
  id: 'puran-skanda', eyebrow: '18 महापुराण · Shaiva', title: 'Skanda Purana', hindi: 'स्कन्द\nपुराण', cover: 'blue',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'om-namah',
  subtitle: 'महापुराण · शैव · ~81,000 श्लोक',
  intro: 'The largest of all eighteen Mahapuranas, presided over by Skanda (Kartikeya), the warrior son of Shiva and Parvati, who narrates it to the sages. With roughly 81,000 verses, it is above all a vast treasury of Mahatmyas (glories) of sacred places. The common recension is arranged in seven khandas — Maheshwara, Vaishnava, Brahma, Kashi, Avanti, Nagara and Prabhasa — famous for the Kashi Khanda (Varanasi), the Kedara and Kaumarika sections, and the Satyanarayana Vrata Katha.',
  chapters: [
    { title: 'मंगलाचरण · गुरु वन्दना (Invocation)', verses: [
      { ref: 'गुरु गीता (Skanda Purana)', sa: 'गुरुर्ब्रह्मा गुरुर्विष्णुर्गुरुर्देवो महेश्वरः ।\nगुरुः साक्षात् परं ब्रह्म तस्मै श्रीगुरवे नमः ॥', en: 'The celebrated Guru-vandana from the Guru Gita, which is preserved within the Skanda Purana: "The Guru is Brahma, the Guru is Vishnu, the Guru is the Lord Maheshwara; the Guru is verily the Supreme Brahman — to that revered Guru I bow."' },
    ] },
    { title: 'माहेश्वर खण्ड (Maheshwara Khanda)', verses: [
      { ref: 'केदार · कौमारिका · अरुणाचल', sa: 'माहेश्वरखण्ड — तारकवध', en: 'Opens the Purana with the glory of Shiva: the Kedara section, the birth of Kartikeya and the slaying of the demon Taraka, and the Arunachala Mahatmya of the sacred hill of Tiruvannamalai.' },
    ] },
    { title: 'वैष्णव खण्ड (Vaishnava Khanda)', verses: [
      { ref: 'वेङ्कटाचल · पुरुषोत्तम · बदरी', sa: 'वैष्णवखण्ड — विष्णुक्षेत्र माहात्म्य', en: 'The glories of great Vishnu shrines — the Venkatachala Mahatmya (Tirupati), the Purushottama Kshetra (Jagannath, Puri), Badarikashrama, and the Margashirsha and Vaishakha vrata observances.' },
    ] },
    { title: 'ब्रह्म खण्ड (Brahma Khanda)', verses: [
      { ref: 'सेतु · धर्मारण्य · उत्तर', sa: 'ब्रह्मखण्ड — सेतु माहात्म्य', en: 'Contains the Setu Mahatmya of Rameshwaram (the bridge to Lanka), the Dharmaranya section, and the Uttara portion which carries the Guru Gita — teachings on pilgrimage, dharma and devotion.' },
    ] },
    { title: 'काशी खण्ड (Kashi Khanda)', verses: [
      { ref: 'काशी · विश्वनाथ · मणिकर्णिका', sa: 'काशीक्षेत्र — विश्वनाथ माहात्म्य', en: 'The renowned pilgrimage guide to Kashi (Varanasi) — the eternal city of Shiva. It extols Vishwanath, the Manikarnika ghat, the Ganga, and the belief that death in Kashi confers liberation (moksha).' },
    ] },
    { title: 'अवन्ति खण्ड (Avanti Khanda)', verses: [
      { ref: 'उज्जयिनी · महाकाल · क्षिप्रा', sa: 'अवन्तीखण्ड — महाकाल माहात्म्य', en: 'The Mahatmya of Avanti (Ujjain) on the Kshipra river — the glory of the Mahakaleshwar Jyotirlinga and the sacred sites of one of the seven mokshadayaka cities.' },
    ] },
    { title: 'नागर खण्ड (Nagara Khanda)', verses: [
      { ref: 'हाटकेश्वर · तीर्थ माहात्म्य', sa: 'नागरखण्ड — हाटकेश्वर क्षेत्र', en: 'Praises the Hatakeshwara Kshetra and the sacred tirthas of the Nagara region (Gujarat) — their origin legends and the merit of pilgrimage.' },
    ] },
    { title: 'प्रभास खण्ड (Prabhasa Khanda)', verses: [
      { ref: 'सोमनाथ · प्रभास · द्वारका', sa: 'प्रभासखण्ड — सोमनाथ माहात्म्य', en: 'The glory of Prabhasa on the western sea — the Somnath Jyotirlinga, the Sarasvati\'s confluence, and Dwarka, the city of Krishna. It also transmits the popular Satyanarayana Vrata Katha.' },
    ] },
  ],
};

const PURAN_LINGA: BookDoc = {
  id: 'puran-linga', eyebrow: '18 महापुराण · Shaiva', title: 'Linga Purana', hindi: 'लिङ्ग\nपुराण', cover: 'gold',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'om-namah',
  subtitle: 'महापुराण · शैव · ~11,000 श्लोक',
  intro: 'A core Shaiva Mahapurana of about 11,000 verses, named for its central theme — the worship of Shiva in the aniconic form of the Linga. Narrated by Vyasa, it is arranged in two parts (Purva-bhaga and Uttara-bhaga) and famously tells of the Lingodbhava: the beginningless, endless pillar of light from which Shiva reveals himself as the ultimate reality beyond Brahma and Vishnu. It covers cosmology, the Yugas and Manvantaras, Shaiva yoga, ritual Linga-worship, tirthas and ethics.',
  chapters: [
    { title: 'मंगलाचरण (Invocation)', verses: [
      { ref: 'शिव वन्दना · पञ्चाक्षर', sa: 'ॐ नमः शिवाय', en: 'The Purana opens with obeisance to the Supreme Soul — Shiva, who is Rudra, Vishnu and Brahma, lord of Pradhana and Purusha and cause of the creation, sustenance and dissolution of the universe — invoked through the eternal five-syllable mantra Om Namah Shivaya.' },
    ] },
    { title: 'लिङ्गोद्भव (Lingodbhava)', verses: [
      { ref: 'ज्योतिर्लिंग · अनादि अनन्त स्तम्भ', sa: 'लिङ्गोद्भव — अग्निस्तम्भ', en: 'The signature narrative: when Brahma and Vishnu disputed who was supreme, an infinite pillar of fire (the Linga) appeared. Brahma flew up and Vishnu dived down, yet neither could find its top or base — revealing Shiva as the limitless origin of all, and the reason he is worshipped as the Linga.' },
    ] },
    { title: 'सृष्टि · कल्प · मन्वन्तर (Cosmology)', verses: [
      { ref: 'सर्ग · प्रतिसर्ग', sa: 'लिङ्गपुराण — सृष्टिवर्णन', en: 'Accounts of primary and secondary creation, the divisions of time — Yugas, Kalpas and Manvantaras — the movements of sun and planets, and the sacred geography of the cosmos, in the encyclopedic Puranic manner.' },
    ] },
    { title: 'शिव के अवतार (The Yogeshwaras)', verses: [
      { ref: 'अष्टाविंशति योगेश्वर', sa: 'लिङ्गपुराण — शिवावतार', en: 'Describes the twenty-eight incarnations of Shiva as teachers of yoga (the Yogeshwaras) and their disciples, presenting the Shaiva path of meditation and inner discipline.' },
    ] },
    { title: 'लिङ्ग पूजा विधि (Linga Worship)', verses: [
      { ref: 'पूजा · अभिषेक · व्रत', sa: 'लिङ्गार्चन माहात्म्य', en: 'The rites of Linga worship — installation, abhisheka, offerings and vows — and their fruits: how devotion to the Linga washes away sin, grants prosperity, and leads the soul to liberation.' },
    ] },
    { title: 'पञ्चब्रह्म · तीर्थ (Panchabrahma & Tirthas)', verses: [
      { ref: 'सद्योजात · वामदेव · अघोर · तत्पुरुष · ईशान', sa: 'पञ्चब्रह्ममन्त्र', en: 'Expounds the five faces of Shiva (Panchabrahma) — Sadyojata, Vamadeva, Aghora, Tatpurusha and Ishana — together with sacred pilgrimage places, vratas and observances dear to Shiva.' },
    ] },
    { title: 'उत्तर भाग (Uttara-bhaga)', verses: [
      { ref: 'अम्बिका · विष्णु अवतार · उपसंहार', sa: 'लिङ्गपुराण — उत्तरभाग', en: 'The concluding part turns to the Goddess Ambika, the incarnations of Vishnu, further hymns and stotras to Shiva, and the merit of hearing and reciting the Purana.' },
    ] },
  ],
};

const PURAN_MARKANDEYA: BookDoc = {
  id: 'puran-markandeya', eyebrow: '18 महापुराण · Devi/Shakta', title: 'Markandeya Purana', hindi: 'मार्कण्डेय\nपुराण', cover: 'rose',
  language: ['Sanskrit', 'Hindi', 'English'], trackId: 'gayatri',
  subtitle: 'महापुराण · देवी/शाक्त · ~9,000 श्लोक',
  intro: 'One of the oldest Mahapuranas, of about 9,000 verses, framed as the wisdom of the immortal sage Markandeya. It opens with the sage Jaimini approaching four wise Dharmika birds who answer his questions from the Mahabharata. Above all it is treasured for the Devi Mahatmya (Durga Saptashati) — cantos 81 to 93 — the foundational Shakta scripture of 700 verses that hymns the Great Goddess as the supreme power, recited across every Navaratri.',
  chapters: [
    { title: 'मंगलाचरण · देवी वन्दना (Invocation)', verses: [
      { ref: 'देवी माहात्म्य 11', sa: 'सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके ।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते ॥', en: 'The most beloved invocation of the Goddess, from the Devi Mahatmya: "O auspicious one among all that is auspicious, O gracious Shiva, accomplisher of every aim; O refuge, three-eyed Gauri, O Narayani — salutations unto You."' },
    ] },
    { title: 'जैमिनि प्रश्न · धर्मपक्षी (The Frame)', verses: [
      { ref: 'चार धर्मात्मा पक्षी', sa: 'मार्कण्डेयपुराण — जैमिनि-प्रश्न', en: 'The narrative frame: unable to resolve four questions arising from the Mahabharata, Jaimini is sent by Markandeya to four wise birds — sons of the sage Mandapala — who, remembering their past births, expound dharma and the great tales that follow.' },
    ] },
    { title: 'मदालसा उपाख्यान (Madalasa)', verses: [
      { ref: 'आत्मविद्या · मदालसा गीत', sa: 'शुद्धोऽसि बुद्धोऽसि निरञ्जनोऽसि\nसंसारमाया परिवर्जितोऽसि ।', en: 'The story of the enlightened queen Madalasa, who sings to her infant sons the highest Vedanta as a lullaby: "You are pure, you are awakened, you are stainless — you are free from the illusion of the world" — awakening them to the deathless Self.' },
    ] },
    { title: 'दत्तात्रेय · अलर्क (Yoga & Wisdom)', verses: [
      { ref: 'योग · राजनीति उपदेश', sa: 'मार्कण्डेयपुराण — दत्तात्रेयोपदेश', en: 'Teachings given by the avadhuta sage Dattatreya to King Alarka — on yoga, detachment, and the conduct of a righteous life — among the philosophical dialogues of the Purana.' },
    ] },
    { title: 'देवी माहात्म्य · दुर्गा सप्तशती (Devi Mahatmya)', verses: [
      { ref: 'देवी माहात्म्य · आरम्भ', sa: 'सावर्णिः सूर्यतनयो यो मनुः कथ्यतेऽष्टमः ।\nनिशामय तदुत्पत्तिं विस्तराद्गदतो मम ॥', en: 'The crown of the Purana begins here (canto 81): the sage tells King Suratha and the merchant Samadhi of Savarni, son of the Sun, the eighth Manu — a tale that unfolds into the glory of the Goddess who is the power behind all creation.' },
    ] },
    { title: 'महिषासुरमर्दिनी · या देवी (The Three Charitas)', verses: [
      { ref: 'देवी माहात्म्य 5', sa: 'या देवी सर्वभूतेषु शक्तिरूपेण संस्थिता ।\nनमस्तस्यै नमस्तस्यै नमस्तस्यै नमो नमः ॥', en: 'The three charitas praise the Goddess as Mahakali (slaying Madhu-Kaitabha), Mahalakshmi (slaying Mahishasura), and Mahasaraswati (slaying Shumbha-Nishumbha). This central refrain adores her indwelling presence: "To the Goddess who abides in all beings as Power — salutation, salutation, again and again salutation."' },
    ] },
    { title: 'सूर्य · मन्वन्तर (Surya & the Manvantaras)', verses: [
      { ref: 'आदित्य महिमा · सावर्णि मनु', sa: 'मार्कण्डेयपुराण — मन्वन्तरवर्णन', en: 'The later chapters glorify Surya (Aditya), recount the fourteen Manvantaras — especially the coming age of Savarni Manu — and close the Purana with genealogies and the merit of its recitation.' },
    ] },
  ],
};


/* ── 5 of the 18 Mahapuranas — authored as BookDoc entries ────────────────
   Narada · Agni · Bhavishya · Brahmavaivarta · Varaha
   Chapter 1 of each = an authentic, sourced Mangalacharan (real Sanskrit +
   English). Remaining chapters present major divisions / famous portions:
   ref = section name, sa = a genuine verbatim shloka OR the Sanskrit theme
   name of the section, en = a factual summary. No verse text is fabricated. */

const PURAN_NARADA: BookDoc = {
  id: 'puran-narada',
  eyebrow: '18 महापुराण · Vaishnava',
  title: 'Narada Purana',
  hindi: 'नारद\nपुराण',
  cover: 'gold',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'gayatri',
  subtitle: 'महापुराण · वैष्णव · ~25,000 श्लोक',
  intro: 'A Vaishnava Mahapurana narrated by the celestial sage Narada, traditionally counted at ~25,000 verses and arranged in two parts — the Purvabhaga (125 chapters, in four padas) and the Uttarabhaga (82 chapters). It is famed for its encyclopedic treatment of the six Vedangas — above all Jyotisha (astrology and astronomy) — for chapter-by-chapter summaries of all eighteen Puranas, and for its teachings on bhakti, dharma and sacred music.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: '1.1', sa: 'वन्दे वृन्दावनासीनमिन्दिरानन्दमन्दिरम् ।\nउपेन्द्रं सान्द्रकारुण्यं परानन्दं परात्परम् ॥', en: 'I bow to Him who is seated in Vrindavan, the abode and delight of Indira (Lakshmi) — to Upendra, dense with compassion, the supreme bliss, higher than the highest.' },
      { ref: '1.2', sa: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम् ।\nदेवीं सरस्वतीं व्यासं ततो जयमुदीरयेत् ॥', en: 'Having bowed to Narayana, and to Nara most exalted of men, and to the goddess Sarasvati and to Vyasa — then let one proclaim the Jaya, the sacred narration.' },
    ] },
    { title: 'पूर्वभाग · विष्णुभक्ति (Vishnu-Bhakti)', verses: [
      { ref: 'Purvabhaga · Ch 1-41', sa: 'विष्णुभक्ति', en: 'The opening chapters of the Purvabhaga are devoted to Vishnu-bhakti — devotional worship, Vaishnava festivals, vratas and ritual ceremonies — setting the devotional frame for the whole work.' },
    ] },
    { title: 'षड्वेदाङ्ग · ज्योतिष (The Vedangas & Astrology)', verses: [
      { ref: 'Purvabhaga · Vedangas', sa: 'षड्वेदाङ्ग · ज्योतिष', en: 'The larger, encyclopedic body of the Purvabhaga expounds the six Vedangas — Shiksha, Kalpa, Vyakarana, Nirukta, Chandas and Jyotisha — and is especially renowned for its detailed astrology and astronomy, covering time-reckoning, yugas, manvantaras and predictions for the Kali age.' },
    ] },
    { title: 'अष्टादश-पुराण-अनुक्रमणिका (Summaries of the 18 Puranas)', verses: [
      { ref: 'Purvabhaga · Ch 92-109', sa: 'अष्टादशपुराणानुक्रमणिका', en: 'A celebrated scholarly feature: one chapter apiece summarising each of the eighteen major Puranas — a resource valued because its summaries sometimes differ from the surviving manuscripts.' },
    ] },
    { title: 'रुक्माङ्गद-चरित · मोहिनी (Rukmangada & Mohini)', verses: [
      { ref: 'Uttarabhaga', sa: 'रुक्माङ्गदचरित · मोहिनी', en: 'The story of King Rukmangada, whose Ekadashi vow and devotion to Vishnu are tested by the enchantress Mohini — a narrative that later inspired plays and dance-dramas such as Kathakali.' },
    ] },
    { title: 'तीर्थ-माहात्म्य (Pilgrimage along the Ganges)', verses: [
      { ref: 'Uttarabhaga · Tirthas', sa: 'तीर्थमाहात्म्य', en: 'Much of the Uttarabhaga is a pilgrimage guide glorifying tirthas along the Ganges — from Haridwar through Kashi (Banaras) toward Bengal — with the sacred-site praises (mahatmyas) of each.' },
    ] },
    { title: 'राधा मूलप्रकृति · धर्म-मोक्ष (Radha, Dharma & Moksha)', verses: [
      { ref: 'Dharma & Devotion', sa: 'राधा मूलप्रकृति', en: 'The text glorifies Radha as mula-prakriti, the primordial creative principle, and sets out dharma-shastra ethics, varna-ashrama duties, the doctrine of moksha, and methods of worship for Ganesha, Narasimha, Rama, Krishna, Shiva and Lakshmi.' },
    ] },
  ],
};

const PURAN_AGNI: BookDoc = {
  id: 'puran-agni',
  eyebrow: '18 महापुराण · Encyclopedic',
  title: 'Agni Purana',
  hindi: 'अग्नि\nपुराण',
  cover: 'rose',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'mahamrityunjaya',
  subtitle: 'महापुराण · ज्ञानकोश · ~15,000 श्लोक',
  intro: 'Traditionally recited by Agni, the fire-god, to the sage Vasishtha, this Mahapurana of about 15,000 verses in some 382 chapters is renowned as an encyclopedia of all knowledge. Its chapters range across cosmology and the avatars of Vishnu, ritual and mantra, temple architecture (vastu) and iconography, statecraft, gemology, Ayurveda and the healing of humans, animals and plants, grammar, meter and poetics, law, astrology and the science of war — ending on yoga and liberation.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: '1.1', sa: 'श्रियं सरस्वतीं गौरीं गणेशं स्कन्दमीश्वरम् ।\nब्रह्माणं वह्निमिन्द्रादीन् वासुदेवं नमाम्यहम् ॥', en: 'I bow to Shri (Lakshmi), Sarasvati and Gauri (Parvati); to Ganesha, Skanda and Ishvara (Shiva); to Brahma, Vahni (Agni), Indra and the other celestials, and to Vasudeva (Krishna).' },
      { ref: '1.2', sa: 'नैमिषे हरिमीजाना ऋषयः शौनकादयः ।\nतीर्थयात्राप्रसङ्गेन स्वागतं सूतमब्रुवन् ॥', en: 'At the sacred forest of Naimisha, Shaunaka and the other sages, engaged in a sacrifice to Hari (Vishnu), welcomed Suta the reciter as he arrived after a pilgrimage.' },
    ] },
    { title: 'विष्णु अवतार · सृष्टि (Avatars & Creation)', verses: [
      { ref: 'Ch 2-16', sa: 'विष्णु अवतार · सृष्टि', en: 'After the invocation the text narrates the ten avatars of Vishnu — Matsya, Kurma, Varaha, Narasimha and the rest — together with condensed retellings of the Ramayana and Mahabharata, and accounts of cosmology and creation.' },
    ] },
    { title: 'पूजा · मन्त्र · कर्मकाण्ड (Worship & Ritual)', verses: [
      { ref: 'Ritual sections', sa: 'पूजा · मन्त्र · कर्मकाण्ड', en: 'Extensive chapters on ritual worship, the installation and consecration of images, mantras, initiation (diksha) and Tantric worship procedures of the Vaishnava and Shaiva traditions.' },
    ] },
    { title: 'वास्तु · प्रतिमालक्षण (Architecture & Iconography)', verses: [
      { ref: 'Vastu-shastra', sa: 'वास्तु · देवालय · प्रतिमालक्षण', en: 'Temple architecture, town planning and the making of divine images, giving the proportions and rules for constructing temples and sculpting icons of the deities.' },
    ] },
    { title: 'आयुर्वेद · चिकित्सा (Ayurveda & Medicine)', verses: [
      { ref: 'Chikitsa', sa: 'आयुर्वेद · चिकित्सा', en: 'Sections on medicine and healing that treat not only human ailments but also veterinary care of animals and the science of plant health (vriksha-ayurveda).' },
    ] },
    { title: 'राजधर्म · धनुर्वेद (Statecraft & War)', verses: [
      { ref: 'Rajadharma', sa: 'राजधर्म · धनुर्वेद', en: 'Statecraft, diplomacy, law and the coronation of kings, alongside Dhanurveda — military science, weapons and the martial arts.' },
    ] },
    { title: 'व्याकरण · छन्दस् · अलङ्कार (Grammar & Poetics)', verses: [
      { ref: 'Literary sciences', sa: 'व्याकरण · छन्दस् · अलङ्कार', en: 'A complete block on the literary sciences — grammar, prosody and meter, and poetics and rhetoric (alankara) — a rare treasury within a Purana.' },
    ] },
    { title: 'ज्योतिष · योग-मोक्ष (Astrology, Yoga & Liberation)', verses: [
      { ref: 'Closing chapters', sa: 'ज्योतिष · योग-मोक्ष', en: 'The encyclopedia closes with astronomy and astrology and then the philosophical chapters on yoga, knowledge of Brahman and liberation, ending on Vedantic and soteriological themes.' },
    ] },
  ],
};

const PURAN_BHAVISHYA: BookDoc = {
  id: 'puran-bhavishya',
  eyebrow: '18 महापुराण · Saura',
  title: 'Bhavishya Purana',
  hindi: 'भविष्य\nपुराण',
  cover: 'purple',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'om-namah',
  subtitle: 'महापुराण · सौर · ~14,000 श्लोक',
  intro: 'Its very name means the Purana of what is to come — bhavishya, the future. Traditionally reckoned at about 14,000 verses and divided into four parvas (Brahma, Madhyama, Pratisarga and Uttara), it is a classic authority on vratas and festivals and the most comprehensive Puranic source for the worship of Surya, the Sun, and the Maga (Shakadvipiya) solar priests. Its Pratisarga Parva is famous — and much debated — for its prophetic narratives of coming ages.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: 'Opening', sa: 'ॐ श्रीपरमात्मने नमः ॥\nश्रीगणेशाय नमः ॥\nॐ नमो भगवते वासुदेवाय ॥', en: 'Om, salutation to the Supreme Self; salutation to Shri Ganesha; Om, salutation to the Lord Vasudeva — the benedictory salutations that head the text.' },
      { ref: 'Brahma Parva 1.1', sa: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम् ।\nदेवीं सरस्वतीं व्यासं ततो जयमुदीरयेत् ॥', en: 'Having bowed to Narayana, and to Nara most exalted of men, and to the goddess Sarasvati and to Vyasa — then let one recite the Jaya, the sacred narration.' },
    ] },
    { title: 'ब्राह्मपर्व (Brahma Parva)', verses: [
      { ref: 'Brahma Parva', sa: 'ब्राह्मपर्व', en: 'The opening and largest book: sage Sumantu narrates to King Shatanika on creation, the duties of the varnas and ashramas, the samskaras (rites of passage), daily ritual, and above all the worship of Surya, the Sun.' },
    ] },
    { title: 'सौर · मग ब्राह्मण (Sun-Worship & the Maga Priests)', verses: [
      { ref: 'Saura section', sa: 'सौर · मग (शाकद्वीपीय) ब्राह्मण', en: 'How Krishna\'s son Samba, cured of leprosy by worshipping Surya, brought eighteen Maga (Shakadvipiya) Brahmins from Shakadvipa to serve as priests of the Sun — the foundational solar-cult narrative of Indian sun worship.' },
    ] },
    { title: 'मध्यमपर्व (Madhyama Parva)', verses: [
      { ref: 'Madhyama Parva', sa: 'मध्यमपर्व', en: 'A later, Tantra-inflected book centred on festivals, vrata-kathas (the narratives of religious vows) and the devotional merit of observances such as Ekadashi and Shivaratri, with ritual and shraddha material.' },
    ] },
    { title: 'प्रतिसर्गपर्व (Pratisarga Parva)', verses: [
      { ref: 'Pratisarga Parva', sa: 'प्रतिसर्गपर्व', en: 'The prophecy book — royal and sage genealogies together with narratives of the ages to come; it is well known for late interpolations, which scholars date largely to the medieval and colonial periods.' },
    ] },
    { title: 'उत्तरपर्व · भविष्योत्तर (Uttara Parva)', verses: [
      { ref: 'Uttara Parva', sa: 'उत्तरपर्व · भविष्योत्तरपुराण', en: 'A book so self-contained that it circulates as its own work, the Bhavishyottara Purana — a practical handbook of vratas, danas (charitable gifts), festivals and pilgrimage mahatmyas for the Kali age.' },
    ] },
    { title: 'व्रत · उत्सव (Vratas & Festivals)', verses: [
      { ref: 'Vrata material', sa: 'व्रत · उत्सव', en: 'Running across the Madhyama and Uttara Parvas, the corpus for which the Purana is a classic authority — the rules, dates, procedures and rewards of religious vows and festival observances.' },
    ] },
  ],
};

const PURAN_BRAHMAVAIVARTA: BookDoc = {
  id: 'puran-brahmavaivarta',
  eyebrow: '18 महापुराण · Vaishnava',
  title: 'Brahmavaivarta Purana',
  hindi: 'ब्रह्मवैवर्त\nपुराण',
  cover: 'blue',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'flute',
  subtitle: 'महापुराण · वैष्णव · ~18,000 श्लोक',
  intro: 'A Krishna-centric Vaishnava Mahapurana of about 18,000 verses, arranged in four khandas — Brahma, Prakriti, Ganesha (Ganapati) and Sri Krishna Janma. It exalts Krishna as the supreme being from whom all gods arise, and Radha as his inseparable divine energy; it unfolds the theology of Prakriti, the Divine Feminine, in her five forms, and narrates the birth and greatness of Ganesha and the eternal realm of Goloka.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: 'Brahma Khanda 1.1', sa: 'गणेशब्रह्मेशसुरेशशेषाः सुराश्च सर्वे मनवो मुनीन्द्राः ।\nसरस्वतीश्रीगिरिजादिकाश्च नमन्ति देव्यः प्रणमामि तं विभुम् ॥', en: 'Ganesha, Brahma, Isha (Shiva), Suresha (Indra) and Shesha; all the gods, the Manus and the chief of sages; and the goddesses Sarasvati, Shri (Lakshmi), Girija (Parvati) and the rest — all bow down. To that all-pervading Lord (Krishna) I offer my obeisance.' },
    ] },
    { title: 'ब्रह्मखण्ड (Brahma Khanda)', verses: [
      { ref: 'Brahma Khanda · 30 ch', sa: 'ब्रह्मखण्ड', en: 'Describes creation and the cosmos, presenting Krishna as the ultimate cause from whom Brahma and the whole creative order arise.' },
    ] },
    { title: 'प्रकृतिखण्ड (Prakriti Khanda)', verses: [
      { ref: 'Prakriti Khanda · 67 ch', sa: 'प्रकृतिखण्ड · पञ्चप्रकृति', en: 'Expounds the theology of Prakriti, the Divine Feminine, in her five principal forms — Durga, Lakshmi, Sarasvati, Savitri and Radha — teaching that every woman is a portion of the Goddess.' },
    ] },
    { title: 'गणेशखण्ड · गणपतिखण्ड (Ganesha Khanda)', verses: [
      { ref: 'Ganesha Khanda · 46 ch', sa: 'गणेशखण्ड · गणपतिखण्ड', en: 'Narrates the birth, the greatness and the exploits of Ganesha, together with the related family narratives of Shiva and Parvati.' },
    ] },
    { title: 'श्रीकृष्णजन्मखण्ड (Krishna Janma Khanda)', verses: [
      { ref: 'Krishna Janma Khanda · ~131 ch', sa: 'श्रीकृष्णजन्मखण्ड', en: 'The longest and most celebrated section: the birth of Krishna, his love with Radha, the lilas of Vrindavan with the gopis, and the supreme transcendent realm of Goloka.' },
    ] },
    { title: 'गोलोक · राधाकृष्ण (Goloka & Radha-Krishna)', verses: [
      { ref: 'Krishna Janma Khanda', sa: 'गोलोक · राधाकृष्ण', en: 'Depicts the eternal abode Goloka and the Radha-Krishna theology in which Radha is Krishna\'s inseparable creative energy, the shakti of the Supreme.' },
    ] },
    { title: 'पञ्चप्रकृति (The Five Divine Mothers)', verses: [
      { ref: 'Prakriti Khanda', sa: 'पञ्चप्रकृति', en: 'The doctrine that the one Divine Mother manifests as five goddesses, and that all female beings have come forth from the divine feminine — so that an offence against any woman is an offence against the Goddess.' },
    ] },
  ],
};

const PURAN_VARAHA: BookDoc = {
  id: 'puran-varaha',
  eyebrow: '18 महापुराण · Vaishnava',
  title: 'Varaha Purana',
  hindi: 'वराह\nपुराण',
  cover: 'green',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'om-namah',
  subtitle: 'महापुराण · वैष्णव · ~24,000 श्लोक',
  intro: 'A Vaishnava Mahapurana traditionally reckoned at ~24,000 verses (the surviving text runs to some 217 chapters), narrated by Lord Vishnu in his Varaha, the boar avatar, to the Earth goddess Bhudevi whom he has just lifted from the cosmic waters. It is famed for the story of that rescue and for its teachings on vratas, on the tirthas of Mathura, on charity and the rites for ancestors, and on devotion to Vishnu.',
  chapters: [
    { title: 'मंगलाचरण · Invocation', verses: [
      { ref: '1.1', sa: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम् ।\nदेवीं सरस्वतीं व्यासं ततो जयमुदीरयेत् ॥', en: 'Having bowed to Narayana, and to Nara most exalted of men, and to the goddess Sarasvati and to Vyasa — then let one recite the Jaya, the sacred narration.' },
    ] },
    { title: 'वराह-पृथिवी संवाद (Varaha & the Earth)', verses: [
      { ref: 'Ch 1-112', sa: 'वराह-पृथिवी संवाद', en: 'The core frame: Vishnu as the cosmic Boar, having raised the Earth from the flood-waters, instructs the Earth goddess (Prithvi / Dharani) on creation, dharma and liberation.' },
    ] },
    { title: 'सृष्टि (Creation & Cosmology)', verses: [
      { ref: 'Cosmology', sa: 'सृष्टि', en: 'Accounts of creation, the cosmic cycles and dissolution, and the incarnations of Vishnu — Matsya recovering the Vedas, Kurma at the churning, Varaha raising the Earth — forming the philosophical framework of the text.' },
    ] },
    { title: 'व्रत (Vratas & Observances)', verses: [
      { ref: 'Vrata sections', sa: 'कोकिल-व्रत · चातुर्मास्य-माहात्म्य', en: 'Extensive prescriptions of vows, fasts and festival observances — among them the Kokila-vrata and the glory of the Chaturmasya months — with their procedures and rewards.' },
    ] },
    { title: 'मथुरा-माहात्म्य (Mathura & Pilgrimage)', verses: [
      { ref: 'Tirtha-yatra', sa: 'मथुरा-माहात्म्य · तीर्थयात्रा', en: 'A large mahatmya glorifying the sacred sites and temples of Mathura (and sites in Nepal), guiding the pilgrim from shrine to shrine.' },
    ] },
    { title: 'नाचिकेत-उपाख्यान (The Story of Nachiketa)', verses: [
      { ref: 'Nachiketa', sa: 'नाचिकेत-उपाख्यान', en: 'The tale of Nachiketa\'s journey to the realm of Yama and his return, cataloguing the hells and the workings of karma and its retribution.' },
    ] },
    { title: 'धर्मसंहिता · श्राद्ध-दान (Dharma, Shraddha & Charity)', verses: [
      { ref: 'Ch 193-212', sa: 'धर्मसंहिता · श्राद्ध · दान', en: 'The Dharmasamhita, a dialogue of King Janamejaya and the sage Vaishampayana, expounding dharma and ethical conduct, the shraddha rites for ancestors, and the merit of dana (charity).' },
    ] },
  ],
};


/* ────────────────────────────────────────────────────────────────────────
 * 5 of the 18 Mahapuranas — BookDoc entries for the Sacred Scriptures library.
 * Vamana · Kurma · Matsya · Garuda · Brahmanda.
 *
 * Authenticity: Chapter 1 of each = a genuine, source-verified mangalacharana
 * (GRETIL critical Sanskrit e-texts / wisdomlib). Where no specific shloka is
 * quoted, `sa` carries the section's real Sanskrit name/theme and `en` a
 * factual summary — no verse text is invented.
 * ──────────────────────────────────────────────────────────────────────── */

const PURAN_VAMANA: BookDoc = {
  id: 'puran-vamana',
  eyebrow: '18 महापुराण · Vaishnava',
  title: 'Vamana Purana',
  hindi: 'वामन\nपुराण',
  cover: 'gold',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'flute',
  subtitle: 'महापुराण · वैष्णव · ~10,000 श्लोक',
  intro: 'The Purana of Vishnu\'s dwarf incarnation, Vamana, who as Trivikrama measured the three worlds in three strides and humbled the demon-king Bali. A Mahapurana of about 10,000 verses narrated by the sage Pulastya, it weaves together Vaishnava, Shaiva and tirtha lore. It is especially famed for the Trivikrama story, the tale of Prahlada, and its Saromahatmya on sacred lakes and Kurukshetra.',
  chapters: [
    { title: 'अध्याय १ · मंगलाचरण (Invocation)', verses: [
      { ref: '1.1', sa: 'नारायणं नमस्कृत्य नरं चैव नरोत्तमम् ।\nदेवीं सरस्वतीं व्यासं ततो जयमुदीरयेत् ॥', en: 'Having bowed to Narayana and to Nara, the most exalted of men, and to the goddess Sarasvati and to Vyasa — then let one recite the sacred narrative. The opening benediction (mangalacharana) of the Vamana Purana, spoken before the sage Pulastya begins the telling.' },
    ] },
    { title: 'वामनावतार · Trivikrama & King Bali', verses: [
      { ref: 'Vamana Charita', sa: 'त्रिविक्रम · वामनावतार', en: 'The heart of the Purana: Vishnu takes birth as the dwarf Vamana, approaches the generous demon-king Bali at his sacrifice and begs three paces of land. Granted the boon, he grows into the cosmic Trivikrama and covers earth, sky and heaven in three strides, restoring the worlds to the gods while honouring Bali\'s devotion.' },
    ] },
    { title: 'शिव-पार्वती · Shiva, Parvati & Kartikeya', verses: [
      { ref: 'Shaiva Katha', sa: 'शिवपार्वतीविवाह · अन्धकासुरवध', en: 'A large Shaiva portion narrates the marriage of Shiva and Parvati, the birth of Kartikeya (Skanda), and the slaying of the demon Andhaka. These chapters knit the Vaishnava frame together with the worship of Shiva and the Great Goddess.' },
    ] },
    { title: 'प्रह्लाद-चरित · The Devotion of Prahlada', verses: [
      { ref: 'Prahlada', sa: 'प्रह्लादभक्ति · विष्णुशरणागति', en: 'The story of the boy-devotee Prahlada, whose unwavering faith in Vishnu withstands his demon father\'s wrath — a discourse on surrender (sharanagati) and the protecting grace of the Lord.' },
    ] },
    { title: 'सरोमाहात्म्य · Sacred Lakes & Kurukshetra', verses: [
      { ref: 'Saromahatmya', sa: 'तीर्थमाहात्म्य · कुरुक्षेत्र', en: 'The famed Saromahatmya glorifies holy lakes and pilgrimage sites, above all the sacred field of Kurukshetra — describing their origin, the merit of bathing and gifting there, and the vows (vratas) observed by pilgrims.' },
    ] },
    { title: 'सृष्टि व वंश · Cosmogony & Genealogies', verses: [
      { ref: 'Sarga & Vamsha', sa: 'सर्ग · प्रतिसर्ग · वंश', en: 'Like every Mahapurana it recounts the five marks (pancha-lakshana): creation and re-creation of the cosmos, the ages of the Manus, and the genealogies of gods, sages and kings — including the tale of Daksha\'s sacrifice.' },
    ] },
  ],
};

const PURAN_KURMA: BookDoc = {
  id: 'puran-kurma',
  eyebrow: '18 महापुराण · Shaiva',
  title: 'Kurma Purana',
  hindi: 'कूर्म\nपुराण',
  cover: 'green',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'mahamrityunjaya',
  subtitle: 'महापुराण · शैव · ~17,000 श्लोक',
  intro: 'Narrated by Vishnu in his Kurma (tortoise) form during the churning of the ocean of milk, this Mahapurana of about 17,000 verses is arranged in a Purva and an Uttara portion. It is most celebrated for embedding the Ishvara Gita — Lord Shiva\'s discourse on yoga, OM and non-dual reality to the sages at Badarikashrama — together with the Vyasa Gita. It blends Vaishnava, Shaiva and Shakta devotion and glorifies Varanasi and Prayaga.',
  chapters: [
    { title: 'अध्याय १ · मंगलाचरण (Invocation)', verses: [
      { ref: '1.1.1', sa: 'नमस्कृत्वाप्रमेयाय विष्णवे कूर्मरूपिणे ।\nपुराणं संप्रवक्ष्यामि यदुक्तं विश्वयोनिना ॥', en: 'Bowing to the immeasurable Vishnu who took the form of the tortoise (Kurma), I shall relate the Purana as it was told by the Source of the universe. The Kurma Purana\'s opening verse, spoken as the sages of Naimisha ask the story of Suta.' },
    ] },
    { title: 'कूर्मावतार · The Tortoise & the Churning', verses: [
      { ref: 'Kurma Avatara', sa: 'समुद्रमन्थन · कूर्मरूप', en: 'The frame narrative: during the churning of the ocean for the nectar of immortality, Vishnu becomes the great tortoise upon whose back Mount Mandara turns. Seated thus, he answers the sages\' questions and reveals the Purana.' },
    ] },
    { title: 'ईश्वरगीता · The Ishvara Gita', verses: [
      { ref: 'Uttara 1–11', sa: 'ईश्वरगीता · योग · प्रणव · अद्वैत', en: 'The Purana\'s most famous portion — eleven chapters in which Lord Shiva (Ishvara), at Badarikashrama, teaches the assembled sages the eight-fold yoga, the meaning of OM (pranava), and the non-dual identity of the Self with Brahman. It is a Shaiva companion to the Bhagavad Gita.' },
    ] },
    { title: 'व्यासगीता · The Vyasa Gita', verses: [
      { ref: 'Vyasa Gita', sa: 'आचार · धर्म · वर्णाश्रम', en: 'The Vyasa Gita sets out right conduct (achara), the duties of the stages and orders of life (varnashrama-dharma), and the disciplines of daily worship and purity.' },
    ] },
    { title: 'काशी-प्रयाग माहात्म्य · Varanasi & Prayaga', verses: [
      { ref: 'Kashi Mahatmya', sa: 'वाराणसी · प्रयाग · तीर्थ', en: 'Extended glorifications of Varanasi (Kashi), the city of Shiva, and of Prayaga at the confluence of the rivers — describing their sanctity, shrines and the liberation granted to those who dwell or die there.' },
    ] },
    { title: 'सृष्टि व मन्वन्तर · Creation & the Manvantaras', verses: [
      { ref: 'Sarga & Manvantara', sa: 'सर्ग · मन्वन्तर · देवीमाहात्म्य', en: 'Accounts of cosmic creation, the reigns of the Manus, and the greatness of Lakshmi and Parvati as the Divine Mother, along with genealogies of sages and royal houses.' },
    ] },
  ],
};

const PURAN_MATSYA: BookDoc = {
  id: 'puran-matsya',
  eyebrow: '18 महापुराण · Shaiva',
  title: 'Matsya Purana',
  hindi: 'मत्स्य\nपुराण',
  cover: 'rose',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'temple-bells',
  subtitle: 'महापुराण · शैव · ~14,000 श्लोक',
  intro: 'Told by Vishnu in his Matsya (fish) avatar to King Manu during the great deluge, this Mahapurana of roughly 14,000 verses is among the oldest of the eighteen. The fish tows Manu\'s ark to safety, preserving the seeds of all life and the Vedas across the cosmic flood. It is uniquely famed for its detailed chapters on temple architecture and Vastu Shastra, and for the Narmada Mahatmya.',
  chapters: [
    { title: 'अध्याय १ · मत्स्यावतार (Invocation)', verses: [
      { ref: 'Matsya', sa: 'श्रुतीनां यत्र कल्पादौ प्रवृत्त्यर्थं जनार्दनः ।\nमत्स्यरूपेण मनवे नरसिंहस्य वर्णनम् ॥', en: 'That in which, at the beginning of a cosmic age, Janardana (Vishnu) in the form of a fish related to Manu — for the sake of promulgating the Vedas — the account of Narasimha and the ages: this is declared the Matsya Purana. The verse by which the Purana names and defines itself.' },
    ] },
    { title: 'प्रलय व नौका · The Deluge and the Ark', verses: [
      { ref: 'Matsya Avatara', sa: 'प्रलय · मनु · वेदरक्षा', en: 'The central legend: warned of the coming flood, King Manu shelters a small fish that grows to immense size. As the waters rise, the fish tows Manu\'s boat — bearing the seeds of all beings and the Vedas — tethered by a serpent to its horn, until the deluge subsides and creation begins anew.' },
    ] },
    { title: 'सृष्टि व वंश · Creation & Dynasties', verses: [
      { ref: 'Sarga & Vamsha', sa: 'सर्ग · वंश · मन्वन्तर', en: 'Cosmogony and the genealogies of gods, sages, and the solar and lunar royal lines, including accounts of the Andhra and other dynasties and the duties of kings (rajadharma).' },
    ] },
    { title: 'देवालय व वास्तु · Temple Architecture & Vastu', verses: [
      { ref: 'Vastu Shastra', sa: 'देवालयलक्षण · वास्तुशास्त्र · प्रतिमा', en: 'The chapters for which the Purana is best known — describing about twenty styles of Hindu temple, the sacred square grids (mandalas) of building design, the making and consecration of images, and the rites of construction.' },
    ] },
    { title: 'नर्मदा माहात्म्य · The Glory of the Narmada', verses: [
      { ref: 'Narmada Mahatmya', sa: 'नर्मदा · तीर्थ · प्रयाग', en: 'The renowned Narmada Mahatmya, a pilgrim\'s guide to the shrines and sacred fords along the Narmada river, together with the glory of Prayaga and the merit of bathing at these tirthas.' },
    ] },
    { title: 'दान व व्रत · Great Gifts and Vows', verses: [
      { ref: 'Dana & Vrata', sa: 'षोडशमहादान · व्रत · श्राद्ध', en: 'A detailed treatment of religious giving — including the sixteen great gifts (shodasha-mahadana) such as the golden-embryo and cosmic-egg gifts — along with sacred vows (vratas) and the rites of ancestral offering.' },
    ] },
  ],
};

const PURAN_GARUDA: BookDoc = {
  id: 'puran-garuda',
  eyebrow: '18 महापुराण · Vaishnava',
  title: 'Garuda Purana',
  hindi: 'गरुड़\nपुराण',
  cover: 'blue',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'meditation',
  subtitle: 'महापुराण · वैष्णव · ~19,000 श्लोक',
  intro: 'A Vaishnava Mahapurana of about 19,000 verses, presented as the knowledge Vishnu imparted to his mount Garuda and retold by Suta to the sages of Naimisha. Its first part (Acara Khanda) covers Vishnu devotion, worship, cosmology, gemmology and medicine. It is most widely known for the Preta Khanda, which addresses death, the soul\'s journey and the rites for the departed — for which it is traditionally read after a death in the family.',
  chapters: [
    { title: 'अध्याय १ · मंगलाचरण (Invocation)', verses: [
      { ref: '1.1.1', sa: 'अजमजरमनन्तं ज्ञानरूपं महान्तं\nशिवममलमनादिं भूतदेहादिहीनम् ।\nसकलकरणहीनं सर्वभूतस्थितं तं\nहरिममलममायं सर्वगं वन्द एकम् ॥', en: 'Unborn, ageless, endless, the very form of knowledge, vast, auspicious, spotless, beginningless, free of elements and body, without any organs yet dwelling in all beings — that one Hari, pure, without illusion, all-pervading, I worship. The opening verse of the Garuda Purana\'s first chapter.' },
    ] },
    { title: 'विष्णुभक्ति · Worship of Vishnu', verses: [
      { ref: 'Acara Khanda', sa: 'विष्णुपूजा · अवतार · व्रत', en: 'The dialogue of Vishnu and Garuda on devotion: the forms and incarnations of the Lord, the methods of worship and installation, sacred vows and festivals, and the path of bhakti as the surest means of liberation.' },
    ] },
    { title: 'नीति व विद्या · Worldly Knowledge', verses: [
      { ref: 'Vidya', sa: 'रत्नपरीक्षा · आयुर्वेद · नीति', en: 'A remarkable compendium of practical learning — the testing of gems (ratna-pariksha), the medicine of Dhanvantari, astrology, grammar and statecraft (niti) — set within the Purana\'s devotional frame.' },
    ] },
    { title: 'प्रेतकल्प · The Preta Khanda (After Death)', verses: [
      { ref: 'Preta Khanda', sa: 'प्रेतकल्प · यमलोक · शरीरानित्यता', en: 'The Purana\'s most famous portion, read respectfully in a house of mourning. It reflects on the impermanence of the body, describes the soul\'s passage after death and the realm of Yama, and prescribes the shraddha and pinda-dana rites by which the living aid the departed toward a peaceful onward journey.' },
    ] },
    { title: 'शरीर व मोक्ष · Body, Soul and Liberation', verses: [
      { ref: 'Brahma Khanda', sa: 'आत्मज्ञान · मोक्षधर्म', en: 'Teachings on the nature of the soul, the making of the human body, and the discipline of self-knowledge that leads beyond birth and death to final release (moksha).' },
    ] },
    { title: 'सारोद्धार · The Garuda Gita', verses: [
      { ref: 'Garuda Gita', sa: 'गरुडगीता · धर्मसार', en: 'A distilled dialogue in which Vishnu answers Garuda\'s questions on the fate of the good and the wicked, the value of charity and truth, and the essence of dharma — a summary of the whole Purana\'s counsel.' },
    ] },
  ],
};

const PURAN_BRAHMANDA: BookDoc = {
  id: 'puran-brahmanda',
  eyebrow: '18 महापुराण · Shakta',
  title: 'Brahmanda Purana',
  hindi: 'ब्रह्माण्ड\nपुराण',
  cover: 'purple',
  language: ['Sanskrit', 'Hindi', 'English'],
  trackId: 'gayatri',
  subtitle: 'महापुराण · शाक्त · ~12,000 श्लोक',
  intro: 'One of the oldest Mahapuranas — about 12,000 verses named for the Brahmanda, the cosmic egg from which the universe unfolds. Narrated by Suta and arranged in four sections (Prakriya, Anushanga, Upodghata and Upasamhara), it details creation, sacred geography and the ages of the Manus. It is celebrated above all for containing the Lalita Sahasranama, the thousand names of the Goddess Lalita Tripurasundari, and it also carries the Adhyatma Ramayana.',
  chapters: [
    { title: 'अध्याय १ · मंगलाचरण (Invocation)', verses: [
      { ref: '1.1.1', sa: 'नमोनमः क्षये सृष्टौ स्थितौ सत्त्वमयाय वा ।\nनमो रजस्तमःसत्त्वत्रिरूपाय स्वयंभुवे ॥', en: 'Obeisance, obeisance to the Self-born, embodied in goodness (sattva), in dissolution, creation and sustenance; obeisance to the one of threefold nature — the qualities of rajas, tamas and sattva. The opening invocation of the Brahmanda Purana.' },
      { ref: '1.1.2', sa: 'जितं भगवता तेन हरिणा लोकधारिणा ।\nअजेन विश्वरूपेण निर्गुणेन गुणात्मना ॥', en: 'Victorious is the Lord Hari, upholder of the worlds — the unborn, of universal form, beyond the qualities yet their very soul.' },
    ] },
    { title: 'ब्रह्माण्ड · The Cosmic Egg', verses: [
      { ref: 'Prakriya Pada', sa: 'ब्रह्माण्ड · क्षेत्रज्ञ · सृष्टि', en: 'The cosmology that gives the Purana its name: from unmanifest Prakriti forms the golden Cosmic Egg (Brahmanda), within which Brahma the Field-knower (kshetrajna) awakens as the first embodied being and creation proceeds through its ordered stages.' },
    ] },
    { title: 'भुवनकोश व मन्वन्तर · Geography & the Ages', verses: [
      { ref: 'Anushanga & Upodghata', sa: 'भुवनकोश · मन्वन्तर · वंश', en: 'The description of the worlds (bhuvana-kosha) — continents, oceans and mountains — together with the reckoning of time, the reigns of the Manus, and the genealogies of gods, sages and kings.' },
    ] },
    { title: 'ललिता सहस्रनाम · Thousand Names of Lalita', verses: [
      { ref: 'Lalita Sahasranama', sa: 'श्रीमाता श्रीमहाराज्ञी श्रीमत्सिंहासनेश्वरी ।\nचिदग्निकुण्डसम्भूता देवकार्यसमुद्यता ॥', en: 'The auspicious Mother, the great Empress, sovereign of the glorious lion-throne; born from the fire-pit of pure consciousness, arisen to accomplish the work of the gods. The opening names of the celebrated Lalita Sahasranama, the thousand names of the Goddess Lalita Tripurasundari, revealed in this Purana\'s Lalitopakhyana.' },
    ] },
    { title: 'अध्यात्म रामायण · The Adhyatma Ramayana', verses: [
      { ref: 'Adhyatma Ramayana', sa: 'अध्यात्मरामायण · रामतत्त्व', en: 'Embedded within the Brahmanda Purana, the Adhyatma Ramayana retells the story of Rama as a spiritual allegory — a dialogue of Shiva and Parvati in which Rama is the supreme Brahman and Sita the divine power, teaching devotion and self-knowledge.' },
    ] },
    { title: 'भविष्य व उपसंहार · Future Ages & Conclusion', verses: [
      { ref: 'Upasamhara Pada', sa: 'भविष्यराजवंश · परशुराम · उपसंहार', en: 'The concluding section foretells the royal lines of the ages to come, recounts the deeds of Parashurama, and closes the Purana with the fruit (phala) of hearing it.' },
    ] },
  ],
};

/* register:
 *   'puran-vamana':   PURAN_VAMANA
 *   'puran-kurma':    PURAN_KURMA
 *   'puran-matsya':   PURAN_MATSYA
 *   'puran-garuda':   PURAN_GARUDA
 *   'puran-brahmanda': PURAN_BRAHMANDA
 */

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
  'hanuman-chalisa': {
    id: 'hanuman-chalisa', eyebrow: 'Tulsidas · Awadhi', title: 'Hanuman Chalisa', hindi: 'श्री हनुमान\nचालीसा', cover: 'gold',
    language: ['Hindi', 'English'], trackId: 'temple-bells',
    intro: 'Goswami Tulsidas rachit 40 chaupaiyon ka bhajan — Shri Hanuman ki stuti. Devanagari + roman + English arth, aur har chaupai ka AI se saral arth.',
    chapters: [
      { title: 'Hanuman Chalisa', verses: [
        { ref: 'चौपाई 1', sa: 'जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥', en: 'Victory to you, Hanuman, ocean of wisdom and virtue!' },
      ] },
    ],
  },
  'aarti-sangrah': {
    id: 'aarti-sangrah', eyebrow: 'भक्ति · Bhakti', title: 'Aarti Sangrah', hindi: 'आरती\nसंग्रह', cover: 'gold',
    language: ['Hindi'], trackId: 'temple-bells',
    intro: 'Sabhi pramukh Hindu devi-devताओं ki sampoorna (poori) aartiyan — Ganesh, Shiv, Vishnu, Krishna, Ram, Hanuman, Durga, Kali, Laxmi, Saraswati, Surya, Shani, Ganga, Khatu Shyam, Sai aur bahut — categories me.',
    chapters: [
      { title: 'आरतियाँ', verses: [{ ref: 'गणेश', sa: 'जय गणेश जय गणेश जय गणेश देवा।', en: '' }] },
    ],
  },
  'mantra-sangrah': {
    id: 'mantra-sangrah', eyebrow: 'भक्ति · Bhakti', title: 'Mantra Sangrah', hindi: 'मंत्र\nसंग्रह', cover: 'purple',
    language: ['Hindi', 'English'], trackId: 'gayatri',
    intro: 'Sabse mukhya, sarvमान्य mantra — Mahamrityunjaya, Gayatri, ॐ नमः शिवाय, Hare Krishna, Ganesh mool, Mahalakshmi, Shani — arth, kab v kitni baar japें, aur AI se saral samajh.',
    chapters: [
      { title: 'मंत्र', verses: [{ ref: 'महामृत्युंजय', sa: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।', en: '' }] },
    ],
  },
  'stotra-sangrah': {
    id: 'stotra-sangrah', eyebrow: 'भक्ति · Bhakti', title: 'Stotra Sangrah', hindi: 'स्तोत्र\nसंग्रह', cover: 'green',
    language: ['Hindi'], trackId: 'temple-bells',
    intro: 'Pramanik Sanskrit stotra — Sankatnashan Ganesh Stotra aadi (aur stotra source-verify karke jode ja rahe hain).',
    chapters: [
      { title: 'स्तोत्र', verses: [{ ref: 'गणेश', sa: 'प्रणम्य शिरसा देवं गौरीपुत्रं विनायकम्।', en: '' }] },
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
  'puran-brahma': PURAN_BRAHMA,
  'puran-padma': PURAN_PADMA,
  'puran-vishnu': PURAN_VISHNU,
  'puran-bhagavata': PURAN_BHAGAVATA,
  'puran-shiva': PURAN_SHIVA,
  'puran-skanda': PURAN_SKANDA,
  'puran-linga': PURAN_LINGA,
  'puran-markandeya': PURAN_MARKANDEYA,
  'puran-narada': PURAN_NARADA,
  'puran-agni': PURAN_AGNI,
  'puran-bhavishya': PURAN_BHAVISHYA,
  'puran-brahmavaivarta': PURAN_BRAHMAVAIVARTA,
  'puran-varaha': PURAN_VARAHA,
  'puran-vamana': PURAN_VAMANA,
  'puran-kurma': PURAN_KURMA,
  'puran-matsya': PURAN_MATSYA,
  'puran-garuda': PURAN_GARUDA,
  'puran-brahmanda': PURAN_BRAHMANDA,
};

export const BOOK_LIST: BookDoc[] = Object.values(BOOKS);

/** Scriptures as unified items (for grids / the "Scriptures" filter).
    subtitle advertises the chapter count so the card clearly reads as a book. */
export const SCRIPTURES: LibraryItem[] = BOOK_LIST.map((b) => ({
  id: b.id, type: 'scripture', title: b.title, hindi: b.hindi,
  // Gita + Ramayana ab dynamic reader (DB) se — poora content; baaki books static chapter count
  subtitle: b.subtitle
    ? b.subtitle
    : b.id === 'gita' ? '18 Chapters · 700 Verses'
    : b.id === 'ramayan' ? 'Sanskrit & English · 7 Kanda'
    : b.id === 'ramcharitmanas' ? 'Hindi · 7 Kand · 1074 Verses'
    : b.id === 'hanuman-chalisa' ? 'Hindi & English · 40 Chaupai · AI'
    : b.id === 'aarti-sangrah' ? 'Hindi · सभी देवी-देवता · पूर्ण आरती'
    : b.id === 'mantra-sangrah' ? 'Hindi & English · 7 मुख्य मंत्र · जाप · AI'
    : b.id === 'stotra-sangrah' ? 'Sanskrit · प्रामाणिक स्तोत्र'
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
