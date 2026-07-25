import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLang } from '@/i18n/LangProvider'
import './sections.css'

type Item = { id: string; q: { hi: string; en: string }; a: { hi: string; en: string } }

const ITEMS: Item[] = [
  {
    id: 'accuracy',
    q: { hi: 'गणना कितनी सटीक है?', en: 'How accurate are the calculations?' },
    a: {
      hi: 'पंचांग और कुंडली दृक-सिद्ध गणना से बनते हैं। त्योहार और व्रत की तारीखें एक-एक करके जाँची गईं — 767 में से 767 सही मिलीं। तिथि उदया तिथि परंपरा से दिखाई जाती है, और हर अंग अपने समाप्ति समय के साथ रहता है।',
      en: 'The panchang and the charts come from a Drik-siddha calculation. The festival and vrat dates were checked one by one — 767 of 767 matched. Tithi follows the udaya tithi convention, and every limb is shown with its end time.',
    },
  },
  {
    id: 'privacy',
    q: { hi: 'मेरा जन्म विवरण निजी रहता है?', en: 'Is my birth data private?' },
    a: {
      hi: 'आपकी जन्म तिथि, समय और स्थान का उपयोग केवल आपकी कुंडली और आपके पाठ बनाने के लिए होता है। यही जानकारी ज्योतिषी के उत्तर का आधार भी बनती है। इसे बेचा नहीं जाता।',
      en: 'Your date, time and place of birth are used only to compute your chart and your readings. That same data is what grounds the astrologer’s answers. It is not sold.',
    },
  },
  {
    id: 'offline',
    q: { hi: 'क्या यह ऑफ़लाइन चलता है?', en: 'Does it work offline?' },
    a: {
      hi: 'सीधी बात: ज़्यादातर नहीं। पंचांग, कुंडली, राशिफल और ज्योतिषी के उत्तर हर बार ताज़ा गणना से बनते हैं, इसलिए इनके लिए इंटरनेट चाहिए। ऑडियो भी इंटरनेट से चलता है।',
      en: 'Plainly: mostly no. The panchang, charts, rashifal and the astrologer’s answers are computed fresh each time, so they need a connection. Audio streams as well.',
    },
  },
  {
    id: 'languages',
    q: { hi: 'कौन सी भाषाएँ मिलती हैं?', en: 'Which languages does it speak?' },
    a: {
      hi: 'हिंदी और English — पूरा ऐप, दोनों भाषाओं में। शास्त्र संस्कृत मूल पाठ के साथ आते हैं, और कई ग्रंथों का हिंदी अर्थ भी साथ रहता है।',
      en: 'Hindi and English, across the whole app. The scriptures carry their Sanskrit original, and many texts also carry the meaning in Hindi.',
    },
  },
  {
    id: 'pricing',
    q: { hi: 'क्या यह मुफ़्त है? प्रीमियम में क्या है?', en: 'Is it free? What is premium?' },
    a: {
      hi: 'ऐप डाउनलोड करने और शुरू करने का कोई शुल्क नहीं है। गहरे विश्लेषण के लिए योजनाएँ हैं, जिनकी कीमत पहले से साफ़ दिखती है — कोई छिपा शुल्क नहीं, कोई अचानक कटौती नहीं।',
      en: 'There is no charge to download the app and get started. Deeper analysis sits behind plans whose price is shown up front — no hidden charges, no surprise deductions.',
    },
  },
  {
    id: 'sources',
    q: { hi: 'शास्त्र सामग्री कहाँ से आती है?', en: 'Where does the scripture content come from?' },
    a: {
      hi: 'सार्वजनिक रूप से उपलब्ध पारंपरिक संस्करणों से। संस्कृत मूल पाठ जैसा है वैसा रखा गया है; जहाँ सरल हिंदी कथा या अर्थ जोड़ा गया है, वह मूल के साथ अलग से दिखता है — उसकी जगह नहीं लेता।',
      en: 'From publicly available traditional editions. The Sanskrit original is kept as it is; where a simple Hindi katha or meaning has been added, it sits beside the original rather than replacing it.',
    },
  },
  {
    id: 'partial',
    q: {
      hi: 'कुछ पुराणों में कम अध्याय क्यों दिखते हैं?',
      en: 'Why do some Puranas show fewer chapters?',
    },
    a: {
      hi: '18 में से 16 पुराण पूरे पाठ के साथ हैं। भविष्य पुराण और लिङ्ग पुराण अभी आंशिक हैं, क्योंकि इनका पूरा मशीन-पठनीय संस्करण कहीं उपलब्ध नहीं है। ऐप के भीतर भी इन्हें आंशिक ही लिखा गया है — गिनती बढ़ाकर नहीं दिखाई गई।',
      en: '16 of the 18 ship as complete texts. The Bhavishya and Linga Puranas are still partial, because no complete machine-readable source exists for them anywhere. They are labelled partial inside the app too — the counts are never padded.',
    },
  },
  {
    id: 'get',
    q: { hi: 'ऐप कैसे मिलेगा?', en: 'How do I get the app?' },
    a: {
      hi: 'अभी APK सीधे डाउनलोड कर सकते हैं — नीचे बटन दिया गया है। Play Store पर जल्द आ रहा है।',
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
              ? 'सीधे जवाब — जो नहीं है, उसके बारे में भी साफ़ लिखा है।'
              : 'Straight answers — including about the things the app does not do.'}
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
