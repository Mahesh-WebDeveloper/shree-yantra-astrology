import type { VedicIconName } from '@/components/cosmic/VedicIcon'

export type LocalizedText = {
  en: string
  hi: string
}

export type ProductScreenId = 'home' | 'kundli' | 'choghadiya' | 'library'

export type ProductScreen = {
  id: ProductScreenId
  index: string
  icon: VedicIconName
  eyebrow: LocalizedText
  title: LocalizedText
  body: LocalizedText
  points: LocalizedText[]
}

export type FeatureJourney = {
  id: string
  index: string
  icon: VedicIconName
  eyebrow: LocalizedText
  title: LocalizedText
  body: LocalizedText
  features: LocalizedText[]
  /** Real app screenshot for this journey. */
  screenId?: import('@/data/appScreens').AppScreenId
}

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.shreeyantra.astrology'

export const PRODUCT_SCREENS: ProductScreen[] = [
  {
    id: 'home',
    index: '01',
    icon: 'rashifal',
    eyebrow: { en: 'Your daily Vedic dashboard', hi: 'आपका दैनिक वैदिक डैशबोर्ड' },
    title: {
      en: 'A calm starting point for every day.',
      hi: 'हर दिन के लिए एक सरल और शांत शुरुआत।',
    },
    body: {
      en: 'Personal rashifal, daily guidance and the most-used Vedic tools stay easy to reach without turning the home screen into a crowded marketplace.',
      hi: 'व्यक्तिगत राशिफल, दैनिक मार्गदर्शन और सबसे उपयोगी वैदिक सुविधाएँ बिना भीड़भाड़ के आसानी से मिलती हैं।',
    },
    points: [
      { en: 'Personal birth profile', hi: 'व्यक्तिगत जन्म प्रोफाइल' },
      { en: 'Hindi and English', hi: 'हिंदी और अंग्रेजी' },
      { en: 'Light and dark themes', hi: 'लाइट और डार्क थीम' },
    ],
  },
  {
    id: 'kundli',
    index: '02',
    icon: 'kundli',
    eyebrow: { en: 'Kundli and birth chart', hi: 'कुंडली और जन्म चक्र' },
    title: {
      en: 'From the first chart to deeper Jyotish layers.',
      hi: 'मूल जन्म चक्र से ज्योतिष की गहरी परतों तक।',
    },
    body: {
      en: 'Explore graha positions, divisional charts, Vimshottari Dasha, yogas, doshas, gochar, Sade Sati, life timelines and detailed Janam Patri reports.',
      hi: 'ग्रह स्थिति, वर्ग कुंडली, विंशोत्तरी दशा, योग, दोष, गोचर, साढ़े साती, जीवन समयरेखा और विस्तृत जन्म पत्री देखें।',
    },
    points: [
      { en: 'North, South and East chart styles', hi: 'उत्तर, दक्षिण और पूर्व शैली' },
      { en: 'Dasha, yoga and dosha analysis', hi: 'दशा, योग और दोष विश्लेषण' },
      { en: 'Janam Patri and Brihat Kundli PDF', hi: 'जन्म पत्री और बृहत कुंडली PDF' },
    ],
  },
  {
    id: 'choghadiya',
    index: '03',
    icon: 'panchang',
    eyebrow: { en: 'Panchang and auspicious time', hi: 'पंचांग और शुभ समय' },
    title: {
      en: 'Traditional time guidance, tuned to place.',
      hi: 'स्थान के अनुसार पारंपरिक समय मार्गदर्शन।',
    },
    body: {
      en: 'See tithi, nakshatra, yoga, karana, sunrise, sunset, festivals, Choghadiya and Shubh Muhurat in a practical daily experience.',
      hi: 'तिथि, नक्षत्र, योग, करण, सूर्योदय, सूर्यास्त, पर्व, चौघड़िया और शुभ मुहूर्त को उपयोगी दैनिक रूप में देखें।',
    },
    points: [
      { en: 'Location-aware Panchang', hi: 'स्थान आधारित पंचांग' },
      { en: 'Day and night Choghadiya', hi: 'दिन और रात का चौघड़िया' },
      { en: 'Muhurat Finder for key occasions', hi: 'मुख्य अवसरों के लिए मुहूर्त फाइंडर' },
    ],
  },
  {
    id: 'library',
    index: '04',
    icon: 'reading',
    eyebrow: { en: 'Sacred reading and listening', hi: 'दिव्य पाठ और श्रवण' },
    title: {
      en: 'A spiritual library designed for daily use.',
      hi: 'दैनिक उपयोग के लिए बना आध्यात्मिक पुस्तकालय।',
    },
    body: {
      en: 'Read and listen to the Bhagavad Gita, Ramayan, Ramcharitmanas, Vedas, Mahapuranas, Hanuman Chalisa, aartis, mantras, stotras and the daily shloka.',
      hi: 'भगवद्गीता, रामायण, रामचरितमानस, वेद, महापुराण, हनुमान चालीसा, आरती, मंत्र, स्तोत्र और दैनिक श्लोक पढ़ें और सुनें।',
    },
    points: [
      { en: 'Chapter-based reading', hi: 'अध्याय आधारित पाठ' },
      { en: 'Audio playback and progress', hi: 'ऑडियो और पाठ प्रगति' },
      { en: 'Simple meanings where available', hi: 'जहाँ उपलब्ध हो वहाँ सरल अर्थ' },
    ],
  },
]

