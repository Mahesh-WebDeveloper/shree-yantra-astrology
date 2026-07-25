/**
 * मंत्र संग्रह — the most-searched, canonical, short Hindu mantras (public-domain). Each is a
 * complete, standard, verifiable text with a simple meaning, when/why to chant, and count.
 * Rendered by MantraSangrahScreen (a Library book) with a per-mantra "Explain simply with AI".
 */
export interface CollMantra {
  id: string; titleHi: string; titleEn: string; deity: string; category: string;
  sanskrit: string; roman: string; meaningHi: string; meaningEn: string;
  whenHi: string; whenEn: string; count: string; benefitHi: string; benefitEn: string;
}

export const MANTRA_CATEGORIES: { key: string; hi: string; en: string }[] = [
  { key: 'shakti', hi: 'आरोग्य व रक्षा', en: 'Health & Protection' },
  { key: 'nitya', hi: 'नित्य व सर्वमान्य', en: 'Daily & Universal' },
  { key: 'dev', hi: 'देव व समृद्धि', en: 'Deities & Prosperity' },
];

export const MANTRAS_COLL: CollMantra[] = [
  {
    id: 'mahamrityunjaya', titleHi: 'महामृत्युंजय मंत्र', titleEn: 'Mahamrityunjaya Mantra', deity: 'भगवान शिव', category: 'shakti',
    sanskrit: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।\nउर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय माऽमृतात्॥',
    roman: 'Om tryambakam yajamahe sugandhim pushti-vardhanam.\nUrvarukam iva bandhanan mrityor mukshiya ma’mritat.',
    meaningHi: 'हम त्रिनेत्रधारी शिव की आराधना करते हैं, जो सुगंधित हैं और पोषण बढ़ाने वाले हैं। जैसे पका खरबूजा बेल से सहज अलग हो जाता है, वैसे ही हमें मृत्यु के बंधन से मुक्त करें, अमरता से नहीं।',
    meaningEn: 'We worship the three-eyed Shiva, fragrant and nourishing. As a ripe cucumber is freed from its vine, may he free us from the bondage of death — but not from immortality.',
    whenHi: 'रोग, संकट, भय या दुर्घटना से रक्षा हेतु; बीमार व्यक्ति के लिए।', whenEn: 'For protection from illness, danger, fear or accident; for the sick.',
    count: '108 बार', benefitHi: 'आरोग्य, दीर्घायु, भय व अकाल-मृत्यु से रक्षा — शिव का सबसे शक्तिशाली रक्षा-मंत्र।', benefitEn: 'Health, long life, and protection from fear and untimely death — Shiva’s most powerful protective mantra.',
  },
  {
    id: 'gayatri', titleHi: 'गायत्री मंत्र', titleEn: 'Gayatri Mantra', deity: 'माँ गायत्री / सविता', category: 'nitya',
    sanskrit: 'ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं।\nभर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥',
    roman: 'Om bhur bhuvah svah. Tat savitur varenyam.\nBhargo devasya dhimahi. Dhiyo yo nah prachodayat.',
    meaningHi: 'उस प्राणस्वरूप, दुःखनाशक, सुखस्वरूप, श्रेष्ठ, तेजस्वी सविता देव को हम धारण करें; वे हमारी बुद्धि को सन्मार्ग की ओर प्रेरित करें।',
    meaningEn: 'May we hold in our hearts that adorable, radiant light of the divine Savitr; may he inspire our intellect towards righteousness.',
    whenHi: 'रोज़ सुबह (ब्रह्म-मुहूर्त), स्नान के बाद; विद्यार्थियों के लिए विशेष।', whenEn: 'Every morning (Brahma-muhurta), after a bath; especially for students.',
    count: '11 / 108 बार', benefitHi: 'बुद्धि, एकाग्रता, तेज व ज्ञान — हर सनातनी का नित्य मंत्र।', benefitEn: 'Wisdom, focus, radiance and knowledge — the daily mantra for every seeker.',
  },
  {
    id: 'shiv-panchakshari', titleHi: 'शिव पंचाक्षरी मंत्र', titleEn: 'Shiva Panchakshari Mantra', deity: 'भगवान शिव', category: 'dev',
    sanskrit: 'ॐ नमः शिवाय॥',
    roman: 'Om Namah Shivaya.',
    meaningHi: 'मैं भगवान शिव को नमन करता हूँ — यही पाँच अक्षरों (न-मः-शि-वा-य) का महामंत्र है।',
    meaningEn: 'I bow to Lord Shiva — the great five-syllable (na-mah-shi-va-ya) mantra.',
    whenHi: 'सोमवार, प्रदोष, सावन में विशेष; ध्यान व नित्य जप के लिए।', whenEn: 'Especially Mondays, Pradosh, Sawan; for meditation and daily japa.',
    count: '108 बार', benefitHi: 'मन की शांति, नकारात्मकता का नाश, शिव-कृपा।', benefitEn: 'Peace of mind, removal of negativity, Shiva’s grace.',
  },
  {
    id: 'hare-krishna', titleHi: 'हरे कृष्ण महामंत्र', titleEn: 'Hare Krishna Mahamantra', deity: 'भगवान श्रीकृष्ण', category: 'dev',
    sanskrit: 'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे।\nहरे राम हरे राम, राम राम हरे हरे॥',
    roman: 'Hare Krishna Hare Krishna, Krishna Krishna Hare Hare.\nHare Rama Hare Rama, Rama Rama Hare Hare.',
    meaningHi: 'हे भगवान की आह्लादिनी शक्ति (हरा/राधा), हे कृष्ण, हे राम! मुझे अपनी सेवा में लगाएँ — यह कलियुग का सर्वोत्तम तारक महामंत्र है।',
    meaningEn: 'O divine energy of the Lord (Hara/Radha), O Krishna, O Rama — please engage me in your service. It is the supreme deliverer-mantra of Kali-yuga.',
    whenHi: 'कभी भी, किसी भी अवस्था में; कीर्तन व जप के लिए।', whenEn: 'Anytime, in any state; for kirtan and japa.',
    count: 'माला (108) या निरंतर', benefitHi: 'मन की शुद्धि, आनंद, कृष्ण-भक्ति — कलियुग का सरलतम मार्ग।', benefitEn: 'Purity of mind, bliss and devotion — the simplest path in Kali-yuga.',
  },
  {
    id: 'ganesh-mool', titleHi: 'गणेश मूल मंत्र', titleEn: 'Ganesha Mula Mantra', deity: 'श्री गणेश', category: 'dev',
    sanskrit: 'ॐ गं गणपतये नमः॥',
    roman: 'Om Gam Ganapataye Namah.',
    meaningHi: 'विघ्नहर्ता श्री गणपति को नमन — हर शुभ कार्य के आरंभ में।',
    meaningEn: 'Salutations to Ganapati, remover of obstacles — at the start of every auspicious task.',
    whenHi: 'बुधवार, गणेश चतुर्थी; किसी भी नए कार्य के आरंभ में।', whenEn: 'Wednesdays, Ganesh Chaturthi; at the start of any new venture.',
    count: '11 / 108 बार', benefitHi: 'विघ्नों का नाश, बुद्धि व सफलता।', benefitEn: 'Removal of obstacles, wisdom and success.',
  },
  {
    id: 'lakshmi-beej', titleHi: 'महालक्ष्मी मंत्र', titleEn: 'Mahalakshmi Mantra', deity: 'माँ लक्ष्मी', category: 'dev',
    sanskrit: 'ॐ श्रीं ह्रीं श्रीं कमले कमलालये प्रसीद प्रसीद।\nॐ श्रीं ह्रीं श्रीं महालक्ष्म्यै नमः॥',
    roman: 'Om Shreem Hreem Shreem Kamale Kamalalaye Prasida Prasida.\nOm Shreem Hreem Shreem Mahalakshmyai Namah.',
    meaningHi: 'हे कमल में निवास करने वाली माँ कमला (लक्ष्मी)! प्रसन्न हों, प्रसन्न हों; महालक्ष्मी को नमन।',
    meaningEn: 'O Kamala (Lakshmi) who dwells in the lotus — be pleased, be pleased; salutations to Mahalakshmi.',
    whenHi: 'शुक्रवार, दीवाली; धन-समृद्धि हेतु।', whenEn: 'Fridays, Diwali; for wealth and prosperity.',
    count: '108 बार', benefitHi: 'धन, वैभव, समृद्धि व स्थिरता।', benefitEn: 'Wealth, abundance, prosperity and stability.',
  },
  {
    id: 'shani', titleHi: 'शनि मंत्र', titleEn: 'Shani Mantra', deity: 'शनि देव', category: 'shakti',
    sanskrit: 'ॐ शं शनैश्चराय नमः॥',
    roman: 'Om Sham Shanaishcharaya Namah.',
    meaningHi: 'न्याय व कर्मफल के देव शनैश्चर (शनि) को नमन।',
    meaningEn: 'Salutations to Shanaishchara (Shani), the deity of justice and the fruits of karma.',
    whenHi: 'शनिवार; साढ़ेसाती/ढैया व शनि-दोष शांति हेतु।', whenEn: 'Saturdays; for Sade-sati / Dhaiya and Shani-dosha relief.',
    count: '23000 (अनुष्ठान) या 108 नित्य', benefitHi: 'शनि की पीड़ा में शांति, न्यायपूर्ण फल, कष्ट-निवारण।', benefitEn: 'Relief during Shani’s afflictions, just outcomes, and removal of hardship.',
  },
];
