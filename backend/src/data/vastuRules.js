'use strict';

const SOURCES = {
  mayamata: {
    id: 'mayamata',
    title: 'Mayamata',
    type: 'classical-text',
    note: 'Classical Vastu and Indian architecture text used for site planning, orientation, proportions and residential design principles.',
    url: 'https://books.google.com/books/about/Mayamata.html?id=lxgvEAAAQBAJ',
  },
  manasara: {
    id: 'manasara',
    title: 'Manasara',
    type: 'classical-text',
    note: 'Traditional Indian architecture text covering town planning, dwellings, measurements and building layout principles.',
    url: 'https://www.wisdomlib.org/hinduism/book/manasara-english-translation',
  },
  brihatSamhita: {
    id: 'brihat-samhita-53',
    title: 'Brihat Samhita - Vastu Vidya',
    type: 'classical-text',
    note: 'Varahamihira text with a dedicated Vastu Vidya chapter on house and site considerations.',
    url: 'https://www.wisdomlib.org/hinduism/book/brihat-samhita/d/doc229297.html',
  },
  modernSafety: {
    id: 'modern-safety',
    title: 'Modern building safety guardrail',
    type: 'safety',
    note: 'Vastu guidance must not override structural, electrical, fire, earthquake or municipal building safety rules.',
    url: 'https://www.bis.gov.in/standardized-development-and-building-regulations-2023/?lang=en',
  },
};

const DIRECTIONS = {
  N: { key: 'N', en: 'North', hi: 'उत्तर', element: { en: 'Water and prosperity', hi: 'जल और समृद्धि' } },
  NE: { key: 'NE', en: 'North-East', hi: 'ईशान कोण', element: { en: 'Spiritual clarity', hi: 'आध्यात्मिक शुद्धता' } },
  E: { key: 'E', en: 'East', hi: 'पूर्व', element: { en: 'Sunlight and growth', hi: 'सूर्य प्रकाश और विकास' } },
  SE: { key: 'SE', en: 'South-East', hi: 'अग्नि कोण', element: { en: 'Fire and cooking', hi: 'अग्नि और भोजन' } },
  S: { key: 'S', en: 'South', hi: 'दक्षिण', element: { en: 'Discipline and stability', hi: 'अनुशासन और स्थिरता' } },
  SW: { key: 'SW', en: 'South-West', hi: 'नैऋत्य कोण', element: { en: 'Weight and stability', hi: 'भार और स्थिरता' } },
  W: { key: 'W', en: 'West', hi: 'पश्चिम', element: { en: 'Results and storage', hi: 'परिणाम और भंडारण' } },
  NW: { key: 'NW', en: 'North-West', hi: 'वायव्य कोण', element: { en: 'Movement and air', hi: 'गति और वायु' } },
  CENTER: { key: 'CENTER', en: 'Brahmasthan', hi: 'ब्रह्मस्थान', element: { en: 'Open central energy', hi: 'खुला केंद्रीय स्थान' } },
};

