// ── Muhurat (auspicious-timing) rule catalog ─────────────────────────────────
// Classical Muhurta-Shastra rules (Panchang 5-anga + nakshatra/tithi/vaar suitability)
// used to SCORE each candidate day. These are deterministic filters — the actual
// tithi/nakshatra/yoga/karana/Rahu-Kaal for a day come from our astronomy engine
// (vedastro.service.getPanchang), so nothing here is guessed at runtime.
//
// Tithi numbers below are the in-paksha number 1..15 (Pratipada=1 … Purnima=15;
// Amavasya handled separately). Vaar: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat.
// Nakshatra names match NAKSHATRA[] in vedastro.service.

// Universally inauspicious tithis for starting auspicious work: Rikta (4,9,14).
const RIKTA = [4, 9, 14];
// Generally auspicious tithis (Shukla-leaning): 2,3,5,7,10,11,13 (+1,6,12 ok).
const GOOD_TITHIS = [1, 2, 3, 5, 7, 10, 11, 12, 13];
// Soft/benefic weekdays for most muhurats: Mon, Wed, Thu, Fri.
const GOOD_VAARS = [1, 3, 4, 5];

const cat = (o) => ({
  goodTithis: GOOD_TITHIS,
  riktaTithis: RIKTA,
  goodVaars: GOOD_VAARS,
  avoidAmavasya: true,
  avoidPurnima: false,
  avoidBhadra: true,
  avoidPanchak: false,
  nameBased: true,
  // Dynamic form contract → frontend shows exactly these inputs.
  // location + month are ALWAYS required. name/birth: 'none' | 'optional' | 'required'.
  requires: { name: 'optional', birth: 'optional', couple: false },
  ...o,
});

