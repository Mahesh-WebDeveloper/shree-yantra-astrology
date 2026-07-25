// "Kundli Sikhe" — a beginner→advanced, story-style learning journey about Vedic astrology.
// Curated bilingual content (NOT AI-generated at runtime) so it is accurate, consistent,
// instant and works offline. Astronomy facts are kept factual; Jyotish is presented as the
// traditional interpretation system. Sources blended from classical Jyotish (Vedanga Jyotisha,
// Brihat Parashara Hora Shastra tradition) + modern astronomy (NASA planet count) + common
// reference explanations (Wikipedia/AstroSage-style primers), simplified for a 0-knowledge user.

export type Bi = { en: string; hi: string };

export type ArtKey = 'sky' | 'solar' | 'navagraha' | 'zodiac' | 'nakshatra' | 'lagna' | 'moon' | 'houses' | 'generate' | 'readchart' | 'varga' | 'dasha' | 'history' | 'trust';

export interface LearnBlock {
  heading?: Bi;
  text: Bi;
  example?: Bi;        // a tiny real-life "जैसे…/like…" example
  bullets?: Bi[];
}

export interface LearnChapter {
  id: string;
  emoji: string;
  art: ArtKey;
  level: Bi;           // "Basic" / "बेसिक" chip
  kicker: Bi;
  title: Bi;
  intro: Bi;           // 1-line summary on the index card
  readMin: number;
  blocks: LearnBlock[];
}

const b = (en: string, hi: string): Bi => ({ en, hi });

