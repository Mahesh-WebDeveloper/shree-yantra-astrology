import { motion } from 'framer-motion'
import { SHOWCASE_TRUST, SHOWCASE_BIG_STATS } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

export function ShowcaseTrust() {
  const { hi } = useLang()

  return (
    <section id="trust" className="showcase-section relative scroll-mt-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <header className="showcase-section-head mx-auto max-w-3xl text-center">
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'भरोसे का आधार' : 'Built on authenticity'}</span>
          </p>
          <h2 className="mt-4 font-playfair text-[2.1rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.7rem]">
            {hi ? 'शास्त्रीय गणना, आधुनिक सटीकता' : 'Classical Vedic rules, modern precision'}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
            {hi
              ? 'श्री यंत्रा में हर गणना प्रामाणिक वैदिक पद्धति से होती है — कोई शॉर्टकट नहीं, कोई अनुमान नहीं।'
              : 'Every calculation in Shree Yantra follows authentic Vedic methodology — no shortcuts, no guesswork.'}
          </p>
        </header>

        <div className="showcase-trust-grid mt-12">
          {SHOWCASE_TRUST.map((item, i) => (
            <motion.article
              key={item.title.en}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 3) * 0.06, duration: 0.55 }}
              className="showcase-trust-card"
            >
              <span className="showcase-trust-card__icon" aria-hidden>
                {item.icon}
              </span>
              <h3>{hi ? item.title.hi : item.title.en}</h3>
              <p>{hi ? item.body.hi : item.body.en}</p>
            </motion.article>
          ))}
        </div>

        <div className="showcase-bigstats mt-12">
          {SHOWCASE_BIG_STATS.map((stat) => (
            <div key={stat.label.en} className="showcase-bigstats__item">
              <strong>{hi ? stat.value.hi : stat.value.en}</strong>
              <span>{hi ? stat.label.hi : stat.label.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
