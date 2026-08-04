// "वास्तु सीखें" — a beginner-friendly, chapter-wise course on Vastu Shastra.
// Curated bilingual content (NOT AI-generated at runtime) so it is accurate, consistent,
// instant and works offline. Based on the classical Vastu tradition (Mayamata, Manasara,
// Vishwakarma Prakash, Brihat Samhita, Samarangana Sutradhara) — simplified with everyday
// examples so a person with ZERO background can follow it. Vastu is presented as the
// traditional science of directions & the five elements, alongside plain modern reasoning
// (sunlight, air-flow, hygiene) so the advice stays practical and trustworthy.

export type Bi = { en: string; hi: string };
export type VArtKey =
  | 'house' | 'compass' | 'panch' | 'brahma' | 'door' | 'kitchen' | 'bed'
  | 'pooja' | 'toilet' | 'water' | 'colors' | 'remedy' | 'plot' | 'tips';

export interface VLearnBlock { heading?: Bi; text: Bi; example?: Bi; bullets?: Bi[] }
export interface VLearnChapter {
  id: string; emoji: string; art: VArtKey;
  level: Bi; kicker: Bi; title: Bi; intro: Bi; readMin: number;
  blocks: VLearnBlock[];
}

const b = (en: string, hi: string): Bi => ({ en, hi });