const ROOM_TYPES = {
  mainEntrance: {
    order: 1,
    weight: 14,
    label: { en: 'Main entrance', hi: 'मुख्य प्रवेश' },
    ideal: ['N', 'NE', 'E'],
    ok: ['NW'],
    avoid: ['SW', 'S'],
    sourceIds: ['mayamata', 'manasara', 'brihat-samhita-53'],
    confidence: 'strong-traditional',
    why: {
      en: 'The entrance is treated as the primary flow point of the house. North, East and North-East are traditionally kept open, bright and welcoming.',
      hi: 'मुख्य प्रवेश को घर की ऊर्जा का मुख्य द्वार माना जाता है। उत्तर, पूर्व और ईशान को परंपरा में खुला, उज्ज्वल और स्वागत योग्य रखना श्रेष्ठ माना गया है।',
    },
    remedy: {
      en: 'Keep the entrance clean, bright and obstruction-free. Use a clear nameplate, good lighting and avoid heavy storage near the door.',
      hi: 'प्रवेश द्वार साफ, रोशन और बिना रुकावट रखें। स्पष्ट नेम-प्लेट, अच्छी लाइट और दरवाजे के पास भारी सामान से बचें।',
    },
  },
  kitchen: {
    order: 2,
    weight: 12,
    label: { en: 'Kitchen', hi: 'रसोई' },
    ideal: ['SE'],
    ok: ['NW', 'E'],
    avoid: ['NE', 'SW', 'CENTER'],
    sourceIds: ['mayamata', 'manasara'],
    confidence: 'strong-traditional',
    why: {
      en: 'Kitchen is linked with the fire element, so South-East is the classical first preference. North-West is commonly used as the practical second option.',
      hi: 'रसोई अग्नि तत्व से जुड़ी मानी जाती है, इसलिए अग्नि कोण यानी दक्षिण-पूर्व को पहला श्रेष्ठ स्थान माना जाता है। वायव्य कोण दूसरा व्यावहारिक विकल्प माना जाता है।',
    },
    remedy: {
      en: 'If the kitchen cannot move, place the stove toward the South-East part of the kitchen and keep water storage away from the stove.',
      hi: 'अगर रसोई बदलना संभव नहीं है, तो चूल्हा रसोई के दक्षिण-पूर्व हिस्से में रखें और पानी/सिंक को चूल्हे से अलग रखें।',
    },
  },
  masterBedroom: {
    order: 3,
    weight: 11,
    label: { en: 'Master bedroom', hi: 'मुख्य शयनकक्ष' },
    ideal: ['SW'],
    ok: ['S', 'W'],
    avoid: ['NE', 'CENTER'],
    sourceIds: ['mayamata', 'manasara'],
    confidence: 'strong-traditional',
    why: {
      en: 'The South-West is traditionally kept heavier and more stable, so it suits the head of the family or master bedroom.',
      hi: 'नैऋत्य कोण को परंपरा में भारी और स्थिर क्षेत्र माना गया है, इसलिए यह परिवार के मुखिया या मुख्य शयनकक्ष के लिए उपयुक्त माना जाता है।',
    },
    remedy: {
      en: 'Keep heavier furniture in the South-West side and avoid mirrors directly facing the bed.',
      hi: 'भारी फर्नीचर दक्षिण-पश्चिम हिस्से में रखें और बिस्तर के सामने सीधा दर्पण रखने से बचें।',
    },
  },
  bedroom: {
    order: 4,
    weight: 8,
    label: { en: 'Bedroom', hi: 'शयनकक्ष' },
    ideal: ['W', 'NW', 'SW'],
    ok: ['S', 'E'],
    avoid: ['NE', 'CENTER'],
    sourceIds: ['mayamata', 'manasara'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Bedrooms need calm and privacy. West, North-West and South-West are usually easier to balance for rest.',
      hi: 'शयनकक्ष में शांति और निजता चाहिए। पश्चिम, वायव्य और नैऋत्य क्षेत्र आराम के लिए सामान्यतः संतुलित माने जाते हैं।',
    },
    remedy: {
      en: 'Keep the bed head toward South or East where possible and reduce clutter under the bed.',
      hi: 'संभव हो तो सिर दक्षिण या पूर्व की ओर रखकर सोएं और बिस्तर के नीचे अनावश्यक सामान न रखें।',
    },
  },
  pujaRoom: {
    order: 5,
    weight: 9,
    label: { en: 'Puja room', hi: 'पूजा कक्ष' },
    ideal: ['NE', 'E', 'N'],
    ok: ['CENTER'],
    avoid: ['S', 'SW', 'SE'],
    sourceIds: ['mayamata', 'manasara', 'brihat-samhita-53'],
    confidence: 'strong-traditional',
    why: {
      en: 'North-East is traditionally kept light, pure and quiet, which makes it the best zone for prayer and meditation.',
      hi: 'ईशान कोण को हल्का, पवित्र और शांत रखने की परंपरा है, इसलिए पूजा और ध्यान के लिए यह श्रेष्ठ माना जाता है।',
    },
    remedy: {
      en: 'Keep the altar clean and elevated. Avoid placing a toilet wall directly behind the puja area.',
      hi: 'मंदिर/वेदी साफ और थोड़ी ऊंचाई पर रखें। पूजा स्थान के ठीक पीछे शौचालय की दीवार से बचें।',
    },
  },
  toilet: {
    order: 6,
    weight: 10,
    label: { en: 'Toilet', hi: 'शौचालय' },
    ideal: ['NW', 'W'],
    ok: ['S', 'SE'],
    avoid: ['NE', 'CENTER', 'E'],
    sourceIds: ['manasara', 'modern-safety'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Toilets are best kept away from North-East and the center. North-West or West is commonly used for disposal and movement zones.',
      hi: 'शौचालय को ईशान और ब्रह्मस्थान से दूर रखना बेहतर माना जाता है। वायव्य या पश्चिम क्षेत्र सामान्यतः निकास और गति से जुड़े माने जाते हैं।',
    },
    remedy: {
      en: 'Keep strong ventilation, dry floors and closed toilet lids. Fix leakage immediately.',
      hi: 'अच्छा वेंटिलेशन, सूखा फर्श और बंद ढक्कन रखें। पानी की लीकेज तुरंत ठीक करवाएं।',
    },
  },
  livingRoom: {
    order: 7,
    weight: 7,
    label: { en: 'Living room', hi: 'बैठक कक्ष' },
    ideal: ['N', 'E', 'NE'],
    ok: ['NW', 'W'],
    avoid: ['SW'],
    sourceIds: ['mayamata', 'manasara'],
    confidence: 'moderate-traditional',
    why: {
      en: 'The living room benefits from light, openness and easy approach from the entrance.',
      hi: 'बैठक कक्ष में प्रकाश, खुलापन और प्रवेश से आसान पहुंच लाभकारी मानी जाती है।',
    },
    remedy: {
      en: 'Keep this space bright and uncluttered. Place heavier seating toward South or West walls where possible.',
      hi: 'बैठक को रोशन और व्यवस्थित रखें। संभव हो तो भारी सोफा दक्षिण या पश्चिम दीवार की तरफ रखें।',
    },
  },
  studyRoom: {
    order: 8,
    weight: 7,
    label: { en: 'Study room', hi: 'अध्ययन कक्ष' },
    ideal: ['NE', 'E', 'N'],
    ok: ['W'],
    avoid: ['S', 'SW'],
    sourceIds: ['mayamata', 'manasara'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Study areas are traditionally placed in lighter zones with clarity and morning light.',
      hi: 'अध्ययन क्षेत्र को परंपरा में हल्के, स्पष्ट और सुबह के प्रकाश वाले क्षेत्रों में रखना अच्छा माना जाता है।',
    },
    remedy: {
      en: 'Face East or North while studying where possible and keep the desk clean.',
      hi: 'संभव हो तो पढ़ते समय पूर्व या उत्तर की ओर मुख रखें और मेज साफ रखें।',
    },
  },
  staircase: {
    order: 9,
    weight: 7,
    label: { en: 'Staircase', hi: 'सीढ़ियां' },
    ideal: ['S', 'SW', 'W'],
    ok: ['SE', 'NW'],
    avoid: ['NE', 'CENTER'],
    sourceIds: ['mayamata', 'manasara', 'modern-safety'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Staircases are heavy elements. South, South-West and West are better for weight and structural mass.',
      hi: 'सीढ़ियां भारी संरचना होती हैं। दक्षिण, नैऋत्य और पश्चिम क्षेत्र भार और स्थिरता के लिए बेहतर माने जाते हैं।',
    },
    remedy: {
      en: 'Keep the staircase well-lit and structurally safe. Do not block the central open area with heavy stair mass.',
      hi: 'सीढ़ियों को रोशन और संरचनात्मक रूप से सुरक्षित रखें। घर के केंद्र को भारी सीढ़ियों से न भरें।',
    },
  },
  overheadWaterTank: {
    order: 10,
    weight: 7,
    label: { en: 'Overhead water tank', hi: 'ऊपरी पानी की टंकी' },
    ideal: ['SW', 'W', 'S'],
    ok: ['NW'],
    avoid: ['NE', 'CENTER'],
    sourceIds: ['manasara', 'modern-safety'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Overhead tanks add load. Traditionally, heavier zones are preferred while North-East is kept light.',
      hi: 'ऊपरी टंकी भार बढ़ाती है। परंपरा में भारी क्षेत्र पसंद किए जाते हैं और ईशान को हल्का रखा जाता है।',
    },
    remedy: {
      en: 'Verify load safety with an engineer and avoid leakage. If placed in North-East, reduce visual and physical heaviness where possible.',
      hi: 'इंजीनियर से लोड सेफ्टी जरूर जांचें और लीकेज न होने दें। अगर ईशान में है तो वहां भारीपन कम रखें।',
    },
  },
  undergroundWater: {
    order: 11,
    weight: 8,
    label: { en: 'Underground water', hi: 'भूमिगत जल' },
    ideal: ['NE', 'N', 'E'],
    ok: ['NW'],
    avoid: ['SW', 'SE', 'S'],
    sourceIds: ['mayamata', 'manasara', 'modern-safety'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Underground water is traditionally preferred in the North-East, North or East, while heavy South-West is avoided.',
      hi: 'भूमिगत जल को परंपरा में ईशान, उत्तर या पूर्व में श्रेष्ठ माना जाता है, जबकि भारी नैऋत्य से बचा जाता है।',
    },
    remedy: {
      en: 'Keep water points clean and covered. For new construction, confirm plumbing, drainage and municipal rules first.',
      hi: 'जल स्रोत साफ और ढका रखें। नए निर्माण में पहले प्लंबिंग, ड्रेनेज और नगर नियमों की पुष्टि करें।',
    },
  },
  cashLocker: {
    order: 12,
    weight: 6,
    label: { en: 'Cash locker', hi: 'तिजोरी' },
    ideal: ['SW', 'S', 'W'],
    ok: ['N'],
    avoid: ['SE', 'NW', 'CENTER'],
    sourceIds: ['mayamata', 'manasara'],
    confidence: 'moderate-traditional',
    why: {
      en: 'Valuables are traditionally kept in stable zones, with the locker opening toward North or East where possible.',
      hi: 'कीमती वस्तुओं को स्थिर क्षेत्र में रखना माना जाता है, और संभव हो तो तिजोरी उत्तर या पूर्व की ओर खुलनी चाहिए।',
    },
    remedy: {
      en: 'Place the locker against a South or West wall so it opens toward North or East, if your room allows it.',
      hi: 'यदि संभव हो तो तिजोरी दक्षिण या पश्चिम दीवार से लगाकर रखें ताकि वह उत्तर या पूर्व की ओर खुले।',
    },
  },
};

