import { motion } from 'framer-motion'
import { SHOWCASE_SCRIPTURES } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

export function ShowcaseLibrary() {
  const { hi } = useLang()

  return (
    <section id="library" className="showcase-section relative scroll-mt-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div className="showcase-library">
          <div className="showcase-library__head">
            <p className="showcase-kicker w-fit">
              <span className="showcase-kicker__mark" aria-hidden />
              <span>{hi ? 'दिव्य पुस्तकालय' : 'Divine Library'}</span>
            </p>
            <h2 className="mt-4 font-playfair text-[2rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.5rem]">
              {hi ? 'मंत्र, शास्त्र व वैदिक ज्ञान — एक जेब में' : 'Mantras, scriptures & Vedic wisdom — in your pocket'}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? 'पूरा आध्यात्मिक संग्रह ऐप में व्यवस्थित है — पढ़ने की प्रगति सहेजी जाती है, ऑडियो कथाएँ साथ चलती हैं।'
                : 'The complete spiritual collection lives in the app — reading progress is saved, audio kathas travel with you.'}
            </p>
          </div>

          <div className="showcase-library__grid">
            {SHOWCASE_SCRIPTURES.map((item, i) => (
              <motion.div
                key={item.title.en}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: (i % 4) * 0.05, duration: 0.5 }}
                className="showcase-library__card"
              >
                <strong>{hi ? item.title.hi : item.title.en}</strong>
                <span>{hi ? item.meta.hi : item.meta.en}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
