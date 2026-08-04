import type { CSSProperties, ReactNode } from 'react'
import { useLang } from '@/i18n/LangProvider'
import { useRevealChildren } from './hooks/useSiteMotion'
import './appinaction.css'
import './sections.css'

/**
 * The complete map of what the app does — every service, grouped, in plain
 * words, with a one-line "what you get" on each. Nothing here is aspirational:
 * it is a straight reading of the shipped app.
 */

type Bi = { hi: string; en: string }

type Item = {
  hi: string
  en: string
  what: Bi
  stat?: Bi
}

type Group = {
  id: string
  hi: string
  en: string
  accent: string
  glyph: ReactNode
  items: Item[]
}

const G = {
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M3 3l18 18M21 3L3 21M12 3l9 9-9 9-9-9z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.4l3.4 2" strokeLinecap="round" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <circle cx="12" cy="12" r="4.2" />
      <path
        d="M12 2v2.6M12 19.4V22M2 12h2.6M19.4 12H22M4.9 4.9l1.9 1.9M17.2 17.2l1.9 1.9M19.1 4.9l-1.9 1.9M6.8 17.2l-1.9 1.9"
        strokeLinecap="round"
      />
    </svg>
  ),
  lotus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="M12 3.2c2.1 2.3 3.1 4.7 3.1 7.2S14.1 15.4 12 17.7c-2.1-2.3-3.1-4.8-3.1-7.3S9.9 5.5 12 3.2z" />
      <path d="M12 17.7C9.2 17.7 6.6 16 5 13.1c2.6-.9 5-.5 7 1.2M12 17.7c2.8 0 5.4-1.7 7-4.6-2.6-.9-5-.5-7 1.2" />
      <path d="M3.5 18.6c2.6 1.5 5.5 2.2 8.5 2.2s5.9-.7 8.5-2.2" strokeLinecap="round" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="M12 6.4C10.4 5 8.3 4.3 5.4 4.3c-.8 0-1.4.1-1.9.2v13.9c.5-.1 1.1-.2 1.9-.2 2.9 0 5 .7 6.6 2.1 1.6-1.4 3.7-2.1 6.6-2.1.8 0 1.4.1 1.9.2V4.5c-.5-.1-1.1-.2-1.9-.2-2.9 0-5 .7-6.6 2.1z" />
      <path d="M12 6.4v14.1" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="M6.4 10.2a5.6 5.6 0 0111.2 0c0 4 1.4 5.6 1.4 5.6H5s1.4-1.6 1.4-5.6z" strokeLinejoin="round" />
      <path d="M10.2 19a2 2 0 003.6 0" strokeLinecap="round" />
    </svg>
  ),
}

