import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import { useRevealChildren } from './hooks/useSiteMotion'
import './sections.css'

type Item = { id: string; q: { hi: string; en: string }; a: { hi: string; en: string } }

const ITEMS: Item[] = [
  {
    id: 'accuracy',
    q: { hi: 'ऐप की गणनाएँ किस पद्धति पर आधारित हैं?', en: 'Which methods are used for the calculations?' },
    a: {
      hi: 'जन्म कुंडली के लिए जन्म तिथि, सटीक समय, स्थान और खगोलीय ग्रह-स्थितियों का उपयोग किया जाता है। पंचांग की गणना में लाहिड़ी (चित्रा पक्ष) अयनांश, उदय तिथि और चुने गए शहर के सूर्योदय-सूर्यास्त को ध्यान में रखा जाता है। अलग ज्योतिष परंपराओं में कुछ नियम भिन्न हो सकते हैं, इसलिए महत्वपूर्ण संस्कार के लिए स्थानीय पंचांग या योग्य ज्योतिषाचार्य से पुष्टि करना उचित है।',
      en: 'Kundli calculations use the date, exact time and place of birth together with astronomical planetary positions. Panchang calculations consider the Lahiri (Chitra Paksha) ayanamsa, Udaya Tithi and local sunrise and sunset. Some rules vary across Jyotish traditions, so important ceremonies should also be confirmed with a local Panchang or qualified astrologer.',
    },
  },
  {
    id: 'who',
    q: { hi: 'ज्योतिषी सुविधा उत्तर कैसे तैयार करती है?', en: 'How does the Jyotishi feature prepare an answer?' },
    a: {
      hi: 'यह एआई-सहायित सुविधा आपकी सहेजी हुई जन्म जानकारी, कुंडली, दशा और वर्तमान गोचर के आधार पर उत्तर तैयार करती है। इसका उद्देश्य जटिल ज्योतिषीय जानकारी को सरल भाषा में समझाना है। इसे निश्चित भविष्यवाणी या चिकित्सकीय, कानूनी अथवा वित्तीय सलाह न मानें।',
      en: 'This AI-assisted feature uses your saved birth details, chart, dasha and current transits to prepare a personalised response. It is intended to explain complex astrology clearly and should not be treated as a guaranteed prediction or as medical, legal or financial advice.',
    },
  },
  {
    id: 'privacy',
    q: { hi: 'मेरा जन्म विवरण सुरक्षित है?', en: 'Are my birth details safe?' },
    a: {
      hi: 'श्री यंत्र आपकी व्यक्तिगत जानकारी नहीं बेचता। ऐप की आवश्यक सुविधाएँ चलाने के लिए सीमित जानकारी संबंधित सेवा-प्रदाताओं के साथ साझा की जा सकती है, जैसे साइन-इन, ज्योतिषीय गणना, स्थान खोज और भुगतान सेवाएँ। विस्तृत जानकारी तथा उपलब्ध नियंत्रण गोपनीयता नीति में दिए गए हैं।',
      en: 'Shree Yantra does not sell personal information. Limited data may be shared with service providers required for sign-in, astrological calculations, location search and payments. The Privacy Policy explains these uses and the controls available to you.',
    },
  },
  {
    id: 'offline',
    q: { hi: 'क्या यह इंटरनेट के बिना चलेगा?', en: 'Does it work without internet?' },
    a: {
      hi: 'कुंडली गणना, व्यक्तिगत राशिफल, ज्योतिषी प्रश्नोत्तर और अधिकांश पढ़ने-सुनने वाली सामग्री के लिए इंटरनेट आवश्यक है। पहले से लोड या सहेजी गई सामग्री की उपलब्धता संबंधित सुविधा और डिवाइस पर निर्भर करेगी।',
      en: 'Internet access is required for Kundli calculations, personalised Rashifal, Jyotishi answers and most reading or listening content. Previously loaded or saved content may remain available depending on the feature and device.',
    },
  },
  {
    id: 'languages',
    q: { hi: 'ऐप किस भाषा में है?', en: 'What language is the app in?' },
    a: {
      hi: 'ऐप की प्रमुख सुविधाएँ हिंदी और English दोनों भाषाओं में उपलब्ध हैं। भाषा एक टैप में बदली जा सकती है। संस्कृत मूल पाठ अपनी मूल भाषा में रहता है और जहाँ उपलब्ध हो, उसके साथ सरल हिंदी अर्थ भी दिया जाता है।',
      en: 'The main app features are available in Hindi and English, and the language can be changed with one tap. Sanskrit source text remains in its original language, with a simple Hindi meaning shown where available.',
    },
  },
  {
    id: 'pricing',
    q: { hi: 'सदस्यता कैसे काम करती है?', en: 'How does the subscription work?' },
    a: {
      hi: 'ऐप डाउनलोड करना निःशुल्क है, लेकिन प्रीमियम सुविधाओं के लिए सक्रिय सदस्यता आवश्यक है। वर्तमान में ₹1 में 7 दिन का ट्रायल उपलब्ध है। ट्रायल के बाद लागू योजना, अवधि और शुल्क भुगतान से पहले ऐप में दिखाए जाते हैं।',
      en: 'The app is free to download, while premium features require an active subscription. A 7-day trial is currently available for ₹1. The applicable plan, duration and price after the trial are shown before payment.',
    },
  },
  {
    id: 'sources',
    q: { hi: 'ये ग्रंथ कहाँ से लिए गए हैं?', en: 'Where do the scriptures come from?' },
    a: {
      hi: 'पुस्तकालय की सामग्री सार्वजनिक रूप से उपलब्ध पारंपरिक संस्करणों पर आधारित है। मूल पाठ, अनुवाद, सरल अर्थ और कथा को अलग-अलग पहचान के साथ प्रस्तुत किया जाता है, ताकि पाठक मूल ग्रंथ और उसकी व्याख्या में अंतर समझ सके।',
      en: 'The library content is based on traditional editions available in the public domain. Source text, translation, simplified meaning and retelling are identified separately so readers can distinguish the original text from its explanation.',
    },
  },
  {
    id: 'partial',
    q: {
      hi: 'ग्रंथों का पाठ कैसे प्रस्तुत किया गया है?',
      en: 'How is scripture content presented?',
    },
    a: {
      hi: 'प्रत्येक ग्रंथ को उसकी परंपरागत संरचना के अनुसार अध्याय, कांड, सर्ग, पर्व या सूक्त में व्यवस्थित किया गया है। पढ़ने की प्रगति सहेजी जा सकती है और उपलब्ध स्थानों पर अर्थ तथा ऑडियो भी साथ मिलता है।',
      en: 'Each text is organised according to its traditional structure as chapters, kandas, sargas, parvas or suktas. Reading progress can be saved, with meanings and audio provided where available.',
    },
  },
  {
    id: 'get',
    q: { hi: 'ऐप कैसे मिलेगा?', en: 'How do I get the app?' },
    a: {
      hi: 'Android ऐप डाउनलोड करने के लिए नीचे दिए गए आधिकारिक बटन का उपयोग करें। यदि डाउनलोड लिंक अस्थायी रूप से उपलब्ध न हो तो सहायता के लिए ईमेल विकल्प खुल जाएगा। Play Store पर ऐप उपलब्ध होने के बाद यही पेज अपडेट किया जाएगा।',
      en: 'Use the official button below to download the Android app. If the download link is temporarily unavailable, the button will open an email request for support. This page will be updated when the app becomes available on Google Play.',
    },
  },
]

