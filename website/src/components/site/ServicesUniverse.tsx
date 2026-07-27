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
    hi: 'कुंडली व विश्लेषण',
    en: 'Chart & analysis',
    accent: '#e9b850',
    glyph: G.chart,
    items: [
      {
        hi: 'जन्म कुंडली',
        en: 'Janam Kundli',
        what: {
          hi: 'ग्रह, भाव, योग और दोष — सब एक ही चार्ट में',
          en: 'Grahas, bhavas, yogas and doshas in one chart',
        },
        stat: { hi: '12 भाव', en: '12 houses' },
      },
      {
        hi: 'बृहत् कुंडली रिपोर्ट',
        en: 'Brihat Kundli report',
        what: {
          hi: 'पूरी कुंडली का विस्तृत पाठ, एक जगह',
          en: 'The long-form reading of the whole chart, in one place',
        },
      },
      {
        hi: 'जन्म पत्री + नामकरण',
        en: 'Janam Patri + naming',
        what: {
          hi: 'जन्म का पूरा विवरण और नाम का शुभ अक्षर',
          en: 'The full birth record, plus the naming syllable',
        },
      },
      {
        hi: 'कुंडली मिलान',
        en: 'Kundli Milan',
        what: {
          hi: 'दो कुंडलियों का मिलान, दोष की जाँच के साथ',
          en: 'Two charts matched, with the dosha checks',
        },
        stat: { hi: '36 गुण', en: '36 gunas' },
      },
      {
        hi: 'वैदिक विश्लेषण',
        en: 'Vedic analysis',
        what: {
          hi: 'गण, योनि, नाड़ी, गण्डमूल और राजयोग',
          en: 'Gana, yoni, nadi, gandmool and rajyogas',
        },
      },
      {
        hi: 'जीवन समय-रेखा',
        en: 'Life timeline',
        what: {
          hi: 'कौन-सी दशा कब चली और आगे कब आएगी',
          en: 'Which dasha ran when, and what comes next',
        },
      },
      {
        hi: 'गोचर व भविष्यवाणी',
        en: 'Transit & forecast',
        what: {
          hi: 'ग्रह अभी कहाँ हैं और आपकी कुंडली पर उनका असर',
          en: 'Where the planets are now, and what they touch in your chart',
        },
      },
      {
        hi: 'उपाय',
        en: 'Remedies',
        what: {
          hi: 'सरल उपाय, जो आपकी अपनी कुंडली से निकले हों',
          en: 'Simple remedies, drawn from your own chart',
        },
      },
    ],
  },
  {
    id: 'timing',
    hi: 'समय व मुहूर्त',
    en: 'Timing',
    accent: '#d8a45f',
    glyph: G.clock,
    items: [
      {
        hi: 'आज का पंचांग',
        en: "Today's Panchang",
        what: {
          hi: 'पाँचों अंग, हर एक के समाप्ति समय के साथ',
          en: 'All five limbs, each with the time it ends',
        },
        stat: { hi: '5 अंग', en: '5 limbs' },
      },
      {
        hi: 'चौघड़िया',
        en: 'Choghadiya',
        what: {
          hi: 'दिन और रात का पूरा मुहूर्त, चालू समय के साथ',
          en: 'The full day and night muhurat, with the running window',
        },
        stat: { hi: '24 घंटे', en: '24 hours' },
      },
      {
        hi: 'शुभ मुहूर्त खोजें',
        en: 'Find a shubh muhurat',
        what: {
          hi: 'गृह प्रवेश, विवाह, वाहन — हर खिड़की समय के साथ',
          en: 'Griha pravesh, marriage, a vehicle — every window, timed',
        },
      },
      {
        hi: 'व्रत व त्योहार',
        en: 'Vrat & festivals',
        what: {
          hi: 'हर पर्व की तिथि, विधि और महत्व — पूरे साल का कैलेंडर',
          en: 'Every festival with its date, method and meaning — a full-year calendar',
        },
        stat: { hi: '230+ पर्व', en: '230+ festivals' },
      },
    ],
  },
  {
    id: 'readings',
    hi: 'भविष्यवाणी',
    en: 'Readings',
    accent: '#cbb469',
    glyph: G.sun,
    items: [
      {
        hi: 'आपका राशिफल',
        en: 'Your Rashifal',
        what: {
          hi: 'दैनिक, साप्ताहिक, मासिक और वार्षिक — आपकी कुंडली से',
          en: 'Daily, weekly, monthly and yearly — from your own chart',
        },
        stat: { hi: '4 अवधि', en: '4 spans' },
      },
      {
        hi: '12 राशियों का राशिफल',
        en: 'All twelve signs',
        what: { hi: 'हर राशि का आज का हाल', en: 'How the day stands for every sign' },
        stat: { hi: '12 राशियाँ', en: '12 signs' },
      },
      {
        hi: 'ज्योतिषी से प्रश्न',
        en: 'Ask the Jyotishi',
        what: {
          hi: 'प्रश्न पूछिए — उत्तर आपकी अपनी कुंडली से बनता है',
          en: 'Ask a question — the answer is built from your own kundli',
        },
      },
    ],
  },
  {
    id: 'vidya',
    hi: 'अन्य विद्याएँ',
    en: 'More vidyas',
    accent: '#c99a4a',
    glyph: G.lotus,
    items: [
      {
        hi: 'अंक ज्योतिष',
        en: 'Numerology',
        what: {
          hi: 'मूलांक, भाग्यांक और लो-शु ग्रिड, अर्थ के साथ',
          en: 'Mulank, bhagyank and the Lo Shu grid, explained',
        },
      },
      {
        hi: 'वास्तु शास्त्र',
        en: 'Vastu Shastra',
        what: {
          hi: 'घर का ऑडिट, वास्तु दिशा-यंत्र और सुधार के उपाय',
          en: 'A home audit, the vastu compass, and fixes you can act on',
        },
      },
      {
        hi: 'शिशु के शुभ नाम',
        en: 'Baby names',
        what: {
          hi: 'नक्षत्र के अक्षर से नाम, हर नाम का अर्थ सहित',
          en: 'Names from the nakshatra syllable, each with its meaning',
        },
      },
      {
        hi: 'कुंडली सीखें',
        en: 'Learn Kundli',
        what: {
          hi: 'बिलकुल शुरुआत से, उदाहरण कुंडली के साथ',
          en: 'From the very beginning, with a worked example chart',
        },
      },
      {
        hi: 'वास्तु सीखें',
        en: 'Learn Vastu',
        what: {
          hi: 'दिशा और हर कोने का सरल पाठ',
          en: 'A plain lesson in direction and what each corner holds',
        },
      },
    ],
  },
  {
    id: 'library',
    hi: 'दिव्य पुस्तकालय',
    en: 'Sacred library',
    accent: '#dfb877',
    glyph: G.book,
    items: [
      {
        hi: 'भगवद्गीता',
        en: 'Bhagavad Gita',
        what: { hi: 'हर श्लोक, हिंदी अर्थ के साथ', en: 'Every verse, with its Hindi meaning' },
        stat: { hi: '18 अध्याय', en: '18 chapters' },
      },
      {
        hi: 'वाल्मीकि रामायण',
        en: 'Valmiki Ramayana',
        what: { hi: 'पूरा काव्य, सर्ग दर सर्ग', en: 'The whole epic, sarga by sarga' },
        stat: { hi: '648 सर्ग', en: '648 sargas' },
      },
      {
        hi: 'रामचरितमानस',
        en: 'Ramcharitmanas',
        what: { hi: 'सातों कांड, हिंदी अर्थ के साथ', en: 'All seven kandas, with Hindi meaning' },
        stat: { hi: '7 कांड', en: '7 kandas' },
      },
      {
        hi: 'पुराण',
        en: 'The Puranas',
        what: { hi: 'अध्याय दर अध्याय, पढ़ने के लिए', en: 'Chapter by chapter, ready to read' },
        stat: { hi: '18 पुराण', en: '18 Puranas' },
      },
      {
        hi: 'वेद व उपनिषद्',
        en: 'Vedas & Upanishads',
        what: { hi: 'सूक्त और खंड, मूल पाठ के साथ', en: 'Suktas and sections, with the source text' },
        stat: { hi: '4 वेद', en: '4 Vedas' },
      },
      {
        hi: 'आरती, मंत्र, स्तोत्र संग्रह',
        en: 'Aarti, mantra & stotra',
        what: { hi: 'पढ़िए भी, और सुनिए भी', en: 'Read them, or listen to them' },
      },
      {
        hi: 'हनुमान चालीसा',
        en: 'Hanuman Chalisa',
        what: { hi: 'पूरा पाठ, अर्थ के साथ', en: 'The complete text, with meaning' },
      },
      {
        hi: 'आज का श्लोक',
        en: 'Verse of the day',
        what: { hi: 'रोज़ एक श्लोक, अर्थ सहित', en: 'One verse each day, explained' },
      },
      {
        hi: 'सुनने के लिए',
        en: 'To listen',
        what: {
          hi: 'आरती, भजन, मंत्र और ध्यान संगीत',
          en: 'Aartis, bhajans, mantras and meditation music',
        },
      },
      {
        hi: 'रामायण कथा',
        en: 'Ramayan katha',
        what: { hi: 'सुनने के लिए, भाग दर भाग', en: 'To listen to, episode by episode' },
        stat: { hi: '120 भाग', en: '120 episodes' },
      },
      {
        hi: 'महाभारत कथा',
        en: 'Mahabharat katha',
        what: { hi: 'सुनने के लिए, भाग दर भाग', en: 'To listen to, episode by episode' },
        stat: { hi: '100 भाग', en: '100 episodes' },
      },
      {
        hi: 'यथार्थ गीता',
        en: 'Yatharth Geeta',
        what: { hi: 'सुनने के लिए', en: 'To listen to' },
        stat: { hi: '20 भाग', en: '20 episodes' },
      },
    ],
  },
  {
    id: 'daily',
    hi: 'रोज़ का साथ',
    en: 'Everyday',
    accent: '#c9a05e',
    glyph: G.bell,
    items: [
      {
        hi: 'सुबह का राशिफल रिमाइंडर',
        en: 'Morning rashifal reminder',
        what: { hi: 'हर सुबह आपका राशिफल, सूचना में', en: 'Your reading, every morning, as a notification' },
      },
      {
        hi: 'व्रत-त्योहार की सूचना',
        en: 'Festival reminders',
        what: { hi: 'पर्व आने से पहले याद दिला देता है', en: 'A reminder before the day arrives' },
      },
      {
        hi: 'सहेजा हुआ पुस्तकालय',
        en: 'Saved library',
        what: { hi: 'जो पढ़ा या सुना, वह सहेजा रहता है', en: 'Whatever you read or hear stays saved' },
      },
      {
        hi: 'हिंदी और English',
        en: 'Hindi and English',
        what: { hi: 'पूरा ऐप, दोनों भाषाओं में', en: 'The whole app, in both languages' },
      },
    ],
  },
]

