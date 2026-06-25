const FESTIVAL_CATALOG = [
  {
    key: 'diwali',
    aliases: ['diwali', 'deepawali', 'dipawali', 'laxmi puja', 'lakshmi puja', 'दीवाली', 'दिवाली', 'लक्ष्मी पूजा'],
    name: { en: 'Diwali / Lakshmi Puja', hi: 'दीवाली / लक्ष्मी पूजा' },
    type: 'festival',
    importance: 'major',
    rule: { masa: 'Kartika', paksha: 'Krishna', tithi: 'Amavasya', gregorianMonths: [9, 10] },
    knownDates: { 2026: '08/11/2026', 2027: '29/10/2027' },
    guidance: {
      en: 'Lakshmi Puja is traditionally performed in the evening Pradosh window after checking Amavasya overlap and local Panchang.',
      hi: 'लक्ष्मी पूजा स्थान-आधारित पंचांग में अमावस्या और प्रदोष काल देखकर सायंकाल की जाती है।',
    },
    why: {
      en: 'Diwali celebrates light, prosperity, dharma and the worship of Mahalakshmi and Shri Ganesha.',
      hi: 'दीवाली प्रकाश, समृद्धि, धर्म और माँ लक्ष्मी तथा श्री गणेश की पूजा का पर्व है।',
    },
    samagri: ['Lakshmi-Ganesha idol/photo', 'diya', 'ghee/oil', 'kumkum', 'akshat', 'flowers', 'sweets', 'fruits', 'kalash', 'coins/account book'],
    samagriHi: ['लक्ष्मी-गणेश प्रतिमा/चित्र', 'दीपक', 'घी/तेल', 'कुमकुम', 'अक्षत', 'फूल', 'मिठाई', 'फल', 'कलश', 'सिक्के/बही-खाता'],
    steps: [
      'Clean the puja place and light diyas.',
      'Invoke Shri Ganesha first, then Mahalakshmi.',
      'Offer flowers, sweets, fruits and light incense.',
      'Chant Lakshmi mantra and perform aarti.',
      'Keep the home peaceful, clean and well-lit.',
    ],
    stepsHi: [
      'पूजा स्थान साफ करके दीपक जलाएं।',
      'सबसे पहले श्री गणेश, फिर माँ लक्ष्मी का आवाहन करें।',
      'फूल, मिठाई, फल और धूप अर्पित करें।',
      'लक्ष्मी मंत्र जपें और आरती करें।',
      'घर को शांत, स्वच्छ और प्रकाशमय रखें।',
    ],
    mantras: [
      { en: 'Om Shreem Mahalakshmyai Namah', hi: 'ॐ श्रीं महालक्ष्म्यै नमः' },
      { en: 'Om Gam Ganapataye Namah', hi: 'ॐ गं गणपतये नमः' },
    ],
    aarti: { en: 'Lakshmi Aarti, Ganesh Aarti', hi: 'लक्ष्मी आरती, गणेश आरती' },
  },
  {
    key: 'holika-dahan',
    aliases: ['holika', 'holika dahan', 'होलीका', 'होलिका दहन'],
    name: { en: 'Holika Dahan', hi: 'होलिका दहन' },
    type: 'festival',
    importance: 'major',
    rule: { masa: 'Phalguna', paksha: 'Shukla', tithi: 'Purnima', gregorianMonths: [1, 2] },
    knownDates: { 2027: '22/03/2027' },
    guidance: {
      en: 'Holika Dahan is done after sunset only after checking Bhadra; avoid the Bhadra period.',
      hi: 'होलिका दहन सूर्यास्त के बाद भद्रा देखकर किया जाता है; भद्रा काल से बचना चाहिए।',
    },
    why: {
      en: 'It marks the victory of devotion and dharma, remembering Prahlada and the burning of Holika.',
      hi: 'यह भक्त प्रह्लाद की रक्षा और अधर्म पर धर्म की विजय का प्रतीक है।',
    },
    samagri: ['wood/dried cow dung cakes', 'roli', 'akshat', 'flowers', 'coconut', 'water kalash', 'new crop grains'],
    samagriHi: ['लकड़ी/उपले', 'रोली', 'अक्षत', 'फूल', 'नारियल', 'जल कलश', 'नई फसल के दाने'],
    steps: ['Worship Holika before lighting.', 'Offer water, roli, akshat and grains.', 'Circumambulate with family.', 'Pray for protection and removal of negativity.'],
    stepsHi: ['दहन से पहले होलिका पूजन करें।', 'जल, रोली, अक्षत और अन्न अर्पित करें।', 'परिवार सहित परिक्रमा करें।', 'रक्षा और नकारात्मकता दूर होने की प्रार्थना करें।'],
    mantras: [{ en: 'Om Namo Bhagavate Vasudevaya', hi: 'ॐ नमो भगवते वासुदेवाय' }],
    aarti: { en: 'Vishnu Aarti / Holika Puja prayers', hi: 'विष्णु आरती / होलिका पूजा प्रार्थना' },
  },
  {
    key: 'ganesh-chaturthi',
    aliases: ['ganesh chaturthi', 'vinayaka chaturthi', 'ganpati', 'गणेश चतुर्थी', 'गणपति'],
    name: { en: 'Ganesh Chaturthi', hi: 'गणेश चतुर्थी' },
    type: 'festival',
    importance: 'major',
    rule: { masa: 'Bhadrapada', paksha: 'Shukla', tithi: 'Chaturthi', gregorianMonths: [7, 8] },
    knownDates: { 2026: '14/09/2026', 2027: '04/09/2027' },
    guidance: { en: 'Good for Ganesha sthapana, puja and obstacle removal prayers.', hi: 'गणेश स्थापना, पूजा और विघ्न निवारण के लिए शुभ।' },
    why: { en: 'It celebrates Shri Ganesha, the remover of obstacles and lord of wisdom.', hi: 'यह बुद्धि और विघ्न-विनाशक श्री गणेश का पर्व है।' },
    samagri: ['Ganesha idol', 'durva grass', 'modak', 'flowers', 'incense', 'lamp'],
    samagriHi: ['गणेश प्रतिमा', 'दूर्वा', 'मोदक', 'फूल', 'धूप', 'दीपक'],
    steps: ['Do sankalp.', 'Offer durva and modak.', 'Chant Ganesha mantra.', 'Perform aarti.'],
    stepsHi: ['संकल्प लें।', 'दूर्वा और मोदक अर्पित करें।', 'गणेश मंत्र जपें।', 'आरती करें।'],
    mantras: [{ en: 'Om Gam Ganapataye Namah', hi: 'ॐ गं गणपतये नमः' }],
    aarti: { en: 'Ganesh Aarti', hi: 'गणेश आरती' },
  },
  {
    key: 'janmashtami',
    aliases: ['janmashtami', 'krishna janmashtami', 'जन्माष्टमी', 'कृष्ण जन्माष्टमी'],
    name: { en: 'Krishna Janmashtami', hi: 'कृष्ण जन्माष्टमी' },
    type: 'festival',
    importance: 'major',
    rule: { masa: 'Bhadrapada', paksha: 'Krishna', tithi: 'Ashtami', gregorianMonths: [7, 8] },
    knownDates: { 2026: '04/09/2026', 2027: '25/08/2027' },
    guidance: { en: 'Traditionally observed with fasting, Krishna puja and night worship.', hi: 'व्रत, कृष्ण पूजा और रात्रि उपासना के साथ मनाया जाता है।' },
    why: { en: 'It celebrates the birth of Bhagwan Krishna.', hi: 'यह भगवान श्रीकृष्ण के जन्म का उत्सव है।' },
    samagri: ['Krishna idol', 'makhan-mishri', 'tulsi', 'flowers', 'lamp', 'panchamrit'],
    samagriHi: ['कृष्ण प्रतिमा', 'माखन-मिश्री', 'तुलसी', 'फूल', 'दीपक', 'पंचामृत'],
    steps: ['Keep vrat as per health.', 'Offer tulsi and makhan-mishri.', 'Chant Krishna mantra.', 'Do aarti at night.'],
    stepsHi: ['स्वास्थ्य अनुसार व्रत रखें।', 'तुलसी और माखन-मिश्री अर्पित करें।', 'कृष्ण मंत्र जपें।', 'रात्रि में आरती करें।'],
    mantras: [{ en: 'Om Namo Bhagavate Vasudevaya', hi: 'ॐ नमो भगवते वासुदेवाय' }],
    aarti: { en: 'Krishna Aarti', hi: 'कृष्ण आरती' },
  },
  {
    key: 'maha-shivaratri',
    aliases: ['maha shivratri', 'mahashivratri', 'shivaratri', 'महाशिवरात्रि', 'शिवरात्रि'],
    name: { en: 'Maha Shivaratri', hi: 'महाशिवरात्रि' },
    type: 'festival',
    importance: 'major',
    rule: { masa: 'Magha', paksha: 'Krishna', tithi: 'Chaturdashi', gregorianMonths: [1, 2] },
    knownDates: { 2027: '06/03/2027' },
    guidance: { en: 'Best observed with night Shiva puja, japa and meditation.', hi: 'रात्रि शिव पूजा, जप और ध्यान के लिए श्रेष्ठ।' },
    why: { en: 'It is dedicated to Bhagwan Shiva and inner purification.', hi: 'यह भगवान शिव और आंतरिक शुद्धि को समर्पित पर्व है।' },
    samagri: ['Shivling', 'water', 'milk', 'belpatra', 'dhatura', 'flowers', 'lamp'],
    samagriHi: ['शिवलिंग', 'जल', 'दूध', 'बेलपत्र', 'धतूरा', 'फूल', 'दीपक'],
    steps: ['Do abhishek.', 'Offer belpatra.', 'Chant Mahamrityunjaya or Panchakshari mantra.', 'Keep night vigil if possible.'],
    stepsHi: ['अभिषेक करें।', 'बेलपत्र अर्पित करें।', 'महामृत्युंजय या पंचाक्षरी मंत्र जपें।', 'संभव हो तो रात्रि जागरण करें।'],
    mantras: [{ en: 'Om Namah Shivaya', hi: 'ॐ नमः शिवाय' }, { en: 'Om Tryambakam Yajamahe...', hi: 'ॐ त्र्यम्बकं यजामहे...' }],
    aarti: { en: 'Shiva Aarti', hi: 'शिव आरती' },
  },
  {
    key: 'guru-purnima',
    aliases: ['guru purnima', 'गुरु पूर्णिमा'],
    name: { en: 'Guru Purnima', hi: 'गुरु पूर्णिमा' },
    type: 'festival',
    importance: 'major',
    rule: { masa: 'Ashadha', paksha: 'Shukla', tithi: 'Purnima', gregorianMonths: [6, 7] },
    knownDates: { 2026: '29/07/2026', 2027: '18/07/2027' },
    guidance: { en: 'Good for guru puja, study, gratitude and daan.', hi: 'गुरु पूजा, अध्ययन, कृतज्ञता और दान के लिए शुभ।' },
    why: { en: 'It honors the guru tradition and spiritual knowledge.', hi: 'यह गुरु परंपरा और आध्यात्मिक ज्ञान का सम्मान है।' },
    samagri: ['flowers', 'fruits', 'sweets', 'book/scripture', 'lamp'],
    samagriHi: ['फूल', 'फल', 'मिठाई', 'पुस्तक/शास्त्र', 'दीपक'],
    steps: ['Offer gratitude to guru.', 'Study scripture.', 'Do daan and seva.', 'Take a learning sankalp.'],
    stepsHi: ['गुरु के प्रति कृतज्ञता व्यक्त करें।', 'शास्त्र अध्ययन करें।', 'दान और सेवा करें।', 'सीखने का संकल्प लें।'],
    mantras: [{ en: 'Guru Brahma Guru Vishnu...', hi: 'गुरुर्ब्रह्मा गुरुर्विष्णुः...' }],
    aarti: { en: 'Guru Vandana', hi: 'गुरु वंदना' },
  },
];

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function searchFestivalCatalog(query) {
  const q = normalizeQuery(query);
  if (!q) return FESTIVAL_CATALOG;
  return FESTIVAL_CATALOG.filter((f) => (
    f.key.includes(q)
    || f.aliases.some((a) => normalizeQuery(a).includes(q) || q.includes(normalizeQuery(a)))
    || normalizeQuery(f.name.en).includes(q)
    || normalizeQuery(f.name.hi).includes(q)
  ));
}