const LEARN_TOPICS = [
  {
    id: 'what-is-vastu',
    title: { en: 'What is Vastu?', hi: 'वास्तु क्या है?' },
    body: {
      en: 'Vastu Shastra is the traditional Indian knowledge system for arranging land, rooms, directions, light, movement and weight so a building feels balanced and usable.',
      hi: 'वास्तु शास्त्र भूमि, कमरे, दिशाएं, प्रकाश, गति और भार को संतुलित रखने की पारंपरिक भारतीय पद्धति है, ताकि घर उपयोगी और संतुलित महसूस हो।',
    },
  },
  {
    id: 'directions',
    title: { en: 'Directions and elements', hi: 'दिशाएं और तत्व' },
    body: {
      en: 'Every direction is treated as having a different quality. For example, South-East is linked with fire, North-East with purity, and South-West with weight and stability.',
      hi: 'हर दिशा की अलग गुणवत्ता मानी जाती है। जैसे दक्षिण-पूर्व अग्नि से, ईशान पवित्रता से और नैऋत्य भार व स्थिरता से जोड़ा जाता है।',
    },
  },
  {
    id: 'brahmasthan',
    title: { en: 'Brahmasthan', hi: 'ब्रह्मस्थान' },
    body: {
      en: 'The center of the house is traditionally kept lighter and more open. Heavy stairs, toilets or clutter in the center are usually avoided.',
      hi: 'घर के केंद्र को परंपरा में हल्का और खुला रखना अच्छा माना जाता है। बीच में भारी सीढ़ियां, शौचालय या अव्यवस्था से बचा जाता है।',
    },
  },
  {
    id: 'safe-remedies',
    title: { en: 'Safe remedies first', hi: 'पहले सुरक्षित उपाय' },
    body: {
      en: 'A good Vastu feature should first suggest practical corrections: light, cleanliness, ventilation, furniture placement, color balance and clutter removal. Demolition should not be the first answer.',
      hi: 'अच्छा वास्तु फीचर पहले व्यावहारिक सुधार बताए: प्रकाश, सफाई, हवा, फर्नीचर की जगह, रंग संतुलन और अव्यवस्था हटाना। तोड़-फोड़ पहला समाधान नहीं होना चाहिए।',
    },
  },
];

module.exports = { SOURCES, DIRECTIONS, ROOM_TYPES, LEARN_TOPICS };
