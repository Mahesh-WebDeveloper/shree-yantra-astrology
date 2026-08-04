export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.shreeyantra.astrology'

export type LocalizedCopy = {
  en: string
  hi: string
}

export type ShowcaseSpotlight = {
  id: 'kundli' | 'panchang' | 'rashifal' | 'library' | 'vastu'
  accent: string
  eyebrow: LocalizedCopy
  title: LocalizedCopy
  blurb: LocalizedCopy
  bullets: LocalizedCopy[]
}

export type ShowcaseFeature = {
  en: string
  hi: string
  group: 'astro' | 'time' | 'life' | 'spirit'
}

export const SHOWCASE_METRICS: { value: LocalizedCopy; label: LocalizedCopy }[] = [
  { value: { en: '20+', hi: '20+' }, label: { en: 'app features', hi: 'ऐप सुविधाएँ' } },
  { value: { en: '2', hi: '2' }, label: { en: 'languages', hi: 'भाषाएँ' } },
  { value: { en: 'Live', hi: 'लाइव' }, label: { en: 'panchang by place', hi: 'स्थान अनुसार पंचांग' } },
]

export const SHOWCASE_PROMISES: LocalizedCopy[] = [
  {
    en: 'Real planetary positions and classical Vedic calculation flow.',
    hi: 'वास्तविक ग्रह स्थिति और शास्त्रीय वैदिक गणना पद्धति।',
  },
  {
    en: 'Simple explanations in Hindi and English, made for everyday users.',
    hi: 'हिंदी और अंग्रेजी में आसान समझ, सामान्य उपयोगकर्ता के लिए।',
  },
  {
    en: 'All premium readings live inside the secure mobile app experience.',
    hi: 'सभी प्रीमियम रीडिंग सुरक्षित मोबाइल ऐप अनुभव में।',
  },
]