export const FEATURE_JOURNEYS: FeatureJourney[] = [
  {
    id: 'self',
    index: '01',
    icon: 'kundli',
    screenId: 'kundli',
    eyebrow: { en: 'Understand yourself', hi: 'स्वयं को समझें' },
    title: { en: 'Your chart, explained in layers.', hi: 'आपकी कुंडली, सरल परतों में।' },
    body: {
      en: 'Start with the essentials, then move into the technical detail only when you are ready.',
      hi: 'पहले जरूरी बातें समझें, फिर अपनी सुविधा से गहरी तकनीकी जानकारी तक जाएँ।',
    },
    features: [
      { en: 'Janam Kundli', hi: 'जन्म कुंडली' },
      { en: 'Planetary positions', hi: 'ग्रह स्थिति' },
      { en: 'Divisional charts', hi: 'वर्ग कुंडली' },
      { en: 'Vimshottari Dasha', hi: 'विंशोत्तरी दशा' },
      { en: 'Yoga and Dosha', hi: 'योग और दोष' },
      { en: 'Gochar and life timeline', hi: 'गोचर और जीवन समयरेखा' },
    ],
  },
  {
    id: 'day',
    index: '02',
    icon: 'panchang',
    screenId: 'panchang',
    eyebrow: { en: 'Plan your day', hi: 'अपना दिन सँवारें' },
    title: { en: 'Know the quality of time.', hi: 'समय की प्रकृति को समझें।' },
    body: {
      en: 'Daily Vedic time tools are grouped around practical decisions instead of technical jargon.',
      hi: 'दैनिक वैदिक समय सुविधाएँ कठिन शब्दों के बजाय आपके काम और निर्णयों के अनुसार व्यवस्थित हैं।',
    },
    features: [
      { en: 'Personal Rashifal', hi: 'व्यक्तिगत राशिफल' },
      { en: 'Daily Panchang', hi: 'दैनिक पंचांग' },
      { en: 'Choghadiya', hi: 'चौघड़िया' },
      { en: 'Shubh Muhurat', hi: 'शुभ मुहूर्त' },
      { en: 'Festival details', hi: 'पर्व की जानकारी' },
      { en: 'Year transit forecast', hi: 'वार्षिक गोचर फल' },
    ],
  },
  {
    id: 'family',
    index: '03',
    icon: 'milan',
    screenId: 'milan',
    eyebrow: { en: 'Relationships and family', hi: 'संबंध और परिवार' },
    title: { en: 'Traditional tools for shared decisions.', hi: 'परिवार के निर्णयों के लिए पारंपरिक साधन।' },
    body: {
      en: 'The app keeps match scores and naming guidance readable, while preserving the underlying Vedic method.',
      hi: 'ऐप वैदिक पद्धति को बनाए रखते हुए मिलान और नामकरण को आसानी से समझने योग्य बनाता है।',
    },
    features: [
      { en: '36-guna Kundli Milan', hi: '36 गुण कुंडली मिलान' },
      { en: 'Ashtakoot breakdown', hi: 'अष्टकूट विवरण' },
      { en: 'Mangal Dosha context', hi: 'मंगल दोष संदर्भ' },
      { en: 'Nakshatra-based baby names', hi: 'नक्षत्र आधारित नामकरण' },
    ],
  },
  {
    id: 'life',
    index: '04',
    icon: 'vastu',
    screenId: 'numerology',
    eyebrow: { en: 'Home and life tools', hi: 'घर और जीवन के साधन' },
    title: { en: 'Guidance beyond the birth chart.', hi: 'जन्म कुंडली से आगे का मार्गदर्शन।' },
    body: {
      en: 'Use practical tools for Vastu review, numerology and remedies, with clear context and visual guidance.',
      hi: 'वास्तु समीक्षा, अंकशास्त्र और उपायों के लिए स्पष्ट संदर्भ और दृश्य मार्गदर्शन पाएँ।',
    },
    features: [
      { en: 'Vastu audit and zoning map', hi: 'वास्तु ऑडिट और ज़ोनिंग मानचित्र' },
      { en: 'Vastu learning guide', hi: 'वास्तु सीखने की मार्गदर्शिका' },
      { en: 'Numerology', hi: 'अंकशास्त्र' },
      { en: 'Chart-based remedies', hi: 'कुंडली आधारित उपाय' },
    ],
  },
  {
    id: 'spirit',
    index: '05',
    icon: 'reading',
    screenId: 'gita',
    eyebrow: { en: 'Spiritual practice', hi: 'आध्यात्मिक अभ्यास' },
    title: { en: 'Read, listen and return every day.', hi: 'हर दिन पढ़ें, सुनें और जुड़ें।' },
    body: {
      en: 'Sacred texts and devotional collections live in one focused library with reading and audio experiences.',
      hi: 'पवित्र ग्रंथ और भक्ति संग्रह एक केंद्रित पुस्तकालय में पाठ और ऑडियो अनुभव के साथ उपलब्ध हैं।',
    },
    features: [
      { en: 'Bhagavad Gita', hi: 'भगवद्गीता' },
      { en: 'Ramayan and Ramcharitmanas', hi: 'रामायण और रामचरितमानस' },
      { en: 'Vedas and Mahapuranas', hi: 'वेद और महापुराण' },
      { en: 'Aarti, Mantra and Stotra', hi: 'आरती, मंत्र और स्तोत्र' },
      { en: 'Hanuman Chalisa', hi: 'हनुमान चालीसा' },
      { en: 'Daily Shloka', hi: 'दैनिक श्लोक' },
    ],
  },
]

