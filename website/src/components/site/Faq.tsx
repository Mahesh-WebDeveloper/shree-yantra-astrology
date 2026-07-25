import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import './sections.css'

type Item = { id: string; q: { hi: string; en: string }; a: { hi: string; en: string } }

const ITEMS: Item[] = [
  {
    id: 'accuracy',
    q: { hi: 'तारीखें और गणना कितनी सही हैं?', en: 'How right are the dates and calculations?' },
    a: {
      hi: 'त्योहार और व्रत की हर तारीख़ पंचांग से मिलाकर जाँची गई है — 2026, 2027 और 2050 की सभी 767 तारीखें सही निकलीं, और 2028 से 2035 तक भी हर साल अलग से जाँचा गया। तिथि उसी परंपरा से दिखती है जो पंडित जी मानते हैं: सूर्योदय के समय जो तिथि हो, वही उस दिन की तिथि। और हर तिथि, नक्षत्र या योग के साथ यह भी लिखा रहता है कि वह कब तक है।',
      en: 'Every festival and vrat date has been compared against the panchang — all 767 across 2026, 2027 and 2050 came out right, and 2028 to 2035 was checked separately as well. The tithi follows the same convention a pandit uses: whichever tithi is running at sunrise is the tithi for that day. And every tithi, nakshatra or yoga is shown along with the time it ends.',
    },
  },
  {
    id: 'who',
    q: { hi: 'जवाब कौन देता है?', en: 'Who answers my questions?' },
    a: {
      hi: 'जवाब आपकी अपनी कुंडली से बनता है। ज्योतिषी आपकी जन्म कुंडली, अभी चल रही दशा, नौ ग्रहों का गोचर और साढ़ेसाती की तारीखें देखकर बताता है — कोई तैयार लेख कॉपी नहीं किया जाता। और जो बात आपकी कुंडली में है ही नहीं, उसके लिए साफ़ मना कर दिया जाता है, चाहे आपने खुद वही क्यों न कहा हो।',
      en: 'The answer is built from your own chart. The astrologer looks at your birth chart, the period you are running, where the nine planets are moving and the dates of your Sade Sati — nothing is copied from a ready-made article. And if something simply is not in your chart, you are told so plainly, even when you were the one who said it.',
    },
  },
  {
    id: 'privacy',
    q: { hi: 'मेरा जन्म विवरण सुरक्षित है?', en: 'Are my birth details safe?' },
    a: {
      hi: 'आपकी जन्म तारीख़, समय और जगह सिर्फ़ आपकी कुंडली बनाने और आपके पाठ तैयार करने के काम आती है। यही जानकारी ज्योतिषी के जवाब का आधार भी बनती है। इसे न बेचा जाता है, न विज्ञापन के लिए किसी और को दिया जाता है।',
      en: 'Your date, time and place of birth are used only to work out your chart and prepare your readings. That same information is what the astrologer’s answers rest on. It is never sold, and never handed to anyone so you can be advertised to.',
    },
  },
  {
    id: 'offline',
    q: { hi: 'क्या यह इंटरनेट के बिना चलेगा?', en: 'Does it work without internet?' },
    a: {
      hi: 'सीधी बात — ज़्यादातर नहीं। पंचांग, कुंडली, राशिफल और ज्योतिषी के जवाब हर बार उसी वक़्त गिने जाते हैं, इसलिए इनके लिए इंटरनेट चाहिए। आरती, भजन और कथा भी इंटरनेट से ही चलते हैं।',
      en: 'Plainly — mostly no. The panchang, your chart, the rashifal and the astrologer’s answers are worked out fresh each time, so they need a connection. The aartis, bhajans and kathas stream as well.',
    },
  },
  {
    id: 'languages',
    q: { hi: 'ऐप किस भाषा में है?', en: 'What language is the app in?' },
    a: {
      hi: 'पूरा ऐप हिंदी और English दोनों में है — एक बटन दबाइए, भाषा बदल जाती है। शास्त्र संस्कृत में जैसे हैं वैसे ही रहते हैं, और कई ग्रंथों के साथ उनका हिंदी अर्थ भी मिलता है।',
      en: 'The whole app works in both Hindi and English — one tap switches it. The scriptures stay in their original Sanskrit, and many of them come with the meaning in Hindi alongside.',
    },
  },
  {
    id: 'pricing',
    q: { hi: 'क्या यह मुफ़्त है?', en: 'Is it free?' },
    a: {
      hi: 'ऐप डाउनलोड करने और शुरू करने के पैसे नहीं लगते। गहरे विश्लेषण के लिए प्लान हैं, जिनकी कीमत पहले ही साफ़ दिख जाती है — कोई छिपा शुल्क नहीं, और अपने-आप कुछ नहीं कटता।',
      en: 'Downloading the app and getting started costs nothing. Deeper analysis sits behind plans whose price you can see before you decide — no hidden charges, and nothing is deducted on its own.',
    },
  },
  {
    id: 'sources',
    q: { hi: 'ये ग्रंथ कहाँ से लिए गए हैं?', en: 'Where do the scriptures come from?' },
    a: {
      hi: 'सार्वजनिक रूप से उपलब्ध पारंपरिक संस्करणों से। संस्कृत मूल पाठ जैसा का तैसा रखा गया है। जहाँ सरल हिंदी में कथा या अर्थ जोड़ा गया है, वह मूल पाठ के साथ अलग से दिखता है — उसकी जगह नहीं लेता।',
      en: 'From traditional editions that are publicly available. The Sanskrit original is kept exactly as it is. Where a simple Hindi katha or meaning has been added, it sits beside the original rather than replacing it.',
    },
  },
  {
    id: 'partial',
    q: {
      hi: 'कुछ पुराणों में कम अध्याय क्यों हैं?',
      en: 'Why do some Puranas have fewer chapters?',
    },
    a: {
      hi: '18 में से 16 पुराण पूरे हैं। भविष्य पुराण और लिङ्ग पुराण अभी अधूरे हैं, क्योंकि इनका पूरा डिजिटल पाठ कहीं मिलता ही नहीं। हमने गिनती बढ़ाकर नहीं दिखाई — ऐप के भीतर भी इन पर "आंशिक" लिखा है। जिस दिन पूरा पाठ मिलेगा, जोड़ दिया जाएगा।',
      en: '16 of the 18 are complete. The Bhavishya and Linga Puranas are still partial, because no complete digital text of them exists anywhere. We have not padded the counts — inside the app they are labelled partial too. The day a complete text turns up, it goes in.',
    },
  },
  {
    id: 'get',
    q: { hi: 'ऐप कैसे मिलेगा?', en: 'How do I get the app?' },
    a: {
      hi: 'अभी APK सीधे डाउनलोड कर सकते हैं — बटन नीचे ही है। Play Store पर जल्द आ रहा है।',
      en: 'For now you can download the APK directly — the button is just below. Play Store is coming soon.',
    },
  },
]

export function Faq() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const uid = useId()
  const [open, setOpen] = useState<string | null>(ITEMS[0].id)

  const duration = reduce ? 0 : 0.34

  return (
    <section id="faq" className="syj sy-section syj-faq" aria-labelledby="syj-faq-h">
      <div className="sy-container syj-faq__layout">
        <div className="syj-faq__intro">
          <p className="syj-kicker">{hi ? 'सवाल-जवाब' : 'Questions'}</p>
          <h2 id="syj-faq-h" className="syj-title">
            {hi ? (
              <>
                जो अक्सर <em>पूछा जाता है</em>
              </>
            ) : (
              <>
                What people <em>usually ask</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'सीधे जवाब — जो ऐप नहीं करता, वह भी साफ़-साफ़ लिखा है।'
              : 'Straight answers — including the things the app does not do.'}
          </p>
        </div>

        <div className="syj-faq__list">
          {ITEMS.map((item) => {
            const isOpen = open === item.id
            const btnId = `${uid}-${item.id}-btn`
            const panelId = `${uid}-${item.id}-panel`
            return (
              <div
                className={`syj-faq__item${isOpen ? ' is-open' : ''}`}
                key={item.id}
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
