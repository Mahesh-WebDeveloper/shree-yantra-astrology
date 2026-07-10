/**
 * Curated, deeply-researched occasion guides (flagship = Vivah). Authentic, bilingual, and
 * grounded in the Vedic / Grihyasutra / Dharmashastra tradition with an explicit note that
 * kulachar (family custom) + a qualified purohit's guidance is supreme, and that regional
 * customs vary. When a curated guide exists, OccasionScreen renders it; otherwise it falls
 * back to the AI-generated guide.
 *
 * Sources cross-referenced: Rigveda 10.85 (Surya Sukta), Grihyasutras, common vivah-paddhati
 * (naamjap.in, jyotishmath.com, karmkandvidhi.in) + standard Gita Press practice.
 */
export interface Bi { hi: string; en: string }
export interface CMantra { title: Bi; sanskrit: string; roman: string; meaning: Bi; when?: Bi; count?: string }
export interface CStep { title: Bi; what: Bi; why: Bi; deity?: Bi }
export interface CSamagri { name: Bi; reason: Bi }
export interface CRegional { region: Bi; text: Bi }
export interface CFaq { q: Bi; a: Bi }
export interface CAarti { title: Bi; lines?: string }
export interface CuratedOccasion {
  intro: Bi;
  significance: Bi[];
  history?: Bi;
  muhurat: Bi;
  muhuratKey?: string;           // deep-link into our own Muhurat finder
  shubhMonths?: Bi; varjit?: Bi; nakshatra?: Bi; tithi?: Bi;
  regional: CRegional[];
  preparation: Bi[];
  samagri: CSamagri[];
  steps: CStep[];
  saptapadi?: Bi[];
  saptapadiMantras?: { pada: Bi; sanskrit: string; vachan: Bi }[];
  mantras: CMantra[];
  mangalashtak?: { sanskrit: string; note: Bi };
  aartis: CAarti[];
  dos: Bi[];
  donts: Bi[];
  mistakes: Bi[];
  faqs: CFaq[];
  estTime?: Bi;
  difficulty?: Bi;
  disclaimer: Bi;
}