export const METHOD_POINTS: { icon: VedicIconName; title: LocalizedText; body: LocalizedText }[] = [
  {
    icon: 'kundli',
    title: { en: 'Astronomical positions first', hi: 'पहले खगोलीय ग्रह स्थिति' },
    body: {
      en: 'Birth date, exact time, place and timezone are used to calculate sidereal graha positions.',
      hi: 'जन्म तिथि, सही समय, स्थान और समय-क्षेत्र से निरयन ग्रह स्थितियों की गणना होती है।',
    },
  },
  {
    icon: 'rashifal',
    title: { en: 'Lahiri ayanamsa', hi: 'लाहिरी अयनांश' },
    body: {
      en: 'The calculation flow uses Lahiri ayanamsa and classical Jyotish rules implemented by the app.',
      hi: 'गणना में लाहिरी अयनांश और ऐप में लागू शास्त्रीय ज्योतिष नियम उपयोग होते हैं।',
    },
  },
  {
    icon: 'panchang',
    title: { en: 'Location-aware time', hi: 'स्थान आधारित समय' },
    body: {
      en: 'Panchang and Choghadiya use local sunrise and sunset for the selected place and date.',
      hi: 'पंचांग और चौघड़िया चुने हुए स्थान और तिथि के स्थानीय सूर्योदय-सूर्यास्त पर आधारित हैं।',
    },
  },
  {
    icon: 'reading',
    title: { en: 'Responsible interpretation', hi: 'जिम्मेदार व्याख्या' },
    body: {
      en: 'Interpretations are guidance, not a guarantee. Important decisions should include qualified professional advice.',
      hi: 'व्याख्याएँ मार्गदर्शन हैं, गारंटी नहीं। महत्वपूर्ण निर्णयों में योग्य विशेषज्ञ की सलाह भी लें।',
    },
  },
]

