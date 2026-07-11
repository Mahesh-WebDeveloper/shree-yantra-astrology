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

/* ─────────────────────────────────────────────────────────────────────────
 * GRIHA PRAVESH (गृह प्रवेश) — new-home entry / Vastu Shanti puja.
 * Cross-referenced: karmkandvidhi.in (Griha Pravesh paddhati 1–6), 99pandit &
 * devdarshan samagri guides, trimbakeshwar.org, NoBroker/Astroyogi (3 types &
 * muhurat), Rigveda Vastoshpati Sukta 7.54–7.55 (mantras). Kulachar + a
 * qualified purohit's guidance is supreme; regional customs vary.
 * ──────────────────────────────────────────────────────────────────────── */
const GRAH_PRAVESH: CuratedOccasion = {
  intro: {
    hi: 'गृह प्रवेश का अर्थ है किसी नए घर में विधि-विधान व मंत्रोच्चार के साथ पहली बार शुभ प्रवेश करना। सनातन परंपरा में घर केवल ईंट-पत्थर का ढाँचा नहीं, बल्कि एक जीवंत ऊर्जा-क्षेत्र है जिसकी रक्षा "वास्तु पुरुष" करते हैं। गृह प्रवेश पूजा (वास्तु शांति) से निर्माण के दौरान हुए दोषों का शमन होता है, नकारात्मक ऊर्जा दूर होती है और घर में सुख-समृद्धि, शांति व माँ लक्ष्मी का वास होता है। शास्त्रानुसार बिना विधिवत गृह प्रवेश के नए घर में रहना दोषकारक माना गया है।',
    en: 'Griha Pravesh is the first, ritually-sanctioned entry into a new home, accompanied by mantras. In Sanatana tradition a house is not mere brick and stone but a living energy-field guarded by the "Vastu Purusha". The Griha Pravesh puja (a form of Vastu Shanti) neutralises defects that arise during construction, clears negative energy, and invites happiness, prosperity, peace and the residence of Goddess Lakshmi. Scripturally, occupying a new home without a proper Griha Pravesh is considered inauspicious.',
  },
  significance: [
    { hi: 'गृह प्रवेश तीन प्रकार का होता है — (1) अपूर्व: बिलकुल नए बने घर में पहली बार प्रवेश, (2) सपूर्व: यात्रा/प्रवास से लौटकर अपने घर में पुनः प्रवेश, (3) द्वान्धव: आपदा या मरम्मत/जीर्णोद्धार के बाद पुनः प्रवेश।', en: 'Griha Pravesh is of three kinds — (1) Apurva: first-ever entry into a brand-new house, (2) Sapurva: re-entry into your own home after travel/absence, (3) Dwandwah: re-entry after a calamity or major repair/renovation.' },
    { hi: 'वास्तु शांति से घर बनाते समय (खुदाई, कटाई, निर्माण में) अनजाने हुए जीव-हिंसा व वास्तु-दोषों का शमन होता है।', en: 'Vastu Shanti atones for the unintended harm and vastu-doshas caused during construction (digging, cutting, building).' },
    { hi: 'नकारात्मक ऊर्जा व नज़र-दोष दूर होकर घर सकारात्मक तरंगों से भर जाता है, जिससे परिवार को आरोग्य व मानसिक शांति मिलती है।', en: 'Negative energy and the evil eye are cleared, filling the home with positive vibrations that bring the family health and peace of mind.' },
    { hi: 'देवी लक्ष्मी, गणेश व वास्तु देवता के आवाहन से घर में धन-धान्य, समृद्धि व स्थायी सौभाग्य का वास होता है।', en: 'Invoking Lakshmi, Ganesha and the Vastu Devata brings lasting wealth, prosperity and good fortune into the home.' },
  ],
  history: {
    hi: 'गृह प्रवेश की जड़ें वेदों में हैं — ऋग्वेद के 7वें मंडल का "वास्तोष्पति सूक्त" (7.54–7.55) गृह के अधिपति देव से घर को सुखद, रोगरहित व कल्याणकारी बनाने की प्रार्थना करता है। यही सूक्त आज भी वास्तु शांति व गृह प्रवेश विधि का मूल आधार है।',
    en: 'Griha Pravesh is rooted in the Vedas — the "Vastoshpati Sukta" of the Rigveda\'s 7th Mandala (7.54–7.55) prays to the Lord of the Dwelling to make the home pleasant, disease-free and benevolent. This very hymn remains the basis of Vastu Shanti and the Griha Pravesh rite today.',
  },
  muhurat: {
    hi: 'गृह प्रवेश सदैव शुभ मुहूर्त — शुभ मास, नक्षत्र, तिथि, वार व स्थिर लग्न — में किया जाता है। योग्य पुरोहित लग्न व चंद्रबल देखकर अंतिम मुहूर्त तय करते हैं। नीचे दिए बटन से आप अपना शुभ गृह प्रवेश मुहूर्त सीधे इसी ऐप में देख सकते हैं।',
    en: 'Griha Pravesh is always done in an auspicious muhurat — a good month, nakshatra, tithi, weekday and a stable (sthira) lagna. A qualified purohit fixes the final time after checking the lagna and Moon strength. Use the button below to check your Griha Pravesh muhurat right here in the app.',
  },
  muhuratKey: 'griha-pravesh',
  shubhMonths: { hi: 'श्रेष्ठ मास: वैशाख, ज्येष्ठ, माघ व फाल्गुन। शुभ वार: गुरुवार सर्वश्रेष्ठ; सोमवार, बुधवार व शुक्रवार भी शुभ (मंगल व रविवार से बचें)।', en: 'Best months: Vaishakh, Jyeshtha, Magh and Phalgun. Best weekday: Thursday (also Monday, Wednesday, Friday) — avoid Tuesday and Sunday.' },
  varjit: { hi: 'वर्जित काल: चातुर्मास (देवशयनी से देवउठनी एकादशी तक), खरमास/मलमास (सूर्य धनु/मीन में), पितृपक्ष, ग्रहण, अमावस्या — इनमें गृह प्रवेश नहीं करते।', en: 'Avoided: Chaturmas (Devshayani to Devuthani Ekadashi), Kharmas/Malmas (Sun in Sagittarius/Pisces), Pitru Paksha, eclipses and Amavasya.' },
  nakshatra: { hi: 'शुभ नक्षत्र: रोहिणी, मृगशिरा, चित्रा, अनुराधा, रेवती तथा तीनों उत्तरा (उ. फाल्गुनी, उ. आषाढ़ा, उ. भाद्रपद)।', en: 'Auspicious nakshatras: Rohini, Mrigashira, Chitra, Anuradha, Revati and the three Uttaras (U. Phalguni, U. Ashadha, U. Bhadrapada).' },
  tithi: { hi: 'शुभ तिथि: द्वितीया, तृतीया, पंचमी, सप्तमी, दशमी, एकादशी, त्रयोदशी। रिक्ता तिथि (चतुर्थी, नवमी, चतुर्दशी) व अमावस्या त्याज्य। शुभ लग्न: स्थिर लग्न (वृषभ, सिंह, वृश्चिक, कुम्भ)।', en: 'Auspicious tithis: 2nd, 3rd, 5th, 7th, 10th, 11th, 13th. Avoid Rikta tithis (4th, 9th, 14th) and Amavasya. Best lagna: a fixed sign (Taurus, Leo, Scorpio, Aquarius).' },
  regional: [
    { region: { hi: 'उत्तर भारत', en: 'North India' }, text: { hi: 'वास्तु शांति व हवन प्रधान; मुख्य द्वार पर आम-पत्तों का तोरण, स्वस्तिक व रंगोली। गृहस्वामिनी कलश लेकर दाहिना पैर पहले रखते हुए प्रवेश करती हैं; रसोई में पहला व्यंजन हलवा या खीर बनता है।', en: 'Vastu Shanti and havan are central; a mango-leaf toran, swastik and rangoli at the door. The lady of the house enters first with a kalash, right foot first; the first dish cooked is halwa or kheer.' } },
    { region: { hi: 'दक्षिण भारत (गृह प्रवेशम्)', en: 'South India (Gruha Pravesham)' }, text: { hi: 'होमम् के बाद नए पात्र में दूध उबालने की रस्म; कहीं-कहीं माला पहनाई गई गाय-बछड़े को पहले प्रवेश कराकर हर कमरे में घुमाया जाता है; पोंगल/मीठा भात पकाया जाता है।', en: 'After the homam, milk is boiled in a new vessel; in some communities a garlanded cow (and calf) enters first and is led through every room; pongal/sweet rice is prepared.' } },
    { region: { hi: 'महाराष्ट्र', en: 'Maharashtra' }, text: { hi: 'वास्तु शांति व सत्यनारायण पूजा; गृहिणी चावल-सिक्कों से भरा कलश लेकर, दहलीज़ पर रखे अनाज-माप को दाहिने पैर से गिराकर भीतर आती हैं।', en: 'Vastu Shanti and Satyanarayan puja; the woman enters with a rice-and-coin-filled pot, toppling a measure of grain at the threshold with her right foot.' } },
    { region: { hi: 'गुजरात', en: 'Gujarat' }, text: { hi: 'कलश व स्वस्तिक पूजन; गृहिणी चावल भरा कलश लेकर मांगलिक चिह्नों के साथ प्रवेश करती हैं, सामूहिक भजन-कीर्तन होता है।', en: 'Kalash and swastik worship; the woman enters with a rice-filled pot amid auspicious marks, followed by communal bhajan-kirtan.' } },
    { region: { hi: 'बंगाल (गृह प्रबेश)', en: 'Bengal (Griha Prabesh)' }, text: { hi: 'शंख-ध्वनि व उलू-ध्वनि के साथ प्रवेश; लक्ष्मी-नारायण व गृह-देवता का पूजन, अल्पना (रंगोली) व नए घर में मिठाई।', en: 'Entry amid conch and ululation (ulu-dhwani); worship of Lakshmi-Narayan and the household deity, alpana (rangoli) and sweets in the new home.' } },
  ],
  preparation: [
    { hi: 'घर रहने-योग्य पूर्ण अवस्था में हो (छत, दरवाज़े, रसोई तैयार) — अधूरे/निर्माणाधीन घर में गृह प्रवेश वर्जित है।', en: 'The house must be complete enough to live in (roof, doors, kitchen usable) — Griha Pravesh in an unfinished house is forbidden.' },
    { hi: 'पूरे घर की सफाई कर गंगाजल छिड़कें; मुख्य द्वार पर आम-पत्तों का तोरण, हल्दी-कुमकुम से स्वस्तिक व दहलीज़ पर रंगोली बनाएँ।', en: 'Clean the whole house and sprinkle Ganga-jal; hang a mango-leaf toran, draw a swastik in haldi-kumkum, and make rangoli at the threshold.' },
    { hi: 'हवन कुंड व देव-स्थापना ईशान (उत्तर-पूर्व) कोण में रखें; समस्त सामग्री पहले से जुटा लें ताकि पूजा बीच में न रुके।', en: 'Place the havan kund and deities in the Ishan (north-east) corner; gather all samagri in advance so the puja is not interrupted.' },
    { hi: 'कलश तैयार करें — जल, सिक्का, सुपारी व अक्षत भरकर, आम-पल्लव व नारियल सहित। गृहस्वामिनी यही कलश लेकर सबसे पहले प्रवेश करती हैं।', en: 'Prepare the kalash — filled with water, a coin, betel-nut and akshat, topped with mango-pallav and a coconut. The lady of the house enters first carrying it.' },
    { hi: 'संभव हो तो प्रवेश से पूर्व गौ-पूजा करें; पति-पत्नी उस दिन व्रत/उपवास रख सकते हैं।', en: 'If possible, perform gau-puja before entering; the couple may keep a fast that day.' },
  ],
  samagri: [
    { name: { hi: 'कलश (तांबा/पीतल) — 1–5', en: 'Kalash (copper/brass) — 1–5' }, reason: { hi: 'पवित्र केंद्र-बिंदु; इसमें समस्त देवता, तीर्थ व जल-तत्व का आवाहन होता है।', en: 'The sacred focal vessel; all deities, tirthas and the water element are invoked in it.' } },
    { name: { hi: 'नारियल (साबुत) — 2', en: 'Coconut (whole) — 2' }, reason: { hi: 'पूर्णता व शुभता का प्रतीक; कलश के मुख पर रखा जाता है।', en: 'Symbol of wholeness and auspiciousness; placed atop the kalash.' } },
    { name: { hi: 'आम के पत्ते (पल्लव) — 8+', en: 'Mango leaves (pallav) — 8+' }, reason: { hi: 'द्वार-तोरण व कलश-मुख हेतु; शुद्धता व मंगल के सूचक।', en: 'For the door-toran and kalash mouth; signify purity and auspiciousness.' } },
    { name: { hi: 'रोली, कुमकुम, हल्दी व अक्षत', en: 'Roli, kumkum, haldi & akshat' }, reason: { hi: 'तिलक, स्वस्तिक व देव-अर्पण हेतु; अखंड चावल समृद्धि का प्रतीक।', en: 'For tilak, swastik and offerings; unbroken rice symbolises prosperity.' } },
    { name: { hi: 'मौली/कलावा व सिंदूर', en: 'Moli/kalava & sindoor' }, reason: { hi: 'रक्षासूत्र (कलश व कलाई पर) तथा देवी-पूजन व मांगल्य हेतु।', en: 'Protective thread (on kalash & wrist) and for goddess worship & auspiciousness.' } },
    { name: { hi: 'नवधान्य (9 अन्न)', en: 'Navdhanya (nine grains)' }, reason: { hi: 'नवग्रह के प्रतीक; नवग्रह शांति व स्थापना हेतु।', en: 'Symbols of the nine planets; for navagraha shanti and sthapana.' } },
    { name: { hi: 'पंचामृत (दूध, दही, घी, शहद, शक्कर)', en: 'Panchamrit (milk, curd, ghee, honey, sugar)' }, reason: { hi: 'देव-अभिषेक व शुद्धिकरण हेतु आधारभूत सामग्री।', en: 'Core material for divine abhishek (bathing) and purification.' } },
    { name: { hi: 'गंगाजल', en: 'Ganga-jal' }, reason: { hi: 'सर्वोच्च शुद्धिकारक; छिड़काव व पूजन में प्रयुक्त।', en: 'The supreme purifier; used for sprinkling and worship.' } },
    { name: { hi: 'घी का दीपक व कपूर', en: 'Ghee lamp & camphor' }, reason: { hi: 'प्रकाश = ज्ञान व लक्ष्मी; अखंड ज्योति व आरती हेतु।', en: 'Light = knowledge & Lakshmi; for the ever-burning lamp and aarti.' } },
    { name: { hi: 'धूप/अगरबत्ती व पुष्प-माला', en: 'Dhoop/incense & flower garlands' }, reason: { hi: 'सुगंध, सकारात्मक ऊर्जा व देव-अर्पण।', en: 'Fragrance, positive energy and offerings to the deities.' } },
    { name: { hi: 'पान, सुपारी, गुड़ व पंचमेवा', en: 'Betel leaf, supari, jaggery & dry fruits' }, reason: { hi: 'देवता-आसन, संकल्प, मिठास व भोग हेतु।', en: 'For the deity seat, sankalp, sweetness and bhog.' } },
    { name: { hi: 'गणेश-लक्ष्मी मूर्ति/चित्र — 1 सेट', en: 'Ganesh-Lakshmi idol/photo — 1 set' }, reason: { hi: 'प्रथम-पूज्य विघ्नहर्ता व धन-दात्री; मुख्य आराध्य देव।', en: 'The first-worshipped remover of obstacles and giver of wealth; the principal deities.' } },
    { name: { hi: 'हवन कुंड व हवन सामग्री', en: 'Havan kund & havan samagri' }, reason: { hi: 'अग्नि को आहुति देकर शुद्धि व देव-तृप्ति हेतु।', en: 'For oblations into the sacred fire — purification and pleasing the deities.' } },
    { name: { hi: 'आम की समिधा, जौ, काला तिल व घी', en: 'Mango samidha, barley, black sesame & ghee' }, reason: { hi: 'हवन-ईंधन व आहुति; समृद्धि तथा नकारात्मकता-निवारण।', en: 'Havan fuel and oblations; for prosperity and removing negativity.' } },
    { name: { hi: 'नवग्रह समिधा (9 प्रकार की लकड़ी)', en: 'Navagraha samidha (nine woods)' }, reason: { hi: 'नवग्रह हवन हेतु; ग्रह-शांति व अनुकूलता।', en: 'For the navagraha homa; planetary peace and favour.' } },
    { name: { hi: 'नई झाड़ू व लाल कपड़ा', en: 'New broom & red cloth' }, reason: { hi: 'झाड़ू लक्ष्मी का प्रतीक (स्वच्छता व दरिद्रता-निवारण); लाल कपड़ा देव-आसन व कलश-आवरण हेतु।', en: 'The broom is a symbol of Lakshmi (cleanliness, removes poverty); red cloth for the deity seat & kalash cover.' } },
    { name: { hi: 'दूध (उबालने हेतु) व नया पात्र', en: 'Milk (for boiling) & a new vessel' }, reason: { hi: 'रसोई में दूध का उफनकर बहना समृद्धि व बरकत का प्रतीक।', en: 'Milk boiling over in the new kitchen symbolises overflowing abundance.' } },
    { name: { hi: 'तुलसी पौधा (गमले सहित)', en: 'Tulsi plant (potted)' }, reason: { hi: 'पवित्रता व लक्ष्मी-वास; आँगन/द्वार पर स्थापना।', en: 'Purity and the abode of Lakshmi; installed in the courtyard/entrance.' } },
  ],
  steps: [
    { title: { hi: 'पवित्रीकरण व संकल्प', en: 'Purification & Sankalp' }, what: { hi: 'स्वयं व सामग्री पर गंगाजल छिड़ककर शुद्धि करें; हाथ में जल-अक्षत लेकर तिथि, गोत्र व नाम सहित गृह प्रवेश का संकल्प लें।', en: 'Sprinkle Ganga-jal on yourself and the materials; take water and akshat in hand and make the sankalp for Griha Pravesh with your tithi, gotra and name.' }, why: { hi: 'शुद्ध वातावरण व स्पष्ट संकल्प से ही कर्म को दिशा व देव-साक्षी मिलती है।', en: 'A pure space and a clear sankalp give the rite its purpose and divine witness.' } },
    { title: { hi: 'गणेश पूजन', en: 'Ganesha Puja' }, what: { hi: 'सर्वप्रथम विघ्नहर्ता श्री गणेश को पुष्प, अक्षत, दूर्वा व मोदक अर्पित कर पूजन करें।', en: 'First worship Lord Ganesha, the remover of obstacles, with flowers, akshat, durva and modak.' }, why: { hi: 'हर मंगल कार्य निर्विघ्न पूर्ण हो — यही गणेश-पूजन का भाव।', en: 'So the whole ceremony completes without obstacles — the essence of Ganesha worship.' }, deity: { hi: 'श्री गणेश', en: 'Lord Ganesha' } },
    { title: { hi: 'कलश स्थापना', en: 'Kalash Sthapana' }, what: { hi: 'जल, सिक्का, सुपारी व अक्षत भरे कलश पर आम-पल्लव व नारियल रखकर ईशान कोण में स्थापित करें; कलावा बाँधें।', en: 'Fill the kalash with water, a coin, betel-nut and akshat, top it with mango-pallav and a coconut, and install it in the north-east; tie the kalava.' }, why: { hi: 'कलश में समस्त देवता, तीर्थ व जल-तत्व का एक केंद्र-बिंदु पर आवाहन होता है।', en: 'All deities, tirthas and the water element are invoked into one focal point.' } },
    { title: { hi: 'वास्तु पुरुष पूजन (वास्तु शांति)', en: 'Vastu Purush Puja (Vastu Shanti)' }, what: { hi: 'वास्तु-मंडल बनाकर वास्तु देवता (नाग-रूप) की स्थापना व प्राण-प्रतिष्ठा करें; वास्तोष्पति मंत्र से पूजन व बलि अर्पित करें।', en: 'Draw the vastu-mandala, install and consecrate the Vastu Devata (in serpent form), and worship with the Vastoshpati mantra and offerings.' }, why: { hi: 'घर के रक्षक वास्तु पुरुष प्रसन्न होते हैं व निर्माण के वास्तु-दोष शांत होते हैं।', en: 'The guardian Vastu Purush is propitiated and the vastu-doshas of construction are pacified.' }, deity: { hi: 'वास्तु देवता', en: 'Vastu Devata' } },
    { title: { hi: 'नवग्रह पूजन', en: 'Navagraha Puja' }, what: { hi: 'नवग्रह की स्थापना कर उनके मंत्रों से पूजन करें तथा अष्ट-दिक्पालों को नमन करें।', en: 'Install the nine planets, worship them with their mantras, and salute the eight directional guardians (dikpalas).' }, why: { hi: 'ग्रहों की अनुकूलता व दिशाओं की रक्षा नए घर को सुरक्षित करती है।', en: 'Planetary favour and directional protection secure the new home.' }, deity: { hi: 'नवग्रह', en: 'The Navagraha' } },
    { title: { hi: 'मुख्य द्वार पूजन व प्रथम प्रवेश', en: 'Main-door Puja & First Entry' }, what: { hi: 'द्वार पर गौ-पूजा व कलश-पूजन करें; गृहस्वामिनी जल-भरा कलश लेकर, दाहिना पैर पहले रखते हुए मंगल-गान के बीच सबसे पहले घर में प्रवेश करें।', en: 'Worship the cow and kalash at the door; the lady of the house, carrying the water-filled kalash, enters first — right foot first — amid auspicious chanting.' }, why: { hi: 'दहलीज़ व पहला कदम घर के भाग्य की नींव रखते हैं।', en: 'The threshold and the first footstep lay the foundation of the home\'s fortune.' } },
    { title: { hi: 'दूध उबालना', en: 'Boiling the Milk' }, what: { hi: 'रसोई में नए पात्र में दूध उबालकर उफनने दें; पहला भोजन खीर या कुछ मीठा बनाएँ।', en: 'In the new kitchen, boil milk in a new vessel and let it overflow; cook kheer or something sweet as the first meal.' }, why: { hi: 'दूध का उफनकर बहना घर में बरकत व समृद्धि के उमड़ने का प्रतीक है।', en: 'Milk boiling over symbolises abundance and prosperity overflowing in the home.' } },
    { title: { hi: 'हवन / होम', en: 'Havan / Homa' }, what: { hi: 'हवन कुंड में अग्नि स्थापित कर आज्याहुति (ॐ प्रजापतये स्वाहा, ॐ अग्नये स्वाहा…) तथा वास्तु व नवग्रह की आहुतियाँ दें।', en: 'Kindle the fire in the havan kund and offer ghee oblations (Om Prajapataye Svaha, Om Agnaye Svaha…) along with vastu and navagraha oblations.' }, why: { hi: 'अग्नि आहुति को देवताओं तक पहुँचाकर घर को शुद्ध व सुरक्षित करती है।', en: 'Agni carries the offerings to the gods and purifies and protects the home.' }, deity: { hi: 'अग्निदेव', en: 'Agni' } },
    { title: { hi: 'लक्ष्मी पूजन', en: 'Lakshmi Puja' }, what: { hi: 'गणेश सहित माँ लक्ष्मी का पूजन कर धन-धान्य व स्थायी समृद्धि की प्रार्थना करें।', en: 'Worship Goddess Lakshmi together with Ganesha and pray for wealth, grain and lasting prosperity.' }, why: { hi: 'लक्ष्मी के आवाहन से घर में सुख-समृद्धि का स्थायी वास होता है।', en: 'Invoking Lakshmi establishes her permanent residence of prosperity in the home.' }, deity: { hi: 'माँ लक्ष्मी', en: 'Goddess Lakshmi' } },
    { title: { hi: 'सत्यनारायण कथा', en: 'Satyanarayan Katha' }, what: { hi: 'प्रायः उसी दिन या अगले दिन भगवान सत्यनारायण की कथा व पूजा की जाती है।', en: 'The Satyanarayan katha and puja are usually held the same or the next day.' }, why: { hi: 'भगवान विष्णु के आशीर्वाद व पारिवारिक सौहार्द हेतु (प्रचलित, अनिवार्य नहीं)।', en: 'For the blessings of Vishnu and family harmony (customary, not strictly mandatory).' }, deity: { hi: 'श्री सत्यनारायण', en: 'Shri Satyanarayan' } },
    { title: { hi: 'पूर्णाहुति व आरती', en: 'Purnahuti & Aarti' }, what: { hi: 'अंतिम पूर्णाहुति देकर वास्तु, गणेश व लक्ष्मी की आरती करें; प्रसाद वितरण करें।', en: 'Offer the final purnahuti, perform the aarti of Vastu, Ganesha and Lakshmi, and distribute prasad.' }, why: { hi: 'पूर्णाहुति यज्ञ को पूर्ण व सुफल बनाती है।', en: 'The purnahuti completes and seals the yajna, making it fruitful.' } },
    { title: { hi: 'ब्राह्मण भोज व दान', en: 'Brahmin Bhoj & Daan' }, what: { hi: 'पूजा के पश्चात ब्राह्मण-भोजन, दक्षिणा व यथाशक्ति दान करें; परिवार व अतिथियों को भोजन कराएँ।', en: 'After the puja, offer brahmin-bhoj, dakshina and daana as per capacity; feed family and guests.' }, why: { hi: 'दान व अन्नदान से यज्ञ का पुण्य पूर्ण होता है।', en: 'Daana and feeding complete the merit of the ceremony.' } },
  ],
  mantras: [
    { title: { hi: 'गणेश वंदना', en: 'Ganesha Vandana' }, sanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।\nनिर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥\nॐ गं गणपतये नमः॥', roman: 'Vakratunda Mahakaya Suryakoti Samaprabha.\nNirvighnam kuru me deva sarvakaryeshu sarvada.\nOm Gam Ganapataye Namah.', meaning: { hi: 'हे वक्रतुंड, महाकाय, करोड़ों सूर्य के समान तेजस्वी देव! मेरे सभी कार्य सदा निर्विघ्न पूर्ण करें।', en: 'O curved-trunk, mighty, radiant as a million suns — O Lord, make all my tasks ever free of obstacles.' }, when: { hi: 'सबसे पहले, पूजा आरंभ में', en: 'First of all, at the start of the puja' }, count: '3 / 11 / 108' },
    { title: { hi: 'वास्तोष्पति (वास्तु देवता) मंत्र', en: 'Vastoshpati (Vastu Devata) Mantra' }, sanskrit: 'ॐ वास्तोष्पते प्रति जानीह्यस्मान्त्स्वावेशो अनमीवो भवा नः।\nयत्त्वेमहे प्रति तन्नो जुषस्व शं नो भव द्विपदे शं चतुष्पदे॥', roman: 'Om Vastoshpate prati janihyasman svavesho anamivo bhava nah.\nYat tvemahe prati tanno jushasva sham no bhava dvipade sham chatushpade.', meaning: { hi: 'हे वास्तु के अधिपति देव! हमें पहचानिए व स्वीकार कीजिए। यह घर सुखद व रोगरहित हो; हम जो माँगें वह प्रदान कीजिए। हमारे मनुष्यों व पशुओं — सबका कल्याण हो। (ऋग्वेद 7.54.1)', en: 'O Lord of the Dwelling, recognise and accept us. Be an easy, disease-free abode for us; grant what we ask. Bring welfare to our people and our animals. (Rigveda 7.54.1)' }, when: { hi: 'वास्तु शांति व हवन में — गृह प्रवेश का मुख्य मंत्र', en: 'During Vastu Shanti & havan — the central Griha Pravesh mantra' } },
    { title: { hi: 'कलश स्थापना (पृथ्वी) मंत्र', en: 'Kalash Sthapana (Prithvi) Mantra' }, sanskrit: 'ॐ स्योना पृथिवि नो भवानृक्षरा निवेशनी।\nयच्छा नः शर्म सप्रथाः॥\nॐ भूर्भुवः स्वः पृथिव्यै नमः॥', roman: 'Om syona prithivi no bhava anrikshara niveshani.\nYachchha nah sharma saprathah.\nOm Bhurbhuvah Svah Prithivyai Namah.', meaning: { hi: 'हे पृथ्वी! तू हमारे लिए सुखद व कांटारहित निवास-स्थान बन; हमें विस्तृत सुख प्रदान कर। भूः भुवः स्वः — पृथ्वी को नमन।', en: 'O Earth, be a pleasant, thornless dwelling for us; grant us wide-reaching comfort. Bhuh Bhuvah Svah — salutations to the Earth.' }, when: { hi: 'कलश स्थापित करते समय', en: 'While establishing the kalash' } },
    { title: { hi: 'गायत्री / नवग्रह मंत्र', en: 'Gayatri / Navagraha Mantra' }, sanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥', roman: 'Om bhur bhuvah svah tat savitur varenyam\nbhargo devasya dhimahi dhiyo yo nah prachodayat.', meaning: { hi: 'उस सविता (सूर्य) देव के श्रेष्ठ तेज का हम ध्यान करते हैं, जो हमारी बुद्धि को सन्मार्ग की ओर प्रेरित करें।', en: 'We meditate on the supreme radiance of Savitr (the Sun); may it inspire our intellect toward righteousness.' }, when: { hi: 'नवग्रह पूजन व हवन में (हर ग्रह के मंत्र सहित)', en: 'During navagraha puja & havan (with each planet\'s mantra)' }, count: '11 / 108' },
    { title: { hi: 'महालक्ष्मी मंत्र', en: 'Mahalakshmi Mantra' }, sanskrit: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये\nप्रसीद प्रसीद श्रीं ह्रीं श्रीं ॐ महालक्ष्म्यै नमः॥', roman: 'Om Shreem Hreem Shreem Kamale Kamalalaye\nPraseeda Praseeda Shreem Hreem Shreem Om Mahalakshmyai Namah.', meaning: { hi: 'हे कमल में निवास करने वाली कमला (लक्ष्मी) देवी! प्रसन्न होइए, प्रसन्न होइए; महालक्ष्मी को नमन।', en: 'O Kamala (Lakshmi) who dwells in the lotus, be pleased, be pleased; salutations to Mahalakshmi.' }, when: { hi: 'लक्ष्मी पूजन में — धन-समृद्धि हेतु', en: 'During Lakshmi puja — for wealth & prosperity' }, count: '11 / 108' },
    { title: { hi: 'गृह प्रवेश प्रार्थना', en: 'Griha Pravesh Prayer' }, sanskrit: 'ॐ नमस्ते वास्तु पुरुषाय भूशय्याभिरत प्रभो।\nमद्गृहं धन-धान्यादि समृद्धं कुरु सर्वदा॥', roman: 'Om namaste Vastu Purushaya bhushayyabhirata prabho.\nMad-griham dhana-dhanyadi samriddham kuru sarvada.', meaning: { hi: 'हे भूमि पर शयन करने वाले वास्तु पुरुष देव! आपको नमन। मेरे घर को धन-धान्य आदि से सदा समृद्ध कीजिए।', en: 'Salutations to you, O Vastu Purush who rests upon the earth. Make my home ever rich with wealth and grain.' }, when: { hi: 'मुख्य द्वार से प्रथम प्रवेश के समय', en: 'At the moment of first entry through the main door' } },
  ],
  aartis: [
    { title: { hi: 'श्री गणेश आरती', en: 'Shri Ganesha Aarti' }, lines: 'जय गणेश जय गणेश जय गणेश देवा।\nमाता जाकी पार्वती, पिता महादेवा॥' },
    { title: { hi: 'ॐ जय लक्ष्मी माता', en: 'Om Jai Lakshmi Mata' }, lines: 'ॐ जय लक्ष्मी माता, मैया जय लक्ष्मी माता।\nतुमको निशदिन सेवत, हर विष्णु विधाता॥\n(गृह प्रवेश पर लक्ष्मी-गणेश की आरती परिवार सहित गाएँ।)' },
  ],
  dos: [
    { hi: 'मुख्य द्वार में दाहिना पैर पहले रखकर, गृहस्वामिनी कलश लेकर सबसे पहले प्रवेश करें।', en: 'Enter right foot first; the lady of the house enters first carrying the kalash.' },
    { hi: 'रसोई में सबसे पहले दूध उबालें व कुछ मीठा (खीर/हलवा) बनाएँ।', en: 'First boil milk in the kitchen and cook something sweet (kheer/halwa).' },
    { hi: 'घर में अखंड दीप/ज्योति जलाए रखें व तुलसी स्थापित करें।', en: 'Keep a lamp/jyoti burning in the home and install a tulsi plant.' },
    { hi: 'गृह प्रवेश की कम-से-कम पहली रात घर में अवश्य रुकें।', en: 'Be sure to stay in the home at least the first night after Griha Pravesh.' },
    { hi: 'शुभ मुहूर्त में योग्य पुरोहित के मार्गदर्शन में पूजा कराएँ।', en: 'Perform the puja in an auspicious muhurat under a qualified purohit.' },
  ],
  donts: [
    { hi: 'अधूरे/निर्माणाधीन घर में गृह प्रवेश न करें।', en: 'Do not perform Griha Pravesh in an unfinished/under-construction house.' },
    { hi: 'गृह प्रवेश की पहली रात घर खाली न छोड़ें।', en: 'Do not leave the house empty on the first night.' },
    { hi: 'चातुर्मास, खरमास, पितृपक्ष, ग्रहण व अमावस्या में गृह प्रवेश न करें।', en: 'Avoid Griha Pravesh during Chaturmas, Kharmas, Pitru Paksha, eclipses and Amavasya.' },
    { hi: 'मंगल व रविवार तथा रिक्ता तिथियों से बचें; बाएँ पैर से प्रवेश न करें।', en: 'Avoid Tuesday & Sunday and Rikta tithis; do not enter left foot first.' },
    { hi: 'परिवार में शोक/सूतक के समय गृह प्रवेश स्थगित करें।', en: 'Postpone Griha Pravesh during mourning/sutak in the family.' },
  ],
  mistakes: [
    { hi: 'बिना मुहूर्त/पुरोहित के जल्दबाज़ी में प्रवेश करना, या अधूरे घर में सामान डालकर "रह लेना"।', en: 'Rushing in without a muhurat/priest, or "just moving in" belongings into an unfinished house.' },
    { hi: 'सामग्री पूजा से पहले न जुटाना, जिससे विधि बीच में रुक जाती है।', en: 'Not gathering all samagri beforehand, causing the vidhi to break mid-way.' },
    { hi: 'दूध-उबालना या पहला मीठा भोजन भूल जाना, तथा तोरण/स्वस्तिक/रंगोली छोड़ देना।', en: 'Forgetting to boil the milk or cook the first sweet dish, and skipping the toran/swastik/rangoli.' },
  ],
  faqs: [
    { q: { hi: 'क्या किराए के घर में गृह प्रवेश कर सकते हैं?', en: 'Can I do Griha Pravesh in a rented house?' }, a: { hi: 'हाँ — किराए के घर में भी संक्षिप्त वास्तु/सपूर्व पूजा की जाती है; भव्य हवन के बजाय कलश व लक्ष्मी-गणेश पूजन पर्याप्त है।', en: 'Yes — a short Vastu/Sapurva puja is done even in rentals; instead of a grand havan, a kalash and Lakshmi-Ganesh puja suffice.' } },
    { q: { hi: 'मैं पहले ही घर में रह रहा हूँ, अब क्या करूँ?', en: 'What if I have already moved in?' }, a: { hi: 'बाद में भी शुभ मुहूर्त में वास्तु शांति/गृह प्रवेश पूजा कराई जा सकती है; इसे वर्जित नहीं माना जाता।', en: 'You can still perform Vastu Shanti / Griha Pravesh puja later on an auspicious date; it is not considered forbidden.' } },
    { q: { hi: 'क्या सत्यनारायण कथा अनिवार्य है?', en: 'Is the Satyanarayan Katha mandatory?' }, a: { hi: 'अनिवार्य नहीं, पर अत्यंत शुभ व प्रचलित; प्रायः उसी या अगले दिन की जाती है।', en: 'Not strictly mandatory, but highly auspicious and customary; usually done the same or next day.' } },
    { q: { hi: 'दिन का कौन-सा समय श्रेष्ठ है?', en: 'What is the best time of day?' }, a: { hi: 'पुरोहित द्वारा निर्धारित स्थिर लग्न का मुहूर्त — प्रायः प्रातः/पूर्वाह्न; राहुकाल व सूर्यास्त के बाद टालें।', en: 'A stable-lagna muhurat set by the purohit — usually morning/forenoon; avoid Rahukaal and after sunset.' } },
    { q: { hi: 'क्या बिना पुरोहित के कर सकते हैं?', en: 'Can it be done without a priest?' }, a: { hi: 'शास्त्र-सम्मत विधि हेतु पुरोहित श्रेष्ठ हैं; अत्यावश्यकता में गणेश-कलश-लक्ष्मी पूजा, दीप, दूध-उबालना व वास्तोष्पति मंत्र से संक्षिप्त प्रवेश किया जा सकता है।', en: 'A purohit is best for the full shastric vidhi; in urgent cases a short entry (Ganesh-kalash-Lakshmi puja, lamp, milk-boiling and the Vastoshpati mantra) is possible.' } },
    { q: { hi: 'निर्माणाधीन घर में गृह प्रवेश कर सकते हैं?', en: 'Can Griha Pravesh be done in an under-construction house?' }, a: { hi: 'नहीं — घर छत, द्वार व रसोई सहित रहने-योग्य पूर्ण अवस्था में होना चाहिए; अधूरे घर में गृह प्रवेश वर्जित है।', en: 'No — the house must be complete enough to live in (roof, doors, kitchen); Griha Pravesh in an unfinished house is prohibited.' } },
  ],
  estTime: { hi: 'संक्षिप्त ~1–2 घंटे · पूर्ण ~3–5 घंटे', en: 'Short ~1–2 hrs · Full ~3–5 hrs' },
  difficulty: { hi: 'मध्यम · पुरोहित उत्तम', en: 'Moderate · priest advised' },
  disclaimer: {
    hi: 'गृह प्रवेश की विधि क्षेत्र, परंपरा व कुलाचार अनुसार भिन्न हो सकती है। यहाँ दी गई सामग्री सामान्य वैदिक/शास्त्रीय मार्गदर्शन हेतु है; सटीक विधि व मुहूर्त के लिए योग्य पुरोहित/आचार्य का परामर्श सर्वोपरि है।',
    en: 'Griha Pravesh customs vary by region, tradition and family lineage (kulachar). This content is general Vedic/shastric guidance; for the exact vidhi and muhurat, a qualified purohit\'s guidance is supreme.',
  },
};

export const CURATED: Record<string, CuratedOccasion> = { vivah: VIVAH, 'grah-pravesh': GRAH_PRAVESH };
export const curatedOccasion = (id: string): CuratedOccasion | undefined => CURATED[id];
