// Educational content for the interactive "Kundli Seekhe" feature.
// 12 Bhava (houses) + 16 Shodashvarga divisional charts (+ Moon chart), in easy AND
// technical language with real-life examples. Classical significations, verified against
// standard Vedic sources (BPHS tradition; Prokerala / Astro-Seek divisional-chart guides).
// This is fixed educational reference text (a tutorial), not per-user computed data.

export interface Bi { en: string; hi: string }

export interface Bhava {
  house: number;                 // 1..12
  name: Bi;                      // Sanskrit/common name
  title: Bi;                     // plain title (what it is)
  easy: Bi;                      // aam bhasha
  technical: Bi;                 // jyotish terms
  example: Bi;                   // real-life example
  keywords: { en: string[]; hi: string[] };
  karaka: Bi;                    // natural significator planet
  aiPrompt: Bi;                  // prefilled question for "Learn with AI"
}

export const BHAVAS: Bhava[] = [
  {
    house: 1, name: { en: 'Lagna / Tanu Bhava', hi: 'लग्न / तनु भाव' }, title: { en: 'Self, body & personality', hi: 'स्वयं, शरीर व व्यक्तित्व' },
    easy: { en: 'This is YOU — your body, health, looks, nature and the overall direction of your life.', hi: 'यह आप स्वयं हैं — आपका शरीर, स्वास्थ्य, रंग-रूप, स्वभाव और पूरे जीवन की दिशा।' },
    technical: { en: 'The 1st house (Lagna) shows the physical body, vitality, temperament and the "lens" through which the whole chart is read. Its lord and any planets here shape your core self.', hi: 'प्रथम भाव (लग्न) शरीर, ओज, स्वभाव और वह “दृष्टिकोण” दिखाता है जिससे पूरी कुंडली पढ़ी जाती है। इसका स्वामी व यहाँ बैठे ग्रह आपके मूल व्यक्तित्व को गढ़ते हैं।' },
    example: { en: 'Like the cover & first page of your life-book — it sets the tone for everything inside.', hi: 'जैसे आपकी जीवन-पुस्तक का कवर व पहला पन्ना — यह अंदर की हर बात का माहौल तय करता है।' },
    keywords: { en: ['Body', 'Health', 'Personality', 'Appearance', 'Life direction'], hi: ['शरीर', 'स्वास्थ्य', 'व्यक्तित्व', 'रूप', 'जीवन-दिशा'] },
    karaka: { en: 'Sun', hi: 'सूर्य' },
    aiPrompt: { en: 'Explain my 1st house (Lagna) in my birth chart in very simple language — my personality, health and life direction.', hi: 'मेरी कुंडली में मेरे प्रथम भाव (लग्न) का फल बहुत आसान भाषा में समझाएँ — मेरा व्यक्तित्व, स्वास्थ्य व जीवन-दिशा।' },
  },
  {
    house: 2, name: { en: 'Dhana Bhava', hi: 'धन भाव' }, title: { en: 'Wealth, family & speech', hi: 'धन, परिवार व वाणी' },
    easy: { en: 'Your money, savings, family, food and the way you speak.', hi: 'आपका धन, बचत, परिवार, भोजन और बोलने का तरीका।' },
    technical: { en: 'The 2nd house governs accumulated wealth, family lineage (kutumba), speech, face, and food habits. Strong 2nd house = good savings and pleasant speech.', hi: 'द्वितीय भाव संचित धन, कुटुंब, वाणी, मुख और भोजन-आदत का कारक है। मज़बूत द्वितीय भाव = अच्छी बचत व मधुर वाणी।' },
    example: { en: 'Like your wallet and dining table — what you keep and what you say.', hi: 'जैसे आपका बटुआ और खाने की मेज़ — आप क्या रखते हैं और क्या बोलते हैं।' },
    keywords: { en: ['Money', 'Savings', 'Family', 'Speech', 'Food'], hi: ['धन', 'बचत', 'परिवार', 'वाणी', 'भोजन'] },
    karaka: { en: 'Jupiter', hi: 'गुरु' },
    aiPrompt: { en: 'Explain my 2nd house (wealth, family, speech) in my chart in simple language.', hi: 'मेरी कुंडली में द्वितीय भाव (धन, परिवार, वाणी) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 3, name: { en: 'Sahaja / Parakrama', hi: 'सहज / पराक्रम भाव' }, title: { en: 'Courage, siblings & skills', hi: 'साहस, भाई-बहन व कौशल' },
    easy: { en: 'Your courage, effort, younger siblings, hobbies, skills and short trips.', hi: 'आपका साहस, मेहनत, छोटे भाई-बहन, शौक, कौशल और छोटी यात्राएँ।' },
    technical: { en: 'The 3rd house rules valour (parakrama), communication, hands/arms, siblings, and self-effort. It shows how boldly you pursue your goals.', hi: 'तृतीय भाव पराक्रम, संवाद, हाथ-बाहु, भाई-बहन और स्व-प्रयास का कारक है। यह दिखाता है कि आप अपने लक्ष्य कितने साहस से पाते हैं।' },
    example: { en: 'Like the "guts + hustle" that turns a wish into action.', hi: 'जैसे वह “हिम्मत + मेहनत” जो इच्छा को कर्म में बदल देती है।' },
    keywords: { en: ['Courage', 'Effort', 'Siblings', 'Skills', 'Short travel'], hi: ['साहस', 'प्रयास', 'भाई-बहन', 'कौशल', 'छोटी यात्रा'] },
    karaka: { en: 'Mars', hi: 'मंगल' },
    aiPrompt: { en: 'Explain my 3rd house (courage, siblings, skills) in my chart in simple language.', hi: 'मेरी कुंडली में तृतीय भाव (साहस, भाई-बहन, कौशल) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 4, name: { en: 'Sukha Bhava', hi: 'सुख भाव' }, title: { en: 'Mother, home & happiness', hi: 'माता, घर व सुख' },
    easy: { en: 'Your mother, home, land/property, vehicles, peace of mind and comforts.', hi: 'आपकी माता, घर, ज़मीन/संपत्ति, वाहन, मन की शांति और सुख-सुविधाएँ।' },
    technical: { en: 'The 4th house signifies mother, real estate, vehicles, domestic happiness and emotional foundations (chest/heart). It is the base of inner contentment.', hi: 'चतुर्थ भाव माता, अचल संपत्ति, वाहन, घरेलू सुख और भावनात्मक नींव (हृदय) का कारक है। यह आंतरिक संतोष का आधार है।' },
    example: { en: 'Like the roof over your head and the calm in your heart.', hi: 'जैसे सिर पर छत और हृदय की शांति।' },
    keywords: { en: ['Mother', 'Home', 'Property', 'Vehicles', 'Peace'], hi: ['माता', 'घर', 'संपत्ति', 'वाहन', 'शांति'] },
    karaka: { en: 'Moon', hi: 'चंद्र' },
    aiPrompt: { en: 'Explain my 4th house (mother, home, property, happiness) in my chart in simple language.', hi: 'मेरी कुंडली में चतुर्थ भाव (माता, घर, संपत्ति, सुख) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 5, name: { en: 'Putra / Vidya', hi: 'पुत्र / विद्या भाव' }, title: { en: 'Children, intellect & romance', hi: 'संतान, बुद्धि व प्रेम' },
    easy: { en: 'Your children, intelligence, education, creativity, romance and luck from past good deeds.', hi: 'आपकी संतान, बुद्धि, शिक्षा, रचनात्मकता, प्रेम और पूर्व-पुण्य से मिलने वाला भाग्य।' },
    technical: { en: 'The 5th house rules progeny, higher intelligence (buddhi), mantra/upasana, speculation and poorva-punya (merit from past lives). A strong 5th gives wisdom and good children.', hi: 'पंचम भाव संतान, उच्च बुद्धि, मंत्र/उपासना, सट्टा और पूर्व-पुण्य का कारक है। मज़बूत पंचम = विवेक व सुयोग्य संतान।' },
    example: { en: 'Like your creative spark and the joy of raising the next generation.', hi: 'जैसे आपकी रचनात्मक चिंगारी और अगली पीढ़ी को पालने का सुख।' },
    keywords: { en: ['Children', 'Intellect', 'Education', 'Romance', 'Creativity'], hi: ['संतान', 'बुद्धि', 'शिक्षा', 'प्रेम', 'रचनात्मकता'] },
    karaka: { en: 'Jupiter', hi: 'गुरु' },
    aiPrompt: { en: 'Explain my 5th house (children, intelligence, romance) in my chart in simple language.', hi: 'मेरी कुंडली में पंचम भाव (संतान, बुद्धि, प्रेम) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 6, name: { en: 'Ripu / Roga', hi: 'रिपु / रोग भाव' }, title: { en: 'Enemies, disease & service', hi: 'शत्रु, रोग व सेवा' },
    easy: { en: 'Your enemies, diseases, debts, obstacles, daily work/job and competition.', hi: 'आपके शत्रु, रोग, ऋण, बाधाएँ, रोज़ का काम/नौकरी और प्रतिस्पर्धा।' },
    technical: { en: 'The 6th house governs enemies, disease, debt, litigation, service and competition. Well-placed, it gives the power to defeat rivals and overcome hurdles.', hi: 'षष्ठ भाव शत्रु, रोग, ऋण, मुकदमा, सेवा और प्रतिस्पर्धा का कारक है। शुभ स्थिति में यह शत्रुओं व बाधाओं पर विजय देता है।' },
    example: { en: 'Like the gym of life — struggles here build your strength to win.', hi: 'जैसे जीवन का व्यायामशाला — यहाँ के संघर्ष आपको जीतने की ताक़त देते हैं।' },
    keywords: { en: ['Enemies', 'Disease', 'Debt', 'Job/Service', 'Competition'], hi: ['शत्रु', 'रोग', 'ऋण', 'नौकरी/सेवा', 'प्रतिस्पर्धा'] },
    karaka: { en: 'Mars & Saturn', hi: 'मंगल व शनि' },
    aiPrompt: { en: 'Explain my 6th house (enemies, health, debts, service) in my chart in simple language.', hi: 'मेरी कुंडली में षष्ठ भाव (शत्रु, रोग, ऋण, सेवा) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 7, name: { en: 'Kalatra Bhava', hi: 'कलत्र भाव' }, title: { en: 'Marriage, spouse & partnerships', hi: 'विवाह, जीवनसाथी व साझेदारी' },
    easy: { en: 'Your spouse, marriage, business partners and dealings with the public.', hi: 'आपका जीवनसाथी, विवाह, व्यापारिक साझेदार और जनता से व्यवहार।' },
    technical: { en: 'The 7th house rules marriage, spouse, business partnerships, contracts and public relations. It is the axis of "the other" — how you relate one-to-one.', hi: 'सप्तम भाव विवाह, जीवनसाथी, व्यापारिक साझेदारी, अनुबंध और जनसंपर्क का कारक है। यह “दूसरे” की धुरी है — आप एक-से-एक संबंध कैसे बनाते हैं।' },
    example: { en: 'Like the handshake and the wedding ring — every close partnership.', hi: 'जैसे हाथ मिलाना और शादी की अंगूठी — हर घनिष्ठ साझेदारी।' },
    keywords: { en: ['Marriage', 'Spouse', 'Partnership', 'Business', 'Public'], hi: ['विवाह', 'जीवनसाथी', 'साझेदारी', 'व्यापार', 'जनता'] },
    karaka: { en: 'Venus', hi: 'शुक्र' },
    aiPrompt: { en: 'Explain my 7th house (marriage, spouse, partnerships) in my chart in simple language.', hi: 'मेरी कुंडली में सप्तम भाव (विवाह, जीवनसाथी, साझेदारी) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 8, name: { en: 'Ayu / Randhra', hi: 'आयु / रंध्र भाव' }, title: { en: 'Longevity, transformation & occult', hi: 'आयु, परिवर्तन व रहस्य' },
    easy: { en: 'Your lifespan, sudden ups-downs, inheritance, deep secrets and interest in the mysterious.', hi: 'आपकी आयु, अचानक उतार-चढ़ाव, विरासत, गहरे रहस्य और रहस्यमयी में रुचि।' },
    technical: { en: 'The 8th house signifies longevity, sudden events, transformation, inheritance/other people\'s money, occult and research. It rules deep change and hidden matters.', hi: 'अष्टम भाव आयु, अचानक घटनाएँ, परिवर्तन, विरासत/दूसरों का धन, गुह्य-विद्या और शोध का कारक है। यह गहरे बदलाव व छुपे मामलों का घर है।' },
    example: { en: 'Like a locked drawer — sudden gains, hidden depths and rebirths of life.', hi: 'जैसे बंद दराज़ — अचानक लाभ, छुपी गहराइयाँ और जीवन के पुनर्जन्म।' },
    keywords: { en: ['Longevity', 'Sudden events', 'Inheritance', 'Occult', 'Transformation'], hi: ['आयु', 'अचानक घटनाएँ', 'विरासत', 'गुह्य-विद्या', 'परिवर्तन'] },
    karaka: { en: 'Saturn', hi: 'शनि' },
    aiPrompt: { en: 'Explain my 8th house (longevity, sudden events, transformation, occult) in my chart in simple language.', hi: 'मेरी कुंडली में अष्टम भाव (आयु, अचानक घटनाएँ, परिवर्तन, रहस्य) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 9, name: { en: 'Bhagya / Dharma', hi: 'भाग्य / धर्म भाव' }, title: { en: 'Luck, father, guru & dharma', hi: 'भाग्य, पिता, गुरु व धर्म' },
    easy: { en: 'Your luck, father, teacher/guru, higher studies, religion, long journeys and good fortune.', hi: 'आपका भाग्य, पिता, गुरु, उच्च शिक्षा, धर्म, लंबी यात्राएँ और सौभाग्य।' },
    technical: { en: 'The 9th house is the strongest trine — dharma, fortune, father, guru, higher learning, pilgrimage and past-life merit. It blesses the whole life when strong.', hi: 'नवम भाव सबसे शुभ त्रिकोण है — धर्म, भाग्य, पिता, गुरु, उच्च शिक्षा, तीर्थ और पूर्व-पुण्य। मज़बूत होने पर पूरे जीवन को आशीर्वाद देता है।' },
    example: { en: 'Like a tailwind and a wise mentor guiding your journey.', hi: 'जैसे पीछे से बहती अनुकूल हवा और मार्ग दिखाने वाला ज्ञानी गुरु।' },
    keywords: { en: ['Luck', 'Father', 'Guru', 'Higher study', 'Religion'], hi: ['भाग्य', 'पिता', 'गुरु', 'उच्च शिक्षा', 'धर्म'] },
    karaka: { en: 'Jupiter & Sun', hi: 'गुरु व सूर्य' },
    aiPrompt: { en: 'Explain my 9th house (luck, father, guru, dharma) in my chart in simple language.', hi: 'मेरी कुंडली में नवम भाव (भाग्य, पिता, गुरु, धर्म) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 10, name: { en: 'Karma Bhava', hi: 'कर्म भाव' }, title: { en: 'Career, status & fame', hi: 'करियर, पद व यश' },
    easy: { en: 'Your career, profession, position, fame and the work people know you for.', hi: 'आपका करियर, पेशा, पद, यश और वह काम जिससे लोग आपको जानते हैं।' },
    technical: { en: 'The 10th house (highest point) rules profession, authority, status, government and karma in society. Its strength decides worldly success and recognition.', hi: 'दशम भाव (सर्वोच्च बिंदु) पेशा, अधिकार, पद, सरकार और समाज में कर्म का कारक है। इसकी शक्ति सांसारिक सफलता व पहचान तय करती है।' },
    example: { en: 'Like your name-plate at work and your standing in society.', hi: 'जैसे काम पर आपकी नाम-पट्टिका और समाज में आपकी हैसियत।' },
    keywords: { en: ['Career', 'Profession', 'Status', 'Fame', 'Authority'], hi: ['करियर', 'पेशा', 'पद', 'यश', 'अधिकार'] },
    karaka: { en: 'Sun, Mercury, Jupiter, Saturn', hi: 'सूर्य, बुध, गुरु, शनि' },
    aiPrompt: { en: 'Explain my 10th house (career, profession, status, fame) in my chart in simple language.', hi: 'मेरी कुंडली में दशम भाव (करियर, पेशा, पद, यश) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 11, name: { en: 'Labha Bhava', hi: 'लाभ भाव' }, title: { en: 'Gains, income & friends', hi: 'लाभ, आय व मित्र' },
    easy: { en: 'Your income, profits, fulfilment of desires, elder siblings and friends/network.', hi: 'आपकी आय, मुनाफ़ा, इच्छाओं की पूर्ति, बड़े भाई-बहन और मित्र/नेटवर्क।' },
    technical: { en: 'The 11th house signifies gains (labha), all income regardless of source, fulfilment of desires, elder siblings and social circle. A strong 11th brings steady profit.', hi: 'एकादश भाव लाभ, हर स्रोत से आय, इच्छा-पूर्ति, बड़े भाई-बहन और सामाजिक दायरे का कारक है। मज़बूत एकादश = स्थिर मुनाफ़ा।' },
    example: { en: 'Like the money that lands in your account and the friends who lift you up.', hi: 'जैसे खाते में आने वाला धन और आपको ऊपर उठाने वाले मित्र।' },
    keywords: { en: ['Income', 'Gains', 'Desires', 'Friends', 'Network'], hi: ['आय', 'लाभ', 'इच्छाएँ', 'मित्र', 'नेटवर्क'] },
    karaka: { en: 'Jupiter', hi: 'गुरु' },
    aiPrompt: { en: 'Explain my 11th house (gains, income, friends) in my chart in simple language.', hi: 'मेरी कुंडली में एकादश भाव (लाभ, आय, मित्र) का फल आसान भाषा में समझाएँ।' },
  },
  {
    house: 12, name: { en: 'Vyaya / Moksha', hi: 'व्यय / मोक्ष भाव' }, title: { en: 'Expenses, foreign & liberation', hi: 'व्यय, विदेश व मोक्ष' },
    easy: { en: 'Your expenses, losses, foreign lands, sleep & rest, isolation, and spiritual liberation.', hi: 'आपके खर्च, हानि, विदेश, नींद व विश्राम, एकांत, और आध्यात्मिक मोक्ष।' },
    technical: { en: 'The 12th house rules expenditure, loss, foreign residence, seclusion, bed-comforts and moksha (liberation). It governs what you release and your spiritual dissolution.', hi: 'द्वादश भाव व्यय, हानि, विदेश-निवास, एकांत, शय्या-सुख और मोक्ष का कारक है। यह दिखाता है कि आप क्या त्यागते हैं और आपकी आध्यात्मिक मुक्ति।' },
    example: { en: 'Like the outflow gate — spending, letting go, and the path to peace beyond the world.', hi: 'जैसे बाहर जाने का द्वार — खर्च, त्याग, और सांसारिकता से परे शांति का मार्ग।' },
    keywords: { en: ['Expenses', 'Loss', 'Foreign', 'Isolation', 'Moksha'], hi: ['व्यय', 'हानि', 'विदेश', 'एकांत', 'मोक्ष'] },
    karaka: { en: 'Saturn & Ketu', hi: 'शनि व केतु' },
    aiPrompt: { en: 'Explain my 12th house (expenses, foreign, spirituality, moksha) in my chart in simple language.', hi: 'मेरी कुंडली में द्वादश भाव (व्यय, विदेश, अध्यात्म, मोक्ष) का फल आसान भाषा में समझाएँ।' },
  },
];

export interface Varga {
  code: string;                  // 'D1', 'Moon', 'D9'…
  name: Bi;                      // classical name
  divisions: string;            // "1 part" / "9 parts" (display)
  easy: Bi;                      // what it shows, aam bhasha
  technical: Bi;                 // technical purpose
  importance: 'core' | 'major' | 'special';
  aiPrompt: Bi;
}

export const VARGAS: Varga[] = [
  { code: 'D1', name: { en: 'Rasi (Lagna Chart)', hi: 'राशि (लग्न कुंडली)' }, divisions: '1', importance: 'core',
    easy: { en: 'The main birth chart — your whole life at a glance: body, mind, family, career, everything.', hi: 'मुख्य जन्म कुंडली — एक नज़र में पूरा जीवन: शरीर, मन, परिवार, करियर, सब कुछ।' },
    technical: { en: 'The foundation chart. Every prediction starts here; other vargas only refine specific areas.', hi: 'आधार कुंडली। हर भविष्यवाणी यहीं से शुरू होती है; बाकी वर्ग केवल खास क्षेत्रों को सूक्ष्म करते हैं।' },
    aiPrompt: { en: 'Give me a simple overview of my D1 (Rasi) birth chart.', hi: 'मेरी D1 (राशि) जन्म कुंडली का आसान सारांश दें।' } },
  { code: 'Moon', name: { en: 'Chandra Kundli (Moon Chart)', hi: 'चंद्र कुंडली' }, divisions: '1', importance: 'core',
    easy: { en: 'The chart drawn from the Moon — shows your mind, emotions and mental peace.', hi: 'चंद्रमा से बनी कुंडली — आपका मन, भावनाएँ और मानसिक शांति दिखाती है।' },
    technical: { en: 'The same D1 read with the Moon as ascendant. Essential for the mind, and dasha/transit results are often judged from it too.', hi: 'वही D1, पर चंद्रमा को लग्न मानकर। मन के लिए आवश्यक; दशा/गोचर के फल भी अक्सर इसी से देखे जाते हैं।' },
    aiPrompt: { en: 'Explain my Moon chart (Chandra Kundli) — my mind and emotions — in simple language.', hi: 'मेरी चंद्र कुंडली (मन व भावनाएँ) आसान भाषा में समझाएँ।' } },
  { code: 'D2', name: { en: 'Hora', hi: 'होरा' }, divisions: '2', importance: 'major',
    easy: { en: 'Shows your wealth and money matters — how well you can earn and save.', hi: 'आपका धन व पैसे के मामले दिखाती है — आप कितना कमा व बचा सकते हैं।' },
    technical: { en: 'Divides each sign into 2. Used to assess financial prosperity, income and accumulation of wealth.', hi: 'हर राशि को 2 भागों में बाँटती है। धन-समृद्धि, आय व धन-संचय के आकलन हेतु।' },
    aiPrompt: { en: 'What does my D2 (Hora) chart say about wealth? Explain simply.', hi: 'मेरी D2 (होरा) कुंडली धन के बारे में क्या कहती है? आसान भाषा में बताएँ।' } },
  { code: 'D3', name: { en: 'Drekkana', hi: 'द्रेष्काण' }, divisions: '3', importance: 'major',
    easy: { en: 'Shows siblings, courage and your drive to take initiative.', hi: 'भाई-बहन, साहस और पहल करने की आपकी ऊर्जा दिखाती है।' },
    technical: { en: 'Divides each sign into 3. Judges co-borns, valour, enterprise and the ability to choose.', hi: 'हर राशि को 3 भागों में बाँटती है। सहोदर, पराक्रम, उद्यम व चयन-क्षमता का विचार।' },
    aiPrompt: { en: 'Explain my D3 (Drekkana) chart — siblings and courage — simply.', hi: 'मेरी D3 (द्रेष्काण) कुंडली — भाई-बहन व साहस — आसान भाषा में समझाएँ।' } },
  { code: 'D4', name: { en: 'Chaturthamsha', hi: 'चतुर्थांश' }, divisions: '4', importance: 'major',
    easy: { en: 'Shows property, home, land, vehicles and fixed assets.', hi: 'संपत्ति, घर, ज़मीन, वाहन और अचल संपत्ति दिखाती है।' },
    technical: { en: 'Divides each sign into 4. Used for immovable assets, residence, fortune from property and inner happiness.', hi: 'हर राशि को 4 भागों में बाँटती है। अचल संपत्ति, निवास, संपत्ति-सुख व आंतरिक सुख हेतु।' },
    aiPrompt: { en: 'Explain my D4 (Chaturthamsha) chart — property and home — simply.', hi: 'मेरी D4 (चतुर्थांश) कुंडली — संपत्ति व घर — आसान भाषा में समझाएँ।' } },
  { code: 'D7', name: { en: 'Saptamsha', hi: 'सप्तांश' }, divisions: '7', importance: 'major',
    easy: { en: 'Shows children, progeny and matters of fertility.', hi: 'संतान, वंश और प्रजनन के मामले दिखाती है।' },
    technical: { en: 'Divides each sign into 7. The primary chart for children, grandchildren and creative progeny.', hi: 'हर राशि को 7 भागों में बाँटती है। संतान, पौत्र-पौत्री व रचनात्मक वंश की मुख्य कुंडली।' },
    aiPrompt: { en: 'Explain my D7 (Saptamsha) chart — children — simply.', hi: 'मेरी D7 (सप्तांश) कुंडली — संतान — आसान भाषा में समझाएँ।' } },
  { code: 'D9', name: { en: 'Navamsha', hi: 'नवांश' }, divisions: '9', importance: 'core',
    easy: { en: 'The 2nd most important chart — shows marriage, spouse and your inner strength & dharma.', hi: 'दूसरी सबसे महत्वपूर्ण कुंडली — विवाह, जीवनसाथी और आपकी आंतरिक शक्ति व धर्म दिखाती है।' },
    technical: { en: 'Divides each sign into 9. Reveals the true strength of planets, marriage/spouse, dharma and the deeper self. A planet weak in D1 but strong in D9 (vargottama) gives lasting results.', hi: 'हर राशि को 9 भागों में बाँटती है। ग्रहों की वास्तविक शक्ति, विवाह/जीवनसाथी, धर्म व गहरे स्व को दर्शाती है। D1 में कमज़ोर पर D9 में मज़बूत (वर्गोत्तम) ग्रह स्थायी फल देता है।' },
    aiPrompt: { en: 'Explain my D9 (Navamsha) chart — marriage, spouse and inner strength — simply.', hi: 'मेरी D9 (नवांश) कुंडली — विवाह, जीवनसाथी व आंतरिक शक्ति — आसान भाषा में समझाएँ।' } },
  { code: 'D10', name: { en: 'Dashamsha', hi: 'दशांश' }, divisions: '10', importance: 'major',
    easy: { en: 'Shows career, profession, achievements and public recognition.', hi: 'करियर, पेशा, उपलब्धियाँ और सार्वजनिक पहचान दिखाती है।' },
    technical: { en: 'Divides each sign into 10. The main chart for profession, status, promotions and success in the world.', hi: 'हर राशि को 10 भागों में बाँटती है। पेशा, पद, पदोन्नति व सांसारिक सफलता की मुख्य कुंडली।' },
    aiPrompt: { en: 'Explain my D10 (Dashamsha) chart — career and profession — simply.', hi: 'मेरी D10 (दशांश) कुंडली — करियर व पेशा — आसान भाषा में समझाएँ।' } },
  { code: 'D12', name: { en: 'Dwadashamsha', hi: 'द्वादशांश' }, divisions: '12', importance: 'major',
    easy: { en: 'Shows parents, ancestry and matters inherited from the family line.', hi: 'माता-पिता, पूर्वज और कुल-परंपरा से मिली बातें दिखाती है।' },
    technical: { en: 'Divides each sign into 12. Used for parents, lineage, ancestral karma and past-generation influences.', hi: 'हर राशि को 12 भागों में बाँटती है। माता-पिता, वंश, पैतृक कर्म व पूर्व-पीढ़ी प्रभाव हेतु।' },
    aiPrompt: { en: 'Explain my D12 (Dwadashamsha) chart — parents and ancestry — simply.', hi: 'मेरी D12 (द्वादशांश) कुंडली — माता-पिता व वंश — आसान भाषा में समझाएँ।' } },
  { code: 'D16', name: { en: 'Shodashamsha', hi: 'षोडशांश' }, divisions: '16', importance: 'special',
    easy: { en: 'Shows vehicles, luxuries, comforts and happiness from possessions.', hi: 'वाहन, विलासिता, सुख-सुविधा और वस्तुओं से मिलने वाला सुख दिखाती है।' },
    technical: { en: 'Divides each sign into 16. Judges conveyances, luxuries, general happiness and mental disposition toward comforts.', hi: 'हर राशि को 16 भागों में बाँटती है। वाहन, विलासिता, सामान्य सुख व सुख-सुविधा के प्रति मनोवृत्ति का विचार।' },
    aiPrompt: { en: 'Explain my D16 (Shodashamsha) chart — vehicles and luxuries — simply.', hi: 'मेरी D16 (षोडशांश) कुंडली — वाहन व विलासिता — आसान भाषा में समझाएँ।' } },
  { code: 'D20', name: { en: 'Vimshamsha', hi: 'विंशांश' }, divisions: '20', importance: 'special',
    easy: { en: 'Shows your spiritual side — devotion, worship and religious progress.', hi: 'आपका आध्यात्मिक पक्ष — भक्ति, उपासना और धार्मिक प्रगति दिखाती है।' },
    technical: { en: 'Divides each sign into 20. The chart for spiritual sadhana, upasana, and progress on the religious/devotional path.', hi: 'हर राशि को 20 भागों में बाँटती है। आध्यात्मिक साधना, उपासना व धार्मिक/भक्ति-मार्ग की प्रगति की कुंडली।' },
    aiPrompt: { en: 'Explain my D20 (Vimshamsha) chart — spirituality and worship — simply.', hi: 'मेरी D20 (विंशांश) कुंडली — अध्यात्म व उपासना — आसान भाषा में समझाएँ।' } },
  { code: 'D24', name: { en: 'Chaturvimshamsha (Siddhamsha)', hi: 'चतुर्विंशांश (सिद्धांश)' }, divisions: '24', importance: 'special',
    easy: { en: 'Shows education, learning and knowledge — success in studies.', hi: 'शिक्षा, अध्ययन और ज्ञान दिखाती है — पढ़ाई में सफलता।' },
    technical: { en: 'Divides each sign into 24. The primary chart for academic learning, wisdom and success in education.', hi: 'हर राशि को 24 भागों में बाँटती है। शैक्षिक अध्ययन, विद्या व शिक्षा में सफलता की मुख्य कुंडली।' },
    aiPrompt: { en: 'Explain my D24 (Siddhamsha) chart — education and learning — simply.', hi: 'मेरी D24 (सिद्धांश) कुंडली — शिक्षा व विद्या — आसान भाषा में समझाएँ।' } },
  { code: 'D27', name: { en: 'Bhamsha (Nakshatramsha)', hi: 'भांश (नक्षत्रांश)' }, divisions: '27', importance: 'special',
    easy: { en: 'Shows your overall strengths and weaknesses — your stamina and resilience.', hi: 'आपकी कुल शक्तियाँ व कमज़ोरियाँ — आपकी सहनशक्ति व दृढ़ता दिखाती है।' },
    technical: { en: 'Divides each sign into 27. Judges the inherent strength/weakness of the personality and physical-mental stamina.', hi: 'हर राशि को 27 भागों में बाँटती है। व्यक्तित्व की मूल शक्ति/कमज़ोरी व शारीरिक-मानसिक सहनशक्ति का विचार।' },
    aiPrompt: { en: 'Explain my D27 (Bhamsha) chart — strengths and weaknesses — simply.', hi: 'मेरी D27 (भांश) कुंडली — शक्तियाँ व कमज़ोरियाँ — आसान भाषा में समझाएँ।' } },
  { code: 'D30', name: { en: 'Trimshamsha', hi: 'त्रिंशांश' }, divisions: '30', importance: 'special',
    easy: { en: 'Shows troubles, illnesses and hidden weaknesses — the areas to protect yourself in.', hi: 'कष्ट, बीमारियाँ और छुपी कमज़ोरियाँ दिखाती है — जिनसे स्वयं को बचाना है।' },
    technical: { en: 'Divides each sign into 30. Reveals types of misfortunes, chronic ailments, evils and character flaws.', hi: 'हर राशि को 30 भागों में बाँटती है। दुर्भाग्य के प्रकार, पुराने रोग, अरिष्ट व चारित्रिक दोष दर्शाती है।' },
    aiPrompt: { en: 'Explain my D30 (Trimshamsha) chart — troubles and health weaknesses — simply.', hi: 'मेरी D30 (त्रिंशांश) कुंडली — कष्ट व स्वास्थ्य-कमज़ोरियाँ — आसान भाषा में समझाएँ।' } },
  { code: 'D40', name: { en: 'Khavedamsha', hi: 'खवेदांश' }, divisions: '40', importance: 'special',
    easy: { en: 'Shows overall good & bad effects, and blessings from the mother\'s side.', hi: 'कुल शुभ-अशुभ फल और माता-पक्ष से मिले आशीर्वाद दिखाती है।' },
    technical: { en: 'Divides each sign into 40. Assesses auspicious/inauspicious effects and matrilineal legacy (punya).', hi: 'हर राशि को 40 भागों में बाँटती है। शुभ/अशुभ फल व मातृ-पक्ष की विरासत (पुण्य) का आकलन।' },
    aiPrompt: { en: 'Explain my D40 (Khavedamsha) chart — overall auspiciousness — simply.', hi: 'मेरी D40 (खवेदांश) कुंडली — कुल शुभता — आसान भाषा में समझाएँ।' } },
  { code: 'D45', name: { en: 'Akshavedamsha', hi: 'अक्षवेदांश' }, divisions: '45', importance: 'special',
    easy: { en: 'Shows your character, conduct and moral nature, and the father\'s-side legacy.', hi: 'आपका चरित्र, आचरण व नैतिक स्वभाव, और पितृ-पक्ष की विरासत दिखाती है।' },
    technical: { en: 'Divides each sign into 45. Examines overall character, conduct, and paternal legacy — a fine measure of the whole personality.', hi: 'हर राशि को 45 भागों में बाँटती है। कुल चरित्र, आचरण व पितृ-विरासत — पूरे व्यक्तित्व का सूक्ष्म मापक।' },
    aiPrompt: { en: 'Explain my D45 (Akshavedamsha) chart — character and conduct — simply.', hi: 'मेरी D45 (अक्षवेदांश) कुंडली — चरित्र व आचरण — आसान भाषा में समझाएँ।' } },
  { code: 'D60', name: { en: 'Shashtiamsha', hi: 'षष्ट्यांश' }, divisions: '60', importance: 'special',
    easy: { en: 'The deepest chart — shows past-life karma and the subtle causes behind everything.', hi: 'सबसे गहरी कुंडली — पूर्व-जन्म का कर्म और हर बात के सूक्ष्म कारण दिखाती है।' },
    technical: { en: 'Divides each sign into 60 (the finest common division). Reveals past-life karma and gives the deepest confirmation of results across all areas.', hi: 'हर राशि को 60 भागों में बाँटती है (सबसे सूक्ष्म सामान्य विभाजन)। पूर्व-जन्म कर्म दर्शाती है व सभी क्षेत्रों के फल की गहनतम पुष्टि देती है।' },
    aiPrompt: { en: 'Explain my D60 (Shashtiamsha) chart — past-life karma — simply.', hi: 'मेरी D60 (षष्ट्यांश) कुंडली — पूर्व-जन्म कर्म — आसान भाषा में समझाएँ।' } },
];
