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
  {
    key: 'raksha-bandhan',
    aliases: ['raksha bandhan', 'rakshabandhan', 'rakhi', 'raksha', 'rakhri', 'rakshabandhan', 'रक्षाबंधन', 'राखी'],
    name: { en: 'Raksha Bandhan', hi: 'रक्षाबंधन' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Shravana', paksha: 'Shukla', tithi: 'Purnima', gregorianMonths: [7] },
    guidance: { en: 'Rakhi is tied during the auspicious day window, avoiding Bhadra — tie after Bhadra ends.', hi: 'राखी भद्रा रहित शुभ समय में बाँधी जाती है — भद्रा समाप्त होने के बाद बाँधें।' },
    why: { en: 'It celebrates the bond of protection between brothers and sisters.', hi: 'यह भाई-बहन के रक्षा-स्नेह के बंधन का पर्व है।' },
    samagri: ['rakhi', 'roli', 'akshat', 'diya', 'sweets', 'thali'],
    samagriHi: ['राखी', 'रोली', 'अक्षत', 'दीपक', 'मिठाई', 'थाली'],
    steps: ['Avoid the Bhadra period.', 'Apply tilak and akshat.', 'Tie the rakhi and do aarti.', 'Exchange sweets and blessings.'],
    stepsHi: ['भद्रा काल से बचें।', 'तिलक व अक्षत लगाएं।', 'राखी बाँधकर आरती करें।', 'मिठाई व आशीर्वाद का आदान-प्रदान करें।'],
    mantras: [{ en: 'Yena baddho Balee raajaa...', hi: 'येन बद्धो बली राजा...' }],
    aarti: { en: 'Family aarti', hi: 'पारिवारिक आरती' },
  },
  {
    key: 'makar-sankranti',
    aliases: ['makar sankranti', 'makarsankranti', 'sankranti', 'uttarayan', 'uttarayana', 'maghi', 'मकर संक्रांति', 'संक्रांति', 'उत्तरायण'],
    name: { en: 'Makar Sankranti', hi: 'मकर संक्रांति' },
    type: 'festival', importance: 'major',
    rule: { gregorianMonths: [] },
    knownDates: { 2026: '14/01/2026', 2027: '14/01/2027' },
    guidance: { en: 'Observed with a holy bath, Surya worship, til-gud daan and kite flying as the Sun enters Capricorn (Uttarayana).', hi: 'सूर्य के मकर राशि में प्रवेश (उत्तरायण) पर स्नान, सूर्य पूजा, तिल-गुड़ दान के साथ मनाया जाता है।' },
    why: { en: 'It marks the Sun’s northward journey (Uttarayana) — a highly auspicious solar transition.', hi: 'यह सूर्य के उत्तरायण होने का अत्यंत शुभ संक्रांति पर्व है।' },
    samagri: ['til', 'gud (jaggery)', 'water for snan', 'khichdi items', 'donation items'],
    samagriHi: ['तिल', 'गुड़', 'स्नान जल', 'खिचड़ी सामग्री', 'दान सामग्री'],
    steps: ['Take a holy bath at sunrise.', 'Offer Arghya to Surya.', 'Do til-gud daan.', 'Eat/serve khichdi.'],
    stepsHi: ['सूर्योदय पर स्नान करें।', 'सूर्य को अर्घ्य दें।', 'तिल-गुड़ का दान करें।', 'खिचड़ी ग्रहण/वितरण करें।'],
    mantras: [{ en: 'Om Suryaya Namah', hi: 'ॐ सूर्याय नमः' }],
    aarti: { en: 'Surya Aarti', hi: 'सूर्य आरती' },
  },
  {
    key: 'holi',
    aliases: ['holi', 'dhulandi', 'rangwali holi', 'rang holi', 'होली', 'धुलंडी'],
    name: { en: 'Holi (Dhulandi)', hi: 'होली (धुलंडी)' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Phalguna', paksha: 'Shukla', tithi: 'Purnima', gregorianMonths: [2] },
    guidance: { en: 'The Holi of colours is played the day after Holika Dahan (Phalguna Purnima). Celebrate with gulal, water and sweets.', hi: 'रंगों की होली होलिका दहन (फाल्गुन पूर्णिमा) के अगले दिन खेली जाती है। गुलाल, जल व मिठाई के साथ मनाएं।' },
    why: { en: 'It celebrates the arrival of spring and the triumph of good over evil.', hi: 'यह वसंत के आगमन और बुराई पर अच्छाई की विजय का उत्सव है।' },
    mantras: [{ en: 'Om Namo Bhagavate Vasudevaya', hi: 'ॐ नमो भगवते वासुदेवाय' }],
    aarti: { en: 'Vishnu / Krishna Aarti', hi: 'विष्णु / कृष्ण आरती' },
  },
  {
    key: 'navratri',
    aliases: ['navratri', 'navaratri', 'sharadiya navratri', 'durga puja', 'नवरात्रि', 'दुर्गा पूजा'],
    name: { en: 'Shardiya Navratri', hi: 'शारदीय नवरात्रि' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Ashwina', paksha: 'Shukla', tithi: 'Pratipada', gregorianMonths: [8, 9] },
    guidance: { en: 'Nine nights of Devi worship begin on Ashwina Shukla Pratipada with Ghatasthapana.', hi: 'आश्विन शुक्ल प्रतिपदा से घटस्थापना के साथ नौ दिन देवी पूजा आरंभ होती है।' },
    why: { en: 'It honours the nine forms of Maa Durga and the victory of Shakti.', hi: 'यह माँ दुर्गा के नौ रूपों और शक्ति की विजय का पर्व है।' },
    mantras: [{ en: 'Om Aim Hreem Kleem Chamundaye Vichche', hi: 'ॐ ऐं ह्रीं क्लीं चामुण्डायै विच्चे' }],
    aarti: { en: 'Durga Aarti', hi: 'दुर्गा आरती' },
  },
  {
    key: 'dussehra',
    aliases: ['dussehra', 'dasara', 'dashara', 'vijayadashami', 'vijaya dashami', 'दशहरा', 'विजयादशमी'],
    name: { en: 'Dussehra (Vijayadashami)', hi: 'दशहरा (विजयादशमी)' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Ashwina', paksha: 'Shukla', tithi: 'Dashami', gregorianMonths: [8, 9] },
    guidance: { en: 'Vijayadashami is highly auspicious for new beginnings, Shastra/Vahan puja and Aparajita puja.', hi: 'विजयादशमी नए कार्य, शस्त्र/वाहन पूजा और अपराजिता पूजा के लिए अत्यंत शुभ है।' },
    why: { en: 'It marks Rama’s victory over Ravana and Durga over Mahishasura.', hi: 'यह राम की रावण पर और दुर्गा की महिषासुर पर विजय का प्रतीक है।' },
    mantras: [{ en: 'Om Sri Ramaya Namah', hi: 'ॐ श्री रामाय नमः' }],
    aarti: { en: 'Ram / Durga Aarti', hi: 'राम / दुर्गा आरती' },
  },
  {
    key: 'ram-navami',
    aliases: ['ram navami', 'rama navami', 'ramnavami', 'राम नवमी'],
    name: { en: 'Ram Navami', hi: 'राम नवमी' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Chaitra', paksha: 'Shukla', tithi: 'Navami', gregorianMonths: [2, 3] },
    guidance: { en: 'Madhyahna (midday) is the ideal window for Rama Janmotsav puja.', hi: 'राम जन्मोत्सव पूजा के लिए मध्याह्न समय श्रेष्ठ है।' },
    why: { en: 'It celebrates the birth of Bhagwan Shri Ram.', hi: 'यह भगवान श्रीराम के जन्म का उत्सव है।' },
    mantras: [{ en: 'Om Sri Ramaya Namah', hi: 'ॐ श्री रामाय नमः' }, { en: 'Sri Ram Jai Ram Jai Jai Ram', hi: 'श्री राम जय राम जय जय राम' }],
    aarti: { en: 'Ram Aarti', hi: 'राम आरती' },
  },
  {
    key: 'hanuman-jayanti',
    aliases: ['hanuman jayanti', 'hanumanjayanti', 'hanuman janmotsav', 'हनुमान जयंती'],
    name: { en: 'Hanuman Jayanti', hi: 'हनुमान जयंती' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Chaitra', paksha: 'Shukla', tithi: 'Purnima', gregorianMonths: [2, 3] },
    guidance: { en: 'Observed with sunrise Hanuman puja, Sundarkand and Hanuman Chalisa paath.', hi: 'सूर्योदय पर हनुमान पूजा, सुंदरकांड व हनुमान चालीसा पाठ के साथ मनाया जाता है।' },
    why: { en: 'It celebrates the birth of Hanuman ji, the embodiment of devotion and strength.', hi: 'यह भक्ति और बल के प्रतीक हनुमान जी के जन्म का पर्व है।' },
    mantras: [{ en: 'Om Hanumate Namah', hi: 'ॐ हनुमते नमः' }],
    aarti: { en: 'Hanuman Aarti', hi: 'हनुमान आरती' },
  },
  {
    key: 'vasant-panchami',
    aliases: ['vasant panchami', 'basant panchami', 'saraswati puja', 'वसंत पंचमी', 'सरस्वती पूजा'],
    name: { en: 'Vasant Panchami', hi: 'वसंत पंचमी' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Magha', paksha: 'Shukla', tithi: 'Panchami', gregorianMonths: [0, 1] },
    guidance: { en: 'Auspicious for Saraswati puja, Vidyarambh (start of learning) and Abujh-muhurat work.', hi: 'सरस्वती पूजा, विद्यारंभ और अबूझ मुहूर्त कार्यों के लिए शुभ।' },
    why: { en: 'It honours Maa Saraswati and the arrival of spring.', hi: 'यह माँ सरस्वती और वसंत ऋतु के आगमन का पर्व है।' },
    mantras: [{ en: 'Om Aim Saraswatyai Namah', hi: 'ॐ ऐं सरस्वत्यै नमः' }],
    aarti: { en: 'Saraswati Aarti', hi: 'सरस्वती आरती' },
  },
  {
    key: 'akshaya-tritiya',
    aliases: ['akshaya tritiya', 'akshay tritiya', 'akha teej', 'अक्षय तृतीया', 'आखा तीज'],
    name: { en: 'Akshaya Tritiya', hi: 'अक्षय तृतीया' },
    type: 'festival', importance: 'major',
    rule: { masa: 'Vaishakha', paksha: 'Shukla', tithi: 'Tritiya', gregorianMonths: [3, 4] },
    guidance: { en: 'An Abujh (self-auspicious) muhurat — good for any auspicious work, gold purchase, charity and new ventures.', hi: 'अबूझ मुहूर्त — किसी भी शुभ कार्य, स्वर्ण-क्रय, दान और नए आरंभ के लिए श्रेष्ठ।' },
    why: { en: 'Whatever is begun or donated on this day is believed to bring lasting (akshaya) results.', hi: 'इस दिन किया कार्य/दान अक्षय (अनंत) फल देने वाला माना जाता है।' },
    mantras: [{ en: 'Om Shreem Mahalakshmyai Namah', hi: 'ॐ श्रीं महालक्ष्म्यै नमः' }],
    aarti: { en: 'Lakshmi-Vishnu Aarti', hi: 'लक्ष्मी-विष्णु आरती' },
  },
  {
    key: 'karwa-chauth',
    aliases: ['karwa chauth', 'karva chauth', 'karvachauth', 'karwachauth', 'करवा चौथ'],
    name: { en: 'Karwa Chauth', hi: 'करवा चौथ' },
    type: 'vrat', importance: 'major',
    rule: { masa: 'Kartika', paksha: 'Krishna', tithi: 'Chaturthi', gregorianMonths: [9, 10] },
    guidance: { en: 'A day-long nirjala vrat broken after moonrise and Chandra Arghya.', hi: 'दिनभर निर्जला व्रत, चन्द्रोदय व चन्द्र अर्घ्य के बाद पारण।' },
    why: { en: 'Observed for the long life and well-being of the husband.', hi: 'पति की दीर्घायु व कल्याण हेतु रखा जाने वाला व्रत।' },
    mantras: [{ en: 'Om Shivayai Namah', hi: 'ॐ शिवायै नमः' }],
    aarti: { en: 'Karwa Mata Aarti', hi: 'करवा माता आरती' },
  },
  {
    key: 'nag-panchami',
    aliases: ['nag panchami', 'naag panchami', 'नाग पंचमी'],
    name: { en: 'Nag Panchami', hi: 'नाग पंचमी' },
    type: 'festival', importance: 'minor',
    rule: { masa: 'Shravana', paksha: 'Shukla', tithi: 'Panchami', gregorianMonths: [6, 7] },
    guidance: { en: 'Naga (serpent) deities are worshipped with milk and prayers.', hi: 'नाग देवताओं की दूध व प्रार्थना से पूजा की जाती है।' },
    why: { en: 'It seeks the blessings and protection of the Naga devtas.', hi: 'यह नाग देवताओं के आशीर्वाद व रक्षा हेतु है।' },
    mantras: [{ en: 'Om Nagendra Haaraya Namah', hi: 'ॐ नागेन्द्र हाराय नमः' }],
    aarti: { en: 'Naga Puja prayers', hi: 'नाग पूजा प्रार्थना' },
  },
];

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase();
}
// Compact form: lowercase + strip spaces/hyphens/punctuation so "rakshabandhan",
// "raksha bandhan" and "raksha-bandhan" all compare equal.
function compact(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9ऀ-ॿ]/g, '');
}

function searchFestivalCatalog(query) {
  const q = normalizeQuery(query);
  if (!q) return FESTIVAL_CATALOG;
  const cq = compact(q);
  const hit = (a) => { const ca = compact(a); return !!cq && !!ca && (ca.includes(cq) || cq.includes(ca)); };
  return FESTIVAL_CATALOG.filter((f) => (
    hit(f.key)
    || (f.aliases || []).some((a) => hit(a))
    || hit(f.name.en)
    || hit(f.name.hi)
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