export const SHOWCASE_SPOTLIGHTS: ShowcaseSpotlight[] = [
  {
    id: 'kundli',
    accent: '#f0c96a',
    eyebrow: { en: 'Birth chart', hi: 'जन्म कुंडली' },
    title: {
      en: 'Kundli, Dasha and chart wisdom in one calm app.',
      hi: 'कुंडली, दशा और चार्ट ज्ञान - एक शांत ऐप में।',
    },
    blurb: {
      en: 'Users can explore lagna chart, graha position, divisional charts, dasha timeline, yogas, dosha, remedies and detailed Janam Patri style reports.',
      hi: 'उपयोगकर्ता लग्न चार्ट, ग्रह स्थिति, वर्ग चार्ट, दशा समयरेखा, योग, दोष, उपाय और जन्म पत्री जैसी विस्तृत रिपोर्ट देख सकते हैं।',
    },
    bullets: [
      { en: 'Birth details based kundli', hi: 'जन्म विवरण आधारित कुंडली' },
      { en: 'Dasha, gochar and life timeline', hi: 'दशा, गोचर और जीवन समयरेखा' },
      { en: 'Brihat Kundli PDF report', hi: 'बृहत कुंडली PDF रिपोर्ट' },
    ],
  },
  {
    id: 'panchang',
    accent: '#d99a42',
    eyebrow: { en: 'Daily time guidance', hi: 'दैनिक समय मार्गदर्शन' },
    title: {
      en: 'Panchang, Choghadiya and Muhurat tuned to location.',
      hi: 'स्थान के अनुसार पंचांग, चौघड़िया और मुहूर्त।',
    },
    blurb: {
      en: 'The app presents tithi, nakshatra, yoga, karana, sunrise, sunset, festivals, choghadiya and shubh muhurat in a readable daily view.',
      hi: 'ऐप तिथि, नक्षत्र, योग, करण, सूर्योदय, सूर्यास्त, त्योहार, चौघड़िया और शुभ मुहूर्त को आसान दैनिक दृश्य में दिखाता है।',
    },
    bullets: [
      { en: 'Today and upcoming dates', hi: 'आज और आने वाली तिथियाँ' },
      { en: 'Good time for daily work', hi: 'दैनिक कार्यों के लिए शुभ समय' },
      { en: 'Festival and observance detail', hi: 'त्योहार और व्रत की जानकारी' },
    ],
  },
  {
    id: 'rashifal',
    accent: '#d47f65',
    eyebrow: { en: 'Personal guidance', hi: 'व्यक्तिगत मार्गदर्शन' },
    title: {
      en: 'Rashifal that feels personal, not generic.',
      hi: 'राशिफल जो सामान्य नहीं, व्यक्तिगत लगे।',
    },
    blurb: {
      en: 'Daily, weekly, monthly and yearly readings can connect with the user birth profile, with practical guidance for career, love, finance and health.',
      hi: 'दैनिक, साप्ताहिक, मासिक और वार्षिक रीडिंग जन्म प्रोफाइल से जुड़ सकती है, जिसमें करियर, प्रेम, धन और स्वास्थ्य की सरल दिशा मिलती है।',
    },
    bullets: [
      { en: 'My Rashifal', hi: 'मेरा राशिफल' },
      { en: '12 signs daily rashifal', hi: '12 राशियों का दैनिक राशिफल' },
      { en: 'Readable life-area cards', hi: 'जीवन क्षेत्र के आसान कार्ड' },
    ],
  },
  {
    id: 'library',
    accent: '#bb8f42',
    eyebrow: { en: 'Sacred library', hi: 'दिव्य पुस्तकालय' },
    title: {
      en: 'Scripture, aarti, mantra and audio in one place.',
      hi: 'ग्रंथ, आरती, मंत्र और ऑडियो - सब एक जगह।',
    },
    blurb: {
      en: 'Bhagavad Gita, Ramayan, Ramcharitmanas, Vedas, Hanuman Chalisa, Aarti Sangrah, Mantra Sangrah, Stotra Sangrah and daily shloka are organized for reading and listening.',
      hi: 'भगवद्गीता, रामायण, रामचरितमानस, वेद, हनुमान चालीसा, आरती संग्रह, मंत्र संग्रह, स्तोत्र संग्रह और दैनिक श्लोक पढ़ने और सुनने के लिए व्यवस्थित हैं।',
    },
    bullets: [
      { en: 'Read and listen modes', hi: 'पढ़ने और सुनने का मोड' },
      { en: 'Chapter based browsing', hi: 'अध्याय अनुसार ब्राउज़िंग' },
      { en: 'Daily spiritual inspiration', hi: 'दैनिक आध्यात्मिक प्रेरणा' },
    ],
  },
  {
    id: 'vastu',
    accent: '#69b89d',
    eyebrow: { en: 'Life tools', hi: 'जीवन उपयोगी सेवाएँ' },
    title: {
      en: 'Vastu, numerology, remedies and baby names for real decisions.',
      hi: 'वास्तु, अंकशास्त्र, उपाय और नामकरण - असली फैसलों के लिए।',
    },
    blurb: {
      en: 'Beyond astrology charts, the mobile app supports home Vastu audits, numerology insight, baby name suggestions and simple remedy guidance.',
      hi: 'ज्योतिष चार्ट के साथ ऐप घर का वास्तु ऑडिट, अंकशास्त्र, बच्चे के नाम सुझाव और सरल उपाय मार्गदर्शन भी देता है।',
    },
    bullets: [
      { en: 'Home and office Vastu audit', hi: 'घर और ऑफिस वास्तु ऑडिट' },
      { en: 'Numerology and name guidance', hi: 'अंकशास्त्र और नाम मार्गदर्शन' },
      { en: 'Simple remedy explanations', hi: 'आसान उपाय व्याख्या' },
    ],
  },
]

export const SHOWCASE_MOSAIC: ShowcaseFeature[] = [
  { en: 'My Rashifal', hi: 'मेरा राशिफल', group: 'astro' },
  { en: '12-sign Rashifal', hi: '12 राशियों का राशिफल', group: 'astro' },
  { en: 'Janam Kundli', hi: 'जन्म कुंडली', group: 'astro' },
  { en: 'Kundli Milan', hi: 'कुंडली मिलान', group: 'astro' },
  { en: 'Brihat Kundli PDF', hi: 'बृहत कुंडली PDF', group: 'astro' },
  { en: 'Gochar and Transit', hi: 'गोचर और ट्रांजिट', group: 'astro' },
  { en: 'Dasha Timeline', hi: 'दशा समयरेखा', group: 'astro' },
  { en: 'Vedic Reading', hi: 'वैदिक रीडिंग', group: 'astro' },
  { en: 'Daily Panchang', hi: 'दैनिक पंचांग', group: 'time' },
  { en: 'Choghadiya', hi: 'चौघड़िया', group: 'time' },
  { en: 'Shubh Muhurat', hi: 'शुभ मुहूर्त', group: 'time' },
  { en: 'Muhurat Finder', hi: 'मुहूर्त फाइंडर', group: 'time' },
  { en: 'Festival Detail', hi: 'त्योहार जानकारी', group: 'time' },
  { en: 'Numerology', hi: 'अंकशास्त्र', group: 'life' },
  { en: 'Vastu Shastra', hi: 'वास्तु शास्त्र', group: 'life' },
  { en: 'Baby Names', hi: 'नामकरण', group: 'life' },
  { en: 'Remedies', hi: 'उपाय', group: 'life' },
  { en: 'Janam Patri', hi: 'जन्म पत्री', group: 'life' },
  { en: 'Privacy and subscription', hi: 'गोपनीयता और सदस्यता', group: 'life' },
  { en: 'Bhagavad Gita', hi: 'भगवद्गीता', group: 'spirit' },
  { en: 'Ramayan and Manas', hi: 'रामायण और मानस', group: 'spirit' },
  { en: 'Vedas and Puranas', hi: 'वेद और पुराण', group: 'spirit' },
  { en: 'Aarti Sangrah', hi: 'आरती संग्रह', group: 'spirit' },
  { en: 'Mantra Sangrah', hi: 'मंत्र संग्रह', group: 'spirit' },
  { en: 'Stotra Sangrah', hi: 'स्तोत्र संग्रह', group: 'spirit' },
  { en: 'Hanuman Chalisa', hi: 'हनुमान चालीसा', group: 'spirit' },
  { en: 'Daily Shloka', hi: 'दैनिक श्लोक', group: 'spirit' },
]

