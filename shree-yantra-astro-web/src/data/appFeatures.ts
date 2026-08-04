/** All app drawer / stack features mapped to web routes (parity checklist). */

export type AppFeature = {
  route: string
  en: string
  hi: string
  group: 'core' | 'ai' | 'content' | 'account'
  /** Website implementation level compared with the mobile app. */
  parity: 'app' | 'live' | 'alias'
}

/** app = app-like UI + flow; live = backend-backed web UI; alias = mobile screen opens an equivalent web page. */
export const APP_FEATURES: AppFeature[] = [
  { route: '/', en: 'Home', hi: 'होम', group: 'core', parity: 'app' },
  { route: '/services', en: 'All app services', hi: 'सभी ऐप सेवाएँ', group: 'core', parity: 'app' },
  { route: '/my-rashifal', en: 'My Rashifal', hi: 'मेरा राशिफल', group: 'core', parity: 'app' },
  { route: '/rashifal', en: 'Rashifal · 12 Signs', hi: '12 राशि राशिफल', group: 'core', parity: 'app' },
  { route: '/kundli', en: 'Kundli / Birth Chart', hi: 'जन्म कुंडली', group: 'core', parity: 'app' },
  { route: '/kundli-learn', en: 'Learn Kundli', hi: 'कुंडली सीखें', group: 'core', parity: 'app' },
  { route: '/kundli-match', en: 'Kundli Milan', hi: 'कुंडली मिलान', group: 'core', parity: 'app' },
  { route: '/panchang', en: 'Panchang', hi: 'पंचांग', group: 'core', parity: 'app' },
  { route: '/choghadiya', en: 'Choghadiya', hi: 'चौघड़िया', group: 'core', parity: 'app' },
  { route: '/muhurat', en: 'Shubh Muhurat', hi: 'शुभ मुहूर्त', group: 'core', parity: 'app' },
  { route: '/numerology', en: 'Numerology', hi: 'अंकशास्त्र', group: 'core', parity: 'app' },
  { route: '/vastu', en: 'Vastu Shastra', hi: 'वास्तु शास्त्र', group: 'core', parity: 'app' },
  { route: '/vastu-learn', en: 'Learn Vastu', hi: 'वास्तु सीखें', group: 'core', parity: 'app' },
  { route: '/baby-names', en: 'Baby Names', hi: 'नामकरण', group: 'core', parity: 'app' },
  { route: '/remedies', en: 'Remedies', hi: 'उपाय', group: 'core', parity: 'app' },
  { route: '/vedic-reading', en: 'Vedic Reading', hi: 'वैदिक फलादेश', group: 'core', parity: 'app' },
  { route: '/brihat-kundli', en: 'Brihat Kundli Report', hi: 'बृहत कुंडली रिपोर्ट', group: 'core', parity: 'app' },
  { route: '/janam-patri', en: 'Janam Patri + Naamkaran', hi: 'जन्म पत्री + नामकरण', group: 'core', parity: 'app' },
  { route: '/gochar', en: 'Gochar', hi: 'गोचर', group: 'core', parity: 'app' },
  { route: '/life-timeline', en: 'Dasha Timeline', hi: 'दशा समयरेखा', group: 'core', parity: 'app' },
  { route: '/transit-forecast', en: 'Year Forecast', hi: 'वार्षिक गोचर', group: 'core', parity: 'app' },
  { route: '/daily-prediction', en: 'Daily Prediction alias', hi: 'दैनिक फलादेश alias', group: 'core', parity: 'alias' },
  { route: '/predictions', en: 'Predictions alias', hi: 'राशिफल alias', group: 'core', parity: 'alias' },
  { route: '/kundli-explore', en: 'Kundli Explore alias', hi: 'कुंडली explore alias', group: 'core', parity: 'alias' },
  { route: '/example-kundli', en: 'Example Kundli alias', hi: 'उदाहरण कुंडली alias', group: 'core', parity: 'alias' },

  { route: '/ai-astrologer', en: 'Vedic Astrologer', hi: 'वैदिक ज्योतिषी', group: 'ai', parity: 'app' },

  { route: '/library', en: 'Divine Library', hi: 'दिव्य पुस्तकालय', group: 'content', parity: 'app' },
  { route: '/daily-shloka', en: 'Daily Shloka', hi: 'दैनिक श्लोक', group: 'content', parity: 'app' },
  { route: '/gita', en: 'Bhagavad Gita', hi: 'श्रीमद्भगवद्गीता', group: 'content', parity: 'app' },
  { route: '/ramayan', en: 'Ramayana', hi: 'रामायण', group: 'content', parity: 'app' },
  { route: '/ramcharitmanas', en: 'Ramcharitmanas', hi: 'रामचरितमानस', group: 'content', parity: 'app' },
  { route: '/aarti-sangrah', en: 'Aarti Sangrah', hi: 'आरती संग्रह', group: 'content', parity: 'app' },
  { route: '/stotra-sangrah', en: 'Stotra Sangrah', hi: 'स्तोत्र संग्रह', group: 'content', parity: 'app' },
  { route: '/mantra-sangrah', en: 'Mantra Sangrah', hi: 'मंत्र संग्रह', group: 'content', parity: 'app' },
  { route: '/occasions', en: 'Shubh Avsar', hi: 'शुभ अवसर', group: 'content', parity: 'app' },
  { route: '/vedas', en: 'Vedas & Puranas', hi: 'वेद व पुराण', group: 'content', parity: 'app' },
  { route: '/rigveda', en: 'Rigveda', hi: 'ऋग्वेद', group: 'content', parity: 'app' },
  { route: '/hanuman-chalisa', en: 'Hanuman Chalisa', hi: 'हनुमान चालीसा', group: 'content', parity: 'app' },
  { route: '/audio/ramayan_audio', en: 'Ramayan Audio Katha', hi: 'रामायण ऑडियो कथा', group: 'content', parity: 'live' },
  { route: '/audio/mahabharat_audio', en: 'Mahabharat Audio Katha', hi: 'महाभारत ऑडियो कथा', group: 'content', parity: 'live' },

  { route: '/profile', en: 'My Profile', hi: 'मेरी प्रोफ़ाइल', group: 'account', parity: 'app' },
  { route: '/notifications', en: 'Notifications', hi: 'सूचनाएँ', group: 'account', parity: 'app' },
  { route: '/plans', en: 'Plans & Premium', hi: 'प्लान और प्रीमियम', group: 'account', parity: 'app' },
  { route: '/manage-subscription', en: 'Manage Subscription alias', hi: 'सदस्यता प्रबंधन alias', group: 'account', parity: 'alias' },
  { route: '/subscribe', en: 'Subscribe alias', hi: 'सब्सक्राइब alias', group: 'account', parity: 'alias' },
  { route: '/payment', en: 'Payment alias', hi: 'भुगतान alias', group: 'account', parity: 'alias' },
  { route: '/billing-options', en: 'Billing Options alias', hi: 'बिलिंग विकल्प alias', group: 'account', parity: 'alias' },
  { route: '/legal', en: 'Privacy & Terms', hi: 'गोपनीयता और शर्तें', group: 'account', parity: 'app' },
  { route: '/privacy-security', en: 'Privacy & Security alias', hi: 'गोपनीयता सुरक्षा alias', group: 'account', parity: 'alias' },
  { route: '/help', en: 'Help & FAQ', hi: 'सहायता', group: 'account', parity: 'app' },
  { route: '/sign-in', en: 'Sign in', hi: 'लॉगिन', group: 'account', parity: 'app' },
  { route: '/onboarding/birth', en: 'Birth details setup', hi: 'जन्म विवरण', group: 'account', parity: 'app' },
]