const HIGHLIGHTS = [
  { n: '230+', hi: 'व्रत व त्योहार', en: 'vrats & festivals' },
  { n: '648', hi: 'रामायण सर्ग', en: 'Ramayana sargas' },
  { n: '18', hi: 'पुराण', en: 'Puranas' },
  { n: '36', hi: 'गुण मिलान', en: 'guna matching' },
]

export function ServicesUniverse() {
  const { hi } = useLang()
  const revealRef = useRevealChildren<HTMLElement>()

  return (
    <section id="services" className="sy-section syu" aria-labelledby="syu-h" ref={revealRef}>
      <span className="syu__bg" aria-hidden />
      <div className="sy-container">
        <header className="syu__head" data-sy-reveal="0">
          <p className="sy-eyebrow sy-eyebrow--center">{hi ? 'पूरी सूची' : 'The full map'}</p>
          <h2 id="syu-h" className="sy-h2">
            {hi ? (
              <>
                एक ही ऐप में, <span className="sy-gold-text">सब कुछ</span>
              </>
            ) : (
              <>
                Everything, <span className="sy-gold-text">in one app</span>
              </>
            )}
          </h2>
          <p className="sy-lead syu__lead">
            {hi
              ? 'छोटी सेवाएँ भी यहीं गिनी हैं — जो ऐप में है, बस वही लिखा है।'
              : 'The small services are counted here too — this lists what the app actually has, and nothing else.'}
          </p>
        </header>

        <ul className="syu__stats">
          {HIGHLIGHTS.map((h, i) => (
            <li key={h.en} data-sy-reveal={String(60 + i * 60)}>
              <b className="sy-num">{h.n}</b>
              <span>{hi ? h.hi : h.en}</span>
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
                  <em>{hi ? group.en : group.hi}</em>
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