export const HOW_IT_WORKS: { n: string; title: LocalizedText; body: LocalizedText; screenId?: import('@/data/appScreens').AppScreenId }[] = [
  {
    n: '01',
    title: { en: 'Enter your details', hi: 'अपना विवरण दर्ज करें' },
    body: {
      en: 'Download the app and add your birth date, time and place once.',
      hi: 'ऐप डाउनलोड करें और जन्म तिथि, समय व स्थान एक बार जोड़ें।',
    },
    screenId: 'home',
  },
  {
    n: '02',
    title: { en: 'Explore your kundli', hi: 'अपनी कुंडली देखें' },
    body: {
      en: 'See your chart, graha positions, dasha and divisional charts.',
      hi: 'चार्ट, ग्रह स्थिति, दशा और वर्ग कुंडली देखें।',
    },
    screenId: 'kundli',
  },
  {
    n: '03',
    title: { en: 'Understand your astrology', hi: 'अपनी ज्योतिष समझें' },
    body: {
      en: 'Rashifal, panchang, AI guidance and sacred texts — all in one app.',
      hi: 'राशिफल, पंचांग, AI मार्गदर्शन और ग्रंथ — एक ऐप में।',
    },
    screenId: 'rashifal',
  },
]

export const SCROLL_SHOWCASE_COPY: Record<
  import('@/data/appScreens').AppScreenId,
  { title: LocalizedText; body: LocalizedText }