export const VASTU_CHAPTERS: VLearnChapter[] = [
  // 1 ──────────────────────────────────────────────────────────────────────
  {
    id: 'what', emoji: '🏠', art: 'house', level: b('Start here', 'यहाँ से शुरू'),
    kicker: b('Like a story', 'कहानी की तरह'),
    title: b('What is Vastu Shastra?', 'वास्तु शास्त्र क्या है?'),
    intro: b('The old science of building a home in harmony with nature.', 'प्रकृति के साथ मेल बिठाकर घर बनाने का पुराना विज्ञान।'),
    readMin: 2,
    blocks: [
      {
        text: b(
          'Think of the Sun, the wind, the direction of light, and the flow of water. For thousands of years, our ancestors noticed that houses built in a certain way felt healthier, brighter and more peaceful. They wrote these observations down. That collected wisdom — how to place a home and its rooms so nature helps you instead of fighting you — is called Vastu Shastra ("Vastu" = a dwelling, "Shastra" = knowledge).',
          'सूरज, हवा, रोशनी की दिशा और पानी के बहाव के बारे में सोचिए। हज़ारों सालों से हमारे पूर्वजों ने देखा कि एक खास तरीके से बने घर ज़्यादा स्वस्थ, उजले और शांत लगते हैं। उन्होंने ये बातें लिख लीं। वही इकट्ठा ज्ञान — घर और उसके कमरे कैसे रखें ताकि प्रकृति आपकी मदद करे, विरोध न करे — उसे वास्तु शास्त्र कहते हैं ("वास्तु" = रहने की जगह, "शास्त्र" = ज्ञान)।',
        ),
      },
      {
        heading: b('It is mostly common sense', 'यह ज़्यादातर सीधी-सादी समझ है'),
        text: b('Most Vastu rules have a simple, natural reason behind them. You do not need to be a pandit to understand them — just remember WHY each rule exists.', 'ज़्यादातर वास्तु नियमों के पीछे एक सरल, प्राकृतिक कारण होता है। इन्हें समझने के लिए पंडित होना ज़रूरी नहीं — बस याद रखें कि हर नियम क्यों है।'),
        bullets: [
          b('Morning sunlight is healthy → keep the East & North side open and light.', 'सुबह की धूप सेहतमंद है → पूर्व और उत्तर की ओर खुला और हल्का रखें।'),
          b('Afternoon sun is harsh & heavy → keep the South & West side thicker and heavier.', 'दोपहर की धूप तेज़ और भारी होती है → दक्षिण और पश्चिम की ओर मोटा और भारी रखें।'),
          b('Fire and water do not mix → keep the kitchen and the toilet apart.', 'आग और पानी मेल नहीं खाते → रसोई और शौचालय को अलग रखें।'),
        ],
        example: b('A room that gets soft morning sunlight naturally feels fresher than a dark, closed room — that is Vastu working in real life.', 'जिस कमरे में सुबह की हल्की धूप आती है वह अपने-आप एक बंद, अँधेरे कमरे से ज़्यादा ताज़ा लगता है — यही असल ज़िंदगी में वास्तु है।'),
      },
      {
        heading: b('What Vastu is NOT', 'वास्तु क्या नहीं है'),
        text: b('Vastu is not superstition, and it does not mean breaking your house. It is a guide. When a rule cannot be followed, there is almost always a simple remedy (a mirror, a colour, a light, a plant) instead of demolition.', 'वास्तु अंधविश्वास नहीं है, और इसका मतलब घर तोड़ना नहीं है। यह एक मार्गदर्शक है। जब कोई नियम पूरा न हो सके, तो तोड़-फोड़ की जगह लगभग हमेशा एक आसान उपाय होता है (आईना, रंग, रोशनी, पौधा)।'),
      },
    ],
  },

  // 2 ──────────────────────────────────────────────────────────────────────
  {
    id: 'directions', emoji: '🧭', art: 'compass', level: b('Basic', 'बेसिक'),
    kicker: b('The foundation', 'नींव की बात'),
    title: b('The 10 Directions', 'दस दिशाएँ'),
    intro: b('Every Vastu rule starts with knowing your directions.', 'हर वास्तु नियम दिशाएँ जानने से शुरू होता है।'),
    readMin: 3,
    blocks: [
      {
        text: b('There are 4 main directions (North, East, South, West) and 4 corner directions between them (North-East, South-East, South-West, North-West). Plus two more: the Centre and the Sky/Ground. Each direction has a natural quality. Once you know these, the room rules become easy to remember.', 'चार मुख्य दिशाएँ हैं (उत्तर, पूर्व, दक्षिण, पश्चिम) और उनके बीच चार कोने वाली दिशाएँ (ईशान, आग्नेय, नैऋत्य, वायव्य)। साथ में दो और: केंद्र और आकाश/पाताल। हर दिशा का एक स्वभाव होता है। ये जान लें तो कमरों के नियम आसानी से याद रहेंगे।'),
      },
      {
        heading: b('The 8 directions & what they suit', 'आठ दिशाएँ और वे किसके लिए उत्तम'),
        text: b('First find North using a compass (the morning Sun rises in the East — that helps too). Then match each direction to its best use:', 'पहले कंपास से उत्तर पता करें (सुबह सूरज पूर्व में उगता है — इससे भी मदद मिलती है)। फिर हर दिशा को उसके सही उपयोग से मिलाएँ:'),
        bullets: [
          b('North (उत्तर) — wealth & career. Keep open, light. Lord: Kubera.', 'उत्तर — धन व करियर। खुला, हल्का रखें। स्वामी: कुबेर।'),
          b('North-East / Ishan (ईशान) — the most sacred corner. Water, pooja. Lord: Ishwar.', 'ईशान (उत्तर-पूर्व) — सबसे पवित्र कोना। जल, पूजा। स्वामी: ईश्वर।'),
          b('East (पूर्व) — health & morning light. Main door is great here. Lord: Indra/Surya.', 'पूर्व — स्वास्थ्य व प्रातः प्रकाश। मुख्य द्वार यहाँ उत्तम। स्वामी: इंद्र/सूर्य।'),
          b('South-East / Agni (आग्नेय) — the FIRE corner. Best for the kitchen. Lord: Agni.', 'आग्नेय (दक्षिण-पूर्व) — अग्नि कोना। रसोई के लिए उत्तम। स्वामी: अग्नि।'),
          b('South (दक्षिण) — keep heavy, avoid main door. Lord: Yama.', 'दक्षिण — भारी रखें, मुख्य द्वार से बचें। स्वामी: यम।'),
          b('South-West / Nairitya (नैऋत्य) — the heaviest, most stable corner. Master bedroom. Lord: Nairit.', 'नैऋत्य (दक्षिण-पश्चिम) — सबसे भारी व स्थिर कोना। मुख्य शयनकक्ष। स्वामी: नैऋत।'),
          b('West (पश्चिम) — dining, study, storage. Lord: Varuna.', 'पश्चिम — भोजन, अध्ययन, भंडार। स्वामी: वरुण।'),
          b('North-West / Vayavya (वायव्य) — air & movement. Guests, toilets. Lord: Vayu.', 'वायव्य (उत्तर-पश्चिम) — वायु व गति। अतिथि, शौचालय। स्वामी: वायु।'),
        ],
        example: b('Remember it like the Sun\'s day: it is born in the East (health), blazes hottest in the South-East (kitchen fire), sets heavy in the South-West (stable bedroom). The Sun itself teaches Vastu.', 'इसे सूरज के दिन की तरह याद रखें: वह पूर्व में जन्म लेता है (स्वास्थ्य), आग्नेय में सबसे तेज़ जलता है (रसोई की आग), और नैऋत्य में भारी होकर अस्त होता है (स्थिर शयनकक्ष)। सूरज ही वास्तु सिखाता है।'),
      },
      {
        heading: b('One golden rule', 'एक सुनहरा नियम'),
        text: b('Keep the North & East lighter, more open, with lower/lighter things and more windows. Keep the South & West heavier, with taller walls, cupboards and heavy furniture. This single idea is behind half of all Vastu.', 'उत्तर व पूर्व को हल्का, ज़्यादा खुला, नीची/हल्की चीज़ों और ज़्यादा खिड़कियों के साथ रखें। दक्षिण व पश्चिम को भारी, ऊँची दीवारों, अलमारियों और भारी फर्नीचर के साथ रखें। यही एक विचार आधे वास्तु के पीछे है।'),
      },
    ],
  },

  // 3 ──────────────────────────────────────────────────────────────────────
  {
    id: 'panch', emoji: '🌿', art: 'panch', level: b('Basic', 'बेसिक'),
    kicker: b('The five elements', 'पाँच तत्व'),
    title: b('The Panch Tatva (5 Elements)', 'पंचतत्व (पाँच तत्व)'),
    intro: b('Earth, Water, Fire, Air, Space — and their corners.', 'पृथ्वी, जल, अग्नि, वायु, आकाश — और उनके कोने।'),
    readMin: 3,
    blocks: [
      {
        text: b('Vastu says everything — including our body and our home — is made of five elements. A home feels good when each element sits in its natural corner. Disturb an element and you feel it: a fire in the water corner, or a toilet in the sacred corner, brings trouble.', 'वास्तु कहता है कि हर चीज़ — हमारा शरीर और घर भी — पाँच तत्वों से बनी है। घर तब अच्छा लगता है जब हर तत्व अपने प्राकृतिक कोने में हो। किसी तत्व को बिगाड़ें तो असर दिखता है: जल कोने में आग, या पवित्र कोने में शौचालय, परेशानी लाता है।'),
      },
      {
        heading: b('The five and where they live', 'पाँच तत्व और उनका स्थान'),
        text: b('Match the element to its corner — this is the heart of Vastu:', 'तत्व को उसके कोने से मिलाएँ — यही वास्तु का हृदय है:'),
        bullets: [
          b('🔥 Fire (Agni) → South-East. Kitchen, gas, electrical, water-heater.', '🔥 अग्नि → आग्नेय (द-पू)। रसोई, गैस, बिजली, गीज़र।'),
          b('💧 Water (Jal) → North-East. Underground tank, borewell, pooja water.', '💧 जल → ईशान (उ-पू)। भूमिगत टंकी, बोरवेल, पूजा का जल।'),
          b('🌍 Earth (Prithvi) → South-West. Heavy things, master bedroom, foundation.', '🌍 पृथ्वी → नैऋत्य (द-प)। भारी चीज़ें, मुख्य शयनकक्ष, नींव।'),
          b('🌬 Air (Vayu) → North-West. Windows, ventilation, guest room.', '🌬 वायु → वायव्य (उ-प)। खिड़कियाँ, हवादारी, अतिथि कक्ष।'),
          b('🌌 Space (Akash) → Centre (Brahmasthan). Keep it open and empty.', '🌌 आकाश → केंद्र (ब्रह्मस्थान)। खुला व खाली रखें।'),
        ],
        example: b('Notice: fire (SE) and water (NE) are placed FAR apart — just like you would never keep a burning stove next to a water tank. Common sense again.', 'गौर करें: अग्नि (आग्नेय) और जल (ईशान) बहुत दूर रखे गए हैं — जैसे आप जलते चूल्हे को पानी की टंकी के पास कभी नहीं रखेंगे। फिर वही सीधी समझ।'),
      },
    ],
  },

  // 4 ──────────────────────────────────────────────────────────────────────
  {
    id: 'brahma', emoji: '⭕', art: 'brahma', level: b('Basic', 'बेसिक'),
    kicker: b('The heart of the home', 'घर का हृदय'),
    title: b('Brahmasthan — the Sacred Centre', 'ब्रह्मस्थान — पवित्र केंद्र'),
    intro: b('The middle of your home must breathe. Keep it open.', 'घर का बीच साँस ले सके — इसे खुला रखें।'),
    readMin: 2,
    blocks: [
      {
        text: b('Imagine the exact centre of your house — the point where the two diagonals of the plot cross. Vastu calls this the Brahmasthan, the "navel" of the home. Just like a baby breathes and takes nourishment through the navel, a house takes its energy through its centre. So this spot must stay open, clean and light.', 'अपने घर के ठीक बीच की कल्पना कीजिए — वह बिंदु जहाँ प्लॉट के दोनों विकर्ण (कोने से कोने की रेखाएँ) मिलते हैं। वास्तु इसे ब्रह्मस्थान कहता है, घर की "नाभि"। जैसे शिशु नाभि से साँस और पोषण लेता है, वैसे घर अपनी ऊर्जा केंद्र से लेता है। इसलिए यह जगह खुली, साफ़ और हल्की रहनी चाहिए।'),
      },
      {
        heading: b('Keep the centre free of', 'केंद्र में ये न रखें'),
        text: b('Do not block or burden the middle of the house:', 'घर का बीच रोकें या भारी न करें:'),
        bullets: [
          b('No toilet, no staircase, no heavy pillar in the centre.', 'केंद्र में शौचालय, सीढ़ियाँ या भारी खंभा न हो।'),
          b('No kitchen or heavy machine in the exact middle.', 'ठीक बीच में रसोई या भारी मशीन न हो।'),
          b('Best: keep it as an open hall, courtyard, or living space with light above.', 'सर्वोत्तम: इसे खुला हॉल, आँगन या बैठक बनाएँ, ऊपर रोशनी हो।'),
        ],
        example: b('Old havelis kept an open aangan (courtyard) in the centre — sunlight and air poured in from above. That aangan was the Brahmasthan.', 'पुरानी हवेलियों में बीच में खुला आँगन रखा जाता था — ऊपर से धूप और हवा आती थी। वही आँगन ब्रह्मस्थान था।'),
      },
    ],
  },

  // 5 ──────────────────────────────────────────────────────────────────────
  {
    id: 'door', emoji: '🚪', art: 'door', level: b('Important', 'ज़रूरी'),
    kicker: b('Energy enters here', 'ऊर्जा यहीं से आती है'),
    title: b('The Main Door', 'मुख्य द्वार'),
    intro: b('The mouth of the home — where all energy walks in.', 'घर का मुख — सारी ऊर्जा यहीं से अंदर आती है।'),
    readMin: 3,
    blocks: [
      {
        text: b('The main door is the single most important thing in Vastu. It is the "mouth" through which people, money, opportunities and energy enter. A good main door quietly invites good things in every day.', 'मुख्य द्वार वास्तु में सबसे महत्वपूर्ण चीज़ है। यह वह "मुख" है जिससे लोग, धन, अवसर और ऊर्जा अंदर आती है। एक अच्छा मुख्य द्वार हर दिन चुपचाप अच्छी चीज़ों को बुलाता है।'),
      },
      {
        heading: b('Best directions for the main door', 'मुख्य द्वार के लिए उत्तम दिशाएँ'),
        text: b('The most auspicious are East and North (and North-East). These get the healthy morning sun. Avoid a door in the exact South-West.', 'सबसे शुभ हैं पूर्व और उत्तर (और ईशान)। इन्हें सुबह की सेहतमंद धूप मिलती है। ठीक नैऋत्य (द-प) में द्वार से बचें।'),
        bullets: [
          b('Best: East, North, North-East, or the North-of-North-East.', 'सर्वोत्तम: पूर्व, उत्तर, ईशान, या उत्तर-का-ईशान।'),
          b('It should open INWARD and clockwise, and be the biggest, best door.', 'यह अंदर की ओर और घड़ी की दिशा में खुले, और सबसे बड़ा-सुंदर द्वार हो।'),
          b('Keep it clean, well-lit, with no clutter, shoes or dustbin right in front.', 'साफ़, रोशन रखें; ठीक सामने कबाड़, जूते या कूड़ेदान न हो।'),
        ],
        example: b('A nameplate, a small light, and a clean threshold (dehli) at the main door is like a warm smile that welcomes prosperity in.', 'मुख्य द्वार पर नाम-पट्टिका, एक छोटी रोशनी और साफ़ देहली एक गर्मजोशी भरी मुस्कान जैसी है जो समृद्धि का स्वागत करती है।'),
      },
      {
        heading: b('Simple things to avoid', 'बचने की सरल बातें'),
        text: b('These common mistakes weaken the main door:', 'ये आम गलतियाँ मुख्य द्वार को कमज़ोर करती हैं:'),
        bullets: [
          b('A door that squeaks or is broken — repair it.', 'चूँ-चूँ करता या टूटा द्वार — उसे ठीक कराएँ।'),
          b('A big pole, tree or pillar right in front of the door (called dwar-vedh).', 'द्वार के ठीक सामने बड़ा खंभा, पेड़ या स्तंभ (द्वार-वेध)।'),
          b('Two doors facing each other in a straight line with an exit behind.', 'दो द्वार आमने-सामने सीधी रेखा में, पीछे निकास हो।'),
        ],
      },
    ],
  },

  // 6 ──────────────────────────────────────────────────────────────────────
  {
    id: 'kitchen', emoji: '🍳', art: 'kitchen', level: b('Important', 'ज़रूरी'),
    kicker: b('The fire corner', 'अग्नि कोना'),
    title: b('The Kitchen', 'रसोई'),
    intro: b('Fire belongs in the South-East. Cook facing East.', 'आग की जगह आग्नेय (द-पू) है। मुँह पूर्व की ओर करके पकाएँ।'),
    readMin: 3,
    blocks: [
      {
        text: b('The kitchen holds fire (Agni), so it belongs in the fire corner — the South-East (Agneya). If South-East is not possible, the North-West is the second choice. The person cooking should face East, toward the healthy rising sun.', 'रसोई में अग्नि होती है, इसलिए इसकी जगह अग्नि कोने — आग्नेय (द-पू) — में है। अगर आग्नेय संभव न हो तो वायव्य (उ-प) दूसरा विकल्प है। खाना बनाने वाले का मुँह पूर्व की ओर, सेहतमंद उगते सूरज की तरफ़ होना चाहिए।'),
      },
      {
        heading: b('Inside the kitchen', 'रसोई के अंदर'),
        text: b('Keep fire and water separate, even inside the kitchen:', 'रसोई के अंदर भी अग्नि और जल अलग रखें:'),
        bullets: [
          b('Gas stove / cooktop → in the South-East, cook facing East.', 'गैस चूल्हा → आग्नेय में, मुँह पूर्व की ओर।'),
          b('Sink & drinking water → toward the North-East, away from the stove.', 'सिंक व पीने का पानी → ईशान की ओर, चूल्हे से दूर।'),
          b('Fridge → South-West or West. Storage & grains → South or West.', 'फ्रिज → नैऋत्य या पश्चिम। भंडार व अनाज → दक्षिण या पश्चिम।'),
        ],
        example: b('Never put the gas stove and the water tap right next to each other — fire and water clashing is the most common kitchen Vastu mistake.', 'गैस चूल्हे और पानी के नल को बिल्कुल पास-पास कभी न रखें — अग्नि और जल का टकराव रसोई की सबसे आम वास्तु गलती है।'),
      },
      {
        heading: b('Avoid', 'इनसे बचें'),
        text: b('A kitchen in the North-East (sacred water corner) or in the exact centre (Brahmasthan) is considered a defect — but there are remedies (next chapters).', 'ईशान (पवित्र जल कोना) या ठीक केंद्र (ब्रह्मस्थान) में रसोई दोष मानी जाती है — पर इसके उपाय हैं (आगे के अध्याय)।'),
      },
    ],
  },

  // 7 ──────────────────────────────────────────────────────────────────────
  {
    id: 'bedroom', emoji: '🛏', art: 'bed', level: b('Important', 'ज़रूरी'),
    kicker: b('Rest & stability', 'विश्राम व स्थिरता'),
    title: b('The Bedroom', 'शयनकक्ष'),
    intro: b('The master bedroom loves the heavy South-West. Head to the South.', 'मुख्य शयनकक्ष को भारी नैऋत्य पसंद है। सिर दक्षिण की ओर।'),
    readMin: 3,
    blocks: [
      {
        text: b('You sleep for a third of your life, so the bedroom deeply affects your health, mind and relationships. The master (head of the family) bedroom should be in the South-West — the heaviest, most stable, grounding corner. It gives a sense of security and control.', 'आप जीवन का एक-तिहाई हिस्सा सोते हैं, इसलिए शयनकक्ष आपके स्वास्थ्य, मन और रिश्तों पर गहरा असर डालता है। मुखिया का शयनकक्ष नैऋत्य (द-प) में हो — सबसे भारी, स्थिर, टिकाऊ कोना। यह सुरक्षा और नियंत्रण का भाव देता है।'),
      },
      {
        heading: b('How to sleep', 'कैसे सोएँ'),
        text: b('The direction of your head while sleeping matters:', 'सोते समय सिर की दिशा मायने रखती है:'),
        bullets: [
          b('Head toward SOUTH → best. Deep, healthy sleep (this is the classical rule).', 'सिर दक्षिण की ओर → सर्वोत्तम। गहरी, स्वस्थ नींद (शास्त्रीय नियम)।'),
          b('Head toward EAST → good, especially for students & focus.', 'सिर पूर्व की ओर → अच्छा, खासकर विद्यार्थियों व एकाग्रता के लिए।'),
          b('NEVER sleep with the head toward the North (it disturbs sleep).', 'सिर उत्तर की ओर करके कभी न सोएँ (नींद में बाधा)।'),
        ],
        example: b('Think of a compass: the North of your head and the Earth\'s North push against each other. That is why "head to the North" is avoided — head to the South instead.', 'कंपास की तरह सोचें: आपके सिर का उत्तर और धरती का उत्तर एक-दूसरे को धकेलते हैं। इसीलिए "सिर उत्तर की ओर" से बचा जाता है — बजाय इसके सिर दक्षिण की ओर।'),
      },
      {
        heading: b('Bedroom tips', 'शयनकक्ष के सुझाव'),
        text: b('Small changes make a big difference:', 'छोटे बदलाव बड़ा फ़र्क डालते हैं:'),
        bullets: [
          b('Children & guests → North-West or West bedroom.', 'बच्चे व अतिथि → वायव्य या पश्चिम शयनकक्ष।'),
          b('No mirror facing the bed; no TV screen reflecting you while asleep.', 'बिस्तर के सामने आईना न हो; सोते हुए आपका प्रतिबिंब TV में न पड़े।'),
          b('No beam directly above the bed; keep the room calm and clutter-free.', 'बिस्तर के ठीक ऊपर बीम न हो; कमरा शांत व साफ़ रखें।'),
        ],
      },
    ],
  },

  // 8 ──────────────────────────────────────────────────────────────────────
  {
    id: 'pooja', emoji: '🪔', art: 'pooja', level: b('Basic', 'बेसिक'),
    kicker: b('The purest corner', 'सबसे पवित्र कोना'),
    title: b('The Pooja Room', 'पूजा घर'),
    intro: b('The North-East is the lightest, holiest spot — perfect for prayer.', 'ईशान (उ-पू) सबसे हल्का, पवित्र स्थान है — पूजा के लिए उत्तम।'),
    readMin: 2,
    blocks: [
      {
        text: b('The North-East corner (Ishan) receives the first, gentlest rays of the morning sun and is considered the most sacred, positive part of the home. This makes it the ideal place for the pooja room or temple. Praying here, facing East or North, feels naturally uplifting.', 'ईशान कोना (उ-पू) सुबह की पहली, सबसे कोमल किरणें पाता है और घर का सबसे पवित्र, सकारात्मक भाग माना जाता है। इसीलिए यह पूजा घर या मंदिर के लिए आदर्श है। यहाँ पूर्व या उत्तर की ओर मुँह करके पूजा करना स्वाभाविक रूप से मन को ऊपर उठाता है।'),
      },
      {
        heading: b('Simple pooja-room rules', 'पूजा घर के सरल नियम'),
        text: b('Keep the sacred space truly sacred:', 'पवित्र स्थान को सच में पवित्र रखें:'),
        bullets: [
          b('Place idols in the NE, facing West or South so YOU face East/North.', 'मूर्तियाँ ईशान में, पश्चिम/दक्षिण की ओर मुख — ताकि आपका मुँह पूर्व/उत्तर हो।'),
          b('Keep idols a little away from the wall; keep the area clean and lit.', 'मूर्तियाँ दीवार से थोड़ा हटकर; स्थान स्वच्छ व रोशन रखें।'),
          b('No pooja room inside a bedroom wall shared with a toilet, or under stairs.', 'शौचालय से सटी दीवार वाले शयनकक्ष में या सीढ़ियों के नीचे पूजा घर न हो।'),
        ],
        example: b('Even a small clean shelf in the North-East corner, with a diya lit each morning, works beautifully when a separate room is not possible.', 'जब अलग कमरा संभव न हो, तो ईशान कोने में एक छोटी साफ़ शेल्फ़, जिस पर हर सुबह दीया जले, बहुत सुंदर काम करती है।'),
      },
    ],
  },

  // 9 ──────────────────────────────────────────────────────────────────────
  {
    id: 'toilet', emoji: '🚿', art: 'toilet', level: b('Important', 'ज़रूरी'),
    kicker: b('Keep it away from the sacred', 'पवित्र से दूर रखें'),
    title: b('Bathrooms & Toilets', 'स्नानघर व शौचालय'),
    intro: b('Drains carry energy out — keep them away from the North-East.', 'नालियाँ ऊर्जा बाहर ले जाती हैं — इन्हें ईशान से दूर रखें।'),
    readMin: 2,
    blocks: [
      {
        text: b('A toilet is where waste and water leave the house, so its placement matters. The golden rule: never place a toilet in the North-East (the sacred pooja corner) or in the exact centre (Brahmasthan). The best zones are the North-West and the West/South (away from the holy corner).', 'शौचालय वह जगह है जहाँ से मल और पानी घर से बाहर जाते हैं, इसलिए इसका स्थान मायने रखता है। सुनहरा नियम: शौचालय कभी ईशान (पवित्र पूजा कोना) या ठीक केंद्र (ब्रह्मस्थान) में न हो। सबसे अच्छे क्षेत्र वायव्य और पश्चिम/दक्षिण हैं (पवित्र कोने से दूर)।'),
      },
      {
        heading: b('Bathroom tips', 'स्नानघर के सुझाव'),
        text: b('Keep the flow of used water heading away from the sacred North-East:', 'इस्तेमाल किए पानी का बहाव पवित्र ईशान से दूर रखें:'),
        bullets: [
          b('Best toilet zones: North-West, or West/South-South.', 'शौचालय के लिए उत्तम: वायव्य, या पश्चिम/दक्षिण-दक्षिण।'),
          b('Keep the toilet door closed and the seat lid down.', 'शौचालय का दरवाज़ा बंद और सीट का ढक्कन नीचे रखें।'),
          b('Slope the drain outflow toward the North or North-West.', 'नाली का बहाव उत्तर या वायव्य की ओर ढालें।'),
          b('A bathroom (for bathing) may face East for morning light — that is fine.', 'स्नान वाला बाथरूम पूर्व की ओर हो सकता है (प्रातः प्रकाश) — यह ठीक है।'),
        ],
      },
    ],
  },

  // 10 ─────────────────────────────────────────────────────────────────────
  {
    id: 'water', emoji: '💧', art: 'water', level: b('Basic', 'बेसिक'),
    kicker: b('Jal tatva', 'जल तत्व'),
    title: b('Water in the Home', 'घर में जल'),
    intro: b('Underground water in the North-East; overhead tank in the South-West.', 'भूमिगत जल ईशान में; ऊपरी टंकी नैऋत्य में।'),
    readMin: 2,
    blocks: [
      {
        text: b('Water is the North-East element, but there is a clever twist: water that STORES DOWN (borewell, underground tank, well) belongs in the light North-East, while water stored UP HIGH and heavy (the overhead tank) belongs in the heavy South-West or West.', 'जल ईशान तत्व है, पर एक चतुर मोड़ है: जो जल नीचे संग्रह होता है (बोरवेल, भूमिगत टंकी, कुआँ) वह हल्के ईशान में; और जो जल ऊपर और भारी संग्रह होता है (ऊपरी टंकी) वह भारी नैऋत्य या पश्चिम में।'),
      },
      {
        heading: b('Where to keep water', 'जल कहाँ रखें'),
        text: b('Match the type of water to the right direction:', 'जल के प्रकार को सही दिशा से मिलाएँ:'),
        bullets: [
          b('Borewell, underground tank, well → North-East (auspicious for wealth).', 'बोरवेल, भूमिगत टंकी, कुआँ → ईशान (धन हेतु शुभ)।'),
          b('Overhead water tank → South-West or West (heavy stays in the heavy zone).', 'ऊपरी पानी की टंकी → नैऋत्य या पश्चिम (भारी, भारी क्षेत्र में)।'),
          b('A small fountain or aquarium → North or North-East living area.', 'छोटा फव्वारा या एक्वेरियम → उत्तर या ईशान बैठक क्षेत्र में।'),
        ],
        example: b('A heavy overhead tank in the North-East presses down on the lightest, most sacred corner — that is why it is shifted to the strong South-West.', 'ईशान में भारी ऊपरी टंकी सबसे हल्के, पवित्र कोने को दबा देती है — इसीलिए इसे मज़बूत नैऋत्य में हटाया जाता है।'),
      },
    ],
  },

  // 11 ─────────────────────────────────────────────────────────────────────
  {
    id: 'colors', emoji: '🎨', art: 'colors', level: b('Easy', 'आसान'),
    kicker: b('Paint with purpose', 'सोच-समझकर रंग'),
    title: b('Colours & Vastu', 'रंग और वास्तु'),
    intro: b('Each direction has a friendly colour that lifts its energy.', 'हर दिशा का एक मित्र रंग है जो उसकी ऊर्जा बढ़ाता है।'),
    readMin: 2,
    blocks: [
      {
        text: b('Colours are the easiest Vastu remedy — you do not break anything, you just paint. Each direction has colours that suit its element. Light, soft colours generally keep a home peaceful; very dark colours are used sparingly.', 'रंग सबसे आसान वास्तु उपाय हैं — कुछ तोड़ना नहीं, बस रंग करना है। हर दिशा के अपने तत्व के अनुकूल रंग होते हैं। हल्के, कोमल रंग आम तौर पर घर को शांत रखते हैं; बहुत गहरे रंग कम इस्तेमाल करें।'),
      },
      {
        heading: b('Direction-wise friendly colours', 'दिशा अनुसार मित्र रंग'),
        text: b('A simple guide you can use while painting:', 'रंग करते समय एक सरल मार्गदर्शक:'),
        bullets: [
          b('North-East → light blue, white (purity, water).', 'ईशान → हल्का नीला, सफ़ेद (पवित्रता, जल)।'),
          b('East → white, light green (freshness, growth).', 'पूर्व → सफ़ेद, हल्का हरा (ताज़गी, वृद्धि)।'),
          b('South-East → orange, light red, pink (fire zone).', 'आग्नेय → नारंगी, हल्का लाल, गुलाबी (अग्नि क्षेत्र)।'),
          b('South-West → beige, brown, earthy yellow (stability).', 'नैऋत्य → बेज, भूरा, मिट्टी जैसा पीला (स्थिरता)।'),
          b('West → white, blue, grey. North → green, pista (wealth).', 'पश्चिम → सफ़ेद, नीला, धूसर। उत्तर → हरा, पिस्ता (धन)।'),
        ],
        example: b('For a child\'s study in the East, a light green wall gently supports focus and growth — a tiny change, a real feel-good difference.', 'पूर्व में बच्चे के अध्ययन के लिए हल्की हरी दीवार एकाग्रता और वृद्धि को कोमलता से सहारा देती है — छोटा बदलाव, असली अच्छा एहसास।'),
      },
    ],
  },

  // 12 ─────────────────────────────────────────────────────────────────────
  {
    id: 'remedy', emoji: '🪄', art: 'remedy', level: b('Very useful', 'बहुत उपयोगी'),
    kicker: b('Fix without breaking', 'बिना तोड़े सुधारें'),
    title: b('Vastu Defects & Easy Remedies', 'वास्तु दोष और आसान उपाय'),
    intro: b('Most problems have a simple fix — no demolition needed.', 'ज़्यादातर समस्याओं का आसान हल है — तोड़-फोड़ की ज़रूरत नहीं।'),
    readMin: 3,
    blocks: [
      {
        text: b('If a room is in a "wrong" direction, do not panic and do not start breaking walls. Vastu offers gentle remedies (upaya) using mirrors, colours, lights, salt, plants and symbols to balance the energy. Here are the safe, common ones.', 'अगर कोई कमरा "गलत" दिशा में है, तो घबराएँ नहीं और दीवारें तोड़ना शुरू न करें। वास्तु आईने, रंग, रोशनी, नमक, पौधों और प्रतीकों से ऊर्जा संतुलित करने के कोमल उपाय देता है। यहाँ कुछ सुरक्षित, आम उपाय हैं।'),
      },
      {
        heading: b('Common problems → simple remedies', 'आम समस्याएँ → सरल उपाय'),
        text: b('Match the defect to its everyday fix:', 'दोष को उसके रोज़मर्रा के हल से मिलाएँ:'),
        bullets: [
          b('Kitchen in the North-East → keep it very clean; use a red/orange mat; place a small fire symbol.', 'ईशान में रसोई → बहुत साफ़ रखें; लाल/नारंगी चटाई; छोटा अग्नि प्रतीक रखें।'),
          b('Toilet in the North-East → keep door shut, a bowl of sea salt inside, and a mirror outside the door.', 'ईशान में शौचालय → दरवाज़ा बंद रखें, अंदर समुद्री नमक का कटोरा, दरवाज़े के बाहर आईना।'),
          b('Missing/cut North-East corner → place a mirror to "extend" it, and keep plants/water there.', 'कटा हुआ ईशान कोना → आईना लगाकर उसे "बढ़ाएँ", वहाँ पौधे/जल रखें।'),
          b('Heaviness in the North/East → shift heavy furniture toward the South/West.', 'उत्तर/पूर्व में भारीपन → भारी फर्नीचर दक्षिण/पश्चिम की ओर करें।'),
          b('Main door on a weak side → a bright light + auspicious toran/nameplate helps.', 'कमज़ोर दिशा में मुख्य द्वार → तेज़ रोशनी + शुभ तोरण/नाम-पट्टिका मदद करती है।'),
        ],
        example: b('A bowl of coarse sea salt in a damp or heavy corner, changed monthly, is the classic no-cost remedy people swear by for clearing stuck energy.', 'नमी वाले या भारी कोने में मोटे समुद्री नमक का कटोरा, हर महीने बदला जाए — रुकी ऊर्जा साफ़ करने का लोगों का भरोसेमंद, बिना-खर्च वाला क्लासिक उपाय है।'),
      },
      {
        heading: b('Golden remedies everyone can do', 'हर कोई कर सके ऐसे सुनहरे उपाय'),
        text: b('These help almost any home:', 'ये लगभग हर घर की मदद करते हैं:'),
        bullets: [
          b('Let morning sunlight & fresh air in daily. Fix all leaks and broken things.', 'रोज़ सुबह की धूप व ताज़ी हवा आने दें। सभी रिसाव व टूटी चीज़ें ठीक कराएँ।'),
          b('Keep the North-East corner clean, light and clutter-free.', 'ईशान कोना साफ़, हल्का व कबाड़-मुक्त रखें।'),
          b('Keep a healthy green plant (like money plant) in the right spot; remove dead plants.', 'सही जगह हरा-भरा पौधा (जैसे मनी प्लांट) रखें; सूखे पौधे हटाएँ।'),
        ],
      },
    ],
  },

  // 13 ─────────────────────────────────────────────────────────────────────
  {
    id: 'plot', emoji: '📐', art: 'plot', level: b('Before you buy', 'खरीदने से पहले'),
    kicker: b('Choose land wisely', 'ज़मीन समझदारी से चुनें'),
    title: b('Choosing a Plot', 'प्लॉट कैसे चुनें'),
    intro: b('The shape and slope of the land set the base for everything.', 'ज़मीन का आकार और ढलान हर चीज़ की नींव तय करते हैं।'),
    readMin: 2,
    blocks: [
      {
        text: b('Before a single brick is laid, the land itself carries Vastu. A good plot makes a good home easy; a difficult plot needs more remedies. If you can choose, choose well.', 'एक भी ईंट रखने से पहले, ज़मीन में ही वास्तु होता है। अच्छा प्लॉट अच्छा घर बनाना आसान करता है; कठिन प्लॉट को ज़्यादा उपायों की ज़रूरत होती है। अगर चुन सकें, तो अच्छा चुनें।'),
      },
      {
        heading: b('Signs of a good plot', 'अच्छे प्लॉट के लक्षण'),
        text: b('Look for these when picking land:', 'ज़मीन चुनते समय ये देखें:'),
        bullets: [
          b('Square or rectangle shape (regular) is best; avoid odd, cut or triangle shapes.', 'वर्गाकार या आयताकार (समान) सर्वोत्तम; अजीब, कटे या त्रिकोण आकार से बचें।'),
          b('Slope going DOWN toward the North or East is auspicious.', 'उत्तर या पूर्व की ओर नीचे की ढलान शुभ है।'),
          b('The North-East corner extended (not cut) is a very good sign.', 'ईशान कोना बढ़ा हुआ (कटा नहीं) बहुत शुभ लक्षण है।'),
          b('A road on the East or North side suits most families.', 'पूर्व या उत्तर दिशा में सड़क ज़्यादातर परिवारों के लिए उत्तम।'),
        ],
        example: b('A plot where rainwater naturally flows out toward the North-East drains well and is considered lucky — nature is voting yes.', 'जिस प्लॉट का बारिश का पानी सहज ही ईशान की ओर बहकर निकल जाए, वह अच्छी निकासी वाला और भाग्यशाली माना जाता है — प्रकृति हाँ कह रही है।'),
      },
    ],
  },

  // 14 ─────────────────────────────────────────────────────────────────────
  {
    id: 'tips', emoji: '✨', art: 'tips', level: b('Daily habits', 'रोज़ की आदतें'),
    kicker: b('Small habits, big peace', 'छोटी आदतें, बड़ी शांति'),
    title: b('Everyday Vastu Habits', 'रोज़मर्रा की वास्तु आदतें'),
    intro: b('Simple daily things that keep the home\'s energy fresh.', 'रोज़ की सरल बातें जो घर की ऊर्जा ताज़ा रखती हैं।'),
    readMin: 2,
    blocks: [
      {
        text: b('You do not need a new house to enjoy Vastu. These tiny daily habits keep positive energy flowing in any home — rented or owned, big or small.', 'वास्तु का लाभ लेने के लिए नए घर की ज़रूरत नहीं। ये छोटी रोज़ की आदतें किसी भी घर में सकारात्मक ऊर्जा बहती रखती हैं — किराए का हो या अपना, बड़ा हो या छोटा।'),
      },
      {
        heading: b('Do these daily', 'ये रोज़ करें'),
        text: b('A handful of easy, feel-good habits:', 'कुछ आसान, मन को अच्छी लगने वाली आदतें:'),
        bullets: [
          b('Open windows each morning — let sunlight and fresh air clean the home.', 'हर सुबह खिड़कियाँ खोलें — धूप व ताज़ी हवा घर साफ़ करें।'),
          b('Keep the kitchen and the North-East corner spotless.', 'रसोई और ईशान कोना बेदाग़ साफ़ रखें।'),
          b('Fix dripping taps, flickering bulbs and squeaky doors quickly.', 'टपकते नल, टिमटिमाते बल्ब और चूँ करते दरवाज़े जल्दी ठीक कराएँ।'),
          b('Remove clutter, broken items and dead plants — they trap stale energy.', 'कबाड़, टूटी चीज़ें व सूखे पौधे हटाएँ — ये बासी ऊर्जा रोकते हैं।'),
          b('Keep the centre of the home open; do not pile things there.', 'घर का केंद्र खुला रखें; वहाँ सामान न जमा करें।'),
        ],
        example: b('Just opening the East windows to the morning sun for 15 minutes daily changes how a whole home feels — the simplest Vastu of all.', 'रोज़ सिर्फ़ 15 मिनट पूर्व की खिड़कियाँ सुबह के सूरज के लिए खोलना पूरे घर का एहसास बदल देता है — सबसे सरल वास्तु।'),
      },
      {
        heading: b('Remember', 'याद रखें'),
        text: b('Vastu is a helpful guide, not a fear. A home filled with cleanliness, light, air and love already follows most of Vastu. Do what you can, use remedies for the rest, and live happily.', 'वास्तु एक सहायक मार्गदर्शक है, डर नहीं। स्वच्छता, रोशनी, हवा और प्रेम से भरा घर पहले ही अधिकांश वास्तु का पालन करता है। जो कर सकें करें, बाकी के लिए उपाय अपनाएँ, और सुखी रहें।'),
      },
    ],
  },
];