function catalogToObservance(festival) {
  return {
    key: festival.key,
    name: festival.name,
    type: festival.type,
    importance: festival.importance,
    guidance: festival.guidance,
  };
}

function matchFestivalRule(festival, panchang) {
  const rule = festival.rule || {};
  const masa = panchang && panchang.masa && panchang.masa.amanta && panchang.masa.amanta.en;
  const tithi = panchang && panchang.tithi && panchang.tithi.name;
  const paksha = panchang && panchang.tithi && panchang.tithi.paksha;
  return (!rule.masa || rule.masa === masa)
    && (!rule.tithi || rule.tithi === tithi)
    && (!rule.paksha || rule.paksha === paksha);
}

function candidateWindows(startDate, festival, yearsAhead = 2) {
  const months = (festival.rule && festival.rule.gregorianMonths) || [];
  const years = [];
  const startYear = startDate.getFullYear();
  for (let y = startYear; y <= startYear + yearsAhead; y += 1) years.push(y);
  const windows = [];
  years.forEach((year) => {
    months.forEach((month) => {
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      from.setDate(Math.max(1, from.getDate() - 7));
      to.setDate(to.getDate() + 7);
      windows.push({ from, to });
    });
  });
  return windows;
}

function enrichFestivalDetail(detail, festival, lang) {
  if (!festival) return detail;
  const L = lang === 'hi' ? 'hi' : 'en';
  return {
    ...detail,
    catalog: {
      key: festival.key,
      name: festival.name,
      why: festival.why,
      samagri: L === 'hi' ? festival.samagriHi : festival.samagri,
      steps: L === 'hi' ? festival.stepsHi : festival.steps,
      mantras: festival.mantras,
      aarti: festival.aarti,
      guidance: festival.guidance,
    },
  };
}

module.exports = {
  FESTIVAL_CATALOG,
  searchFestivalCatalog,
  catalogToObservance,
  matchFestivalRule,
  candidateWindows,
  enrichFestivalDetail,
};