> = {
  home: {
    title: { en: 'Your daily dashboard', hi: 'आपका दैनिक डैशबोर्ड' },
    body: { en: 'Panchang, rashifal and quick access to every tool.', hi: 'पंचांग, राशिफल और हर सुविधा तक त्वरित पहुँच।' },
  },
  home_services: {
    title: { en: 'All services in one place', hi: 'सभी सेवाएँ एक जगह' },
    body: { en: 'Kundli, AI astrologer, muhurat and more from home.', hi: 'होम से कुंडली, AI, मुहूर्त और और भी।' },
  },
  choghadiya: {
    title: { en: 'Choghadiya for daily work', hi: 'दैनिक कार्य के लिए चौघड़िया' },
    body: { en: 'Know which hour is auspicious for travel, business and more.', hi: 'जानें कौन-सा समय यात्रा, व्यापार के लिए शुभ है।' },
  },
  kundli: {
    title: { en: 'Birth kundli chart', hi: 'जन्म कुंडली चार्ट' },
    body: { en: 'North, South and East Indian chart styles.', hi: 'उत्तर, दक्षिण और पूर्व भारतीय शैली।' },
  },
  kundli_hub: {
    title: { en: 'Deep kundli tools', hi: 'गहरी कुंडली सुविधाएँ' },
    body: { en: 'Milan, gochar, dasha timeline and Brihat reports.', hi: 'मिलान, गोचर, दशा और बृहत रिपोर्ट।' },
  },
  panchang: {
    title: { en: 'Location-aware panchang', hi: 'स्थान आधारित पंचांग' },
    body: { en: 'Tithi, nakshatra, yoga and sunrise for your city.', hi: 'आपके शहर के लिए तिथि, नक्षत्र, योग।' },
  },
  rashifal: {
    title: { en: 'Personal rashifal', hi: 'व्यक्तिगत राशिफल' },
    body: { en: 'Daily, weekly, monthly and yearly from your chart.', hi: 'आपकी कुंडली से दैनिक, साप्ताहिक, मासिक।' },
  },
  ai: {
    title: { en: 'AI Vedic astrologer', hi: 'AI वैदिक ज्योतिषी' },
    body: { en: 'Ask questions grounded in your birth chart data.', hi: 'जन्म कुंडली के आधार पर प्रश्न पूछें।' },
  },
  muhurat: {
    title: { en: 'Shubh muhurat finder', hi: 'शुभ मुहूर्त फाइंडर' },
    body: { en: 'Marriage, griha pravesh, vehicle and more occasions.', hi: 'विवाह, गृह प्रवेश, वाहन और अन्य अवसर।' },
  },
  muhurat_result: {
    title: { en: 'Scored muhurat results', hi: 'स्कोर किए गए मुहूर्त' },
    body: { en: 'Best dates with tithi, nakshatra and time window.', hi: 'तिथि, नक्षत्र और समय के साथ सर्वश्रेष्ठ तिथि।' },
  },
  milan: {
    title: { en: '36-guna kundli milan', hi: '36 गुण कुंडली मिलान' },
    body: { en: 'Ashtakoot matching for marriage compatibility.', hi: 'विवाह के लिए अष्टकूट मिलान।' },
  },
  gita: {
    title: { en: 'Bhagavad Gita', hi: 'भगवद्गीता' },
    body: { en: '18 chapters with audio and chapter navigation.', hi: '18 अध्याय, ऑडियो और अध्याय नेविगेशन।' },
  },
  gita_chapter: {
    title: { en: 'Verse-by-verse reading', hi: 'श्लोक-दर-श्लोक पाठ' },
    body: { en: 'Sanskrit, transliteration and Hindi meaning.', hi: 'संस्कृत, लिप्यंतरण और हिंदी अर्थ।' },
  },
  library: {
    title: { en: 'Divine library', hi: 'दिव्य पुस्तकालय' },
    body: { en: 'Aarti, mantra, stotra and audio playlists.', hi: 'आरती, मंत्र, स्तोत्र और ऑडियो।' },
  },
  vedic_reading: {
    title: { en: 'Vedic phaladesh', hi: 'वैदिक फलादेश' },
    body: { en: 'Traditional birth analysis with panchang details.', hi: 'पंचांग विवरण के साथ पारंपरिक विश्लेषण।' },
  },
  transit: {
    title: { en: 'Year-by-year transit', hi: 'साल-दर-साल गोचर' },
    body: { en: 'Saturn, Jupiter and dasha timeline on one screen.', hi: 'शनि, गुरु और दशा — एक स्क्रीन पर।' },
  },
  numerology: {
    title: { en: 'Ank Jyotish', hi: 'अंक ज्योतिष' },
    body: { en: 'Mulank, bhagyank and name number guidance.', hi: 'मूलांक, भाग्यांक और नामांक मार्गदर्शन।' },
  },
}

