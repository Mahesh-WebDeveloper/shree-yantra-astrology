import { motion } from 'framer-motion'
import { SHOWCASE_PREMIUM } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

const APP_TABS = [
  { en: 'Home', hi: 'होम', active: false },
  { en: 'Choghadiya', hi: 'चौघड़िया', active: false },
  { en: 'Kundli', hi: 'कुंडली', active: true },
  { en: 'Library', hi: 'पुस्तकालय', active: false },
  { en: 'Profile', hi: 'प्रोफ़ाइल', active: false },
]

export function ShowcasePremium() {
  const { hi } = useLang()

  return (
    <section className="showcase-section relative">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <header className="showcase-section-head mx-auto max-w-3xl text-center">
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'ऐप का अनुभव' : 'App experience'}</span>
          </p>
          <h2 className="mt-4 font-playfair text-[2.1rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.65rem]">
            {hi ? 'वही नेविगेशन, वही शांत सोने-सफेद डिज़ाइन' : 'Same navigation, same calm gold design'}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
            {hi
              ? 'होम, चौघड़िया, कुंडली, पुस्तकालय और प्रोफ़ाइल — ऐप की मुख्य टैब संरचना वेबसाइट पर भी दिखाई गई है, ताकि उपयोगकर्ता को पूरा अनुभाव समझ आए।'
              : 'Home, Choghadiya, Kundli, Library and Profile — the app’s core tab structure is reflected here so visitors understand the full journey.'}
          </p>
          <div className="showcase-tabs mx-auto mt-6 max-w-2xl justify-center">
            {APP_TABS.map((tab) => (
              <span
                key={tab.en}
                className={`showcase-tab-pill ${tab.active ? 'showcase-tab-pill--active' : ''}`}
              >
                {hi ? tab.hi : tab.en}
              </span>
            ))}
          </div>
        </header>

        <div className="showcase-premium-grid mt-10">
          {SHOWCASE_PREMIUM.map((item, i) => (
            <motion.article
              key={item.title.en}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.55 }}
              className="showcase-premium-card"
            >
              <strong>{hi ? item.title.hi : item.title.en}</strong>
              <p>{hi ? item.body.hi : item.body.en}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