// Standard auspicious nakshatra pools (English names per vedastro NAKSHATRA[]).
const N = {
  movableGood: ['Punarvasu', 'Swati', 'Shravana', 'Dhanishtha', 'Shatabhisha'],
  fixedGood: ['Rohini', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada'],
  lightGood: ['Ashwini', 'Pushya', 'Hasta', 'Magha', 'Mrigashira'],
  softGood: ['Chitra', 'Anuradha', 'Revati'],
};
const pool = (...keys) => Array.from(new Set(keys.flatMap((k) => N[k] || [k])));

const MUHURAT_CATEGORIES = [
  // ── Property & home ──────────────────────────────────────────────────────
  cat({
    key: 'griha-pravesh', group: 'property', emoji: '🏠', art: 'home',
    name: { en: 'Griha Pravesh', hi: 'गृह प्रवेश' },
    blurb: { en: 'Entering & living in a new home', hi: 'नए घर में प्रवेश व निवास' },
    goodNakshatras: ['Rohini', 'Mrigashira', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Anuradha', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Revati', 'Shravana', 'Shatabhisha'],
    goodTithis: [2, 3, 5, 6, 7, 10, 11, 13],
    avoidPanchak: true, avoidPurnima: true,
    bestLagna: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'],
    why: { en: 'A favourable Griha Pravesh brings peace, stability and prosperity to the new home.', hi: 'शुभ गृह-प्रवेश नए घर में शांति, स्थिरता और समृद्धि लाता है।' },
  }),
  cat({
    key: 'bhoomi-pujan', group: 'property', emoji: '🧱', art: 'foundation',
    name: { en: 'Bhoomi Pujan', hi: 'भूमि पूजन' },
    blurb: { en: 'Foundation laying / start of construction', hi: 'नींव पूजन / निर्माण आरंभ' },
    goodNakshatras: ['Rohini', 'Mrigashira', 'Pushya', 'Hasta', 'Chitra', 'Anuradha', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Dhanishtha', 'Shatabhisha'],
    avoidPanchak: true,
    why: { en: 'A strong foundation muhurat supports a safe, well-built and lasting structure.', hi: 'शुभ भूमि-पूजन सुरक्षित, मजबूत और टिकाऊ निर्माण का आधार बनाता है।' },
  }),
  cat({
    key: 'property-buy', group: 'property', emoji: '📜', art: 'deed',
    name: { en: 'Property / Registry', hi: 'संपत्ति / रजिस्ट्री' },
    blurb: { en: 'Buying land or property, registration', hi: 'ज़मीन/संपत्ति खरीद व रजिस्ट्री' },
    goodNakshatras: pool('fixedGood', 'Rohini', 'Pushya', 'Hasta', 'Chitra', 'Anuradha', 'Dhanishtha', 'Shatabhisha'),
    why: { en: 'Buying property at a favourable time supports a secure, dispute-free asset.', hi: 'शुभ समय में संपत्ति खरीद सुरक्षित व विवाद-रहित स्वामित्व में सहायक होती है।' },
  }),
  cat({
    key: 'vehicle', group: 'property', emoji: '🚗', art: 'vehicle',
    name: { en: 'Vehicle Purchase', hi: 'वाहन खरीद' },
    blurb: { en: 'New car / bike delivery & first puja', hi: 'नई कार/बाइक डिलीवरी व पूजा' },
    goodNakshatras: pool('lightGood', 'movableGood', 'softGood', 'fixedGood'),
    why: { en: 'A favourable vehicle muhurat is chosen for safety and smooth journeys.', hi: 'शुभ वाहन-मुहूर्त सुरक्षा और सुगम यात्राओं के लिए चुना जाता है।' },
  }),

  // ── Family & samskaras ───────────────────────────────────────────────────
  cat({
    key: 'vivah', group: 'family', emoji: '💍', art: 'marriage',
    name: { en: 'Marriage (Vivah)', hi: 'विवाह' },
    blurb: { en: 'Wedding — start of married life', hi: 'विवाह — नए जीवन की शुरुआत' },
    goodNakshatras: ['Rohini', 'Mrigashira', 'Magha', 'Uttara Phalguni', 'Hasta', 'Swati', 'Anuradha', 'Mula', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Revati'],
    goodTithis: [2, 3, 5, 7, 10, 11, 13],
    avoidPurnima: false, nameBased: false,
    requires: { name: 'none', birth: 'required', couple: true },
    why: { en: 'Vivah muhurat aligns tithi, nakshatra and lagna for a harmonious married life. Needs both bride & groom birth details.', hi: 'विवाह-मुहूर्त सुखी दाम्पत्य हेतु तिथि, नक्षत्र व लग्न का मेल देखता है। वर-वधू दोनों के जन्म विवरण चाहिए।' },
  }),
  cat({
    key: 'sagai', group: 'family', emoji: '💐', art: 'engagement',
    name: { en: 'Engagement (Sagai)', hi: 'सगाई / रोका' },
    blurb: { en: 'Fixing the alliance', hi: 'रिश्ता तय करना' },
    goodNakshatras: pool('lightGood', 'softGood', 'fixedGood', 'Swati', 'Mrigashira'),
    requires: { name: 'optional', birth: 'optional', couple: true },
    why: { en: 'An auspicious engagement time blesses the new relationship.', hi: 'शुभ सगाई-समय नए रिश्ते को शुभता देता है।' },
  }),
  cat({
    key: 'namkaran', group: 'family', emoji: '👶', art: 'baby',
    name: { en: 'Naamkaran', hi: 'नामकरण संस्कार' },
    blurb: { en: 'Naming ceremony of a newborn', hi: 'नवजात का नामकरण' },
    goodNakshatras: pool('lightGood', 'movableGood', 'softGood', 'fixedGood', 'Punarvasu'),
    nameBased: false, requires: { name: 'none', birth: 'required', couple: false },
    why: { en: 'Naamkaran uses the baby’s birth details (name is being decided), on a favourable star for good fortune.', hi: 'नामकरण शिशु के जन्म विवरण से देखा जाता है (नाम अभी रखना है), शुभ नक्षत्र में सौभाग्य हेतु।' },
  }),
  cat({
    key: 'mundan', group: 'family', emoji: '✂️', art: 'mundan',
    name: { en: 'Mundan', hi: 'मुंडन संस्कार' },
    blurb: { en: 'First hair-cutting ceremony', hi: 'पहली बार बाल उतारना' },
    goodNakshatras: ['Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Chitra', 'Swati', 'Jyeshtha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Revati'],
    avoidPanchak: true, nameBased: false, requires: { name: 'none', birth: 'required', couple: false },
    why: { en: 'Mundan on a suitable nakshatra is traditionally chosen for the child’s health.', hi: 'उपयुक्त नक्षत्र में मुंडन शिशु के स्वास्थ्य हेतु शुभ माना जाता है।' },
  }),
  cat({
    key: 'annaprashan', group: 'family', emoji: '🥣', art: 'baby',
    name: { en: 'Annaprashan', hi: 'अन्नप्राशन' },
    blurb: { en: 'Baby’s first solid food', hi: 'शिशु का पहला अन्न' },
    goodNakshatras: pool('lightGood', 'movableGood', 'softGood', 'fixedGood', 'Punarvasu'),
    nameBased: false, requires: { name: 'none', birth: 'required', couple: false },
    why: { en: 'Annaprashan on a benefic star supports the child’s health and nourishment.', hi: 'शुभ नक्षत्र में अन्नप्राशन शिशु के स्वास्थ्य व पोषण हेतु शुभ है।' },
  }),

  // ── Education & career ───────────────────────────────────────────────────
  cat({
    key: 'vidyarambh', group: 'career', emoji: '📖', art: 'study',
    name: { en: 'Vidyarambh', hi: 'विद्यारंभ' },
    blurb: { en: 'Beginning of formal education', hi: 'शिक्षा का शुभारंभ' },
    goodNakshatras: ['Ashwini', 'Punarvasu', 'Pushya', 'Hasta', 'Chitra', 'Swati', 'Anuradha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Revati', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada'],
    why: { en: 'Starting learning under a Saraswati-friendly star supports sharp study.', hi: 'सरस्वती-अनुकूल नक्षत्र में पढ़ाई आरंभ तेज़ बुद्धि में सहायक है।' },
  }),
  cat({
    key: 'naukari', group: 'career', emoji: '💼', art: 'job',
    name: { en: 'New Job Joining', hi: 'नई नौकरी' },
    blurb: { en: 'Joining a new job / office', hi: 'नई नौकरी ज्वॉइन करना' },
    goodNakshatras: pool('fixedGood', 'lightGood', 'Anuradha', 'Chitra', 'Shravana', 'Swati'),
    why: { en: 'Joining on a steady, benefic star supports growth and stability at work.', hi: 'स्थिर शुभ नक्षत्र में ज्वॉइनिंग करियर की वृद्धि व स्थिरता में सहायक है।' },
  }),
  cat({
    key: 'vyapar', group: 'career', emoji: '🏪', art: 'shop',
    name: { en: 'Business / Shop Opening', hi: 'व्यापार / दुकान आरंभ' },
    blurb: { en: 'Starting a business or opening a shop', hi: 'व्यापार आरंभ या दुकान उद्घाटन' },
    goodNakshatras: ['Ashwini', 'Pushya', 'Hasta', 'Chitra', 'Swati', 'Anuradha', 'Shravana', 'Dhanishtha', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Rohini'],
    goodVaars: [1, 3, 4, 5, 0],
    why: { en: 'An auspicious launch supports profit, reputation and steady growth.', hi: 'शुभ आरंभ लाभ, प्रतिष्ठा और निरंतर वृद्धि में सहायक है।' },
  }),
  cat({
    key: 'office', group: 'career', emoji: '🏢', art: 'office',
    name: { en: 'Office Opening', hi: 'ऑफिस आरंभ' },
    blurb: { en: 'New office inauguration', hi: 'नए कार्यालय का उद्घाटन' },
    goodNakshatras: pool('fixedGood', 'lightGood', 'Anuradha', 'Chitra', 'Swati', 'Dhanishtha'),
    goodVaars: [1, 3, 4, 5],
    why: { en: 'Opening an office at a steady, benefic time supports growth and teamwork.', hi: 'स्थिर शुभ समय में ऑफिस आरंभ वृद्धि व सहयोग में सहायक है।' },
  }),

  // ── Finance & spiritual ──────────────────────────────────────────────────
  cat({
    key: 'dhan-nivesh', group: 'finance', emoji: '💰', art: 'wealth',
    name: { en: 'Buying Gold / Investment', hi: 'सोना खरीद / निवेश' },
    blurb: { en: 'Gold, valuables & new investments', hi: 'सोना, मूल्यवान वस्तु व निवेश' },
    goodNakshatras: ['Ashwini', 'Rohini', 'Pushya', 'Hasta', 'Chitra', 'Swati', 'Anuradha', 'Shravana', 'Dhanishtha', 'Revati', 'Uttara Phalguni', 'Uttara Ashadha', 'Uttara Bhadrapada'],
    goodVaars: [1, 3, 4, 5, 0],
    why: { en: 'Buying or investing at a wealth-friendly time is believed to grow “akshaya” (never-decreasing) prosperity.', hi: 'धन-अनुकूल समय में खरीद/निवेश “अक्षय” समृद्धि का प्रतीक माना जाता है।' },
  }),
  cat({
    key: 'puja', group: 'spiritual', emoji: '🪔', art: 'puja',
    name: { en: 'Puja / Anushthan', hi: 'पूजा / अनुष्ठान' },
    blurb: { en: 'Satyanarayan, havan, griha-shanti', hi: 'सत्यनारायण, हवन, गृह-शांति' },
    goodNakshatras: pool('lightGood', 'fixedGood', 'softGood', 'Punarvasu', 'Shravana'),
    avoidPurnima: false,
    why: { en: 'A pure, benefic window deepens the merit of worship and rituals.', hi: 'शुद्ध शुभ समय पूजा-अनुष्ठान का पुण्य बढ़ाता है।' },
  }),
  cat({
    key: 'murti-sthapana', group: 'spiritual', emoji: '🛕', art: 'temple',
    name: { en: 'Murti Sthapana', hi: 'मूर्ति स्थापना' },
    blurb: { en: 'Installing a deity / pran pratishtha', hi: 'देव-प्रतिमा / प्राण प्रतिष्ठा' },
    goodNakshatras: pool('fixedGood', 'lightGood', 'softGood', 'Punarvasu', 'Shravana', 'Rohini'),
    why: { en: 'Pran-pratishtha on a sattvic, fixed star anchors lasting divine presence.', hi: 'सात्विक स्थिर नक्षत्र में प्राण-प्रतिष्ठा स्थायी दिव्यता का आधार है।' },
  }),
  cat({
    key: 'yagya', group: 'spiritual', emoji: '🔥', art: 'havan',
    name: { en: 'Yagya / Havan', hi: 'यज्ञ / हवन' },
    blurb: { en: 'Fire ritual, griha-shanti', hi: 'हवन, गृह-शांति' },
    goodNakshatras: pool('lightGood', 'fixedGood', 'Pushya', 'Punarvasu', 'Anuradha', 'Shravana'),
    why: { en: 'A benefic window strengthens the sankalp and merit of the fire ritual.', hi: 'शुभ समय हवन के संकल्प व पुण्य को बल देता है।' },
  }),
];

const CATEGORY_BY_KEY = MUHURAT_CATEGORIES.reduce((a, c) => { a[c.key] = c; return a; }, {});

module.exports = { MUHURAT_CATEGORIES, CATEGORY_BY_KEY, GOOD_TITHIS, RIKTA, GOOD_VAARS };