export const FAQ_ITEMS: { q: LocalizedText; a: LocalizedText }[] = [
  {
    q: { en: 'What is Shree Yantraa Astrology?', hi: 'श्री यंत्रा एस्ट्रोलॉजी क्या है?' },
    a: {
      en: 'It is a Vedic astrology mobile app for Android. Kundli, rashifal, panchang, muhurat, AI guidance and sacred texts live inside the app.',
      hi: 'यह Android के लिए एक वैदिक ज्योतिष मोबाइल ऐप है। कुंडली, राशिफल, पंचांग, मुहूर्त, AI और ग्रंथ ऐप के अंदर हैं।',
    },
  },
  {
    q: { en: 'Is this a Vedic astrology app?', hi: 'क्या यह वैदिक ज्योतिष ऐप है?' },
    a: {
      en: 'Yes. Calculations use Lahiri ayanamsa and classical Jyotish rules. This website only showcases the app — the full experience is on mobile.',
      hi: 'हाँ। गणना लाहिरी अयनांश और शास्त्रीय ज्योतिष नियमों पर आधारित है। यह वेबसाइट केवल झलक है — पूरा अनुभव मोबाइल पर।',
    },
  },
  {
    q: { en: 'What can I do inside the app?', hi: 'ऐप में क्या कर सकते हैं?' },
    a: {
      en: 'Create your kundli, read rashifal, check panchang and choghadiya, find muhurat, match kundlis, ask the AI astrologer, and read Gita, Ramayan, aarti and more.',
      hi: 'कुंडली बनाएँ, राशिफल पढ़ें, पंचांग/चौघड़िया देखें, मुहूर्त खोजें, मिलान करें, AI से पूछें, और गीता, रामायण, आरती पढ़ें।',
    },
  },
  {
    q: { en: 'How is my kundli calculated?', hi: 'मेरी कुंडली कैसे बनती है?' },
    a: {
      en: 'From your birth date, exact time, place and timezone using Lahiri ayanamsa and ephemeris-grade planetary positions.',
      hi: 'जन्म तिथि, सही समय, स्थान और समय-क्षेत्र से — लाहिरी अयनांश और खगोलीय ग्रह स्थिति से।',
    },
  },
  {
    q: { en: 'Does the app use real planetary positions?', hi: 'क्या ऐप वास्तविक ग्रह स्थिति उपयोग करता है?' },
    a: {
      en: 'Yes. Graha positions come from astronomical calculation, not fixed lookup tables.',
      hi: 'हाँ। ग्रह स्थिति खगोलीय गणना से आती है, तैयार तालिका से नहीं।',
    },
  },
  {
    q: { en: 'How does AI help?', hi: 'AI कैसे मदद करता है?' },
    a: {
      en: 'AI explains your chart and panchang context in simpler Hindi or English. It does not replace calculations or guarantee future events.',
      hi: 'AI आपकी कुंडली और पंचांग को सरल हिंदी/अंग्रेजी में समझाता है। यह गणना का स्थान नहीं लेता।',
    },
  },
  {
    q: { en: 'Is the app free?', hi: 'क्या ऐप मुफ़्त है?' },
    a: {
      en: 'You can start with a ₹1 trial for 7 days. Premium features unlock inside the app after subscription.',
      hi: '₹1 में 7 दिन का ट्रायल शुरू कर सकते हैं। प्रीमियम सुविधाएँ सदस्यता के बाद ऐप में खुलती हैं।',
    },
  },
  {
    q: { en: 'Which platforms are supported?', hi: 'कौन-से प्लेटफ़ॉर्म पर उपलब्ध?' },
    a: {
      en: 'Currently Android via Google Play. This website is the product showcase, not the app itself.',
      hi: 'अभी Android — Google Play पर। यह वेबसाइट ऐप का परिचय है, ऐप स्वयं नहीं।',
    },
  },
]

