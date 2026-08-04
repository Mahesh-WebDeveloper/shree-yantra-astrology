/**
 * स्तोत्र संग्रह — complete, canonical, public-domain Sanskrit stotras. Only source-verifiable,
 * fully-known texts are included so every line stays authentic; the collection grows as more
 * are verified. Rendered in the shared DevReader (big readable text + Share + AI-explain).
 */
export interface Stotra { id: string; titleHi: string; titleEn: string; deity: string; category: string; introHi: string; introEn: string; lines: string }

export const STOTRA_CATEGORIES: { key: string; hi: string; en: string }[] = [
  { key: 'ganesh', hi: 'गणेश', en: 'Ganesha' },
];

export const STOTRAS: Record<string, Stotra> = {
  'sankatnashan-ganesh': {
    id: 'sankatnashan-ganesh', titleHi: 'संकटनाशन गणेश स्तोत्र', titleEn: 'Sankatnashan Ganesha Stotra', deity: 'श्री गणेश', category: 'ganesh',
    introHi: 'नारद पुराण का यह स्तोत्र गणेश जी के बारह नामों का है; तीनों संध्या पढ़ने से विघ्न व संकट दूर होते हैं।',
    introEn: 'From the Narada Purana, this stotra of Ganesha’s twelve names removes obstacles and troubles when recited at the three sandhyas.',
    lines: `॥ संकटनाशन गणेश स्तोत्र ॥

प्रणम्य शिरसा देवं गौरीपुत्रं विनायकम्।
भक्तावासं स्मरेन्नित्यमायुःकामार्थसिद्धये॥ १॥

प्रथमं वक्रतुण्डं च एकदन्तं द्वितीयकम्।
तृतीयं कृष्णपिङ्गाक्षं गजवक्त्रं चतुर्थकम्॥ २॥

लम्बोदरं पञ्चमं च षष्ठं विकटमेव च।
सप्तमं विघ्नराजेन्द्रं धूम्रवर्णं तथाष्टमम्॥ ३॥

नवमं भालचन्द्रं च दशमं तु विनायकम्।
एकादशं गणपतिं द्वादशं तु गजाननम्॥ ४॥

द्वादशैतानि नामानि त्रिसन्ध्यं यः पठेन्नरः।
न च विघ्नभयं तस्य सर्वसिद्धिकरं प्रभो॥ ५॥

विद्यार्थी लभते विद्यां धनार्थी लभते धनम्।
पुत्रार्थी लभते पुत्रान्मोक्षार्थी लभते गतिम्॥ ६॥

जपेद्गणपतिस्तोत्रं षड्भिर्मासैः फलं लभेत्।
संवत्सरेण सिद्धिं च लभते नात्र संशयः॥ ७॥

अष्टभ्यो ब्राह्मणेभ्यश्च लिखित्वा यः समर्पयेत्।
तस्य विद्या भवेत्सर्वा गणेशस्य प्रसादतः॥ ८॥

॥ इति श्रीनारदपुराणे संकटनाशनं गणेशस्तोत्रं सम्पूर्णम् ॥`,
  },
};

export const STOTRA_LIST: Stotra[] = Object.values(STOTRAS);