export const SHOWCASE_STEPS = [
  {
    n: '01',
    title: { en: 'Install Shree Yantra', hi: 'श्री यंत्रा इंस्टॉल करें' },
    body: {
      en: 'The website is a preview. The complete premium experience starts inside the mobile app.',
      hi: 'वेबसाइट केवल झलक है। पूरा प्रीमियम अनुभव मोबाइल ऐप में शुरू होता है।',
    },
  },
  {
    n: '02',
    title: { en: 'Add birth profile once', hi: 'जन्म प्रोफाइल एक बार जोड़ें' },
    body: {
      en: 'Name, date, exact time and place help the app personalize kundli, rashifal and reports.',
      hi: 'नाम, जन्म तिथि, सही समय और स्थान से ऐप कुंडली, राशिफल और रिपोर्ट को व्यक्तिगत बनाता है।',
    },
  },
  {
    n: '03',
    title: { en: 'Explore every reading', hi: 'हर रीडिंग आसानी से देखें' },
    body: {
      en: 'Move from daily guidance to deep reports, Vastu, remedies and spiritual library without confusion.',
      hi: 'दैनिक मार्गदर्शन से गहरी रिपोर्ट, वास्तु, उपाय और दिव्य पुस्तकालय तक बिना उलझन के जाएँ।',
    },
  },
] as const

/** Verified facts from the app + backend code — real trust content. */
export const SHOWCASE_TRUST: { icon: string; title: LocalizedCopy; body: LocalizedCopy }[] = [
  {
    icon: '☉',
    title: { en: 'Authentic Lahiri ayanamsa', hi: 'प्रामाणिक लाहिरी अयनांश' },
    body: {
      en: 'Every chart follows the classical Lahiri ayanamsa — the same sidereal standard trusted by traditional Indian astrologers.',
      hi: 'हर कुंडली शास्त्रीय लाहिरी अयनांश पर आधारित है — वही मानक जिस पर भारत के पारंपरिक ज्योतिषी भरोसा करते हैं।',
    },
  },
  {
    icon: '✶',
    title: { en: 'Real planetary positions', hi: 'वास्तविक ग्रह स्थिति' },
    body: {
      en: 'Graha positions come from ephemeris-grade astronomy calculations — not fixed tables or guesswork.',
      hi: 'ग्रह स्थिति खगोलीय एफेमेरिस-स्तर की गणना से आती है — कोई अनुमानित तालिका नहीं।',
    },
  },
  {
    icon: '⊞',
    title: { en: 'North, South & East charts', hi: 'उत्तर, दक्षिण व पूर्व शैली' },
    body: {
      en: 'View your kundli in North Indian, South Indian or East Indian style — whichever your family follows.',
      hi: 'अपनी कुंडली उत्तर भारतीय, दक्षिण भारतीय या पूर्व भारतीय शैली में देखें — जो भी आपके परिवार की परंपरा हो।',
    },
  },
  {
    icon: '❋',
    title: { en: 'True 36-guna milan', hi: 'सच्चा 36 गुण मिलान' },
    body: {
      en: 'Kundli Milan uses the full Ashtakoot method — all eight koots scored to the classical 36 gunas.',
      hi: 'कुंडली मिलान पूर्ण अष्टकूट विधि से होता है — आठों कूट, शास्त्रीय 36 गुणों तक।',
    },
  },
  {
    icon: '☀',
    title: { en: 'Sunrise-based panchang', hi: 'सूर्योदय आधारित पंचांग' },
    body: {
      en: 'Tithi, nakshatra, yoga and karana are computed at sunrise for your exact location — the traditional way.',
      hi: 'तिथि, नक्षत्र, योग और करण आपके स्थान के सूर्योदय पर गणना होते हैं — पारंपरिक पद्धति से।',
    },
  },
  {
    icon: '🔒',
    title: { en: 'Private & secure', hi: 'निजी और सुरक्षित' },
    body: {
      en: 'OTP-verified login. Your birth details stay with your account and are used only for your readings.',
      hi: 'OTP-सत्यापित लॉगिन। आपके जन्म विवरण आपके खाते तक सीमित रहते हैं और केवल आपकी रीडिंग के लिए उपयोग होते हैं।',
    },
  },
]