const GROUPS: Group[] = [
  {
    id: 'chart',
    hi: 'कुंडली और ग्रह-विश्लेषण',
    en: 'Kundli and planetary analysis',
    accent: '#e9b850',
    glyph: G.chart,
    items: [
      {
        hi: 'जन्म कुंडली',
        en: 'Janam Kundli',
        what: {
          hi: 'लग्न, राशि, नक्षत्र, ग्रह, भाव, योग और दोष की विस्तृत जानकारी',
          en: 'Detailed information on lagna, rashi, nakshatra, planets, houses, yogas and doshas',
        },
        stat: { hi: 'विस्तृत कुंडली', en: 'Detailed chart' },
      },
      {
        hi: 'बृहत् कुंडली रिपोर्ट',
        en: 'Brihat Kundli report',
        what: {
          hi: 'जीवन के प्रमुख क्षेत्रों पर विस्तृत कुंडली रिपोर्ट',
          en: 'A detailed Kundli report covering the major areas of life',
        },
      },
      {
        hi: 'जन्म पत्री + नामकरण',
        en: 'Janam Patri + naming',
        what: {
          hi: 'जन्म विवरण के साथ नक्षत्र के अनुसार नाम का शुभ अक्षर',
          en: 'Birth details with a naming syllable based on the nakshatra',
        },
      },
      {
        hi: 'कुंडली मिलान',
        en: 'Kundli Milan',
        what: {
          hi: '36 गुणों का अष्टकूट मिलान और प्रमुख वैवाहिक अनुकूलता संकेत',
          en: '36-guna Ashtakoot matching with key marriage compatibility indicators',
        },
        stat: { hi: 'अष्टकूट', en: 'Ashtakoot' },
      },
      {
        hi: 'वैदिक विश्लेषण',
        en: 'Vedic analysis',
        what: {
          hi: 'गण, योनि, नाड़ी, गण्डमूल, राजयोग और अन्य वैदिक संकेत',
          en: 'Gana, yoni, nadi, gandmool, rajyogas and other Vedic indicators',
        },
      },
      {
        hi: 'दशा समयरेखा',
        en: 'Life timeline',
        what: {
          hi: 'पिछली, वर्तमान और आने वाली महादशा-अंतर्दशा की समयरेखा',
          en: 'A timeline of past, current and upcoming mahadasha-antardasha periods',
        },
      },
      {
        hi: 'गोचर और फलादेश',
        en: 'Transits and forecast',
        what: {
          hi: 'वर्तमान ग्रह-स्थितियों का आपकी जन्म कुंडली पर संभावित प्रभाव',
          en: 'How current planetary positions may relate to your birth chart',
        },
      },
      {
        hi: 'उपाय',
        en: 'Remedies',
        what: {
          hi: 'कुंडली के संकेतों के अनुसार सरल और व्यावहारिक पारंपरिक उपाय',
          en: 'Simple, practical traditional remedies based on chart indications',
        },
      },
    ],
  },
  {
    id: 'timing',
    hi: 'पंचांग और शुभ समय',
    en: 'Panchang and auspicious timings',
    accent: '#d8a45f',
    glyph: G.clock,
    items: [
      {
        hi: 'आज का पंचांग',
        en: "Today's Panchang",
        what: {
          hi: 'तिथि, नक्षत्र, योग, करण और वार के साथ समाप्ति समय',
          en: 'Tithi, nakshatra, yoga, karana and vaara with end times',
        },
        stat: { hi: 'दैनिक', en: 'Daily' },
      },
      {
        hi: 'चौघड़िया',
        en: 'Choghadiya',
        what: {
          hi: 'दिन और रात के चौघड़िया के साथ वर्तमान शुभ-अशुभ अवधि',
          en: 'Day and night Choghadiya with the current auspicious or inauspicious period',
        },
        stat: { hi: 'लाइव समय', en: 'Live window' },
      },
      {
        hi: 'शुभ मुहूर्त खोजें',
        en: 'Find a shubh muhurat',
        what: {
          hi: 'विवाह, गृह प्रवेश, वाहन और अन्य महत्वपूर्ण कार्यों के लिए शुभ समय',
          en: 'Auspicious timings for marriage, griha pravesh, vehicles and other important occasions',
        },
      },
      {
        hi: 'व्रत व त्योहार',
        en: 'Vrat & festivals',
        what: {
          hi: 'वर्षभर के व्रत-त्योहार की तिथि, पूजा विधि और धार्मिक महत्व',
          en: 'Dates, puja guidance and significance for vrat and festivals throughout the year',
        },
        stat: { hi: 'विधि सहित', en: 'With vidhi' },
      },
    ],
  },
  {
    id: 'readings',
    hi: 'राशिफल और व्यक्तिगत ज्योतिष',
    en: 'Rashifal and personal astrology',
    accent: '#cbb469',
    glyph: G.sun,
    items: [
      {
        hi: 'आपका राशिफल',
        en: 'Your Rashifal',
        what: {
          hi: 'आपकी कुंडली के आधार पर दैनिक, साप्ताहिक, मासिक और वार्षिक राशिफल',
          en: 'Daily, weekly, monthly and yearly Rashifal informed by your chart',
        },
        stat: { hi: 'व्यक्तिगत', en: 'Personal' },
      },
      {
        hi: '12 राशियों का राशिफल',
        en: 'All twelve signs',
        what: { hi: 'सभी बारह राशियों के लिए आज का राशिफल', en: 'Today’s Rashifal for all twelve signs' },
        stat: { hi: 'दैनिक अपडेट', en: 'Daily update' },
      },
      {
        hi: 'ज्योतिषी से प्रश्न',
        en: 'Ask the Jyotishi',
        what: {
          hi: 'कुंडली, दशा और वर्तमान गोचर को ध्यान में रखकर प्रश्नों के उत्तर',
          en: 'Answers that consider your chart, dasha and current transits',
        },
      },
    ],
  },
  {
    id: 'vidya',
    hi: 'घर, परिवार और अंक ज्योतिष',
    en: 'Home, family and numerology',
    accent: '#c99a4a',
    glyph: G.lotus,
    items: [
      {
        hi: 'अंक ज्योतिष',
        en: 'Numerology',
        what: {
          hi: 'मूलांक, भाग्यांक और लो-शु ग्रिड का सरल विश्लेषण',
          en: 'A clear analysis of Mulank, Bhagyank and the Lo Shu grid',
        },
      },
      {
        hi: 'वास्तु शास्त्र',
        en: 'Vastu Shastra',
        what: {
          hi: 'घर का वास्तु परीक्षण, दिशा-यंत्र और सुधार के व्यावहारिक सुझाव',
          en: 'A home Vastu review, direction compass and practical improvement suggestions',
        },
      },
      {
        hi: 'शिशु के शुभ नाम',
        en: 'Baby names',
        what: {
          hi: 'जन्म नक्षत्र के शुभ अक्षर से नाम और प्रत्येक नाम का अर्थ',
          en: 'Names based on the birth nakshatra syllable, with a meaning for each name',
        },
      },
      {
        hi: 'कुंडली सीखें',
        en: 'Learn Kundli',
        what: {
          hi: 'मूल अवधारणाओं से उन्नत विषयों तक, उदाहरण कुंडली के साथ',
          en: 'From basic concepts to advanced topics, supported by an example chart',
        },
      },
      {
        hi: 'वास्तु सीखें',
        en: 'Learn Vastu',
        what: {
          hi: 'दिशाओं और घर के प्रत्येक भाग का वास्तु महत्व सरल भाषा में',
          en: 'The Vastu significance of directions and areas of the home, explained clearly',
        },
      },
    ],
  },
  {
    id: 'library',
    hi: 'धार्मिक ग्रंथ और भक्ति',
    en: 'Scriptures and devotion',
    accent: '#dfb877',
    glyph: G.book,
    items: [
      {
        hi: 'भगवद्गीता',
        en: 'Bhagavad Gita',
        what: { hi: 'अध्याय-वार संस्कृत श्लोक और उपलब्ध हिंदी अर्थ', en: 'Chapter-wise Sanskrit verses with available Hindi meaning' },
        stat: { hi: 'अर्थ सहित', en: 'With meaning' },
      },
      {
        hi: 'वाल्मीकि रामायण',
        en: 'Valmiki Ramayana',
        what: { hi: 'कांड और सर्ग के अनुसार व्यवस्थित वाल्मीकि रामायण पाठ', en: 'Valmiki Ramayana organised by kanda and sarga' },
        stat: { hi: 'सर्ग-वार', en: 'Sarga-wise' },
      },
      {
        hi: 'रामचरितमानस',
        en: 'Ramcharitmanas',
        what: { hi: 'कांड-वार पाठ, उपलब्ध हिंदी अर्थ के साथ', en: 'Kanda-wise reading, with Hindi meaning where available' },
        stat: { hi: 'कांड-वार', en: 'Kanda-wise' },
      },
      {
        hi: 'पुराण',
        en: 'The Puranas',
        what: { hi: 'अध्याय के अनुसार व्यवस्थित पुराण संग्रह', en: 'A Purana collection organised by chapter' },
        stat: { hi: 'संग्रह', en: 'Collection' },
      },
      {
        hi: 'वेद व उपनिषद्',
        en: 'Vedas & Upanishads',
        what: { hi: 'सूक्त और खंड, मूल पाठ के साथ', en: 'Suktas and sections, with the source text' },
        stat: { hi: 'मूल पाठ', en: 'Source text' },
      },
      {
        hi: 'आरती, मंत्र, स्तोत्र संग्रह',
        en: 'Aarti, mantra & stotra',
        what: { hi: 'पाठ और उपलब्ध ऑडियो, दोनों विकल्प', en: 'Text and available audio in one place' },
      },
      {
        hi: 'हनुमान चालीसा',
        en: 'Hanuman Chalisa',
        what: { hi: 'पूरा पाठ, अर्थ के साथ', en: 'The complete text, with meaning' },
      },
      {
        hi: 'आज का श्लोक',
        en: 'Verse of the day',
        what: { hi: 'प्रतिदिन एक श्लोक और उसका सरल अर्थ', en: 'A verse each day with a clear meaning' },
      },
      {
        hi: 'भक्ति ऑडियो',
        en: 'Devotional audio',
        what: {
          hi: 'आरती, भजन, मंत्र और ध्यान संगीत',
          en: 'Aartis, bhajans, mantras and meditation music',
        },
      },
      {
        hi: 'रामायण कथा',
        en: 'Ramayan katha',
        what: { hi: 'भागों में व्यवस्थित रामायण कथा ऑडियो', en: 'Ramayan katha audio organised by episode' },
        stat: { hi: 'श्रवण', en: 'Audio' },
      },
      {
        hi: 'महाभारत कथा',
        en: 'Mahabharat katha',
        what: { hi: 'भागों में व्यवस्थित महाभारत कथा ऑडियो', en: 'Mahabharat katha audio organised by episode' },
        stat: { hi: 'श्रवण', en: 'Audio' },
      },
      {
        hi: 'यथार्थ गीता',
        en: 'Yatharth Geeta',
        what: { hi: 'अध्याय-वार श्रवण पाठ', en: 'Chapter-wise audio recitation' },
        stat: { hi: 'श्रवण', en: 'Audio' },
      },
    ],
  },
  {
    id: 'daily',
    hi: 'प्रतिदिन उपयोगी सुविधाएँ',
    en: 'Useful every day',
    accent: '#c9a05e',
    glyph: G.bell,
    items: [
      {
        hi: 'सुबह का राशिफल रिमाइंडर',
        en: 'Morning rashifal reminder',
        what: { hi: 'हर सुबह सूचना के माध्यम से आपका राशिफल', en: 'Your Rashifal delivered as a morning notification' },
      },
      {
        hi: 'व्रत-त्योहार की सूचना',
        en: 'Festival reminders',
        what: { hi: 'आने वाले व्रत और त्योहार की समय पर सूचना', en: 'Timely reminders for upcoming vrat and festivals' },
      },
      {
        hi: 'सहेजा हुआ पुस्तकालय',
        en: 'Saved library',
        what: { hi: 'पढ़ने और सुनने की प्रगति आपके खाते में सुरक्षित', en: 'Your reading and listening progress stays saved' },
      },
      {
        hi: 'हिंदी और English',
        en: 'Hindi and English',
        what: { hi: 'ऐप की प्रमुख सुविधाएँ दोनों भाषाओं में उपलब्ध', en: 'The main app features are available in both languages' },
      },
    ],
  },
]