export const HERO_COPY = {
  eyebrow: { en: 'Vedic astrology mobile app', hi: 'वैदिक ज्योतिष मोबाइल ऐप' },
  headlineLine1: { en: 'Ancient wisdom.', hi: 'प्राचीन वैदिक ज्ञान।' },
  headlineLine2: { en: 'Modern astrology.', hi: 'आधुनिक ज्योतिष।' },
  headlineLine3: { en: 'One beautiful app.', hi: 'एक सुंदर ऐप।' },
  lead: {
    en: 'Explore your Kundli, Rashifal, Panchang, Muhurat and more through a modern Vedic astrology experience.',
    hi: 'कुंडली, राशिफल, पंचांग, मुहूर्त और अन्य सुविधाएँ — एक आधुनिक वैदिक ज्योतिष ऐप में।',
  },
  exploreCta: { en: 'Explore features', hi: 'सुविधाएँ देखें' },
  scrollCue: { en: 'Scroll to discover', hi: 'आगे देखें' },
  factAndroid: { en: 'Available on Android', hi: 'Android पर उपलब्ध' },
  factLang: { en: 'Hindi + English', hi: 'हिंदी + English' },
  factTrial: { en: '7-day trial at ₹1', hi: '₹1 में 7 दिन का ट्रायल' },
  noteKundli: { en: 'Birth-data based Kundli', hi: 'जन्म डेटा आधारित कुंडली' },
  notePanchang: { en: 'Location-aware Panchang', hi: 'स्थान आधारित पंचांग' },
}

export const BRAND_PROMISE = {
  tagline: {
    en: 'Making tradition easier to understand, not less meaningful.',
    hi: 'परंपरा को सरल बनाना, हल्का नहीं।',
  },
  items: [
    { en: 'Real planetary positions', hi: 'वास्तविक ग्रह स्थिति' },
    { en: 'Lahiri ayanamsa', hi: 'लाहिरी अयनांश' },
    { en: 'Plain-language insight', hi: 'सरल भाषा' },
    { en: 'Responsible guidance', hi: 'जिम्मेदार मार्गदर्शन' },
  ],
}

export const SACRED_LIBRARY_BOOKS = [
  { en: 'Bhagavad Gita', hi: 'भगवद्गीता' },
  { en: 'Ramayan', hi: 'रामायण' },
  { en: 'Ramcharitmanas', hi: 'रामचरितमानस' },
  { en: 'Four Vedas', hi: 'चारों वेद' },
  { en: '18 Mahapuranas', hi: '18 महापुराण' },
  { en: 'Hanuman Chalisa', hi: 'हनुमान चालीसा' },
  { en: 'Aarti Sangrah', hi: 'आरती संग्रह' },
]

export const SACRED_LIBRARY_COPY = {
  eyebrow: { en: 'Sacred library', hi: 'दिव्य पुस्तकालय' },
  headline1: { en: 'Wisdom you can ', hi: 'ज्ञान जिसे आप ' },
  headline2: { en: 'carry with you.', hi: 'साथ ले जा सकें।' },
  body: {
    en: 'Scripture, devotional reading and audio — designed for daily use on your phone.',
    hi: 'ग्रंथ, भक्ति पाठ और ऑडियो — फोन पर दैनिक उपयोग के लिए।',
  },
  verse: { en: 'Read · Listen · Reflect', hi: 'पढ़ें · सुनें · मनन करें' },
}

export const INTELLIGENCE_COPY = {
  eyebrow: { en: 'AI + Vedic context', hi: 'AI + वैदिक संदर्भ' },
  headline1: { en: 'Complex Jyotish, ', hi: 'कठिन ज्योतिष, ' },
  headline2: { en: 'explained like a conversation.', hi: 'सामान्य भाषा में।' },
  body: {
    en: 'The in-app AI astrologer uses your birth chart and panchang context to explain answers in simpler language.',
    hi: 'ऐप का AI ज्योतिषी आपकी कुंडली और पंचांग के आधार पर सरल भाषा में उत्तर देता है।',
  },
  formula1: { en: 'Vedic calculation', hi: 'वैदिक गणना' },
  formula2: { en: 'Your context', hi: 'आपका संदर्भ' },
  formula3: { en: 'Clear explanation', hi: 'सरल व्याख्या' },
  note: {
    en: 'AI does not invent planetary positions or guarantee future events.',
    hi: 'AI ग्रह स्थिति नहीं बनाता और भविष्य की गारंटी नहीं देता।',
  },
  userQuestion: {
    en: 'What does my current Dasha mean in simple words?',
    hi: 'मेरी वर्तमान दशा का सरल अर्थ क्या है?',
  },
  aiAnswer: {
    en: 'First, let us look at where the Dasha lord sits in your chart. Then I will explain the timing and guidance in simple steps.',
    hi: 'पहले आपकी कुंडली में दशा स्वामी की स्थिति देखते हैं। फिर समय और मार्गदर्शन सरल भाषा में समझाऊँगा।',
  },
  source: { en: 'Birth details + chart + Dasha data', hi: 'जन्म विवरण + कुंडली + दशा' },
  astrologerTitle: { en: 'Vedic Astrologer', hi: 'वैदिक ज्योतिषी' },
  astrologerSub: { en: 'Chart context connected', hi: 'कुंडली संदर्भ जुड़ा है' },
}