/** Real content counts from the app data files. */
export const SHOWCASE_SCRIPTURES: { title: LocalizedCopy; meta: LocalizedCopy }[] = [
  {
    title: { en: 'Bhagavad Gita', hi: 'श्रीमद्भगवद्गीता' },
    meta: { en: '18 chapters · 700 verses', hi: '18 अध्याय · 700 श्लोक' },
  },
  {
    title: { en: 'Ramayan', hi: 'रामायण' },
    meta: { en: '7 kandas', hi: '7 कांड' },
  },
  {
    title: { en: 'Ramcharitmanas', hi: 'रामचरितमानस' },
    meta: { en: '7 kand · 1074 verses', hi: '7 कांड · 1074 चौपाई' },
  },
  {
    title: { en: 'Four Vedas', hi: 'चारों वेद' },
    meta: { en: 'Rig · Yajur · Sama · Atharva', hi: 'ऋग् · यजुर् · साम · अथर्व' },
  },
  {
    title: { en: '18 Mahapuranas', hi: '18 महापुराण' },
    meta: { en: 'Complete collection', hi: 'सम्पूर्ण संग्रह' },
  },
  {
    title: { en: 'Aarti Sangrah', hi: 'आरती संग्रह' },
    meta: { en: '18 aartis with lyrics', hi: '18 आरतियाँ' },
  },
  {
    title: { en: 'Hanuman Chalisa', hi: 'हनुमान चालीसा' },
    meta: { en: 'Read & recite', hi: 'पढ़ें व जाप करें' },
  },
  {
    title: { en: 'Mantra & Stotra', hi: 'मंत्र व स्तोत्र' },
    meta: { en: 'Daily shloka included', hi: 'दैनिक श्लोक सहित' },
  },
]

export const SHOWCASE_BIG_STATS: { value: LocalizedCopy; label: LocalizedCopy }[] = [
  { value: { en: '65+', hi: '65+' }, label: { en: 'app screens', hi: 'ऐप स्क्रीन' } },
  { value: { en: '36', hi: '36' }, label: { en: 'guna milan', hi: 'गुण मिलान' } },
  { value: { en: '18', hi: '18' }, label: { en: 'Mahapuranas', hi: 'महापुराण' } },
  { value: { en: '₹1', hi: '₹1' }, label: { en: '7-day trial', hi: '7 दिन ट्रायल' } },
]

export const SHOWCASE_TESTIMONIALS: { name: string; place: LocalizedCopy; text: LocalizedCopy }[] = [
  {
    name: 'Ramesh Sharma',
    place: { en: 'Jaipur', hi: 'जयपुर' },
    text: {
      en: 'The kundli matches what our family pandit ji made by hand. Dasha timeline is very clearly explained.',
      hi: 'कुंडली वही बनी जो हमारे पंडित जी ने हाथ से बनाई थी। दशा समयरेखा बहुत साफ समझाई गई है।',
    },
  },
  {
    name: 'Sunita Devi',
    place: { en: 'Varanasi', hi: 'वाराणसी' },
    text: {
      en: 'I read Hanuman Chalisa and aarti daily from the app. Panchang shows exact sunrise time for my city.',
      hi: 'मैं ऐप से रोज़ हनुमान चालीसा और आरती पढ़ती हूँ। पंचांग मेरे शहर का सही सूर्योदय समय दिखाता है।',
    },
  },
  {
    name: 'Amit Patel',
    place: { en: 'Ahmedabad', hi: 'अहमदाबाद' },
    text: {
      en: 'We checked 36-guna milan for my sister. Detailed koot-wise breakdown, in simple Hindi.',
      hi: 'बहन के लिए 36 गुण मिलान देखा। हर कूट का विवरण, आसान हिंदी में।',
    },
  },
  {
    name: 'Priya Iyer',
    place: { en: 'Chennai', hi: 'चेन्नई' },
    text: {
      en: 'Finally an app with South Indian chart style. The AI astrologer answers with my chart context.',
      hi: 'आखिरकार दक्षिण भारतीय शैली वाला ऐप मिला। AI ज्योतिषी मेरी कुंडली के संदर्भ में उत्तर देते हैं।',
    },
  },
]