const HIGHLIGHTS: { label: Bi; desc: Bi }[] = [
  {
    label: { hi: 'पंचांग', en: 'Panchang' },
    desc: { hi: 'व्रत, त्योहार और शुभ समय', en: 'Vrat, festivals and shubh time' },
  },
  {
    label: { hi: 'कुंडली', en: 'Kundli' },
    desc: { hi: 'जन्म कुंडली से व्यक्तिगत पाठ', en: 'Personal readings from your chart' },
  },
  {
    label: { hi: 'ग्रंथ', en: 'Granth' },
    desc: { hi: 'गीता, रामायण, वेद और पुराण', en: 'Gita, Ramayan, Vedas and Puranas' },
  },
  {
    label: { hi: 'भक्ति', en: 'Bhakti' },
    desc: { hi: 'आरती, मंत्र, स्तोत्र और कथा', en: 'Aarti, mantra, stotra and katha' },
  },
]

export function ServicesUniverse() {
  const { hi } = useLang()
  const revealRef = useRevealChildren<HTMLElement>()

  return (
    <section id="services" className="sy-section syu" aria-labelledby="syu-h" ref={revealRef}>
      <span className="syu__bg" aria-hidden />
      <div className="sy-container">
        <header className="syu__head" data-sy-reveal="0">
          <p className="sy-eyebrow sy-eyebrow--center">{hi ? 'श्री यंत्र में क्या मिलेगा' : 'What you will find in Shree Yantra'}</p>
          <h2 id="syu-h" className="sy-h2">
            {hi ? (
              <>
                दैनिक पंचांग से <span className="sy-gold-text">विस्तृत जन्म कुंडली तक</span>
              </>
            ) : (
              <>
                From daily Panchang to <span className="sy-gold-text">detailed Kundli analysis</span>
              </>
            )}
          </h2>
          <p className="sy-lead syu__lead">
            {hi
              ? 'जन्म कुंडली, पंचांग, चौघड़िया, शुभ मुहूर्त, राशिफल, कुंडली मिलान, वास्तु, अंक ज्योतिष और धार्मिक पुस्तकालय — सभी प्रमुख सुविधाएँ एक ही ऐप में।'
              : 'Kundli, Panchang, Choghadiya, Muhurat, Rashifal, Kundli Milan, Vastu, Numerology and a spiritual library, all within one app.'}
          </p>
        </header>

        <ul className="syu__stats">
          {HIGHLIGHTS.map((h, i) => (
            <li key={h.label.en} data-sy-reveal={String(60 + i * 60)}>
              <b className="sy-num">{hi ? h.label.hi : h.label.en}</b>
              <span>{hi ? h.desc.hi : h.desc.en}</span>
            </li>
          ))}
        </ul>

        <div className="syu__grid">
          {GROUPS.map((group, gi) => (
            <section
              key={group.id}
              className="syu-group"
              style={{ '--acc': group.accent } as CSSProperties}
              data-sy-reveal={String(60 + gi * 70)}
            >
              <span className="syu-group__hair" aria-hidden />
              <header className="syu-group__top">
                <span className="syu-group__glyph">{group.glyph}</span>
                <span className="syu-group__titles">
                  <b>{hi ? group.hi : group.en}</b>
                  {hi ? null : <em>{group.hi}</em>}
                </span>
                <span className="syu-group__count sy-num">
                  {group.items.length}
                  <i>{hi ? 'सेवाएँ' : 'services'}</i>
                </span>
              </header>

              <ul className="syu-list">
                {group.items.map((item) => (
                  <li className="syu-item" key={item.en}>
                    <span className="syu-item__mark" aria-hidden>
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.1">
                        <path d="M6 1v10M1 6h10" />
                        <circle cx="6" cy="6" r="2.4" />
                      </svg>
                    </span>
                    <span className="syu-item__body">
                      <span className="syu-item__name">
                        {hi ? item.hi : item.en}
                        {item.stat ? (
                          <b className="syu-item__stat sy-num">{hi ? item.stat.hi : item.stat.en}</b>
                        ) : null}
                      </span>
                      <span className="syu-item__what">{hi ? item.what.hi : item.what.en}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