export const DOWNLOAD_FINALE_COPY = {
  eyebrow: { en: 'Available on Android', hi: 'Android पर उपलब्ध' },
  headline1: { en: "Don't just look at the stars. ", hi: 'तारों को केवल देखें नहीं। ' },
  headline2: { en: 'Understand your story.', hi: 'अपनी कहानी समझें।' },
  body: {
    en: 'Explore Vedic astrology through a modern, intelligent and beautifully designed mobile experience.',
    hi: 'वैदिक ज्योतिष को आधुनिक, स्पष्ट और सुंदर मोबाइल अनुभव में समझें।',
  },
  trial: { en: '7-day premium trial at ₹1', hi: '₹1 में 7 दिन का प्रीमियम ट्रायल' },
}

export const JOURNEYS_SECTION = {
  eyebrow: { en: 'One connected experience', hi: 'संपूर्ण ऐप' },
  headline1: { en: 'Not a pile of tools. ', hi: 'ज्योतिष सेवाएँ नहीं, ' },
  headline2: { en: 'Meaningful journeys.', hi: 'अर्थपूर्ण यात्राएँ।' },
  body: {
    en: 'Features grouped by what you want to understand or do — not by technical jargon.',
    hi: 'सुविधाएँ आपके इरादे के अनुसार — शब्दजाल के बजाय।',
  },
}

export const HOW_SECTION = {
  eyebrow: { en: 'Designed to start simply', hi: 'शुरुआत आसान' },
  headline1: { en: 'Three steps. ', hi: 'तीन चरण। ' },
  headline2: { en: 'Your complete Vedic journey.', hi: 'आपकी पूरी वैदिक यात्रा।' },
}

export const FAQ_SECTION = {
  headline: { en: 'Before you download.', hi: 'डाउनलोड करने से पहले।' },
  body: {
    en: 'This website introduces the app. Personal readings and premium tools live inside the mobile app.',
    hi: 'यह वेबसाइट ऐप का परिचय है। व्यक्तिगत रीडिंग और प्रीमियम सुविधाएँ ऐप के अंदर हैं।',
  },
}

export const METHOD_SECTION = {
  eyebrow: { en: 'Transparent methodology', hi: 'गणना में पारदर्शिता' },
  headline1: { en: 'Calculation first. ', hi: 'गणना पहले। ' },
  headline2: { en: 'Explanation second.', hi: 'व्याख्या उसके बाद।' },
  lead: {
    en: 'Shree Yantraa keeps planetary calculations distinct from interpretation — so you know what is computed and what is guidance.',
    hi: 'श्री यंत्रा ग्रह गणना और व्याख्या को अलग रखता है — ताकि आप समझ सकें क्या गणना है और क्या मार्गदर्शन।',
  },
  sunLabel: { en: 'Sun', hi: 'सूर्य' },
  longitude: { en: 'longitude', hi: 'ग्रह देशांतर' },
  timezone: { en: 'timezone', hi: 'समय क्षेत्र' },
}