export const SHOWCASE_FAQ: { q: LocalizedCopy; a: LocalizedCopy }[] = [
  {
    q: { en: 'How accurate are the calculations?', hi: 'गणना कितनी सटीक है?' },
    a: {
      en: 'The app uses the authentic Vedic Lahiri ayanamsa with ephemeris-grade planetary positions. Panchang elements are computed at sunrise for your exact location, the traditional way.',
      hi: 'ऐप प्रामाणिक वैदिक लाहिरी अयनांश और एफेमेरिस-स्तर की ग्रह गणना उपयोग करता है। पंचांग आपके स्थान के सूर्योदय पर पारंपरिक विधि से बनता है।',
    },
  },
  {
    q: { en: 'How do I start?', hi: 'शुरुआत कैसे करूँ?' },
    a: {
      en: 'Install the app, verify your mobile with OTP, and start your 7-day trial at just ₹1. Add your birth details once — every reading becomes personal.',
      hi: 'ऐप इंस्टॉल करें, OTP से मोबाइल सत्यापित करें और सिर्फ ₹1 में 7 दिन का ट्रायल शुरू करें। जन्म विवरण एक बार जोड़ें — हर रीडिंग व्यक्तिगत बन जाती है।',
    },
  },
  {
    q: { en: 'Is the app in Hindi?', hi: 'क्या ऐप हिंदी में है?' },
    a: {
      en: 'Yes — the entire app works in both Hindi and English. Switch anytime from the drawer.',
      hi: 'हाँ — पूरा ऐप हिंदी और अंग्रेजी दोनों में चलता है। ड्रॉअर से कभी भी भाषा बदलें।',
    },
  },
  {
    q: { en: 'Is my birth data private?', hi: 'क्या मेरा जन्म विवरण निजी है?' },
    a: {
      en: 'Yes. Login is OTP-verified and your birth details are used only to compute your kundli, panchang and predictions. See the privacy policy for details.',
      hi: 'हाँ। लॉगिन OTP-सत्यापित है और जन्म विवरण केवल आपकी कुंडली, पंचांग व भविष्यवाणी की गणना के लिए उपयोग होता है। विवरण गोपनीयता नीति में देखें।',
    },
  },
  {
    q: { en: 'Can I use these features on this website?', hi: 'क्या ये सुविधाएँ इस वेबसाइट पर मिलेंगी?' },
    a: {
      en: 'No — this website is a showcase. The complete experience, with your personal dashboard and all readings, lives inside the mobile app.',
      hi: 'नहीं — यह वेबसाइट केवल परिचय है। पूरा अनुभव, व्यक्तिगत डैशबोर्ड और सभी रीडिंग मोबाइल ऐप में मिलती हैं।',
    },
  },
]

export const SHOWCASE_PREMIUM: { title: LocalizedCopy; body: LocalizedCopy }[] = [
  {
    title: { en: 'Personal dashboard', hi: 'व्यक्तिगत डैशबोर्ड' },
    body: {
      en: 'Birth profile once — kundli, rashifal and reports stay personalised across the app.',
      hi: 'जन्म प्रोफाइल एक बार — कुंडली, राशिफल और रिपोर्ट पूरे ऐप में व्यक्तिगत रहती हैं।',
    },
  },
  {
    title: { en: 'Premium membership', hi: 'प्रीमियम सदस्यता' },
    body: {
      en: 'Full readings, AI astrologer, reports and daily guidance unlock inside the mobile app.',
      hi: 'पूरी रीडिंग, AI ज्योतिषी, रिपोर्ट और दैनिक मार्गदर्शन मोबाइल ऐप में खुलते हैं।',
    },
  },
  {
    title: { en: 'Bilingual by design', hi: 'द्विभाषी अनुभव' },
    body: {
      en: 'Switch Hindi and English anytime — same cosmic gold interface in light and dark.',
      hi: 'कभी भी हिंदी/अंग्रेजी बदलें — लाइट और डार्क में एक ही सोने-सफेद इंटरफ़ेस।',
    },
  },
]


