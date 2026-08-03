import { useLang } from '@/i18n/LangProvider'
import { scrollToHash, useRevealChildren } from './hooks/useSiteMotion'
import './sections.css'

type Bi = { hi: string; en: string }
type Row = { id: string; topic: Bi; why: Bi; need: Bi; approach: Bi }

const ROWS: Row[] = [
  {
    id: 'personal',
    topic: { hi: 'व्यक्तिगत जन्म कुंडली', en: 'A chart personal to you' },
    why: {
      hi: 'हर व्यक्ति की कुंडली उसके अपने जन्म विवरण से बनती है।',
      en: 'Every birth chart should begin with the individual’s own birth details.',
    },
    need: {
      hi: 'जन्म तिथि, सटीक समय और जन्म स्थान',
      en: 'Date of birth, exact time and place of birth',
    },
    approach: {
      hi: 'इन्हीं विवरणों के आधार पर कुंडली, दशा और संबंधित विश्लेषण',
      en: 'Kundli, dasha and related analysis based on those details',
    },
  },
  {
    id: 'location',
    topic: { hi: 'शहर के अनुसार पंचांग', en: 'Panchang for your city' },
    why: {
      hi: 'सूर्योदय, सूर्यास्त और उनसे जुड़े शुभ समय स्थान के अनुसार बदलते हैं।',
      en: 'Sunrise, sunset and the timings derived from them vary by location.',
    },
    need: {
      hi: 'चुने गए शहर का स्थानीय सूर्योदय और सूर्यास्त',
      en: 'Local sunrise and sunset for the selected city',
    },
    approach: {
      hi: 'उसी स्थान के अनुसार पंचांग, चौघड़िया और दैनिक शुभ समय',
      en: 'Panchang, Choghadiya and daily auspicious timings for that location',
    },
  },
  {
    id: 'method',
    topic: { hi: 'स्पष्ट गणना-पद्धति', en: 'Clearly stated methodology' },
    why: {
      hi: 'परिणाम के साथ उसकी गणना का आधार जानना भी महत्वपूर्ण है।',
      en: 'It is important to know the calculation basis behind a result.',
    },
    need: {
      hi: 'जन्म विवरण, गणना और ज्योतिषीय व्याख्या की अलग पहचान',
      en: 'A clear distinction between inputs, calculations and interpretation',
    },
    approach: {
      hi: 'लाहिड़ी अयनांश, उदय तिथि और स्थान-आधारित समय की स्पष्ट जानकारी',
      en: 'Clear information on Lahiri ayanamsa, Udaya Tithi and location-based timings',
    },
  },
  {
    id: 'language',
    topic: { hi: 'सरल और उपयोगी भाषा', en: 'Clear, useful language' },
    why: {
      hi: 'ज्योतिषीय शब्दों के साथ उनका सामान्य अर्थ समझना भी आवश्यक है।',
      en: 'Astrological terms are more useful when their everyday meaning is explained.',
    },
    need: {
      hi: 'हिंदी और English में स्पष्ट तथा पढ़ने योग्य जानकारी',
      en: 'Readable information in both Hindi and English',
    },
    approach: {
      hi: 'कुंडली, दशा और पंचांग की जानकारी सरल व्याख्या और उदाहरणों के साथ',
      en: 'Kundli, dasha and Panchang explained with clear language and examples',
    },
  },
  {
    id: 'responsibility',
    topic: { hi: 'संतुलित ज्योतिषीय जानकारी', en: 'Balanced astrological guidance' },
    why: {
      hi: 'ज्योतिष का उद्देश्य समझ बढ़ाना है, डर या भ्रम पैदा करना नहीं।',
      en: 'Astrology should support understanding, not create fear or confusion.',
    },
    need: {
      hi: 'व्याख्या का आधार और उसकी सीमाएँ स्पष्ट हों',
      en: 'A clear explanation of the basis and limitations',
    },
    approach: {
      hi: 'ज्योतिषीय जानकारी को संकेत के रूप में प्रस्तुत किया जाता है, निश्चित परिणाम के रूप में नहीं',
      en: 'Astrological information is presented as guidance, not as a guaranteed outcome',
    },
  },
  {
    id: 'library',
    topic: { hi: 'ग्रंथ और दैनिक भक्ति', en: 'Scripture and daily devotion' },
    why: {
      hi: 'पाठ, पूजा और स्वाध्याय के लिए सामग्री आसानी से उपलब्ध होनी चाहिए।',
      en: 'Reading, worship and self-study content should be easy to access.',
    },
    need: {
      hi: 'मूल पाठ, उपलब्ध सरल अर्थ और ऑडियो का व्यवस्थित संग्रह',
      en: 'An organised collection of source text, available meanings and audio',
    },
    approach: {
      hi: 'गीता, रामायण, वेद, पुराण, आरती, मंत्र और स्तोत्र एक ही ऐप में',
      en: 'Gita, Ramayana, Vedas, Puranas, aarti, mantras and stotras in one app',
    },
  },
  {
    id: 'privacy',
    topic: { hi: 'गोपनीयता और नियंत्रण', en: 'Privacy and control' },
    why: {
      hi: 'जन्म तिथि, समय और स्थान अत्यंत निजी जानकारी है।',
      en: 'Date, time and place of birth are deeply personal details.',
    },
    need: {
      hi: 'जानकारी क्यों ली जाती है, कहाँ उपयोग होती है और क्या नियंत्रण उपलब्ध हैं',
      en: 'A clear explanation of why data is needed, how it is used and what controls are available',
    },
    approach: {
      hi: 'गोपनीयता नीति में उपयोग और सेवा-प्रदाताओं की जानकारी, साथ में ऐप के भीतर नियंत्रण',
      en: 'Uses and service providers disclosed in the Privacy Policy, with controls available in the app',
    },
  },
]