export function Faq() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const uid = useId()
  const revealRef = useRevealChildren<HTMLElement>()
  const [open, setOpen] = useState<string | null>(ITEMS[0].id)

  const duration = reduce ? 0 : 0.34

  return (
    <section id="faq" className="syj sy-section syj-faq" aria-labelledby="syj-faq-h" ref={revealRef}>
      <div className="sy-container syj-faq__layout">
        <div className="syj-faq__intro" data-sy-reveal="0">
          <p className="syj-kicker">{hi ? 'सामान्य प्रश्न' : 'Frequently asked questions'}</p>
          <h2 id="syj-faq-h" className="syj-title">
            {hi ? (
              <>
                ऐप डाउनलोड करने से पहले <em>ज़रूरी जानकारी</em>
              </>
            ) : (
              <>
                Everything to know <em>before you download</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'गणना-पद्धति, ज्योतिषी सुविधा, गोपनीयता, भाषा, सदस्यता और ऐप डाउनलोड से जुड़े सामान्य प्रश्नों के उत्तर।'
              : 'Answers to common questions about calculations, the Jyotishi feature, privacy, languages, subscriptions and downloading the app.'}
          </p>
        </div>

        <div className="syj-faq__list">
          {ITEMS.map((item, i) => {
            const isOpen = open === item.id
            const btnId = `${uid}-${item.id}-btn`
            const panelId = `${uid}-${item.id}-panel`
            return (
              <div
                className={`syj-faq__item${isOpen ? ' is-open' : ''}`}
                key={item.id}
                data-sy-reveal={String(Math.min(40 + i * 45, 360))}
              >
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    id={btnId}
                    className="syj-faq__btn"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : item.id)}
                  >
                    <strong>{hi ? item.q.hi : item.q.en}</strong>
                    <span className="syj-faq__sign" aria-hidden />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="panel"
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="syj-faq__answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{hi ? item.a.hi : item.a.en}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
