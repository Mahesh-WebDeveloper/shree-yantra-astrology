import { motion } from 'framer-motion'
import { SHOWCASE_MOSAIC } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

const GROUPS = ['astro', 'time', 'life', 'spirit'] as const

const GROUP_COPY = {
  astro: {
    en: { title: 'Astrology intelligence', body: 'Birth chart, matching, reports and personal predictions.' },
    hi: { title: 'ज्योतिष ज्ञान', body: 'जन्म कुंडली, मिलान, रिपोर्ट और व्यक्तिगत फलादेश।' },
  },
  time: {
    en: { title: 'Daily time guidance', body: 'Panchang, Choghadiya, Muhurat and festival timing.' },
    hi: { title: 'दैनिक समय मार्गदर्शन', body: 'पंचांग, चौघड़िया, मुहूर्त और त्योहार समय।' },
  },
  life: {
    en: { title: 'Life decisions', body: 'Vastu, numerology, remedies, baby names and profile support.' },
    hi: { title: 'जीवन के फैसले', body: 'वास्तु, अंकशास्त्र, उपाय, नामकरण और प्रोफाइल सहायता।' },
  },
  spirit: {
    en: { title: 'Sacred library', body: 'Scriptures, stotra, mantra, aarti, chalisa and daily shloka.' },
    hi: { title: 'दिव्य पुस्तकालय', body: 'ग्रंथ, स्तोत्र, मंत्र, आरती, चालीसा और दैनिक श्लोक।' },
  },
} as const

export function ShowcaseMosaic() {
  const { hi } = useLang()

  return (
    <section id="all-features" className="showcase-section relative scroll-mt-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div className="showcase-suite-head">
          <div>
            <p className="showcase-kicker w-fit">
              <span className="showcase-kicker__mark" aria-hidden />
              <span>{hi ? 'पूरी ऐप झलक' : 'Complete app preview'}</span>
            </p>
            <h2 className="mt-4 font-playfair text-[2.15rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.7rem]">
              {hi ? 'एक सदस्यता, ज्योतिष की पूरी दुनिया' : 'One membership, the full astrology universe'}
            </h2>
          </div>
          <p>
            {hi
              ? 'यह भाग ऐप की सुविधाएँ दिखाता है। वेबसाइट पर अलग टूल नहीं रखे गए हैं, ताकि उपयोगकर्ता सीधे मोबाइल ऐप डाउनलोड करे और वहीं पूरा अनुभव पाए।'
              : 'This section showcases what the app contains. The website avoids duplicate tools so users move directly to the complete mobile experience.'}
          </p>
        </div>

        <div className="showcase-mosaic-grid mt-10">
          {GROUPS.map((group, index) => {
            const items = SHOWCASE_MOSAIC.filter((item) => item.group === group)
            const copy = GROUP_COPY[group]
            return (
              <motion.article
                key={group}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index * 0.05, duration: 0.55 }}
                className="showcase-mosaic-card"
              >
                <div className="showcase-mosaic-card__top">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong><b>{items.length}</b><small>{hi ? 'सुविधाएँ' : 'features'}</small></strong>
                </div>
                <h3>{hi ? copy.hi.title : copy.en.title}</h3>
                <p>{hi ? copy.hi.body : copy.en.body}</p>
                <ul className="showcase-mosaic-list">
                  {items.map((item) => (
                    <li key={item.en}>
                      <span aria-hidden />
                      {hi ? item.hi : item.en}
                    </li>
                  ))}
                </ul>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}