function MarkFocus() {
  return (
    <svg className="syj-vs2__mark" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function MarkCheck() {
  return (
    <svg className="syj-vs2__mark" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4.9 8.3l2.1 2.2 4.1-4.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WhyDifferent() {
  const { hi } = useLang()
  const revealRef = useRevealChildren<HTMLElement>()
  const needLabel = hi ? 'आपके लिए आवश्यक' : 'What you need'
  const approachLabel = hi ? 'श्री यंत्र में उपलब्ध' : 'What Shree Yantra provides'

  return (
    <section className="syj sy-section syj-why" aria-labelledby="syj-why-h" ref={revealRef}>
      <span className="syj-why__bg" aria-hidden />
      <div className="sy-container">
        <div className="syj-intro" data-sy-reveal="0">
          <p className="syj-kicker">{hi ? 'श्री यंत्र की विशेषता' : 'Why choose Shree Yantra'}</p>
          <h2 id="syj-why-h" className="syj-title">
            {hi ? (
              <>श्री यंत्र को <em>अन्य ज्योतिष ऐप्स से क्या अलग बनाता है</em></>
            ) : (
              <>What sets Shree Yantra <em>apart</em></>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'व्यक्तिगत कुंडली, शहर के अनुसार पंचांग, स्पष्ट गणना-पद्धति, सरल भाषा और गोपनीयता — ये सभी बातें ऐप को उपयोगी और भरोसेमंद बनाती हैं।'
              : 'Personal charts, location-based Panchang, clear methodology, understandable language and privacy make the app useful in everyday life.'}
          </p>
        </div>

        <div className="syj-vs2" role="table" aria-label={hi ? 'उत्पाद सिद्धांत' : 'Product principles'}>
          <span className="syj-vs2__lit" aria-hidden />
          <div className="syj-vs2__row syj-vs2__row--head" role="row">
            <div className="syj-vs2__topic" role="columnheader">
              <span className="syj-vs2__headnote">
                {hi ? 'सात प्रमुख विशेषताएँ' : 'Seven product principles'}
              </span>
            </div>
            <div className="syj-vs2__head syj-vs2__head--them" role="columnheader">
              <em>{hi ? 'आपकी अपेक्षा' : 'Your expectation'}</em>
              <b>{needLabel}</b>
            </div>
            <div className="syj-vs2__head syj-vs2__head--us" role="columnheader">
              <em>{hi ? 'ऐप में सुविधा' : 'In the app'}</em>
              <b>{approachLabel}</b>
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div className="syj-vs2__row" role="row" key={row.id} data-sy-reveal={String(40 + i * 60)}>
              <div className="syj-vs2__topic" role="rowheader">
                <h3>{hi ? row.topic.hi : row.topic.en}</h3>
                <p>{hi ? row.why.hi : row.why.en}</p>
              </div>
              <div className="syj-vs2__cell syj-vs2__them" role="cell">
                <span className="syj-vs2__who">{needLabel}</span>
                <span className="syj-vs2__line">
                  <MarkFocus />
                  <span>{hi ? row.need.hi : row.need.en}</span>
                </span>
              </div>
              <div className="syj-vs2__cell syj-vs2__us" role="cell">
                <span className="syj-vs2__who">{approachLabel}</span>
                <span className="syj-vs2__line">
                  <MarkCheck />
                  <strong>{hi ? row.approach.hi : row.approach.en}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="syj-vs2__foot" data-sy-reveal="0">
          <p>
            {hi
              ? 'श्री यंत्र का उद्देश्य वैदिक ज्योतिष की जानकारी को स्पष्ट, उपयोगी और आसानी से समझने योग्य बनाना है।'
              : 'Shree Yantra is designed to make Vedic astrology clear, useful and easier to understand.'}
          </p>
          <a
            className="sy-btn-gold sy-btn-sm"
            href="#download"
            onClick={(e) => {
              e.preventDefault()
              scrollToHash('#download')
            }}
          >
            {hi ? 'Android ऐप डाउनलोड करें' : 'Download the Android app'}
          </a>
        </div>
      </div>
    </section>
  )
}