const VIVAH: CuratedOccasion = {
  intro: {
    hi: 'विवाह सनातन धर्म के षोडश (16) संस्कारों में सबसे महत्वपूर्ण संस्कार है। यह केवल दो व्यक्तियों का नहीं, बल्कि दो आत्माओं व दो परिवारों का पवित्र मिलन है, जिसमें वर-वधू धर्म, अर्थ, काम और मोक्ष की यात्रा में एक-दूसरे के सहयोगी बनने का संकल्प लेते हैं। इससे मनुष्य ब्रह्मचर्य से गृहस्थ आश्रम में प्रवेश करता है।',
    en: 'Vivah is the most important of the sixteen (Shodasha) sanskaras of Sanatana Dharma. It is not merely the union of two people but of two souls and two families — a vow to walk together through dharma, artha, kama and moksha. Through it, one enters the Grihastha (householder) stage from Brahmacharya.',
  },
  significance: [
    { hi: 'षोडश संस्कारों में विवाह को गृहस्थ आश्रम का आधार माना गया है — सभी यज्ञ व अनुष्ठान इसी पर टिके हैं।', en: 'Among the sixteen sanskaras, marriage is the foundation of the householder stage — all yajnas and rituals rest upon it.' },
    { hi: 'शास्त्रानुसार विवाह से मनुष्य "पितृ ऋण" से मुक्ति का पात्र बनता है, क्योंकि वंश परंपरा आगे बढ़ती है।', en: 'By tradition, marriage makes one eligible for release from "pitri-rina" (debt to ancestors), as the lineage continues.' },
    { hi: 'पति-पत्नी एक-दूसरे के "अर्धांग/अर्धांगिनी" हैं — एक के बिना दूसरे की आध्यात्मिक यात्रा अधूरी है।', en: 'Husband and wife are each other’s "ardhanga" (half) — neither’s spiritual journey is complete without the other.' },
    { hi: 'वैदिक परंपरा में कोई मुख्य यज्ञ तब तक पूर्ण नहीं माना जाता जब तक पत्नी पति के वाम भाग में न हो।', en: 'In the Vedic tradition, no major yajna is complete unless the wife is seated on the husband’s left.' },
  ],
  history: {
    hi: 'ऋग्वेद के 10वें मंडल का 85वाँ सूक्त "सूर्या सूक्त" कहलाता है, जिसमें सूर्या व सोम के विवाह का वर्णन है — यही आज भी वैदिक विवाह पद्धति का मूल आधार है। श्रीराम-सीता तथा शिव-पार्वती विवाह आदर्श माने जाते हैं।',
    en: 'The 85th hymn of the 10th Mandala of the Rigveda — the "Surya Sukta" — describes the wedding of Surya and Soma, and remains the very basis of the Vedic wedding today. The weddings of Ram–Sita and Shiva–Parvati are held as ideals.',
  },
  muhurat: {
    hi: 'विवाह सदैव "विवाह लग्न" व कुंडली मिलान (मेलापक) के आधार पर तय होता है। शुभ मास, नक्षत्र व तिथि का पालन आवश्यक है। नीचे दिए बटन से आप अपना शुभ विवाह मुहूर्त सीधे इसी ऐप में देख सकते हैं।',
    en: 'A wedding is always fixed on the "vivah lagna" and kundli matching (melapak). Auspicious month, nakshatra and tithi must be honoured. Use the button below to check your Vivah muhurat right here in the app.',
  },
  muhuratKey: 'vivah',
  shubhMonths: { hi: 'श्रेष्ठ मास: मार्गशीर्ष (अगहन), माघ, फाल्गुन, वैशाख व ज्येष्ठ।', en: 'Best months: Margashirsha, Magha, Phalguna, Vaishakha and Jyeshtha.' },
  varjit: { hi: 'वर्जित: चातुर्मास (देवशयनी से देवउठनी एकादशी तक) व खरमास (सूर्य धनु/मीन में) — इस काल में विवाह नहीं होते।', en: 'Avoided: Chaturmas (Devshayani to Devuthani Ekadashi) and Kharmas (Sun in Sagittarius/Pisces) — weddings are not held then.' },
  nakshatra: { hi: 'शुभ नक्षत्र: रोहिणी, मृगशिरा, उत्तरा फाल्गुनी, हस्त, चित्रा, स्वाति, अनुराधा, उत्तराषाढ़ा, श्रवण, धनिष्ठा, उत्तराभाद्रपद।', en: 'Auspicious nakshatras: Rohini, Mrigashira, Uttara Phalguni, Hasta, Chitra, Swati, Anuradha, Uttarashadha, Shravana, Dhanishtha, Uttara Bhadrapada.' },
  tithi: { hi: 'शुभ तिथि: द्वितीया, तृतीया, पंचमी, सप्तमी, दशमी, एकादशी, त्रयोदशी। रिक्ता तिथि (चतुर्थी, नवमी, चतुर्दशी) त्याज्य।', en: 'Auspicious tithis: 2nd, 3rd, 5th, 7th, 10th, 11th, 13th. Rikta tithis (4th, 9th, 14th) are avoided.' },
  regional: [
    { region: { hi: 'उत्तर भारत', en: 'North India' }, text: { hi: 'बारात आगमन, द्वारपूजा, जयमाला, कन्यादान व अग्नि के चारों ओर सात फेरे (भाँवर) मुख्य हैं। प्रारंभिक फेरों में वधू आगे, अंतिम में वर आगे चलता है।', en: 'Baraat arrival, dwar-puja, jaimala, kanyadaan and seven pheras (bhanwar) around the fire are central. In the early pheras the bride leads; in the last, the groom.' } },
    { region: { hi: 'दक्षिण भारत', en: 'South India' }, text: { hi: 'विवाह प्रायः प्रातः होता है ("कल्याणम्")। "मांगल्यधारणम्" (मंगलसूत्र बाँधना) व "तलम्ब्रालु" (एक-दूसरे के सिर पर हल्दी-चावल डालना) प्रमुख रस्में हैं।', en: 'The wedding ("Kalyanam") is usually at dawn. "Mangalya-dharanam" (tying the mangalsutra) and "Talambralu" (showering turmeric rice on each other) are key.' } },
    { region: { hi: 'महाराष्ट्र', en: 'Maharashtra' }, text: { hi: 'वर-वधू के बीच अंतरपट (पर्दा) रखा जाता है; मंगलाष्टक के अंत में "सावधान" कहकर पर्दा हटता है और दोनों एक-दूसरे को देखते हैं।', en: 'An "antarpat" (cloth screen) is held between the couple; at the end of the Mangalashtak, on "Savadhan!", it is dropped and they behold each other.' } },
    { region: { hi: 'पश्चिम बंगाल', en: 'West Bengal' }, text: { hi: 'महिलाएँ "उलू ध्वनि" व शंख बजाती हैं। वधू पान के पत्तों से मुख ढककर वर के सात चक्कर ("सात पाक") लगाती है, फिर "शुभो दृष्टि"।', en: 'Women make the "ulu-dhwani" and blow conches. The bride, hiding her face with betel leaves, circles the groom seven times ("saat paak"), then "Shubho Drishti".' } },
  ],
  preparation: [
    { hi: 'मुख्य मंडप व हवन कुंड घर/वेन्यू के ईशान कोण (उत्तर-पूर्व) या पूर्व में हो; हवन कुंड मंडप के केंद्र में।', en: 'The main mandap and havan kund should face the Ishan (north-east) or east; the havan kund at the mandap’s centre.' },
    { hi: 'पूजा-आरंभ में वधू वर के दाहिनी ओर बैठे; सप्तपदी के बाद वह वामांगी बनकर बाईं ओर आती है।', en: 'At the start the bride sits on the groom’s right; after Saptapadi she becomes "vamangi" and moves to his left.' },
    { hi: 'वर-वधू को हल्दी, तेल व उबटन (हरिद्रा लेपन) लगाकर तन-मन शुद्ध किया जाता है।', en: 'The couple are anointed with turmeric, oil and ubtan (haridra-lepana) to purify body and mind.' },
    { hi: 'वस्त्र लाल/गुलाबी/पीले/केसरिया रंग के; काले, भूरे व गहरे नीले रंग शास्त्रों में वर्जित हैं।', en: 'Wear red / pink / yellow / saffron; black, brown and deep blue are prohibited by the shastras.' },
  ],
  samagri: [
    { name: { hi: 'दो रेशमी दुपट्टे (2 नग)', en: 'Two silk stoles (2)' }, reason: { hi: 'गठजोड़ (ग्रंथि बंधन) हेतु — दो जन्मों के बंधन का प्रतीक।', en: 'For the granthi-bandhan (knot) — symbol of a bond across lifetimes.' } },
    { name: { hi: 'मंगलसूत्र व सिंदूर (1 सेट)', en: 'Mangalsutra & sindoor (1 set)' }, reason: { hi: 'सुहाग के मुख्य प्रतीक, पति की दीर्घायु से जुड़े।', en: 'The chief symbols of marriage, tied to the husband’s long life.' } },
    { name: { hi: 'जयमाला — ताज़े फूलों की (2 नग)', en: 'Jaimala — fresh flowers (2)' }, reason: { hi: 'एक-दूसरे को जीवनसाथी रूप में स्वीकार करने का प्रतीक।', en: 'Symbol of accepting one another as life-partner.' } },
    { name: { hi: 'धान की खील / लाजा (~500 ग्राम)', en: 'Parched rice / laja (~500 g)' }, reason: { hi: 'लाजा होम में वधू के भाई द्वारा समृद्धि हेतु आहुति।', en: 'Offered by the bride’s brother in the Laja Hom for prosperity.' } },
    { name: { hi: 'सिल-लोढ़ा / पत्थर (1 नग)', en: 'Grinding stone (1)' }, reason: { hi: '"शिलारोहण" रस्म — वधू को चट्टान-सी दृढ़ रहने की प्रेरणा।', en: 'For "Shilarohan" — inspiring the bride to be firm as a rock.' } },
    { name: { hi: '7 सुपारी / चावल की ढेरी', en: 'Seven betel-nuts / rice mounds' }, reason: { hi: 'सप्तपदी के सात वचन व सात कदमों के प्रतीक।', en: 'Symbols of the seven vows and seven steps of Saptapadi.' } },
    { name: { hi: 'अक्षत, रोली, मौली, हल्दी की गाँठ', en: 'Akshat, roli, mauli, turmeric knot' }, reason: { hi: 'सभी प्रारंभिक पूजन व रक्षासूत्र बाँधने हेतु।', en: 'For all preliminary worship and tying the protective thread.' } },
    { name: { hi: 'कलश, नारियल, आम के पत्ते, दीपक, धूप, कपूर, पंचामृत, गंगाजल', en: 'Kalash, coconut, mango leaves, lamp, incense, camphor, panchamrit, Ganga-jal' }, reason: { hi: 'कलश स्थापना, दीप प्रज्वलन व देव-आवाहन हेतु आधारभूत सामग्री।', en: 'Core items for kalash sthapana, lamp-lighting and invoking the deities.' } },
  ],
  steps: [
    { title: { hi: 'घर की शुद्धि व दीप प्रज्वलन', en: 'Purify the home & light the lamp' }, what: { hi: 'घर व पूजा-स्थान की सफाई कर गंगाजल छिड़कें, मुख्य द्वार सजाएँ, दीपक जलाएँ।', en: 'Clean the home and puja area, sprinkle Ganga-jal, decorate the main door, and light the lamp.' }, why: { hi: 'शुद्ध व मंगलमय वातावरण में ही देवता विराजते हैं।', en: 'The deities abide only in a pure, auspicious atmosphere.' } },
    { title: { hi: 'आचमन व संकल्प', en: 'Achaman & Sankalp' }, what: { hi: 'जल से आचमन कर, हाथ में जल-अक्षत लेकर विवाह का संकल्प लें।', en: 'Sip water (achaman), then take water and akshat in hand and make the sankalp (resolve) for the wedding.' }, why: { hi: 'संकल्प से कर्म को दिशा व देव-साक्षी मिलती है।', en: 'The sankalp gives the rite its purpose and divine witness.' } },
    { title: { hi: 'गणेश पूजन व कलश स्थापना', en: 'Ganesha puja & Kalash sthapana' }, what: { hi: 'सर्वप्रथम श्री गणेश को पुष्प, अक्षत, दूर्वा व मोदक अर्पित करें; फिर कलश स्थापित करें।', en: 'First offer flowers, akshat, durva and modak to Ganesha; then establish the kalash.' }, why: { hi: 'हर मंगल कार्य निर्विघ्न पूर्ण हो — यही गणेश-पूजन का भाव।', en: 'So every auspicious task completes without obstacles — the essence of Ganesha worship.' }, deity: { hi: 'श्री गणेश', en: 'Lord Ganesha' } },
    { title: { hi: 'वर आगमन व मधुपर्क', en: 'Welcome & Madhuparka' }, what: { hi: 'मंडप पर वर के आने पर वधू के पिता दही-घी-शहद का मधुपर्क अर्पित कर स्वागत करते हैं।', en: 'On the groom’s arrival, the bride’s father welcomes him with madhuparka (curd, ghee, honey).' }, why: { hi: 'वर को साक्षात नारायण मानकर अतिथि-सत्कार की वैदिक परंपरा।', en: 'The Vedic custom of honouring the groom as Narayana himself.' } },
    { title: { hi: 'पाणिग्रहण (हथलेवा)', en: 'Panigrahana (hand-holding)' }, what: { hi: 'वधू का दाहिना हाथ वर के दाहिने हाथ में; बीच में हल्दी-गाँठ, सिक्का व पुष्प रख कलावा बाँधते हैं।', en: 'The bride’s right hand is placed in the groom’s right; a turmeric knot, coin and flower are held between, tied with the sacred thread.' }, why: { hi: 'वर आजीवन उत्तरदायित्व स्वीकार करता है।', en: 'The groom accepts lifelong responsibility.' }, deity: { hi: 'इंद्र, सूर्य व भग देव', en: 'Indra, Surya and Bhaga' } },
    { title: { hi: 'कन्यादान', en: 'Kanyadaan' }, what: { hi: 'वधू के माता-पिता जल, कुशा व अक्षत लेकर पुत्री का हाथ वर को सौंपते हैं व संकल्प-मंत्र पढ़ते हैं।', en: 'The bride’s parents, holding water, kusha and akshat, give their daughter’s hand to the groom with the sankalp mantras.' }, why: { hi: 'सनातन धर्म का सबसे बड़ा दान — कन्या को नए कुल की लक्ष्मी रूप में सौंपना।', en: 'The greatest daana of Sanatana Dharma — giving the daughter as the Lakshmi of a new family.' } },
    { title: { hi: 'अग्नि स्थापना व लाजा होम', en: 'Agni sthapana & Laja Hom' }, what: { hi: 'वेदी पर अग्नि प्रज्वलित होती है; वधू का भाई उसकी अंजलि में धान का लावा डालता है और दोनों मिलकर अग्नि में अर्पित करते हैं।', en: 'Fire is kindled on the vedi; the bride’s brother places parched rice in her palms and the couple offer it into the fire.' }, why: { hi: 'भाई बहन के नए घर की समृद्धि हेतु अग्निदेव से प्रार्थना करता है।', en: 'The brother prays to Agni for prosperity in his sister’s new home.' }, deity: { hi: 'अग्निदेव', en: 'Agni' } },
    { title: { hi: 'सप्तपदी (सात फेरे / सात कदम)', en: 'Saptapadi (seven steps/pheras)' }, what: { hi: 'अग्नि को साक्षी मानकर घड़ी की दिशा में सात फेरे/कदम लिए जाते हैं; हर कदम एक वचन है।', en: 'With Agni as witness, seven pheras/steps are taken clockwise; each step is a vow.' }, why: { hi: 'सात वचन पूर्ण होने पर ही विवाह आध्यात्मिक व शास्त्रीय रूप से पूर्ण माना जाता है।', en: 'Only on completing the seven vows is the marriage considered spiritually and scripturally complete.' }, deity: { hi: 'अग्निदेव', en: 'Agni' } },
    { title: { hi: 'सिंदूरदान, मंगलसूत्र व ग्रंथि बंधन', en: 'Sindoor-daan, Mangalsutra & Granthi-bandhan' }, what: { hi: 'वर सूर्यदेव का ध्यान कर वधू की माँग में सिंदूर भरता, मंगलसूत्र पहनाता है; फिर दोनों के दुपट्टों का गठजोड़ बाँधा जाता है।', en: 'Meditating on Surya, the groom fills the bride’s parting with sindoor and ties the mangalsutra; then their stoles are knotted together.' }, why: { hi: 'यह अटूट, आजीवन दांपत्य बंधन का प्रतीक है।', en: 'A symbol of the unbreakable, lifelong marital bond.' } },
  ],
  saptapadiMantras: [
    { pada: { hi: 'प्रथम पद — अन्न व पोषण', en: 'Step 1 — Food & Nourishment' }, sanskrit: 'ॐ इषे एकपदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'वर: पहला कदम अन्न के लिए। कन्या: यदि आप जीवनभर परिवार के पालन-पोषण व भोजन की जिम्मेदारी लें, तो मैं आपके वामांग आना स्वीकार करती हूँ।', en: 'Groom: the first step is for food. Bride: if you take lifelong responsibility for the family’s nourishment, I accept coming to your left side.' } },
    { pada: { hi: 'द्वितीय पद — बल व स्वास्थ्य', en: 'Step 2 — Strength & Health' }, sanskrit: 'ॐ ऊर्जे द्विपदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'कन्या: सुख-दुख, रोग या स्वास्थ्य में यदि आप मेरा साथ देंगे और मानसिक-शारीरिक रूप से मेरा बल बनेंगे, तो मैं आपके वामांग आना स्वीकार करती हूँ।', en: 'Bride: if in joy, sorrow, sickness or health you stand by me and become my strength in mind and body, I accept coming to your left.' } },
    { pada: { hi: 'तृतीय पद — धन व समृद्धि', en: 'Step 3 — Wealth & Prosperity' }, sanskrit: 'ॐ रायस्पोषाय त्रिपदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'कन्या: यदि आप धन-धान्य के प्रबंधन में मेरा सम्मान करेंगे और परिवार की समृद्धि हेतु प्रयासरत रहेंगे, तो मैं आपके वामांग आना स्वीकार करती हूँ।', en: 'Bride: if you respect me in managing wealth and strive for the family’s prosperity, I accept coming to your left.' } },
    { pada: { hi: 'चतुर्थ पद — सुख व परिवार', en: 'Step 4 — Happiness & Family' }, sanskrit: 'ॐ मायोभव्याय चतुष्पदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'कन्या: परिवार के रीति-रिवाजों, उत्सवों व सुख-सुविधाओं में यदि आप मेरी इच्छाओं का ध्यान रखेंगे, तो मैं आपके वामांग आना स्वीकार करती हूँ।', en: 'Bride: if in family customs, festivals and comforts you honour my wishes, I accept coming to your left.' } },
    { pada: { hi: 'पंचम पद — संतान व पशुधन', en: 'Step 5 — Progeny & Assets' }, sanskrit: 'ॐ प्रजाभ्यः पंचपदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'कन्या: संतान के पालन-पोषण, उनकी शिक्षा तथा घर की संपत्ति की रक्षा में यदि आप मेरी सलाह लेंगे, तो मैं आपके वामांग आना स्वीकार करती हूँ।', en: 'Bride: if in raising and educating our children and protecting our home you take my counsel, I accept coming to your left.' } },
    { pada: { hi: 'षष्ठम पद — ऋतु व संगति', en: 'Step 6 — Seasons & Companionship' }, sanskrit: 'ॐ ऋतुभ्यः षट्पदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'कन्या: जीवन के सभी उतार-चढ़ावों में आप मेरे सच्चे मित्र बनकर रहेंगे और समाज में कभी मेरा अपमान नहीं करेंगे, तो मैं आपके वामांग आना स्वीकार करती हूँ।', en: 'Bride: if through all of life’s ups and downs you remain my true friend and never dishonour me in society, I accept coming to your left.' } },
    { pada: { hi: 'सप्तम पद — आजीवन मित्रता', en: 'Step 7 — Lifelong Friendship' }, sanskrit: 'ॐ सखे सप्तपदी भव सा मामनुव्रता भव विष्णुस्त्वानयतु।\nपुत्रान् विन्दावहै बहूंस्ते सन्तु जरदष्टयः॥', vachan: { hi: 'कन्या: आज से आप पराई स्त्रियों को माता-बहन के समान समझेंगे और हमारा यह प्रेम व विश्वास आजीवन बना रहेगा, तो मैं अपना सर्वस्व सौंपकर आपके वामांग आती हूँ।', en: 'Bride: from today you will regard other women as mother and sister, and our love and trust will last a lifetime; so I give my all and come to your left.' } },
  ],
  mantras: [
    { title: { hi: 'गणेश वंदना', en: 'Ganesha Vandana' }, sanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥', roman: 'Vakratunda Mahakaya Suryakoti Samaprabha.\nNirvighnam kuru me deva sarvakaryeshu sarvada.', meaning: { hi: 'हे वक्रतुंड, महाकाय, करोड़ों सूर्य के समान तेजस्वी गणेश! मेरे सभी कार्य सदा निर्विघ्न पूर्ण करें।', en: 'O curved-trunk, mighty, radiant as a million suns — O Ganesha, make all my tasks ever free of obstacles.' }, when: { hi: 'सर्वप्रथम, कार्य आरंभ में', en: 'First of all, at the very start' }, count: '3 / 11' },
    { title: { hi: 'दीप प्रज्वलन', en: 'Lighting the lamp' }, sanskrit: 'शुभं करोति कल्याणम् आरोग्यं धनसम्पदा।\nशत्रुबुद्धिविनाशाय दीपज्योतिर्नमोऽस्तु ते॥', roman: 'Shubham karoti kalyanam arogyam dhana-sampada.\nShatru-buddhi-vinashaya deep-jyotir namo’stu te.', meaning: { hi: 'यह दीपक शुभ, कल्याण, आरोग्य व धन-संपदा देने वाला है; शत्रु-बुद्धि के नाश हेतु उस दीप-ज्योति को नमन।', en: 'This lamp bestows auspiciousness, well-being, health and wealth; salutations to that lamp-light which destroys hostile thoughts.' }, when: { hi: 'दीपक जलाते समय', en: 'While lighting the lamp' } },
    { title: { hi: 'कलश स्थापना', en: 'Kalash sthapana' }, sanskrit: 'कलशस्य मुखे विष्णुः कण्ठे रुद्रः समाश्रितः।\nमूले तत्र स्थितो ब्रह्मा मध्ये मातृगणाः स्मृताः॥', roman: 'Kalashasya mukhe Vishnuh kanthe Rudrah samashritah.\nMule tatra sthito Brahma madhye matriganah smritah.', meaning: { hi: 'कलश के मुख में विष्णु, कंठ में रुद्र, मूल में ब्रह्मा तथा मध्य में मातृगण विराजते हैं।', en: 'In the kalash’s mouth dwells Vishnu, in its neck Rudra, at its base Brahma, and in its middle the Divine Mothers.' }, when: { hi: 'कलश स्थापित करते समय', en: 'While establishing the kalash' } },
    { title: { hi: 'गणेश मूल मंत्र', en: 'Ganesha root mantra' }, sanskrit: 'ॐ गं गणपतये नमः॥', roman: 'Om Gam Ganapataye Namah.', meaning: { hi: 'गणपति को नमस्कार — विघ्नहर्ता का आवाहन।', en: 'Salutations to Ganapati — invoking the remover of obstacles.' }, when: { hi: 'गणेश पूजन में जप', en: 'Japa during Ganesha puja' }, count: '11 / 21 / 108' },
    { title: { hi: 'द्वार पूजा / मधुपर्क', en: 'Dwar Puja / Madhuparka' }, sanskrit: 'ॐ मधुपर्को मया दत्तो गृहाण त्वं नमोऽस्तु ते।\nसुस्वागतं ते वरद मम गेहे नमोऽस्तु ते॥', roman: 'Om madhuparko maya datto grihana tvam namo’stu te.\nSusvagatam te varada mama gehe namo’stu te.', meaning: { hi: 'हे वर! मैं यह मधुपर्क (दही-घी-शहद) अर्पित करता हूँ, कृपया स्वीकार करें। मेरे घर आपका स्वागत है — आपको नमस्कार।', en: 'O groom, I offer this madhuparka (curd, ghee, honey) — please accept it. You are welcome to my home — salutations to you.' }, when: { hi: 'वर के मंडप-आगमन पर स्वागत के समय', en: 'When welcoming the groom at the mandap' } },
    { title: { hi: 'कन्यादान संकल्प', en: 'Kanyadaan Sankalp' }, sanskrit: 'कन्यां कनकसम्पन्नां कनकाभरणैर्युताम्।\nदास्यामि विष्णवे तुभ्यं ब्रह्मलोकजिगीषया॥', roman: 'Kanyam kanaka-sampannam kanakabharanair-yutam.\nDasyami Vishnave tubhyam brahma-loka-jigishaya.', meaning: { hi: 'सुवर्ण व आभूषणों से युक्त इस कन्या को, ब्रह्मलोक की प्राप्ति की कामना से, मैं वर (साक्षात विष्णु-रूप) को दान करता हूँ।', en: 'This daughter, adorned with gold and ornaments, I give to you — the groom, Vishnu himself — with the wish to attain Brahmaloka.' }, when: { hi: 'कन्यादान के समय माता-पिता द्वारा', en: 'By the parents at Kanyadaan' } },
    { title: { hi: 'पाणिग्रहण मंत्र', en: 'Panigrahana Mantra' }, sanskrit: 'ॐ गृभ्णामि ते सुप्रजास्त्वाय हस्तं मया पत्या जरदष्टिर्यथासः।\nभगो अर्यमा सविता पुरन्धिर्मह्यं त्वादुर्गार्हपत्याय देवाः॥', roman: 'Om gribhnami te suprajastvaya hastam maya patya jaradashtir yathasah.\nBhago Aryama Savita Purandhir mahyam tvadur garhapatyaya devah.', meaning: { hi: 'हे कल्याणी! श्रेष्ठ संतान व सुखी जीवन हेतु मैं वृद्धावस्था तक तुम्हारा हाथ थाम रहा हूँ। भग, अर्यमा, सविता आदि देवों ने गृहस्थ धर्म के पालन हेतु तुम्हें मुझे सौंपा है।', en: 'O blessed one, for noble progeny and a happy life I take your hand until old age. The gods Bhaga, Aryama and Savita have given you to me to uphold the householder’s dharma.' }, when: { hi: 'हाथ थामते समय (हथलेवा)', en: 'While taking the hand' } },
    { title: { hi: 'लाजा होम (खील की आहुति)', en: 'Laja Hom (parched-rice offering)' }, sanskrit: 'ॐ अर्यमणं देवं कन्या अग्निमयक्षत।\nस नो अर्यमा देवः प्रेतो मुञ्चतु मा पतेः स्वाहा।\nइदम् अर्यमणे देवाय, इदं न मम॥', roman: 'Om Aryamanam devam kanya agnim-ayakshata.\nSa no Aryama devah preto munchatu ma pateh svaha.\nIdam Aryamane devaya, idam na mama.', meaning: { hi: 'कन्या प्रार्थना करती है — हे अग्निदेव, मेरा यह विवाह-बंधन दृढ़ करें। अर्यमा देव मुझे मायके के बंधनों से मुक्त करें, पर पति के घर व प्रेम से कभी अलग न करें। यह आहुति अर्यमा देव को अर्पित है, मेरी नहीं।', en: 'The bride prays — O Agni, strengthen this marriage bond. May Aryama free me from my parental ties, but never part me from my husband’s home and love. This offering is for Aryama, not for myself.' }, when: { hi: 'भाई द्वारा खील डालने पर वर-वधू की संयुक्त आहुति', en: 'The couple’s joint offering as the brother pours the parched rice' } },
    { title: { hi: 'राष्ट्रभृत / प्रधान होम', en: 'Rashtrabhrit / Pradhan Hom' }, sanskrit: 'ॐ ऋताषाड् ऋतधामाग्निर्गन्धर्वस्तस्यौषधयोऽप्सरसो मुदो नाम।\nस न इदं ब्रह्म क्षत्रं पातु, तस्मै स्वाहा, वाट्॥', roman: 'Om ritashad ritadhama agnir gandharvas tasyaushadhayo’psaraso mudo nama.\nSa na idam brahma kshatram patu, tasmai svaha, vat.', meaning: { hi: 'सत्य को धारण करने वाले, दिव्य प्रकाश-स्वरूप अग्निदेव हमारे इस नए जीवन, कुल व शक्तियों की रक्षा करें। यह आहुति उन्हें समर्पित है।', en: 'May Agni — upholder of truth and embodiment of divine light — protect our new life, lineage and strengths. This offering is dedicated to him.' }, when: { hi: 'वर-वधू की संयुक्त घी-आहुति', en: 'The couple’s joint ghee offering' } },
    { title: { hi: 'मंगल्य (मंगलसूत्र) मंत्र', en: 'Mangalya (Mangalsutra) mantra' }, sanskrit: 'माङ्गल्यं तन्तुनानेन जगज्जीवनहेतुना।\nकण्ठे बध्नामि सुभगे त्वं जीव शरदः शतम्॥', roman: 'Mangalyam tantunanena jagaj-jivana-hetuna.\nKanthe badhnami subhage tvam jiva sharadah shatam.', meaning: { hi: 'हे सौभाग्यवती! जगत के जीवन का हेतु यह मंगल-सूत्र मैं तुम्हारे गले में बाँध रहा हूँ; तुम सौ वर्ष सुखपूर्वक जियो।', en: 'O blessed one, I tie this auspicious thread — cause of the world’s life — around your neck; may you live a hundred autumns.' }, when: { hi: 'मंगलसूत्र पहनाते समय', en: 'While tying the mangalsutra' } },
    { title: { hi: 'सिंदूरदान मंत्र', en: 'Sindoor-daan Mantra' }, sanskrit: 'ॐ सुमङ्गलीरियं वधूरिमां समेत पश्यत।\nसौभाग्यमस्यै दत्त्वा याथास्तं वि परेतन॥', roman: 'Om sumangaliriyam vadhur imam sameta pashyata.\nSaubhagyam asyai dattva yathastam vi paretana.', meaning: { hi: 'यह वधू परम सौभाग्यवती है — आप सब आकर इसे देखें, इसे सौभाग्य का आशीर्वाद देकर अपने-अपने घर लौटें। (ऋग्वेद 10.85.33)', en: 'This bride is most auspicious — come, behold her, bless her with good fortune, and return to your homes. (Rigveda 10.85.33)' }, when: { hi: 'माँग में सिंदूर भरते समय', en: 'While filling the parting with sindoor' } },
  ],
  mangalashtak: {
    sanskrit: 'मङ्गलं भगवान् विष्णुः मङ्गलं गरुडध्वजः।\nमङ्गलं पुण्डरीकाक्षः मङ्गलायतनो हरिः॥\nतदेव लग्नं सुदिनं तदेव ताराबलं चन्द्रबलं तदेव।\nविद्याबलं दैवबलं तदेव लक्ष्मीपते तेऽङ्घ्रियुगं स्मरामि॥',
    note: { hi: 'विवाह के मुख्य क्षण पर देवताओं के आवाहन हेतु मंगलाष्टक पढ़े जाते हैं (महाराष्ट्र में अंत में "सावधान" कहकर अंतरपट हटता है)।', en: 'The Mangalashtak is recited at the key moment to invoke the deities (in Maharashtra the antarpat is dropped on the final "Savadhan").' },
  },
  aartis: [
    { title: { hi: 'श्री गणेश आरती', en: 'Shri Ganesha Aarti' }, lines: 'जय गणेश जय गणेश जय गणेश देवा।\nमाता जाकी पार्वती, पिता महादेवा॥' },
    { title: { hi: 'ॐ जय जगदीश हरे', en: 'Om Jai Jagdish Hare' }, lines: 'ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे।\nभक्त जनों के संकट, क्षण में दूर करे॥' },
    { title: { hi: 'श्री लक्ष्मी-नारायण आरती', en: 'Shri Lakshmi-Narayana Aarti' }, lines: 'ॐ जय लक्ष्मी नारायणा, स्वामी जय लक्ष्मी नारायणा।\n(वर-वधू लक्ष्मी-नारायण स्वरूप माने जाते हैं — पूरी आरती परिवार सहित गाएँ।)' },
  ],
  dos: [
    { hi: 'शुभ मुहूर्त का पालन करें व वर-वधू का मुख पूर्व/उत्तर दिशा में रखें।', en: 'Honour the muhurat and keep the couple facing east/north.' },
    { hi: 'कन्यादान के समय माता-पिता का मन शांत व प्रसन्न रहे।', en: 'At kanyadaan the parents’ minds should be calm and glad.' },
    { hi: 'सप्तपदी के समय हर वचन के अर्थ पर पूरे मन से ध्यान दें।', en: 'During Saptapadi, dwell wholeheartedly on the meaning of each vow.' },
    { hi: 'परिवार के बड़ों का आशीर्वाद लें; संयम व श्रद्धा रखें।', en: 'Take the elders’ blessings; keep restraint and devotion.' },
  ],
  donts: [
    { hi: 'मंडप में चमड़े की वस्तुएँ (बेल्ट, पर्स) या जूते पहनकर न जाएँ।', en: 'Do not enter the mandap in leather items (belt, purse) or shoes.' },
    { hi: 'रस्मों के बीच बार-बार मोबाइल/सेल्फी से ध्यान न भटकाएँ।', en: 'Do not break focus with repeated phone use / selfies during the rites.' },
    { hi: 'मंडप के पास क्रोध, विवाद या अपशब्दों का प्रयोग न करें।', en: 'No anger, quarrels or harsh words near the mandap.' },
    { hi: 'नशे का सेवन व अनावश्यक व्यवधान से बचें।', en: 'Avoid intoxicants and needless interruptions.' },
  ],
  mistakes: [
    { hi: 'गठजोड़ (ग्रंथि बंधन) को ढीला बाँधना — इसे मजबूती से बाँधें; बीच में खुलना अशुभ माना जाता है।', en: 'Tying the granthi-bandhan loosely — tie it firmly; it coming undone mid-rite is deemed inauspicious.' },
    { hi: 'जल्दबाज़ी में वर-वधू को दक्षिण दिशा की ओर बैठा देना — शास्त्रों में वर्जित।', en: 'Hastily seating the couple facing south — prohibited by the shastras.' },
    { hi: 'समय की कमी से फेरों की संख्या घटाना या मंत्र छोटे करवाना — सात फेरे व सात वचन पूर्ण होने चाहिए।', en: 'Cutting the number of pheras or shortening mantras to save time — all seven pheras and vows must be completed.' },
  ],
  faqs: [
    { q: { hi: 'क्या गणेश पूजा आवश्यक है?', en: 'Is Ganesha puja necessary?' }, a: { hi: 'अधिकांश वैदिक व पारंपरिक विवाहों में गणेश पूजन को मंगलारंभ माना जाता है।', en: 'In most Vedic and traditional weddings, Ganesha puja is the auspicious beginning.' } },
    { q: { hi: 'क्या हर विवाह में मंगलसूत्र होता है?', en: 'Does every wedding include a mangalsutra?' }, a: { hi: 'नहीं — यह क्षेत्रीय व सामुदायिक परंपरा पर निर्भर करता है।', en: 'No — it depends on regional and community custom.' } },
    { q: { hi: 'फेरों में कौन आगे चलता है?', en: 'Who leads during the pheras?' }, a: { hi: 'प्रायः पहले 3-4 फेरों में वधू आगे (गृहस्थी का प्रतीक), अंतिम में वर आगे (धर्म-मोक्ष का प्रतीक)।', en: 'Usually the bride leads the first 3–4 pheras (household duty); the groom leads the last (dharma & moksha).' } },
    { q: { hi: 'कन्यादान केवल माता-पिता ही कर सकते हैं?', en: 'Can only parents perform kanyadaan?' }, a: { hi: 'यदि माता-पिता न हों, तो परिवार के कोई भी बड़े (चाचा-चाची, भाई-भाभी) महासंकल्प ले सकते हैं।', en: 'If the parents are absent, any elder of the family (uncle/aunt, brother/sister-in-law) may take the sankalp.' } },
    { q: { hi: 'विवाह के बाद वधू किस ओर बैठती है?', en: 'On which side does the bride sit after marriage?' }, a: { hi: 'विवाह से पहले दाहिनी ओर; सप्तपदी व सुहाग रस्म के बाद वह वामांगी बनकर बाईं ओर बैठती है।', en: 'On the right before marriage; after Saptapadi she becomes vamangi and sits on the left.' } },
  ],
  estTime: { hi: '3–4 घंटे', en: '3–4 hours' },
  difficulty: { hi: 'उच्च · पुरोहित आवश्यक', en: 'Advanced · priest needed' },
  disclaimer: {
    hi: 'यह मार्गदर्शन सामान्य वैदिक/शास्त्रीय परंपरा पर आधारित है। हिंदू विवाह की एक ही सार्वभौमिक विधि नहीं होती — यह वेद, गृह्यसूत्र, धर्मशास्त्र, क्षेत्र व समुदाय अनुसार भिन्न होती है। अपने कुलाचार, परिवार की परंपरा एवं योग्य आचार्य/पुरोहित के निर्देशों का पालन सर्वोपरि है।',
    en: 'This guidance follows general Vedic/shastric tradition. There is no single universal Hindu wedding procedure — it varies by Veda, Grihyasutra, Dharmashastra, region and community. Following your kulachar (family custom) and a qualified purohit’s guidance is supreme.',
  },
};

export const CURATED: Record<string, CuratedOccasion> = { vivah: VIVAH };
export const curatedOccasion = (id: string): CuratedOccasion | undefined => CURATED[id];