export const KUNDLI_CHAPTERS: LearnChapter[] = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 'sky', emoji: '🌌', art: 'sky', level: b('Start here', 'यहाँ से शुरू'),
    kicker: b('Like a story', 'कहानी की तरह'),
    title: b('What is a Kundli, really?', 'कुंडली असल में होती क्या है?'),
    intro: b('A photo of the sky at the moment you were born.', 'जन्म के पल आसमान की एक तस्वीर।'),
    readMin: 2,
    blocks: [
      {
        text: b(
          'Imagine that at the exact second a baby is born, someone presses "pause" on the whole sky and takes a photo. Where was the Sun? Where was the Moon? Which stars were rising in the east? That frozen photo — drawn as a simple diagram — is your Kundli (birth chart, also called Janma Kundali).',
          'कल्पना कीजिए — जिस ठीक सेकंड में बच्चा जन्म लेता है, कोई पूरे आसमान पर "pause" दबा देता है और एक फोटो ले लेता है। उस पल सूर्य कहाँ था? चंद्रमा कहाँ था? पूर्व दिशा में कौन-से तारे उग रहे थे? वही रुकी हुई तस्वीर — एक सरल चित्र के रूप में — आपकी कुंडली (जन्म कुंडली) है।',
        ),
      },
      {
        heading: b('It needs just three things', 'इसे सिर्फ़ तीन चीज़ें चाहिए'),
        text: b('Your Kundli is built from your birth Date, exact Time, and Place. Each one answers a different question about that sky-photo.', 'आपकी कुंडली बनती है जन्म की तारीख, सही समय और जगह से। हर एक उस आसमान-फोटो का अलग सवाल हल करता है।'),
        bullets: [
          b('Date → which day, where the slow planets were.', 'तारीख → कौन-सा दिन, धीमे ग्रह कहाँ थे।'),
          b('Time → which sign was rising (this decides your Lagna).', 'समय → कौन-सी राशि उग रही थी (यही आपका लग्न तय करता है)।'),
          b('Place → from which point on Earth the sky was seen.', 'जगह → धरती के किस बिंदु से आसमान देखा जा रहा था।'),
        ],
        example: b('Two babies born the same day but one hour apart can have a different Lagna — because the sky kept turning.', 'एक ही दिन पर एक घंटे के अंतर से जन्मे दो बच्चों का लग्न अलग हो सकता है — क्योंकि आसमान घूमता रहता है।'),
      },
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 'solar', emoji: '☀️', art: 'solar', level: b('Basic', 'बेसिक'),
    kicker: b('The big picture', 'बड़ी तस्वीर'),
    title: b('The Solar System & the "Grahas"', 'सौरमंडल और "ग्रह"'),
    intro: b('Why science says 8 planets but Jyotish says 9.', 'विज्ञान 8 ग्रह कहता है, ज्योतिष 9 — क्यों?'),
    readMin: 3,
    blocks: [
      {
        text: b('At the centre is the Sun. Around it spin the planets. Modern astronomy counts EIGHT planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune (Pluto is now a "dwarf planet").', 'केंद्र में सूर्य है। उसके चारों ओर ग्रह घूमते हैं। आधुनिक खगोल-विज्ञान आठ ग्रह गिनता है: बुध, शुक्र, पृथ्वी, मंगल, बृहस्पति, शनि, अरुण (Uranus) और वरुण (Neptune)। (प्लूटो अब "बौना ग्रह" है।)'),
      },
      {
        heading: b('Jyotish uses "Navagraha" = 9', 'ज्योतिष "नवग्रह" = 9 लेता है'),
        text: b('Vedic astrology does NOT use Earth (you are standing on it) or Uranus/Neptune. Instead it uses the Sun and Moon (as seen from Earth) plus Mars, Mercury, Jupiter, Venus, Saturn — and two special points, Rahu and Ketu. That makes NINE "grahas". A graha is not exactly a "planet"; it means an influencing factor used to read life.', 'वैदिक ज्योतिष पृथ्वी (आप उसी पर खड़े हैं) या अरुण/वरुण को नहीं लेता। इसके बदले सूर्य और चंद्र (धरती से दिखने वाले) तथा मंगल, बुध, गुरु, शुक्र, शनि — और दो विशेष बिंदु, राहु व केतु लेता है। इस तरह नौ "ग्रह" बनते हैं। "ग्रह" का मतलब बिल्कुल "planet" नहीं; यह जीवन पढ़ने में प्रयोग होने वाला प्रभावकारी कारक है।'),
        bullets: [
          b('Sun & Moon — the two "lights".', 'सूर्य व चंद्र — दो "प्रकाश"।'),
          b('Mars, Mercury, Jupiter, Venus, Saturn — the five visible planets.', 'मंगल, बुध, गुरु, शुक्र, शनि — पाँच दृश्य ग्रह।'),
          b('Rahu & Ketu — not real bodies; they are calculated points.', 'राहु व केतु — असली पिंड नहीं; गणना से निकले बिंदु।'),
        ],
      },
      {
        heading: b('What are Rahu & Ketu?', 'राहु-केतु क्या हैं?'),
        text: b('The Moon\'s path crosses the Sun\'s path at two points. Those two crossing points are Rahu and Ketu — the spots where eclipses can happen. They have no body, but in Jyotish they are treated as powerful "shadow grahas".', 'चंद्रमा का रास्ता सूर्य के रास्ते को दो जगह काटता है। वही दो कटान-बिंदु राहु और केतु हैं — जहाँ ग्रहण लग सकता है। इनका कोई शरीर नहीं, पर ज्योतिष में इन्हें शक्तिशाली "छाया-ग्रह" माना जाता है।'),
        example: b('No-body, but big meaning — like a shadow has no weight yet still falls on the wall.', 'शरीर नहीं, पर बड़ा महत्व — जैसे परछाई का वज़न नहीं फिर भी दीवार पर पड़ती है।'),
      },
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 'navagraha', emoji: '🪐', art: 'navagraha', level: b('Basic', 'बेसिक'),
    kicker: b('Meet the 9', 'नौ से मिलिए'),
    title: b('What each Graha "means"', 'हर ग्रह का "मतलब" क्या है'),
    intro: b('Each planet is like a character with a role.', 'हर ग्रह एक किरदार की तरह है, अपनी भूमिका के साथ।'),
    readMin: 3,
    blocks: [
      {
        text: b('Think of the 9 grahas as 9 characters in your life-story. Each one "governs" certain qualities. This is the traditional meaning used to read a chart:', 'नौ ग्रहों को अपनी जीवन-कहानी के 9 किरदार समझिए। हर एक कुछ गुणों का "स्वामी" है। चार्ट पढ़ने में यही पारंपरिक मतलब प्रयोग होते हैं:'),
        bullets: [
          b('Sun (Surya) — soul, confidence, father, authority.', 'सूर्य — आत्मा, आत्मविश्वास, पिता, अधिकार।'),
          b('Moon (Chandra) — mind, emotions, mother, comfort.', 'चंद्र — मन, भावनाएँ, माता, सुकून।'),
          b('Mars (Mangal) — energy, courage, drive, siblings.', 'मंगल — ऊर्जा, साहस, जोश, भाई-बहन।'),
          b('Mercury (Budh) — intelligence, speech, business, skill.', 'बुध — बुद्धि, वाणी, व्यापार, कौशल।'),
          b('Jupiter (Guru) — wisdom, luck, teachers, growth.', 'गुरु (बृहस्पति) — ज्ञान, भाग्य, गुरु, वृद्धि।'),
          b('Venus (Shukra) — love, beauty, comfort, marriage.', 'शुक्र — प्रेम, सुंदरता, सुख, विवाह।'),
          b('Saturn (Shani) — discipline, patience, hard work, time.', 'शनि — अनुशासन, धैर्य, कड़ी मेहनत, समय।'),
          b('Rahu — desire, ambition, sudden rise, the unusual.', 'राहु — इच्छा, महत्वाकांक्षा, अचानक उन्नति, असामान्य।'),
          b('Ketu — detachment, spirituality, the past, letting go.', 'केतु — वैराग्य, अध्यात्म, अतीत, त्याग।'),
        ],
      },
      {
        text: b('A graha gives "good" or "tough" results depending on WHICH sign and WHICH house it sits in, and how strong it is. So no graha is purely good or bad — context decides.', 'कोई ग्रह "अच्छा" या "कठिन" फल देगा, यह इस पर निर्भर करता है कि वह किस राशि और किस भाव में बैठा है और कितना बलवान है। इसलिए कोई ग्रह पूरी तरह अच्छा या बुरा नहीं — संदर्भ तय करता है।'),
        example: b('Saturn is not "bad". A strong Saturn = patience that builds a lasting career; like a slow but solid foundation.', 'शनि "बुरा" नहीं है। बलवान शनि = धैर्य जो टिकाऊ करियर बनाता है; जैसे धीमी पर मज़बूत नींव।'),
      },
    ],
  },

  // 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 'zodiac', emoji: '♈', art: 'zodiac', level: b('Basic', 'बेसिक'),
    kicker: b('The 12 signs', '12 राशियाँ'),
    title: b('The 12 Rashis (Zodiac belt)', '12 राशियाँ (राशि-चक्र)'),
    intro: b('The sky-circle is cut into 12 equal slices.', 'आसमान का गोला 12 बराबर हिस्सों में बँटा है।'),
    readMin: 2,
    blocks: [
      {
        text: b('Picture a giant circle of sky around the Earth — the band along which the Sun, Moon and planets appear to travel. Jyotish divides this circle into 12 equal slices of 30° each. Each slice is a Rashi (zodiac sign): Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.', 'धरती के चारों ओर आसमान का एक विशाल गोला सोचिए — वह पट्टी जिस पर सूर्य, चंद्र और ग्रह चलते दिखते हैं। ज्योतिष इस गोले को 30°-30° के 12 बराबर हिस्सों में बाँटता है। हर हिस्सा एक राशि है: मेष, वृषभ, मिथुन, कर्क, सिंह, कन्या, तुला, वृश्चिक, धनु, मकर, कुंभ, मीन।'),
      },
      {
        text: b('A "sign" is simply the slice of sky a graha is standing in. Saying "Moon is in Leo" just means the Moon was in the Leo slice at your birth. Each sign has a ruling graha and a nature (fire, earth, air, water).', '"राशि" बस वह आसमानी हिस्सा है जिसमें कोई ग्रह खड़ा है। "चंद्र सिंह में है" का मतलब है जन्म के समय चंद्रमा सिंह वाले हिस्से में था। हर राशि का एक स्वामी ग्रह और एक तत्व (अग्नि, पृथ्वी, वायु, जल) होता है।'),
        example: b('Like 12 rooms in a circular house — a graha is always standing in one of the rooms.', 'जैसे गोल घर के 12 कमरे — कोई ग्रह हमेशा किसी एक कमरे में खड़ा होता है।'),
      },
    ],
  },

  // 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 'nakshatra', emoji: '✨', art: 'nakshatra', level: b('Basic+', 'बेसिक+'),
    kicker: b('Finer detail', 'सूक्ष्म विवरण'),
    title: b('The 27 Nakshatras', '27 नक्षत्र'),
    intro: b('A finer 27-part grid for precise reading.', 'सटीक पढ़ने के लिए 27 हिस्सों का बारीक ग्रिड।'),
    readMin: 2,
    blocks: [
      {
        text: b('12 signs are good, but Jyotish wanted something more precise — based on the Moon. So the same sky-circle is ALSO divided into 27 smaller parts called Nakshatras (lunar mansions). The Moon spends about one day in each nakshatra as it goes around.', '12 राशियाँ अच्छी हैं, पर ज्योतिष को चंद्रमा पर आधारित और सटीक चीज़ चाहिए थी। इसलिए वही आसमानी गोला 27 छोटे हिस्सों में भी बाँटा गया, जिन्हें नक्षत्र कहते हैं। चंद्रमा हर नक्षत्र में लगभग एक दिन रहता है।'),
      },
      {
        text: b('Your "Janma Nakshatra" (birth star) is the nakshatra the Moon was in when you were born. It is used for your name\'s first syllable, for matching kundlis in marriage, and for finer personality reading.', 'आपका "जन्म नक्षत्र" वही नक्षत्र है जिसमें जन्म के समय चंद्रमा था। इसका उपयोग नाम के पहले अक्षर, विवाह में कुंडली मिलान, और सूक्ष्म स्वभाव पढ़ने में होता है।'),
        example: b('Two people with the same Moon sign can still differ — because their nakshatra is different.', 'एक ही चंद्र राशि वाले दो लोग फिर भी अलग हो सकते हैं — क्योंकि उनका नक्षत्र अलग है।'),
      },
    ],
  },

  // 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 'lagna', emoji: '🌅', art: 'lagna', level: b('Important', 'महत्वपूर्ण'),
    kicker: b('The first thing to read', 'सबसे पहले पढ़ने वाली चीज़'),
    title: b('Lagna (Ascendant) — your starting point', 'लग्न — आपका आरंभ-बिंदु'),
    intro: b('The sign rising in the east at your birth time.', 'जन्म के समय पूर्व में उग रही राशि।'),
    readMin: 3,
    blocks: [
      {
        text: b('As the Earth spins, a new zodiac sign "rises" on the eastern horizon roughly every 2 hours. The sign that was rising at your exact birth second is your Lagna (Ascendant, or "Rising sign"). It becomes the FIRST house of your chart — your starting point.', 'धरती घूमने के साथ पूर्वी क्षितिज पर लगभग हर 2 घंटे में एक नई राशि "उगती" है। जन्म के ठीक सेकंड जो राशि उग रही थी वही आपका लग्न है। यही आपकी कुंडली का पहला भाव बनता है — आपका आरंभ-बिंदु।'),
      },
      {
        heading: b('Why Lagna matters most', 'लग्न सबसे ज़्यादा क्यों मायने रखता है'),
        text: b('Lagna decides the whole "frame" of your chart — which sign sits in which house, and therefore how every planet is read. It reflects your body, basic nature, how you start things, and the overall direction of life. This is why exact birth TIME is so important — a wrong time can change the Lagna.', 'लग्न आपकी पूरी कुंडली का "ढाँचा" तय करता है — कौन-सी राशि किस भाव में बैठेगी, और इसी से हर ग्रह का फल पढ़ा जाता है। यह आपके शरीर, मूल स्वभाव, चीज़ें शुरू करने के तरीके और जीवन की समग्र दिशा को दर्शाता है। इसीलिए सही जन्म-समय इतना ज़रूरी है — गलत समय लग्न बदल सकता है।'),
        example: b('If your Lagna is Leo, you may come across as confident and visible; if Cancer, more caring and emotional — that is the "first colour" of your personality.', 'अगर लग्न सिंह है तो आप आत्मविश्वासी व प्रभावशाली दिख सकते हैं; अगर कर्क है तो अधिक भावुक व देखभाल करने वाले — यही आपके व्यक्तित्व का "पहला रंग" है।'),
      },
    ],
  },

  // 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 'moon', emoji: '🌙', art: 'moon', level: b('Important', 'महत्वपूर्ण'),
    kicker: b('Your inner world', 'आपकी भीतरी दुनिया'),
    title: b('Moon sign — "Aapki Rashi"', 'चंद्र राशि — "आपकी राशि"'),
    intro: b('When people ask "your rashi?", they mean this.', 'जब लोग "आपकी राशि?" पूछते हैं, मतलब यही।'),
    readMin: 2,
    blocks: [
      {
        text: b('When someone says "your rashi is Leo", they usually mean your MOON sign — the zodiac sign the Moon was in at your birth. In Vedic astrology the Moon is treated as the mind, so the Moon sign describes your emotional nature, inner comfort, and how you feel things.', 'जब कोई कहता है "आपकी राशि सिंह है", तो आम तौर पर उनका मतलब आपकी चंद्र राशि से होता है — वह राशि जिसमें जन्म के समय चंद्रमा था। वैदिक ज्योतिष में चंद्रमा को मन माना जाता है, इसलिए चंद्र राशि आपके भावनात्मक स्वभाव, भीतरी सुकून और महसूस करने के तरीके को बताती है।'),
      },
      {
        text: b('Daily horoscopes (rashifal) are usually written for the Moon sign, because the Moon moves fast and reflects the day-to-day mood. Your Lagna is your outer frame; your Moon sign is your inner heart.', 'दैनिक राशिफल आम तौर पर चंद्र राशि के लिए लिखा जाता है, क्योंकि चंद्रमा तेज़ चलता है और रोज़ के मूड को दर्शाता है। लग्न आपका बाहरी ढाँचा है; चंद्र राशि आपका भीतरी हृदय।'),
        example: b('Moon in Leo = your feelings carry warmth, pride and a wish to be appreciated — like a heart that loves a little spotlight.', 'चंद्र सिंह में = आपकी भावनाओं में गर्मजोशी, स्वाभिमान और सराहना की चाह — जैसे दिल जिसे थोड़ी रौशनी पसंद है।'),
      },
    ],
  },

  // 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 'houses', emoji: '🏠', art: 'houses', level: b('Core', 'मुख्य'),
    kicker: b('12 areas of life', 'जीवन के 12 क्षेत्र'),
    title: b('The 12 Bhavas (Houses)', '12 भाव (घर)'),
    intro: b('Each box in the chart is one area of your life.', 'चार्ट का हर खाना आपके जीवन का एक क्षेत्र है।'),
    readMin: 4,
    blocks: [
      {
        text: b('A Kundli has 12 boxes called Bhavas (houses). Counting starts from your Lagna (1st house) and goes on. Each house "owns" a part of life. When we read a chart, we check which planet sits in which house, and which sign rules it.', 'कुंडली में 12 खाने होते हैं जिन्हें भाव (घर) कहते हैं। गिनती आपके लग्न (पहला भाव) से शुरू होती है। हर भाव जीवन का एक हिस्सा "रखता" है। चार्ट पढ़ते समय हम देखते हैं कि कौन-सा ग्रह किस भाव में है और उस पर किस राशि का स्वामित्व है।'),
      },
      {
        heading: b('What each house stands for', 'हर भाव किसका प्रतीक है'),
        text: b('Here is the simple meaning of all 12 houses:', 'यहाँ सभी 12 भावों का सरल मतलब है:'),
        bullets: [
          b('1st — Self, body, personality, how you start.', 'पहला — स्वयं, शरीर, व्यक्तित्व, शुरुआत।'),
          b('2nd — Money, family, speech, food.', 'दूसरा — धन, परिवार, वाणी, भोजन।'),
          b('3rd — Courage, siblings, effort, short trips.', 'तीसरा — साहस, भाई-बहन, मेहनत, छोटी यात्राएँ।'),
          b('4th — Mother, home, property, inner peace.', 'चौथा — माता, घर, संपत्ति, मन की शांति।'),
          b('5th — Children, education, creativity, romance.', 'पाँचवाँ — संतान, शिक्षा, रचनात्मकता, प्रेम।'),
          b('6th — Health, enemies, debts, daily work.', 'छठा — स्वास्थ्य, शत्रु, ऋण, रोज़ का काम।'),
          b('7th — Marriage, partner, business partners.', 'सातवाँ — विवाह, जीवनसाथी, व्यापारिक साझेदार।'),
          b('8th — Sudden events, longevity, secrets, transformation.', 'आठवाँ — अचानक घटनाएँ, आयु, रहस्य, बदलाव।'),
          b('9th — Luck, dharma, father, higher learning, travel.', 'नौवाँ — भाग्य, धर्म, पिता, उच्च शिक्षा, यात्रा।'),
          b('10th — Career, status, public image, karma.', 'दसवाँ — करियर, पद, समाज में पहचान, कर्म।'),
          b('11th — Income, gains, friends, wishes.', 'ग्यारहवाँ — आय, लाभ, मित्र, इच्छाएँ।'),
          b('12th — Expenses, loss, foreign lands, spirituality, sleep.', 'बारहवाँ — व्यय, हानि, विदेश, अध्यात्म, नींद।'),
        ],
        example: b('To read career, you look at the 10th house. If, say, Sun sits in the 10th, it can point to authority and a visible role.', 'करियर देखने के लिए दसवाँ भाव देखते हैं। मान लीजिए सूर्य दसवें में हो, तो यह अधिकार और दिखने वाली भूमिका की ओर इशारा कर सकता है।'),
      },
    ],
  },

  // 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 'readchart', emoji: '📐', art: 'readchart', level: b('Core', 'मुख्य'),
    kicker: b('How to read the boxes', 'खाने कैसे पढ़ें'),
    title: b('How to actually READ the chart', 'चार्ट को असल में कैसे पढ़ें'),
    intro: b('North vs South style + reading any box, step by step.', 'उत्तर/दक्षिण शैली + कोई भी खाना पढ़ना, कदम-दर-कदम।'),
    readMin: 4,
    blocks: [
      {
        text: b('A Kundli is drawn in different layouts, but it is the SAME data:', 'कुंडली अलग-अलग शैलियों में बनाई जाती है, पर डेटा एक ही होता है:'),
        bullets: [
          b('North Indian — a diamond shape. The HOUSES stay fixed; the sign NUMBER changes in each box.', 'उत्तर भारतीय — हीरे (diamond) जैसा। भाव स्थिर रहते हैं; हर खाने में राशि का नंबर बदलता है।'),
          b('South Indian — a square grid. The SIGNS stay fixed; the Lagna is marked, and houses are counted from it.', 'दक्षिण भारतीय — चौकोर ग्रिड। राशियाँ स्थिर रहती हैं; लग्न पर निशान होता है और भाव उससे गिने जाते हैं।'),
          b('The layout only changes the drawing — never your birth data.', 'शैली सिर्फ़ चित्र बदलती है — आपका जन्म-डेटा कभी नहीं।'),
        ],
      },
      {
        heading: b('How to read ONE box', 'एक खाना कैसे पढ़ें'),
        text: b('Pick any box. Three things live in it: (1) a HOUSE number (which life-area), (2) a SIGN number 1–12 (which zodiac slice — 1=Aries … 12=Pisces), and (3) any GRAHAS sitting there (shown by short names like Su, Mo, Ma…). You read it as: "this life-area, coloured by this sign, is influenced by these planets."', 'कोई भी खाना चुनिए। उसमें तीन चीज़ें होती हैं: (1) भाव संख्या (कौन-सा जीवन-क्षेत्र), (2) राशि संख्या 1–12 (कौन-सी राशि — 1=मेष … 12=मीन), और (3) उसमें बैठे ग्रह (छोटे नाम जैसे सू, चं, मं…)। इसे ऐसे पढ़ें: "यह जीवन-क्षेत्र, इस राशि के रंग में, इन ग्रहों से प्रभावित है।"'),
        example: b('Box shows "10" as house, sign "1" (Aries) and "Su" inside → 10th house (career) in Aries, with the Sun → a bold, leadership-style career theme.', 'खाने में भाव "10", राशि "1" (मेष) और अंदर "सू" → दसवाँ भाव (करियर) मेष में, सूर्य के साथ → साहसी, नेतृत्व-शैली का करियर भाव।'),
      },
      {
        heading: b('The beginner order', 'शुरुआती क्रम'),
        text: b('Never judge by one planet. Read in this order, layer by layer:', 'कभी एक ग्रह से फ़ैसला न करें। इस क्रम में परत-दर-परत पढ़ें:'),
        bullets: [
          b('1) Lagna — the overall frame.', '1) लग्न — समग्र ढाँचा।'),
          b('2) Moon sign — the inner mind.', '2) चंद्र राशि — भीतरी मन।'),
          b('3) Which planet is in which house.', '3) कौन ग्रह किस भाव में।'),
          b('4) Planet strength (own sign / exalted / weak).', '4) ग्रह-बल (स्वराशि / उच्च / कमज़ोर)।'),
          b('5) Dasha (timing) + Gochar (current transits).', '5) दशा (समय) + गोचर (वर्तमान चाल)।'),
        ],
      },
    ],
  },

  // 10 ────────────────────────────────────────────────────────────────────
  {
    id: 'varga', emoji: '🔍', art: 'varga', level: b('Advanced', 'उन्नत'),
    kicker: b('Zoom-in charts', 'ज़ूम-इन चार्ट'),
    title: b('Why there are MANY charts (Varga)', 'इतने सारे चार्ट क्यों (वर्ग)'),
    intro: b('D1 is the main map; D9, D10… zoom into one area.', 'D1 मुख्य नक्शा; D9, D10… एक क्षेत्र को ज़ूम करते हैं।'),
    readMin: 3,
    blocks: [
      {
        text: b('The main birth chart is the D1 or Rashi chart — your overall life map. But for a closer look at ONE topic, Jyotish uses divisional charts called Varga charts. They are calculated by sub-dividing each sign further.', 'मुख्य जन्म-कुंडली D1 या राशि चार्ट है — आपका समग्र जीवन-नक्शा। पर किसी एक विषय को नज़दीक से देखने के लिए ज्योतिष विभागीय चार्ट (वर्ग चार्ट) प्रयोग करता है। ये हर राशि को और बाँटकर निकाले जाते हैं।'),
        bullets: [
          b('D1 (Rashi) — the whole life, the base chart.', 'D1 (राशि) — पूरा जीवन, आधार चार्ट।'),
          b('D9 (Navamsha) — marriage, dharma, real inner strength of planets.', 'D9 (नवांश) — विवाह, धर्म, ग्रहों का वास्तविक भीतरी बल।'),
          b('D10 (Dashamsha) — career and profession.', 'D10 (दशमांश) — करियर और व्यवसाय।'),
          b('Others (D2, D3, D7, D12…) — wealth, siblings, children, parents…', 'अन्य (D2, D3, D7, D12…) — धन, भाई-बहन, संतान, माता-पिता…'),
        ],
        example: b('D1 says you marry; D9 describes the quality and depth of that marriage — like a microscope on one slide.', 'D1 कहता है विवाह होगा; D9 उस विवाह की गुणवत्ता व गहराई बताता है — जैसे एक स्लाइड पर माइक्रोस्कोप।'),
      },
    ],
  },

  // 11 ────────────────────────────────────────────────────────────────────
  {
    id: 'dasha', emoji: '⏳', art: 'dasha', level: b('Advanced', 'उन्नत'),
    kicker: b('Timing of life', 'जीवन का समय'),
    title: b('Dasha & Gochar — the "when"', 'दशा और गोचर — "कब"'),
    intro: b('The chart shows "what"; these show "when".', 'चार्ट "क्या" बताता है; ये "कब" बताते हैं।'),
    readMin: 3,
    blocks: [
      {
        text: b('Your birth chart shows your potential — but WHEN does each theme become active? That is timing. Jyotish has two main timing tools: Dasha and Gochar.', 'आपकी जन्म-कुंडली आपकी संभावना दिखाती है — पर हर विषय कब सक्रिय होगा? यही समय है। ज्योतिष में समय के दो मुख्य औज़ार हैं: दशा और गोचर।'),
        bullets: [
          b('Dasha — a planetary "period" system (Vimshottari is most common). Life runs through long periods ruled by different grahas, e.g. a 19-year Saturn period, a 16-year Jupiter period.', 'दशा — ग्रहों की "अवधि" पद्धति (विंशोत्तरी सबसे आम)। जीवन अलग-अलग ग्रहों की लंबी अवधियों से गुज़रता है, जैसे 19 साल की शनि दशा, 16 साल की गुरु दशा।'),
          b('Gochar (transit) — where the planets are moving in the sky TODAY, compared to your birth Moon. This is what "Sade Sati" is about.', 'गोचर — आज आसमान में ग्रह कहाँ चल रहे हैं, आपके जन्म-चंद्र के मुक़ाबले। "साढ़े साती" इसी का हिस्सा है।'),
        ],
        example: b('Chart says you have leadership ability (the "what"); a supportive Jupiter dasha can be the "when" it finally shows up.', 'चार्ट कहता है आपमें नेतृत्व-क्षमता है (क्या); अनुकूल गुरु दशा वह समय हो सकती है जब यह सामने आती है (कब)।'),
      },
    ],
  },

  // 12 ────────────────────────────────────────────────────────────────────
  {
    id: 'history', emoji: '📜', art: 'history', level: b('Story', 'कहानी'),
    kicker: b('Where it came from', 'यह कहाँ से आया'),
    title: b('Who "invented" Jyotish?', 'ज्योतिष किसने "बनाया"?'),
    intro: b('Not one person — a tradition grown over ages.', 'कोई एक व्यक्ति नहीं — युगों में विकसित परंपरा।'),
    readMin: 3,
    blocks: [
      {
        text: b('No single person invented Vedic astrology. It grew as a tradition called Jyotisha — one of the six "Vedangas" (limbs of the Veda), originally about timekeeping, the calendar and choosing the right moment for rituals. The early text Vedanga Jyotisha is over 2,000 years old.', 'वैदिक ज्योतिष किसी एक व्यक्ति का बनाया नहीं है। यह "ज्योतिष" नाम की परंपरा के रूप में विकसित हुआ — वेद के छह "वेदांगों" में से एक, जो मूलतः समय-गणना, पंचांग और शुभ मुहूर्त चुनने के बारे में था। प्रारंभिक ग्रंथ "वेदांग ज्योतिष" 2,000 साल से अधिक पुराना है।'),
      },
      {
        text: b('Later, sages and classical texts expanded chart-reading, the dasha system and predictions. The most famous foundational text on birth-chart reading is the Brihat Parashara Hora Shastra, attributed to the sage Parashara. So it is more accurate to say "a tradition developed over centuries" than to name one inventor.', 'बाद में ऋषियों और शास्त्रीय ग्रंथों ने जन्म-कुंडली पढ़ना, दशा पद्धति और फलादेश को विस्तार दिया। जन्म-कुंडली पढ़ने का सबसे प्रसिद्ध आधारभूत ग्रंथ "बृहत् पराशर होरा शास्त्र" है, जो ऋषि पराशर से जुड़ा है। इसलिए किसी एक "अविष्कारक" का नाम लेने से बेहतर है कहना कि "यह परंपरा सदियों में विकसित हुई"।'),
        example: b('Like a language — nobody "invented" Hindi in one day; many people shaped it over a long time.', 'जैसे कोई भाषा — हिंदी को किसी ने एक दिन में "नहीं बनाया"; कई लोगों ने लंबे समय में गढ़ा।'),
      },
    ],
  },

  // 13 ────────────────────────────────────────────────────────────────────
  {
    id: 'trust', emoji: '🪔', art: 'trust', level: b('Important', 'महत्वपूर्ण'),
    kicker: b('How to use it wisely', 'इसे समझदारी से कैसे लें'),
    title: b('Guidance, not fear', 'मार्गदर्शन, डर नहीं'),
    intro: b('Use a kundli to reflect — never to panic.', 'कुंडली सोच-समझ के लिए — घबराने के लिए नहीं।'),
    readMin: 2,
    blocks: [
      {
        text: b('A Kundli is a traditional system for reflection — about tendencies, timing and remedies. It can make you calmer and clearer. But it should NEVER replace medical, legal, financial or emergency advice, and no single planet or yoga decides a whole life.', 'कुंडली सोच-विचार की एक पारंपरिक पद्धति है — प्रवृत्तियों, समय और उपायों के बारे में। यह आपको शांत और स्पष्ट बना सकती है। पर यह कभी भी चिकित्सा, कानूनी, आर्थिक या आपातकालीन सलाह की जगह नहीं ले सकती, और कोई एक ग्रह या योग पूरी ज़िंदगी तय नहीं करता।'),
        bullets: [
          b('Read the FULL picture, not one scary line.', 'पूरी तस्वीर पढ़ें, एक डरावनी पंक्ति नहीं।'),
          b('Remedies should be simple, positive and harmless.', 'उपाय सरल, सकारात्मक और अहानिकारक हों।'),
          b('Your effort (karma) always matters most.', 'आपकी मेहनत (कर्म) हमेशा सबसे ज़्यादा मायने रखती है।'),
        ],
        example: b('Think of it like a weather forecast: it helps you carry an umbrella — it does not control your day.', 'इसे मौसम के पूर्वानुमान जैसा समझें: यह छाता रखने में मदद करता है — आपका दिन नियंत्रित नहीं करता।'),
      },
    ],
  },
];
